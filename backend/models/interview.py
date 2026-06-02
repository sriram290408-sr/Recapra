from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    date_time = Column(String, nullable=False)  # ISO format string or datetime formatted
    interview_mode = Column(String, default="online")  # online, face-to-face, phone
    location_or_link = Column(String, nullable=True)
    interviewer_name = Column(String, nullable=True)
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled, rescheduled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    application = relationship("JobApplication", back_populates="interviews")
