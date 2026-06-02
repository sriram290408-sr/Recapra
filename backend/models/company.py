from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String, nullable=False)
    company_email = Column(String, nullable=True)
    hr_name = Column(String, nullable=True)
    hr_email = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    website = Column(String, nullable=True)
    linkedin_page = Column(String, nullable=True)
    location = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    company_type = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    logo_path = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String, default="pending")  # pending, approved, rejected
    verification_rejection_reason = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by_admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="company_profile", foreign_keys=[user_id])
    verified_by_admin = relationship("User", back_populates="verified_companies", foreign_keys=[verified_by_admin_id])
    verification_documents = relationship("CompanyVerificationDocument", back_populates="company_profile", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="company", cascade="all, delete-orphan")


class CompanyVerificationDocument(Base):
    __tablename__ = "company_verification_documents"

    id = Column(Integer, primary_key=True, index=True)
    company_profile_id = Column(Integer, ForeignKey("company_profiles.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String, nullable=False)  # registration_cert, tax_doc, etc.
    gst_number = Column(String, nullable=True)
    registration_number = Column(String, nullable=True)
    file_path = Column(String, nullable=False)
    original_file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    company_profile = relationship("CompanyProfile", back_populates="verification_documents")
