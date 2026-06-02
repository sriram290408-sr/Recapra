from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, UniqueConstraint, String
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("company_profiles.id", ondelete="CASCADE"), nullable=False)
    cover_letter = Column(Text, nullable=True)
    status = Column(String, default="applied")  # applied, under_review, need_improvement, shortlisted, interview_scheduled, etc.
    applied_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("CandidateProfile", back_populates="applications")
    company = relationship("CompanyProfile", back_populates="applications")
    interviews = relationship("InterviewSchedule", back_populates="application", cascade="all, delete-orphan")
    ats_result = relationship("ATSResult", back_populates="application", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("job_id", "candidate_id", name="uq_job_candidate_application"),
    )
