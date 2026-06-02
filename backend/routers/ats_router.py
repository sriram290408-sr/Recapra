from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.dependencies import get_db
from core.role_checker import require_role
from models.user import User
from services import ats_service, company_service
from schemas.ats_schema import (
    ATSResultResponse,
    ATSRankedApplicantResponse,
    ATSJobSummaryResponse,
    ATSRunResponse,
)

router = APIRouter()


@router.post("/jobs/{job_id}/run", response_model=ATSRunResponse, status_code=status.HTTP_200_OK)
def run_ats(
    job_id: int,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    """Run/re-run ATS analysis for all applicants of a job."""
    profile = company_service.get_company_profile(db, current_user.id)
    result = ats_service.run_ats_for_job(db, job_id, profile.id)
    return ATSRunResponse(**result)


@router.get("/jobs/{job_id}/ranked-applicants", response_model=List[ATSRankedApplicantResponse])
def get_ranked_applicants(
    job_id: int,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    """Get all job applications with their current ATS scores and match levels."""
    profile = company_service.get_company_profile(db, current_user.id)
    return ats_service.get_ranked_applicants(db, job_id, profile.id)


@router.get("/applications/{application_id}/report", response_model=ATSResultResponse)
def get_detailed_report(
    application_id: int,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    """Get the full detailed ATS Result breakdown for one candidate application."""
    profile = company_service.get_company_profile(db, current_user.id)
    return ats_service.get_single_report(db, application_id, profile.id)


@router.get("/jobs/{job_id}/summary", response_model=ATSJobSummaryResponse)
def get_job_summary(
    job_id: int,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    """Get aggregated overview analytics and metrics for the job's candidate pool."""
    profile = company_service.get_company_profile(db, current_user.id)
    return ats_service.get_job_ats_summary(db, job_id, profile.id)


@router.post("/applications/{application_id}/rerun", response_model=ATSResultResponse)
def rerun_single_applicant(
    application_id: int,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    """Re-run ATS scoring for a specific single applicant."""
    profile = company_service.get_company_profile(db, current_user.id)
    ats_service.rerun_ats_for_applicant(db, application_id, profile.id)
    return ats_service.get_single_report(db, application_id, profile.id)
