from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from schemas.interview_schema import (
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    InterviewListResponse,
    BulkInterviewCreate,
    BulkInterviewResponse,
)
from models.user import User
from core.dependencies import get_db
from core.role_checker import require_role
from services import interview_service, candidate_service, company_service

router = APIRouter()


@router.post(
    "/schedule/{application_id}",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def schedule(
    application_id: int,
    data: InterviewCreate,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db),
):
    profile = company_service.get_company_profile(db, current_user.id)
    return interview_service.schedule_interview(db, profile.id, application_id, data)


@router.post(
    "/schedule-bulk",
    response_model=BulkInterviewResponse,
    status_code=status.HTTP_200_OK,
)
def schedule_bulk(
    data: BulkInterviewCreate,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db),
):
    profile = company_service.get_company_profile(db, current_user.id)
    return interview_service.schedule_bulk_interviews(db, profile.id, data)


@router.get("/my-interviews", response_model=InterviewListResponse)
def get_my_interviews(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db),
):
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return interview_service.get_my_interviews(db, profile.id)


@router.get("/company-interviews", response_model=InterviewListResponse)
def get_company_interviews(
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db),
):
    profile = company_service.get_company_profile(db, current_user.id)
    return interview_service.get_company_interviews(db, profile.id)


@router.put("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: int,
    data: InterviewUpdate,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db),
):
    profile = company_service.get_company_profile(db, current_user.id)
    return interview_service.update_interview(db, profile.id, interview_id, data)
