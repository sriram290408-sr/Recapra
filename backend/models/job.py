from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(String, nullable=True)  # Comma-separated list
    requirements = Column(Text, nullable=True)
    experience_required = Column(String, nullable=True)
    education_required = Column(String, nullable=True)
    location = Column(String, nullable=True)
    work_mode = Column(String, default="remote")  # remote, hybrid, onsite
    job_type = Column(String, default="full-time")  # internship, full-time, part-time, contract
    salary_range = Column(String, nullable=True)
    openings_count = Column(Integer, default=1)
    last_date_to_apply = Column(String, nullable=True)
    interview_mode = Column(String, nullable=True)
    selection_process = Column(Text, nullable=True)
    status = Column(String, default="active")  # draft, active, paused, closed, expired
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("CompanyProfile", back_populates="jobs")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")
    ats_results = relationship("ATSResult", back_populates="job", cascade="all, delete-orphan")
