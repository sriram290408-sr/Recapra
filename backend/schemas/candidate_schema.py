from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class CandidateProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    career_status: Optional[str] = None
    job_loss_reason: Optional[str] = None
    target_job_role: Optional[str] = None
    preferred_job_type: Optional[str] = None
    preferred_location: Optional[str] = None
    expected_salary: Optional[float] = None
    availability: Optional[str] = None
    notice_period: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    personal_website_url: Optional[str] = None
    profile_completion_pct: Optional[int] = None

class CandidateEducationCreate(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    year_of_passing: Optional[int] = None
    marks_percentage: float  # Validation check 0 to 100 in service layer or pydantic validator

class CandidateEducationResponse(CandidateEducationCreate):
    id: int
    candidate_profile_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CandidateSkillCreate(BaseModel):
    skill_name: str
    skill_type: str  # technical, soft, tool
    proficiency_level: str  # beginner, intermediate, advanced

class CandidateSkillResponse(CandidateSkillCreate):
    id: int
    candidate_profile_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CandidateExperienceCreate(BaseModel):
    employment_type: str = "experienced"  # fresher, experienced
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    years_of_experience: Optional[float] = None
    description: Optional[str] = None
    career_gap_reason: Optional[str] = None

class CandidateExperienceResponse(CandidateExperienceCreate):
    id: int
    candidate_profile_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CandidateProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tech_stack: Optional[str] = None
    project_link: Optional[str] = None
    github_link: Optional[str] = None
    live_demo_link: Optional[str] = None

class CandidateProjectResponse(CandidateProjectCreate):
    id: int
    candidate_profile_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CandidateDocumentResponse(BaseModel):
    id: int
    candidate_profile_id: int
    document_type: str
    file_path: str
    original_file_name: str
    file_size: Optional[int] = None
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CandidateProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    career_status: Optional[str] = None
    job_loss_reason: Optional[str] = None
    target_job_role: Optional[str] = None
    preferred_job_type: Optional[str] = None
    preferred_location: Optional[str] = None
    expected_salary: Optional[float] = None
    availability: Optional[str] = None
    notice_period: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    personal_website_url: Optional[str] = None
    profile_completion_pct: int
    education: List[CandidateEducationResponse] = []
    skills: List[CandidateSkillResponse] = []
    experiences: List[CandidateExperienceResponse] = []
    documents: List[CandidateDocumentResponse] = []
    projects: List[CandidateProjectResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Pagination helper response
class CandidateDashboardResponse(BaseModel):
    profile_completion_pct: int
    resume_uploaded: bool
    portfolio_added: bool
    projects_count: int
    applied_jobs_count: int
    current_status: Optional[str] = None
    next_step: str
