import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    scheduled_date = Column(String(50), nullable=False) # e.g. "2026-09-15"
    scheduled_time = Column(String(50), nullable=False) # e.g. "11:00 AM"
    status = Column(String(50), default="SCHEDULED")    # SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    result = Column(String(50), nullable=True)          # PASSED, CONDITIONAL, FAILED
    
    checklist_json = Column(Text, nullable=True)        # JSON string of items verified
    remarks = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="inspections")
    officer = relationship("User", foreign_keys=[officer_id])
