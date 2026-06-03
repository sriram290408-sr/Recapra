from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class CandidateAIImprovement(Base):
    """Stores AI resume improvements and before/after ATS scores for a candidate."""
    __tablename__ = "candidate_ai_resume_improvements"

    id = Column(Integer, primary_key=True, index=True)
    candidate_profile_id = Column(
        Integer,
        ForeignKey("candidate_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_resume_text = Column(Text, nullable=False)
    improved_resume_text = Column(Text, nullable=True)  # Fully structured improved resume draft
    target_role = Column(String, nullable=False)
    ai_suggestions = Column(Text, nullable=True)        # JSON string containing recommendations and feedback

    # ATS Scoring comparison
    original_ats_score = Column(Float, default=0.0)
    improved_ats_score = Column(Float, default=0.0)
    score_difference = Column(Float, default=0.0)

    status = Column(String, default="pending")          # "pending" | "accepted" | "rejected"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate_profile = relationship("CandidateProfile", back_populates="ai_improvements")
