from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException, status
from models.job import Job
from models.company import CompanyProfile
from schemas.job_schema import JobCreate, JobUpdate
from datetime import datetime

def create_job(db: Session, company_id: int, data: JobCreate) -> Job:
    # Check if company is approved (verified)
    company = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).first()
    if not company or not company.is_verified or company.verification_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only approved companies can post jobs. Please submit verification details and wait for approval."
        )
        
    job = Job(
        company_id=company_id,
        title=data.title,
        description=data.description,
        required_skills=data.required_skills,
        requirements=data.requirements,
        experience_required=data.experience_required,
        education_required=data.education_required,
        location=data.location,
        work_mode=data.work_mode,
        job_type=data.job_type,
        salary_range=data.salary_range,
        openings_count=data.openings_count,
        last_date_to_apply=data.last_date_to_apply,
        interview_mode=data.interview_mode,
        selection_process=data.selection_process,
        status="active"  # Defaults to active upon posting
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    job.applications_count = 0
    return job

def get_job_by_id(db: Session, job_id: int) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job post not found."
        )
    job.applications_count = len(job.applications)
    return job

def update_job(db: Session, company_id: int, job_id: int, data: JobUpdate) -> Job:
    job = get_job_by_id(db, job_id)
    
    # Check ownership
    if job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this job post."
        )
        
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)
        
    db.commit()
    db.refresh(job)
    job.applications_count = len(job.applications)
    return job

def delete_job(db: Session, company_id: int, job_id: int):
    job = get_job_by_id(db, job_id)
    
    # Check ownership
    if job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this job post."
        )
        
    db.delete(job)
    db.commit()

def get_jobs(
    db: Session, 
    page: int = 1, 
    limit: int = 10, 
    search: str = "", 
    location: str = "", 
    skill: str = "", 
    job_type: str = "", 
    work_mode: str = "", 
    status_filter: str = "active"
) -> dict:
    offset = (page - 1) * limit
    
    # Setup query, candidates can see active jobs from verified companies
    query = db.query(Job).join(CompanyProfile).filter(
        Job.status == status_filter,
        CompanyProfile.is_verified == True
    )
    
    if search:
        query = query.filter(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%"),
                CompanyProfile.company_name.ilike(f"%{search}%")
            )
        )
        
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
        
    if skill:
        query = query.filter(Job.required_skills.ilike(f"%{skill}%"))
        
    if job_type:
        query = query.filter(Job.job_type == job_type)
        
    if work_mode:
        query = query.filter(Job.work_mode == work_mode)
        
    total = query.count()
    items = query.order_by(Job.created_at.desc()).offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    for item in items:
        item.applications_count = len(item.applications)
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

def get_company_jobs(
    db: Session, 
    company_id: int, 
    page: int = 1, 
    limit: int = 10, 
    status_filter: str = ""
) -> dict:
    offset = (page - 1) * limit
    query = db.query(Job).filter(Job.company_id == company_id)
    
    if status_filter:
        query = query.filter(Job.status == status_filter)
        
    total = query.count()
    items = query.order_by(Job.created_at.desc()).offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    for item in items:
        item.applications_count = len(item.applications)
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }
