from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.company import CompanyProfile, CompanyVerificationDocument
from models.job import Job
from models.application import JobApplication
from models.interview import InterviewSchedule
from schemas.company_schema import CompanyProfileUpdate
from services.notification_service import create_notification
from core.file_handler import delete_file

def get_company_profile(db: Session, user_id: int) -> CompanyProfile:
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found."
        )
    return profile

def update_company_profile(db: Session, user_id: int, data: CompanyProfileUpdate) -> CompanyProfile:
    profile = get_company_profile(db, user_id)
    update_data = data.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    db.commit()
    db.refresh(profile)
    return profile

def submit_company_verification(db: Session, profile_id: int, gst_number: str, reg_number: str, file_path: str, orig_name: str, size: int) -> CompanyVerificationDocument:
    profile = db.query(CompanyProfile).filter(CompanyProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found."
        )
        
    # Clear out old verification document files if any exist
    old_docs = db.query(CompanyVerificationDocument).filter(
        CompanyVerificationDocument.company_profile_id == profile_id
    ).all()
    for doc in old_docs:
        delete_file(doc.file_path)
        db.delete(doc)
    db.commit()
    
    doc = CompanyVerificationDocument(
        company_profile_id=profile_id,
        document_type="registration_cert",
        gst_number=gst_number,
        registration_number=reg_number,
        file_path=file_path,
        original_file_name=orig_name,
        file_size=size
    )
    db.add(doc)
    
    # Update profile status to pending
    profile.verification_status = "pending"
    profile.is_verified = False
    profile.verification_rejection_reason = None
    
    db.commit()
    db.refresh(doc)
    db.refresh(profile)
    
    # Create notification for the company
    create_notification(
        db, profile.user_id,
        "Verification Submitted",
        "Your company verification documents have been uploaded successfully. Admin will review them shortly.",
        "verification"
    )
    
    return doc

def get_dashboard_data(db: Session, user_id: int) -> dict:
    profile = get_company_profile(db, user_id)
    
    jobs_posted_count = db.query(Job).filter(Job.company_id == profile.id).count()
    active_jobs_count = db.query(Job).filter(Job.company_id == profile.id, Job.status == "active").count()
    applications_received_count = db.query(JobApplication).filter(JobApplication.company_id == profile.id).count()
    shortlisted_candidates_count = db.query(JobApplication).filter(JobApplication.company_id == profile.id, JobApplication.status == "shortlisted").count()
    
    # Count interviews scheduled
    interviews_scheduled_count = db.query(InterviewSchedule).join(JobApplication).filter(
        JobApplication.company_id == profile.id,
        InterviewSchedule.status == "scheduled"
    ).count()
    
    return {
        "verification_status": profile.verification_status,
        "is_verified": profile.is_verified,
        "jobs_posted_count": jobs_posted_count,
        "active_jobs_count": active_jobs_count,
        "applications_received_count": applications_received_count,
        "shortlisted_candidates_count": shortlisted_candidates_count,
        "interviews_scheduled_count": interviews_scheduled_count,
        "rejection_reason": profile.verification_rejection_reason
    }
