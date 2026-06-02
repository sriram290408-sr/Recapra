from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class ATSResult(Base):
    __tablename__ = "ats_results"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(Integer, ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False, unique=True)
    candidate_profile_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)

    overall_score = Column(Integer, nullable=False)
    match_level = Column(String, nullable=False)  # Excellent, Strong, Good, Needs Review, Weak
    confidence_level = Column(String, default="High")  # High, Medium, Low

    # Category Scores
    skills_score = Column(Integer, nullable=False)          # max 35
    experience_score = Column(Integer, nullable=False)      # max 20
    project_score = Column(Integer, nullable=False)         # max 15
    resume_keyword_score = Column(Integer, nullable=False)  # max 15
    cover_letter_score = Column(Integer, nullable=False)    # max 10
    education_score = Column(Integer, nullable=False)       # max 5

    # Match Details (stored as JSON arrays in text)
    matched_skills = Column(Text, nullable=True)
    missing_skills = Column(Text, nullable=True)
    matched_keywords = Column(Text, nullable=True)
    missing_keywords = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)
    concerns = Column(Text, nullable=True)

    # Analysis & Summaries
    recommendation = Column(Text, nullable=True)
    resume_analysis = Column(Text, nullable=True)
    cover_letter_analysis = Column(Text, nullable=True)
    project_relevance_summary = Column(Text, nullable=True)

    # Hugging Face AI Report Columns
    summary = Column(Text, nullable=True)
    feedback_summary = Column(Text, nullable=True)
    trend_analysis = Column(Text, nullable=True)
    chart_analysis = Column(Text, nullable=True)
    what_is_good = Column(Text, nullable=True)
    what_is_missing = Column(Text, nullable=True)
    improvement_needed = Column(Text, nullable=True)

    # Tracking
    generated_by = Column(String, default="in_house")         # "hf_ai" or "in_house"
    n8n_execution_id = Column(String, nullable=True)           # HF execution/run ID or details if available
    analysis_version = Column(String, default="2.0.0")
    run_count = Column(Integer, default=1)
    last_run_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="ats_results")
    application = relationship("JobApplication", back_populates="ats_result")
    candidate_profile = relationship("CandidateProfile", back_populates="ats_results")
