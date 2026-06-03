from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    bio = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    career_status = Column(String, nullable=True)
    job_loss_reason = Column(Text, nullable=True)
    target_job_role = Column(String, nullable=True)
    preferred_job_type = Column(String, nullable=True)
    preferred_location = Column(String, nullable=True)
    expected_salary = Column(Float, nullable=True)
    availability = Column(String, nullable=True)
    notice_period = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    personal_website_url = Column(String, nullable=True)
    profile_completion_pct = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="candidate_profile", foreign_keys=[user_id])
    education = relationship("CandidateEducation", back_populates="candidate_profile", cascade="all, delete-orphan")
    skills = relationship("CandidateSkill", back_populates="candidate_profile", cascade="all, delete-orphan")
    experiences = relationship("CandidateExperience", back_populates="candidate_profile", cascade="all, delete-orphan")
    documents = relationship("CandidateDocument", back_populates="candidate_profile", cascade="all, delete-orphan")
    projects = relationship("CandidateProject", back_populates="candidate_profile", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="candidate", cascade="all, delete-orphan")
    ats_results = relationship("ATSResult", back_populates="candidate_profile", cascade="all, delete-orphan")
    candidate_ats_results = relationship("CandidateATSResult", back_populates="candidate_profile", cascade="all, delete-orphan")
    ai_improvements = relationship("CandidateAIImprovement", back_populates="candidate_profile", cascade="all, delete-orphan")


class CandidateEducation(Base):
    __tablename__ = "candidate_education"

    id = Column(Integer, primary_key=True, index=True)
    candidate_profile_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    institution = Column(String, nullable=False)
    degree = Column(String, nullable=False)
    field_of_study = Column(String, nullable=False)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    year_of_passing = Column(Integer, nullable=True)
    marks_percentage = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate_profile = relationship("CandidateProfile", back_populates="education")


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(Integer, primary_key=True, index=True)
    candidate_profile_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String, nullable=False)
    skill_type = Column(String, nullable=False)  # technical, soft, tool
    proficiency_level = Column(String, nullable=False)  # beginner, intermediate, advanced
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate_profile = relationship("CandidateProfile", back_populates="skills")


class CandidateExperience(Base):
    __tablename__ = "candidate_experience"

    id = Column(Integer, primary_key=True, index=True)
    candidate_profile_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    employment_type = Column(String, default="experienced")  # fresher, experienced
    company_name = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    years_of_experience = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    career_gap_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate_profile = relationship("CandidateProfile", back_populates="experiences")


class CandidateDocument(Base):
    __tablename__ = "candidate_documents"

    id = Column(Integer, primary_key=True, index=True)
    candidate_profile_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String, nullable=False)  # resume, portfolio
    file_path = Column(String, nullable=False)
    original_file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    candidate_profile = relationship("CandidateProfile", back_populates="documents")


class CandidateProject(Base):
    __tablename__ = "candidate_projects"

    id = Column(Integer, primary_key=True, index=True)
    candidate_profile_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tech_stack = Column(String, nullable=True)
    project_link = Column(String, nullable=True)
    github_link = Column(String, nullable=True)
    live_demo_link = Column(String, nullable=True)
    screenshot_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate_profile = relationship("CandidateProfile", back_populates="projects")
