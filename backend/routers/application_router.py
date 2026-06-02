from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from schemas.application_schema import (
    JobApplicationCreate,
    JobApplicationStatusUpdate,
    JobApplicationResponse,
    JobApplicationListResponse
)
from models.user import User
from core.dependencies import get_db
from core.role_checker import require_role
from services import application_service, candidate_service, company_service

router = APIRouter()

@router.post("/apply/{job_id}", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply(
    job_id: int,
    data: JobApplicationCreate,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return application_service.apply_to_job(db, profile.id, job_id, data)

@router.get("/my-applications", response_model=JobApplicationListResponse)
def get_my_applications(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    status: str = Query("", description="Filter applications by status"),
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return application_service.get_my_applications(db, profile.id, page=page, limit=limit, status_filter=status)

@router.get("/company-applicants/{job_id}", response_model=JobApplicationListResponse)
def get_company_applicants(
    job_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    status: str = Query("", description="Filter applicants by status"),
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    profile = company_service.get_company_profile(db, current_user.id)
    return application_service.get_company_applicants(db, profile.id, job_id, page=page, limit=limit, status_filter=status)

@router.put("/status/{application_id}", response_model=JobApplicationResponse)
def update_status(
    application_id: int,
    data: JobApplicationStatusUpdate,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    profile = company_service.get_company_profile(db, current_user.id)
    return application_service.update_application_status(db, profile.id, application_id, data)
