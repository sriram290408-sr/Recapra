from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from models.user import User
from models.candidate import CandidateProfile
from models.company import CompanyProfile
from models.job import Job
from models.application import JobApplication
from core.dependencies import get_db
from core.role_checker import require_role
from services.notification_service import create_notification
from datetime import datetime, timezone as datetime_timezone
from services.admin_service import get_admin_summary_counts

RECENT_ACTIVITY_LIMIT = 8

def parse_iso_datetime(dt_str: str) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        cleaned = dt_str.replace("Z", "+00:00").replace(" ", "T")
        dt = datetime.fromisoformat(cleaned)
        if dt.tzinfo is not None:
            dt = dt.astimezone(datetime_timezone.utc).replace(tzinfo=None)
        return dt
    except Exception:
        for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                return datetime.strptime(dt_str.strip(), fmt)
            except Exception:
                continue
        return None

router = APIRouter()

class CompanyRejectRequest(BaseModel):
    rejection_reason: str

@router.get("/dashboard")
def get_dashboard_stats(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    counts = get_admin_summary_counts(db)
    return {
        "total_candidates": counts["total_candidates"],
        "total_companies": counts["total_companies"],
        "pending_verifications": counts["pending_verifications"],
        "approved_companies": counts["approved_companies"],
        "rejected_companies": counts["rejected_companies"],
        "total_jobs": counts["total_jobs"],
        "total_applications": counts["total_applications"]
    }

@router.get("/companies/pending")
def get_pending_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    query = db.query(CompanyProfile).filter(CompanyProfile.verification_status == "pending")
    total = query.count()
    items = query.order_by(CompanyProfile.created_at.desc()).offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    # Pre-load HR details from related user
    company_items = []
    for item in items:
        user = db.query(User).filter(User.id == item.user_id).first()
        company_items.append({
            "id": item.id,
            "user_id": item.user_id,
            "company_name": item.company_name,
            "website": item.website,
            "location": item.location,
            "industry": item.industry,
            "company_size": item.company_size,
            "verification_status": item.verification_status,
            "gst_number": item.verification_documents[0].gst_number if item.verification_documents else None,
            "registration_number": item.verification_documents[0].registration_number if item.verification_documents else None,
            "doc_path": item.verification_documents[0].file_path if item.verification_documents else None,
            "doc_name": item.verification_documents[0].original_file_name if item.verification_documents else None,
            "hr_name": item.hr_name or (user.name if user else ""),
            "hr_email": item.hr_email or (user.email if user else "")
        })
        
    return {
        "items": company_items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

@router.put("/companies/{company_id}/approve")
def approve_company(
    company_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    profile = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found.")
        
    profile.is_verified = True
    profile.verification_status = "approved"
    profile.verification_rejection_reason = None
    profile.verified_at = datetime.utcnow()
    profile.verified_by_admin_id = current_user.id
    
    db.commit()
    
    create_notification(
        db, profile.user_id,
        "Account Approved!",
        "Congratulations! Your company verification was approved by the administrator. You can now post jobs.",
        "verification"
    )
    
    return {"message": f"Company '{profile.company_name}' successfully verified."}

@router.put("/companies/{company_id}/reject")
def reject_company(
    company_id: int,
    data: CompanyRejectRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    profile = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found.")
        
    profile.is_verified = False
    profile.verification_status = "rejected"
    profile.verification_rejection_reason = data.rejection_reason
    profile.verified_at = None
    profile.verified_by_admin_id = None
    
    db.commit()
    
    create_notification(
        db, profile.user_id,
        "Account Verification Rejected",
        f"Your verification request was rejected. Reason: {data.rejection_reason}. Please resolve this and resubmit verification details.",
        "verification"
    )
    
    return {"message": f"Company '{profile.company_name}' verification rejected."}

@router.get("/users")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    role: str = Query("", description="Filter users by role"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
        
    total = query.count()
    items = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    user_list = []
    for u in items:
        user_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at
        })
        
    return {
        "items": user_list,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

@router.get("/jobs")
def get_admin_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    status: str = Query("", description="Filter jobs by status"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    query = db.query(Job).join(CompanyProfile)
    
    if status:
        query = query.filter(Job.status == status)
        
    total = query.count()
    items = query.order_by(Job.created_at.desc()).offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    jobs_list = []
    for job in items:
        jobs_list.append({
            "id": job.id,
            "title": job.title,
            "company_name": job.company.company_name,
            "location": job.location,
            "work_mode": job.work_mode,
            "job_type": job.job_type,
            "status": job.status,
            "created_at": job.created_at
        })
        
    return {
        "items": jobs_list,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

@router.get("/applications")
def get_admin_applications(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    status: str = Query("", description="Filter applications by status"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    query = db.query(JobApplication).join(Job).join(CandidateProfile)
    
    if status:
        query = query.filter(JobApplication.status == status)
        
    total = query.count()
    items = query.order_by(JobApplication.applied_at.desc()).offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    apps_list = []
    for app in items:
        apps_list.append({
            "id": app.id,
            "job_title": app.job.title,
            "candidate_name": app.candidate.full_name,
            "company_name": app.company.company_name,
            "status": app.status,
            "applied_at": app.applied_at
        })
        
    return {
        "items": apps_list,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }


# ─── Admin Insights / Analytics ───────────────────────────────────────────────

@router.get("/insights")
def get_admin_insights(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    from models.interview import InterviewSchedule
    from models.candidate import CandidateDocument
    from sqlalchemy import func, distinct

    now = datetime.utcnow()
    counts = get_admin_summary_counts(db)

    # ── Shared Metrics ────────────────────────────────────────────────────────
    total_candidates = counts["total_candidates"]
    total_companies = counts["total_companies"]
    total_jobs = counts["total_jobs"]
    total_applications = counts["total_applications"]
    pending_verifications = counts["pending_verifications"]
    approved_companies = counts["approved_companies"]
    rejected_companies = counts["rejected_companies"]
    active_jobs = counts["active_jobs"]
    selected_candidates = counts["selected_candidates"]
    total_interviews = counts["total_interviews"]

    # ── Overview ──────────────────────────────────────────────────────────────
    completed_profiles = db.query(CandidateProfile).filter(
        CandidateProfile.profile_completion_pct >= 100
    ).count()
    verified_companies = approved_companies

    # ── Candidate Readiness ───────────────────────────────────────────────────
    resume_uploaded = db.query(distinct(CandidateDocument.candidate_profile_id)).filter(
        CandidateDocument.document_type == "resume"
    ).count()
    portfolio_added = db.query(distinct(CandidateDocument.candidate_profile_id)).filter(
        CandidateDocument.document_type == "portfolio"
    ).count()
    profiles_100_percent = completed_profiles
    profiles_incomplete = total_candidates - completed_profiles

    avg_completion_row = db.query(
        func.avg(CandidateProfile.profile_completion_pct)
    ).scalar()
    average_profile_completion = round(float(avg_completion_row or 0), 1)

    # ── Company Activity ──────────────────────────────────────────────────────
    companies_with_jobs = db.query(distinct(Job.company_id)).count()
    companies_without_jobs = total_companies - companies_with_jobs

    # ── Job Activity ──────────────────────────────────────────────────────────
    paused_jobs = db.query(Job).filter(Job.status == "paused").count()
    closed_jobs = db.query(Job).filter(Job.status == "closed").count()

    # ── Application Pipeline ──────────────────────────────────────────────────
    pipeline_statuses = [
        "applied", "under_review", "need_improvement",
        "shortlisted", "interview_scheduled", "selected", "rejected"
    ]
    application_pipeline = {}
    for s in pipeline_statuses:
        application_pipeline[s] = db.query(JobApplication).filter(
            JobApplication.status == s
        ).count()

    # ── Interview Insights ────────────────────────────────────────────────────
    all_scheduled = db.query(InterviewSchedule).filter(
        InterviewSchedule.status == "scheduled"
    ).all()
    upcoming_interviews = 0
    for iv in all_scheduled:
        parsed_dt = parse_iso_datetime(iv.date_time)
        if parsed_dt and parsed_dt > now:
            upcoming_interviews += 1
            
    online_interviews = db.query(InterviewSchedule).filter(
        InterviewSchedule.interview_mode == "online"
    ).count()
    face_to_face_interviews = db.query(InterviewSchedule).filter(
        InterviewSchedule.interview_mode == "face-to-face"
    ).count()
    phone_interviews = db.query(InterviewSchedule).filter(
        InterviewSchedule.interview_mode == "phone"
    ).count()

    # ── Top Hiring Companies ──────────────────────────────────────────────────
    top_companies_raw = (
        db.query(
            CompanyProfile.company_name,
            func.count(Job.id).label("job_count"),
            func.count(JobApplication.id).label("application_count"),
        )
        .join(Job, Job.company_id == CompanyProfile.id, isouter=True)
        .join(JobApplication, JobApplication.company_id == CompanyProfile.id, isouter=True)
        .group_by(CompanyProfile.id, CompanyProfile.company_name)
        .order_by(func.count(JobApplication.id).desc())
        .limit(10)
        .all()
    )
    top_hiring_companies = [
        {
            "company_name": row.company_name,
            "job_count": row.job_count or 0,
            "application_count": row.application_count or 0,
        }
        for row in top_companies_raw
        if (row.job_count or 0) > 0
    ]

    # ── Recent Activity (last 8 applications) ─────────────────────────────────
    recent_apps = (
        db.query(JobApplication)
        .join(Job)
        .join(CandidateProfile)
        .order_by(JobApplication.applied_at.desc())
        .limit(RECENT_ACTIVITY_LIMIT)
        .all()
    )
    recent_activity = []
    for app in recent_apps:
        try:
            recent_activity.append({
                "type": "application",
                "candidate_name": app.candidate.full_name if app.candidate else "Unknown",
                "job_title": app.job.title if app.job else "Unknown",
                "company_name": app.company.company_name if app.company else "Unknown",
                "status": app.status,
                "timestamp": app.applied_at.isoformat() if app.applied_at else None,
            })
        except Exception:
            continue

    return {
        "overview": {
            "total_candidates": total_candidates,
            "completed_profiles": completed_profiles,
            "total_companies": total_companies,
            "verified_companies": verified_companies,
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "total_interviews": total_interviews,
            "selected_candidates": selected_candidates,
        },
        "candidate_readiness": {
            "resume_uploaded": resume_uploaded,
            "portfolio_added": portfolio_added,
            "profiles_100_percent": profiles_100_percent,
            "profiles_incomplete": profiles_incomplete,
            "average_profile_completion": average_profile_completion,
        },
        "company_activity": {
            "pending_verifications": pending_verifications,
            "approved_companies": approved_companies,
            "rejected_companies": rejected_companies,
            "companies_with_jobs": companies_with_jobs,
            "companies_without_jobs": companies_without_jobs,
        },
        "job_activity": {
            "active_jobs": active_jobs,
            "paused_jobs": paused_jobs,
            "closed_jobs": closed_jobs,
        },
        "application_pipeline": application_pipeline,
        "interview_insights": {
            "total_interviews": total_interviews,
            "upcoming_interviews": upcoming_interviews,
            "online_interviews": online_interviews,
            "face_to_face_interviews": face_to_face_interviews,
            "phone_interviews": phone_interviews,
        },
        "top_hiring_companies": top_hiring_companies,
        "recent_activity": recent_activity,
    }

