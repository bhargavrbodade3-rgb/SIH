from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=True)
    subject = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    priority = Column(String(20), default="MEDIUM")
    status = Column(String(30), default="OPEN")  # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    description = Column(Text, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    officer_assigned = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    business = relationship("Business")
