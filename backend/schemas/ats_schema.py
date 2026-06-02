from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class ATSResultResponse(BaseModel):
    id: int
    job_id: int
    application_id: int
    candidate_profile_id: int

    overall_score: int
    match_level: str
    confidence_level: str

    skills_score: int
    experience_score: int
    project_score: int
    resume_keyword_score: int
    cover_letter_score: int
    education_score: int

    matched_skills: List[str]
    missing_skills: List[str]
    matched_keywords: List[str]
    missing_keywords: List[str]
    strengths: List[str]
    concerns: List[str]

    recommendation: Optional[str] = None
    resume_analysis: Optional[str] = None
    cover_letter_analysis: Optional[str] = None
    project_relevance_summary: Optional[str] = None

    # Hugging Face AI Report Fields
    summary: Optional[str] = None
    feedback_summary: Optional[str] = None
    trend_analysis: Optional[str] = None
    chart_analysis: Optional[Dict[str, Any]] = None
    what_is_good: Optional[List[str]] = None
    what_is_missing: Optional[List[str]] = None
    improvement_needed: Optional[List[str]] = None

    generated_by: Optional[str] = "in_house"
    n8n_execution_id: Optional[str] = None

    analysis_version: str
    run_count: int
    last_run_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ATSCandidateBrief(BaseModel):
    id: int
    full_name: str
    location: Optional[str] = None
    target_job_role: Optional[str] = None
    preferred_job_type: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ATSCandidateDocumentBrief(BaseModel):
    id: int
    document_type: str
    file_path: str
    original_file_name: str

    model_config = ConfigDict(from_attributes=True)


class ATSRankedApplicantResponse(BaseModel):
    id: int  # application_id
    candidate_id: int
    candidate_name: str
    target_role: str
    status: str
    applied_at: datetime

    # document indicators
    has_resume: bool
    has_cover_letter: bool
    has_portfolio: bool
    has_github: bool
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None

    # ATS result (None if not run yet)
    ats_result: Optional[ATSResultResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ATSRunResponse(BaseModel):
    message: str
    ranked_count: int
    failed_count: int = 0
    generated_by: str = "in_house"

    model_config = ConfigDict(from_attributes=True)


class ATSJobSummaryResponse(BaseModel):
    total_applicants: int
    ranked_applicants_count: int
    average_score: float
    excellent_count: int
    strong_count: int
    good_count: int
    needs_review_count: int
    weak_count: int
    most_common_missing_skills: List[str]
    most_common_matched_skills: List[str]
    failed_count: int = 0

    model_config = ConfigDict(from_attributes=True)
