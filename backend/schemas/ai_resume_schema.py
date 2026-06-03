from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime


class AIImprovementRequest(BaseModel):
    target_role: str


class AIImprovementResponse(BaseModel):
    id: int
    candidate_profile_id: int
    original_resume_text: str
    improved_resume_text: Optional[Any] = None  # Returns parsed JSON or text
    target_role: str
    ai_suggestions: Optional[Any] = None       # Returns parsed JSON or text
    original_ats_score: float
    improved_ats_score: float
    score_difference: float
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AIAcceptResponse(BaseModel):
    message: str
    improvement_id: int
    status: str


class AIRejectResponse(BaseModel):
    message: str
    improvement_id: int
    status: str


class AIRunATSResponse(BaseModel):
    original_ats_score: float
    ats_score_after_ai_improvement: float
    score_difference: float
    ats_report: Optional[Any] = None
