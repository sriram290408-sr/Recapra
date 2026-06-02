from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from core.dependencies import get_db
from core.role_checker import require_role
from models.user import User
from services import candidate_service, candidate_ats_service

router = APIRouter()


# ── Request Schemas ───────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    analysis_type: str                  # "role_template" | "company_job"
    role_template_id: Optional[int] = None
    job_id: Optional[int] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/role-templates")
def list_role_templates(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db),
):
    """Return all available role JD templates for candidate self-analysis."""
    return candidate_ats_service.get_role_templates(db)


@router.get("/company-jobs")
def list_company_jobs(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db),
):
    """Return active company jobs available for candidate ATS analysis."""
    return candidate_ats_service.get_active_company_jobs(db)


@router.post("/analyze", status_code=status.HTTP_200_OK)
def run_analysis(
    data: AnalyzeRequest,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db),
):
    """
    Run ATS analysis for the current candidate.
    analysis_type: 'role_template' or 'company_job'
    """
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return candidate_ats_service.run_candidate_ats(
        db=db,
        candidate_profile_id=profile.id,
        analysis_type=data.analysis_type,
        role_template_id=data.role_template_id,
        job_id=data.job_id,
    )


@router.get("/reports")
def list_reports(
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db),
):
    """Return all saved ATS reports for the current candidate."""
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return candidate_ats_service.get_candidate_reports(db, profile.id)


@router.get("/reports/{report_id}")
def get_report(
    report_id: int,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db),
):
    """Return a single saved ATS report."""
    profile = candidate_service.get_candidate_profile(db, current_user.id)
    return candidate_ats_service.get_candidate_report(db, profile.id, report_id)
