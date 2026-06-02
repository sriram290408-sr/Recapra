from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from schemas.job_schema import JobCreate, JobUpdate, JobResponse, JobListResponse
from models.user import User
from core.dependencies import get_db
from core.role_checker import require_role
from services import job_service, company_service

router = APIRouter()

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def post_job(
    data: JobCreate,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    profile = company_service.get_company_profile(db, current_user.id)
    return job_service.create_job(db, profile.id, data)

@router.get("", response_model=JobListResponse)
def get_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query("", description="Search term for job title, description or company"),
    location: str = Query("", description="Filter by location"),
    skill: str = Query("", description="Filter by required skills"),
    job_type: str = Query("", description="Filter by job type"),
    work_mode: str = Query("", description="Filter by work mode"),
    db: Session = Depends(get_db)
):
    # Only active jobs of verified companies are queried for candidates/public
    return job_service.get_jobs(
        db, page=page, limit=limit, search=search, 
        location=location, skill=skill, job_type=job_type, 
        work_mode=work_mode, status_filter="active"
    )

@router.get("/company/my-jobs", response_model=JobListResponse)
def get_my_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    status: str = Query("", description="Filter by job status (active/paused/closed)"),
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    profile = company_service.get_company_profile(db, current_user.id)
    return job_service.get_company_jobs(db, profile.id, page=page, limit=limit, status_filter=status)

@router.get("/{id}", response_model=JobResponse)
def get_job_details(
    id: int,
    db: Session = Depends(get_db)
):
    return job_service.get_job_by_id(db, id)

@router.put("/{id}", response_model=JobResponse)
def update_job(
    id: int,
    data: JobUpdate,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    profile = company_service.get_company_profile(db, current_user.id)
    return job_service.update_job(db, profile.id, id, data)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    id: int,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    profile = company_service.get_company_profile(db, current_user.id)
    job_service.delete_job(db, profile.id, id)
