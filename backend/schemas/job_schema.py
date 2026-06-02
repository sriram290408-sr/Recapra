from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: Optional[str] = None  # Comma-separated list
    requirements: Optional[str] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    location: Optional[str] = None
    work_mode: str = "remote"  # remote, hybrid, onsite
    job_type: str = "full-time"  # internship, full-time, part-time, contract
    salary_range: Optional[str] = None
    openings_count: int = 1
    last_date_to_apply: Optional[str] = None
    interview_mode: Optional[str] = None
    selection_process: Optional[str] = None

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None
    requirements: Optional[str] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    job_type: Optional[str] = None
    salary_range: Optional[str] = None
    openings_count: Optional[int] = None
    last_date_to_apply: Optional[str] = None
    interview_mode: Optional[str] = None
    selection_process: Optional[str] = None
    status: Optional[str] = None  # draft, active, paused, closed, expired

class JobCompanyResponse(BaseModel):
    id: int
    company_name: str
    website: Optional[str] = None
    location: Optional[str] = None
    logo_path: Optional[str] = None
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)

class JobResponse(BaseModel):
    id: int
    company_id: int
    title: str
    description: str
    required_skills: Optional[str] = None
    requirements: Optional[str] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    location: Optional[str] = None
    work_mode: str
    job_type: str
    salary_range: Optional[str] = None
    openings_count: int
    last_date_to_apply: Optional[str] = None
    interview_mode: Optional[str] = None
    selection_process: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    company: Optional[JobCompanyResponse] = None
    applications_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class JobListResponse(BaseModel):
    items: List[JobResponse]
    total: int
    page: int
    limit: int
    pages: int
