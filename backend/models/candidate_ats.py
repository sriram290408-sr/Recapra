from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class RoleJDTemplate(Base):
    """Default job description templates for candidate self-analysis."""
    __tablename__ = "role_jd_templates"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String, nullable=False, unique=True)
    job_description = Column(Text, nullable=True)
    required_skills = Column(Text, nullable=True)   # JSON array string
    preferred_skills = Column(Text, nullable=True)  # JSON array string
    experience_requirement = Column(String, nullable=True)
    education_requirement = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to candidate ATS results
    ats_results = relationship("CandidateATSResult", back_populates="role_template")


class CandidateATSResult(Base):
    """Stores per-run ATS analysis results for a candidate."""
    __tablename__ = "candidate_ats_results"

    id = Column(Integer, primary_key=True, index=True)
    candidate_profile_id = Column(
        Integer,
        ForeignKey("candidate_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Source of the JD used for analysis
    source_type = Column(String, nullable=False)          # "role_template" | "company_job"
    role_template_id = Column(
        Integer,
        ForeignKey("role_jd_templates.id", ondelete="SET NULL"),
        nullable=True,
    )
    job_id = Column(
        Integer,
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
    )
    resume_document_id = Column(Integer, nullable=True)
    portfolio_document_id = Column(Integer, nullable=True)

    # Target role label
    target_role = Column(String, nullable=True)

    # Core scores
    overall_score = Column(Float, default=0.0)
    match_level = Column(String, default="Needs Review")   # Excellent / Strong / Good / Needs Review / Weak
    confidence_level = Column(String, default="Medium")    # High / Medium / Low

    # Category scores (out of max weights)
    skills_score = Column(Float, default=0.0)        # /35
    experience_score = Column(Float, default=0.0)    # /15
    project_score = Column(Float, default=0.0)       # /15
    resume_keyword_score = Column(Float, default=0.0) # /15
    portfolio_score = Column(Float, default=0.0)     # /10
    education_score = Column(Float, default=0.0)     # /10

    # Match lists (stored as JSON text)
    matched_skills = Column(Text, nullable=True)
    missing_skills = Column(Text, nullable=True)
    matched_keywords = Column(Text, nullable=True)
    missing_keywords = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)
    concerns = Column(Text, nullable=True)

    # Report text fields
    summary = Column(Text, nullable=True)
    feedback_summary = Column(Text, nullable=True)
    trend_analysis = Column(Text, nullable=True)
    chart_analysis = Column(Text, nullable=True)      # JSON object text
    what_is_good = Column(Text, nullable=True)        # JSON array text
    what_is_missing = Column(Text, nullable=True)     # JSON array text
    improvement_needed = Column(Text, nullable=True)  # JSON array text
    recommendation = Column(Text, nullable=True)
    resume_analysis = Column(Text, nullable=True)
    portfolio_analysis = Column(Text, nullable=True)
    project_relevance_summary = Column(Text, nullable=True)

    # Generation metadata
    generated_by = Column(String, default="in_house")   # "in_house" | "hf_ai"
    run_count = Column(Integer, default=1)
    last_run_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate_profile = relationship("CandidateProfile", back_populates="candidate_ats_results")
    role_template = relationship("RoleJDTemplate", back_populates="ats_results")
