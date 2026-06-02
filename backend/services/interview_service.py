from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.interview import InterviewSchedule
from models.application import JobApplication
from models.job import Job
from models.company import CompanyProfile
from models.candidate import CandidateProfile
from schemas.interview_schema import InterviewCreate, InterviewUpdate, BulkInterviewCreate
from services.notification_service import create_notification
from datetime import datetime, timezone


def _parse_interview_datetime(date_time_str: str) -> datetime | None:
    """
    Safely parse the interview date_time string (stored as String in DB) into
    a timezone-naive UTC datetime for comparison.
    Returns None if the value is missing or cannot be parsed.
    """
    if not date_time_str:
        return None
    try:
        # Handle ISO 8601 strings with 'Z' or timezone offset
        cleaned = date_time_str.strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
        # Normalize to naive UTC for comparison with datetime.utcnow()
        if dt.tzinfo is not None:
            dt = dt.replace(tzinfo=None) - dt.utcoffset()
        return dt
    except Exception:
        pass
    # Fallback: try common formats
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(date_time_str.strip(), fmt)
        except Exception:
            pass
    return None


def _format_datetime(date_time_str: str) -> str:
    """Format ISO date string to a readable format for notifications."""
    try:
        dt = datetime.fromisoformat(date_time_str.replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y at %I:%M %p")
    except Exception:
        return date_time_str


def _build_interview_notification_message(
    job_title: str,
    date_time_str: str,
    interview_mode: str,
    location_or_link: str | None,
    interviewer_name: str | None,
    description: str | None,
) -> str:
    """Build the full multiline interview notification message."""
    location_display = location_or_link if location_or_link else "Not provided"
    interviewer_display = interviewer_name if interviewer_name else "Not specified"
    notes_display = description if description else "No additional notes"
    formatted_dt = _format_datetime(date_time_str)

    return (
        f"Job: {job_title}\n"
        f"Date & Time: {formatted_dt}\n"
        f"Mode: {interview_mode}\n"
        f"Meeting Link / Location: {location_display}\n"
        f"Interviewer: {interviewer_display}\n"
        f"Notes: {notes_display}"
    )


def _enrich_interview(db: Session, interview: InterviewSchedule) -> dict:
    """Convert an InterviewSchedule ORM object into an enriched dict for the response."""
    application = db.query(JobApplication).filter(
        JobApplication.id == interview.application_id
    ).first()

    job_title = None
    candidate_name = None
    company_name = None

    if application:
        job = db.query(Job).filter(Job.id == application.job_id).first()
        candidate = db.query(CandidateProfile).filter(
            CandidateProfile.id == application.candidate_id
        ).first()
        company = db.query(CompanyProfile).filter(
            CompanyProfile.id == application.company_id
        ).first()

        job_title = job.title if job else None
        candidate_name = candidate.full_name if candidate else None
        company_name = company.company_name if company else None

    return {
        "id": interview.id,
        "application_id": interview.application_id,
        "title": interview.title,
        "description": interview.description,
        "date_time": interview.date_time,
        "interview_mode": interview.interview_mode,
        "location_or_link": interview.location_or_link,
        "interviewer_name": interview.interviewer_name,
        "status": interview.status,
        "notes": interview.notes,
        "created_at": interview.created_at,
        "updated_at": interview.updated_at,
        "job_title": job_title,
        "candidate_name": candidate_name,
        "company_name": company_name,
    }


def schedule_interview(
    db: Session,
    company_id: int,
    application_id: int,
    data: InterviewCreate,
) -> InterviewSchedule:
    # 1. Verify application exists and is owned by this company
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id
    ).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found.",
        )

    if application.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to schedule an interview for this application.",
        )

    # 2. Prevent duplicate upcoming interviews for the same application
    existing = db.query(InterviewSchedule).filter(
        InterviewSchedule.application_id == application_id,
        InterviewSchedule.status == "scheduled",
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This application already has an upcoming interview scheduled. Cancel or reschedule the existing one first.",
        )

    # 3. Save interview record
    interview = InterviewSchedule(
        application_id=application_id,
        title=data.title,
        description=data.description,
        date_time=data.date_time,
        interview_mode=data.interview_mode,
        location_or_link=data.location_or_link,
        interviewer_name=data.interviewer_name,
        status="scheduled",
        notes=data.notes,
    )
    db.add(interview)

    # 4. Update application status
    application.status = "interview_scheduled"

    db.commit()
    db.refresh(interview)

    # 5. Notify candidate with full details
    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.id == application.candidate_id
    ).first()
    job = db.query(Job).filter(Job.id == application.job_id).first()

    job_title = job.title if job else "Position"

    if candidate:
        message = _build_interview_notification_message(
            job_title=job_title,
            date_time_str=data.date_time,
            interview_mode=data.interview_mode,
            location_or_link=data.location_or_link,
            interviewer_name=data.interviewer_name,
            description=data.description,
        )
        create_notification(
            db,
            candidate.user_id,
            "Interview Scheduled",
            message,
            "interview",
        )

    return interview


def schedule_bulk_interviews(
    db: Session,
    company_id: int,
    data: BulkInterviewCreate,
) -> dict:
    """Schedule interviews for multiple applications at once."""
    success_count = 0
    failed_count = 0
    errors = []

    for application_id in data.application_ids:
        try:
            # Validate application exists and belongs to this company
            application = db.query(JobApplication).filter(
                JobApplication.id == application_id
            ).first()

            if not application:
                failed_count += 1
                errors.append(f"Application {application_id}: not found.")
                continue

            if application.company_id != company_id:
                failed_count += 1
                errors.append(
                    f"Application {application_id}: not authorized."
                )
                continue

            # Skip rejected or selected applicants
            if application.status in ("rejected", "selected"):
                failed_count += 1
                errors.append(
                    f"Application {application_id}: cannot schedule interview — status is '{application.status}'."
                )
                continue

            # Prevent duplicate upcoming interview
            existing = db.query(InterviewSchedule).filter(
                InterviewSchedule.application_id == application_id,
                InterviewSchedule.status == "scheduled",
            ).first()
            if existing:
                failed_count += 1
                errors.append(
                    f"Application {application_id}: already has an upcoming interview scheduled."
                )
                continue

            # Create interview record
            interview = InterviewSchedule(
                application_id=application_id,
                title=data.title,
                description=data.description,
                date_time=data.date_time,
                interview_mode=data.interview_mode,
                location_or_link=data.location_or_link,
                interviewer_name=data.interviewer_name,
                status="scheduled",
                notes=data.notes,
            )
            db.add(interview)

            # Update application status
            application.status = "interview_scheduled"

            db.flush()  # get interview.id without committing yet

            # Notify candidate
            candidate = db.query(CandidateProfile).filter(
                CandidateProfile.id == application.candidate_id
            ).first()
            job = db.query(Job).filter(Job.id == application.job_id).first()

            job_title = job.title if job else "Position"

            if candidate:
                message = _build_interview_notification_message(
                    job_title=job_title,
                    date_time_str=data.date_time,
                    interview_mode=data.interview_mode,
                    location_or_link=data.location_or_link,
                    interviewer_name=data.interviewer_name,
                    description=data.description,
                )
                create_notification(
                    db,
                    candidate.user_id,
                    "Interview Scheduled",
                    message,
                    "interview",
                )

            success_count += 1

        except Exception as exc:
            failed_count += 1
            errors.append(f"Application {application_id}: unexpected error — {str(exc)}")
            db.rollback()
            continue

    db.commit()

    return {
        "success_count": success_count,
        "failed_count": failed_count,
        "errors": errors,
    }


def get_my_interviews(db: Session, candidate_id: int) -> dict:
    """Return candidate interviews split into upcoming and past based on current UTC time."""
    interviews = (
        db.query(InterviewSchedule)
        .join(JobApplication)
        .filter(JobApplication.candidate_id == candidate_id)
        .order_by(InterviewSchedule.date_time.asc())
        .all()
    )

    now = datetime.utcnow()
    upcoming = []
    past = []

    for interview in interviews:
        enriched = _enrich_interview(db, interview)
        interview_dt = _parse_interview_datetime(interview.date_time)
        # Interviews with unparseable dates go to upcoming (safe fallback)
        if interview_dt is None or interview_dt >= now:
            upcoming.append(enriched)
        else:
            past.append(enriched)

    # upcoming sorted soonest-first, past sorted most-recent-first
    past.sort(key=lambda x: x.get("date_time") or "", reverse=True)

    all_items = upcoming + past
    return {
        "items": all_items,        # legacy field — full list for backward compat
        "upcoming": upcoming,
        "past": past,
        "total": len(all_items),
    }


def get_company_interviews(db: Session, company_id: int) -> dict:
    """Return company interviews split into upcoming and past based on current UTC time."""
    interviews = (
        db.query(InterviewSchedule)
        .join(JobApplication)
        .filter(JobApplication.company_id == company_id)
        .order_by(InterviewSchedule.date_time.asc())
        .all()
    )

    now = datetime.utcnow()
    upcoming = []
    past = []

    for interview in interviews:
        enriched = _enrich_interview(db, interview)
        interview_dt = _parse_interview_datetime(interview.date_time)
        # Interviews with unparseable dates go to upcoming (safe fallback)
        if interview_dt is None or interview_dt >= now:
            upcoming.append(enriched)
        else:
            past.append(enriched)

    # upcoming sorted soonest-first, past sorted most-recent-first
    past.sort(key=lambda x: x.get("date_time") or "", reverse=True)

    all_items = upcoming + past
    return {
        "items": all_items,        # legacy field — full list for backward compat
        "upcoming": upcoming,
        "past": past,
        "total": len(all_items),
    }


def update_interview(
    db: Session,
    company_id: int,
    interview_id: int,
    data: InterviewUpdate,
) -> InterviewSchedule:
    interview = db.query(InterviewSchedule).filter(
        InterviewSchedule.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview schedule not found.",
        )

    # Verify application ownership
    application = db.query(JobApplication).filter(
        JobApplication.id == interview.application_id
    ).first()
    if not application or application.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this interview schedule.",
        )

    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(interview, key, value)

    # If status is updated to completed, sync application status
    if "status" in update_data and update_data["status"] == "completed":
        application.status = "interview_completed"

    db.commit()
    db.refresh(interview)

    # Notify candidate of update
    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.id == application.candidate_id
    ).first()
    job = db.query(Job).filter(Job.id == application.job_id).first()
    company = db.query(CompanyProfile).filter(
        CompanyProfile.id == company_id
    ).first()

    comp_name = company.company_name if company else "Recruiter"
    job_title = job.title if job else "Position"

    if candidate:
        create_notification(
            db,
            candidate.user_id,
            "Interview Status Update",
            f"Your interview for '{job_title}' at {comp_name} was updated to status: '{interview.status}'.",
            "interview",
        )

    return interview
