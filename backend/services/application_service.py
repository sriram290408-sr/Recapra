from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.application import JobApplication
from models.job import Job
from models.company import CompanyProfile
from models.candidate import CandidateProfile
from schemas.application_schema import JobApplicationCreate, JobApplicationStatusUpdate
from services.notification_service import create_notification
from datetime import datetime

def apply_to_job(db: Session, candidate_id: int, job_id: int, data: JobApplicationCreate) -> JobApplication:
    # 1. Get job profile details and verify existence
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job post not found."
        )
        
    # 2. Check: Candidate cannot apply to closed/expired job.
    if job.status not in ["active", "open"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job is closed or no longer accepting applications."
        )
        
    # 3. Check: Candidate cannot apply to unverified company job.
    company = db.query(CompanyProfile).filter(CompanyProfile.id == job.company_id).first()
    if not company or not company.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Applications are not allowed for unverified company job postings."
        )
        
    # 4. Check: Candidate cannot apply to same job twice.
    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.candidate_id == candidate_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this job."
        )
        
    # 5. Save application
    application = JobApplication(
        job_id=job_id,
        candidate_id=candidate_id,
        company_id=job.company_id,
        cover_letter=data.cover_letter,
        status="applied"
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    # 6. Notifications
    # Candidate profile name
    candidate = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_id).first()
    cand_name = candidate.full_name if candidate else "A candidate"
    
    # Notify Company
    create_notification(
        db, company.user_id,
        "New Job Application",
        f"{cand_name} applied to your job posting: '{job.title}'.",
        "status_change"
    )
    
    # Notify Candidate
    create_notification(
        db, candidate.user_id if candidate else 0,
        "Application Submitted Successfully",
        f"Your application for '{job.title}' at {company.company_name} was received.",
        "info"
    )
    
    return application

def get_my_applications(
    db: Session, 
    candidate_id: int, 
    page: int = 1, 
    limit: int = 10, 
    status_filter: str = ""
) -> dict:
    offset = (page - 1) * limit
    query = db.query(JobApplication).filter(JobApplication.candidate_id == candidate_id)
    
    if status_filter:
        query = query.filter(JobApplication.status == status_filter)
        
    total = query.count()
    items = query.order_by(JobApplication.applied_at.desc()).offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

def get_company_applicants(
    db: Session, 
    company_id: int, 
    job_id: int, 
    page: int = 1, 
    limit: int = 10, 
    status_filter: str = ""
) -> dict:
    offset = (page - 1) * limit
    
    # Verify job ownership or ensure candidate privacy
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view applicants for this job post."
        )
        
    query = db.query(JobApplication).filter(JobApplication.job_id == job_id)
    
    if status_filter:
        query = query.filter(JobApplication.status == status_filter)
        
    total = query.count()
    items = query.order_by(JobApplication.applied_at.desc()).offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

def update_application_status(
    db: Session, 
    company_id: int, 
    application_id: int, 
    data: JobApplicationStatusUpdate
) -> JobApplication:
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found."
        )
        
    # Check ownership: Company can update status only for applications to its own jobs.
    if application.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this application status."
        )
        
    # Update status
    application.status = data.status
    db.commit()
    db.refresh(application)
    
    # Get details for notification
    candidate = db.query(CandidateProfile).filter(CandidateProfile.id == application.candidate_id).first()
    job = db.query(Job).filter(Job.id == application.job_id).first()
    company = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).first()
    
    comp_name = company.company_name if company else "Recruiter"
    job_title = job.title if job else "Position"
    
    # Notify Candidate
    if candidate:
        create_notification(
            db, candidate.user_id,
            "Application Status Update",
            f"Your application status for '{job_title}' at {comp_name} was updated to '{data.status.replace('_', ' ').capitalize()}'.",
            "status_change"
        )
        
    return application
