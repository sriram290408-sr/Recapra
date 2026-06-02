from fastapi import APIRouter, Depends, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from schemas.company_schema import (
    CompanyProfileResponse,
    CompanyProfileUpdate,
    CompanyDashboardResponse,
    CompanyVerificationDocumentResponse
)
from models.user import User
from core.dependencies import get_db, get_current_user
from core.role_checker import require_role
from core.file_handler import validate_and_save_file
from services import company_service

router = APIRouter()

@router.get("/dashboard", response_model=CompanyDashboardResponse)
def get_dashboard(
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    return company_service.get_dashboard_data(db, current_user.id)

@router.get("/profile", response_model=CompanyProfileResponse)
def get_profile(
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    return company_service.get_company_profile(db, current_user.id)

@router.put("/profile", response_model=CompanyProfileResponse)
def update_profile(
    data: CompanyProfileUpdate,
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    return company_service.update_company_profile(db, current_user.id, data)

@router.post("/verification", response_model=CompanyVerificationDocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_verification(
    gst_number: str = Form(...),
    registration_number: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    profile = company_service.get_company_profile(db, current_user.id)
    file_info = validate_and_save_file(file, category="company_doc")
    return company_service.submit_company_verification(
        db, profile.id, gst_number, registration_number,
        file_info["file_path"], file_info["original_file_name"], file_info["file_size"]
    )

@router.get("/verification-status")
def get_verification_status(
    current_user: User = Depends(require_role(["company"])),
    db: Session = Depends(get_db)
):
    profile = company_service.get_company_profile(db, current_user.id)
    return {
        "is_verified": profile.is_verified,
        "verification_status": profile.verification_status,
        "rejection_reason": profile.verification_rejection_reason
    }

@router.get("/public/{company_id}", response_model=CompanyProfileResponse)
def get_public_profile(
    company_id: int,
    db: Session = Depends(get_db)
):
    profile = db.query(company_service.CompanyProfile).filter(company_service.CompanyProfile.id == company_id).first()
    if not profile:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Company profile not found.")
    return profile
