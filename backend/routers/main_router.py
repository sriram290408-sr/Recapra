from fastapi import APIRouter
from routers import (
    auth_router,
    candidate_router,
    company_router,
    admin_router,
    job_router,
    application_router,
    interview_router,
    notification_router,
    ats_router,
    candidate_ats_router,
)

main_router = APIRouter()

main_router.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
main_router.include_router(candidate_router.router, prefix="/candidate", tags=["Candidate"])
main_router.include_router(company_router.router, prefix="/company", tags=["Company"])
main_router.include_router(admin_router.router, prefix="/admin", tags=["Admin"])
main_router.include_router(job_router.router, prefix="/jobs", tags=["Jobs"])
main_router.include_router(application_router.router, prefix="/applications", tags=["Applications"])
main_router.include_router(interview_router.router, prefix="/interviews", tags=["Interviews"])
main_router.include_router(notification_router.router, prefix="/notifications", tags=["Notifications"])
main_router.include_router(ats_router.router, prefix="/ats", tags=["ATS"])
main_router.include_router(candidate_ats_router.router, prefix="/candidate/ats", tags=["Candidate ATS"])
