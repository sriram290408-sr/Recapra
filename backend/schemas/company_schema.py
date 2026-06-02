from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    company_email: Optional[EmailStr] = None
    hr_name: Optional[str] = None
    hr_email: Optional[EmailStr] = None
    contact_number: Optional[str] = None
    website: Optional[str] = None
    linkedin_page: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    company_type: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None

class CompanyVerificationDocumentResponse(BaseModel):
    id: int
    company_profile_id: int
    document_type: str
    gst_number: Optional[str] = None
    registration_number: Optional[str] = None
    file_path: str
    original_file_name: str
    file_size: Optional[int] = None
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompanyProfileResponse(BaseModel):
    id: int
    user_id: int
    company_name: str
    company_email: Optional[EmailStr] = None
    hr_name: Optional[str] = None
    hr_email: Optional[EmailStr] = None
    contact_number: Optional[str] = None
    website: Optional[str] = None
    linkedin_page: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    company_type: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    logo_path: Optional[str] = None
    is_verified: bool
    verification_status: str
    verification_rejection_reason: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by_admin_id: Optional[int] = None
    verification_documents: List[CompanyVerificationDocumentResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompanyDashboardResponse(BaseModel):
    verification_status: str  # pending, approved, rejected
    is_verified: bool
    jobs_posted_count: int
    active_jobs_count: int
    applications_received_count: int
    shortlisted_candidates_count: int
    interviews_scheduled_count: int
    rejection_reason: Optional[str] = None
