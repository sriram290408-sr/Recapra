from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class InterviewCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date_time: str
    interview_mode: str = "online"  # online, face-to-face, phone
    location_or_link: Optional[str] = None
    interviewer_name: Optional[str] = None
    notes: Optional[str] = None

class InterviewUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date_time: Optional[str] = None
    interview_mode: Optional[str] = None
    location_or_link: Optional[str] = None
    interviewer_name: Optional[str] = None
    status: Optional[str] = None  # scheduled, completed, cancelled, rescheduled
    notes: Optional[str] = None

class BulkInterviewCreate(BaseModel):
    application_ids: List[int]
    title: str
    description: Optional[str] = None
    date_time: str
    interview_mode: str = "online"  # online, face-to-face, phone
    location_or_link: Optional[str] = None
    interviewer_name: Optional[str] = None
    notes: Optional[str] = None

class InterviewResponse(BaseModel):
    id: int
    application_id: int
    title: str
    description: Optional[str] = None
    date_time: str
    interview_mode: str
    location_or_link: Optional[str] = None
    interviewer_name: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Enriched fields from joined tables
    job_title: Optional[str] = None
    candidate_name: Optional[str] = None
    company_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class InterviewListResponse(BaseModel):
    items: List[InterviewResponse]
    total: int

class BulkInterviewResponse(BaseModel):
    success_count: int
    failed_count: int
    errors: List[str]
