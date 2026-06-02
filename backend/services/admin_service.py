from sqlalchemy.orm import Session
from models.candidate import CandidateProfile
from models.company import CompanyProfile
from models.job import Job
from models.application import JobApplication

try:
    from models.interview import InterviewSchedule
except ImportError:
    InterviewSchedule = None

def get_admin_summary_counts(db: Session) -> dict:
    """
    Standardized admin summary counts used across both the core dashboard
    and detailed insights endpoints to ensure data consistency.
    """
    total_candidates = db.query(CandidateProfile).count()
    total_companies = db.query(CompanyProfile).count()
    total_jobs = db.query(Job).count()
    total_applications = db.query(JobApplication).count()

    pending_verifications = db.query(CompanyProfile).filter(
        CompanyProfile.verification_status == "pending"
    ).count()

    approved_companies = db.query(CompanyProfile).filter(
        CompanyProfile.verification_status == "approved"
    ).count()

    rejected_companies = db.query(CompanyProfile).filter(
        CompanyProfile.verification_status == "rejected"
    ).count()

    active_jobs = db.query(Job).filter(Job.status == "active").count()
    selected_candidates = db.query(JobApplication).filter(
        JobApplication.status == "selected"
    ).count()

    if InterviewSchedule is not None:
        total_interviews = db.query(InterviewSchedule).count()
    else:
        total_interviews = 0

    return {
        "total_candidates": total_candidates,
        "total_companies": total_companies,
        "total_jobs": total_jobs,
        "total_applications": total_applications,
        "pending_verifications": pending_verifications,
        "approved_companies": approved_companies,
        "rejected_companies": rejected_companies,
        "active_jobs": active_jobs,
        "selected_candidates": selected_candidates,
        "total_interviews": total_interviews,
    }
