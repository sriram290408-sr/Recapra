from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from schemas.job_schema import JobResponse
from schemas.candidate_schema import CandidateProfileResponse

class JobApplicationCreate(BaseModel):
    cover_letter: Optional[str] = None

class JobApplicationStatusUpdate(BaseModel):
    status: str

class ApplicationCandidateResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    career_status: Optional[str] = None
    job_loss_reason: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_completion_pct: int

    model_config = ConfigDict(from_attributes=True)

class JobApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    company_id: int
    cover_letter: Optional[str] = None
    status: str
    applied_at: datetime
    updated_at: datetime
    job: Optional[JobResponse] = None
    candidate: Optional[CandidateProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)

class JobApplicationListResponse(BaseModel):
    items: List[JobApplicationResponse]
    total: int
    page: int
    limit: int
    pages: int
