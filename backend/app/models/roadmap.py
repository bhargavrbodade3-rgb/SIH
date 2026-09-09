import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class RoadmapStep(Base):
    __tablename__ = "roadmap_steps"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # FOUNDATIONAL, SECTOR_SPECIFIC, POST_APPROVAL
    description = Column(Text, nullable=False)
    issuing_authority = Column(String(255), nullable=False)
    official_portal_url = Column(String(255), nullable=False)
    typical_timeline_days = Column(String(50), default="7-15")
    typical_cost = Column(String(255), default="0")
    depends_on = Column(String(255), default="")  # comma-separated codes, e.g. "PAN,INCORPORATION"
    approval_code = Column(String(50), nullable=True)  # link to Approval model clearance code
    step_order = Column(Integer, default=1, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    statuses = relationship("BusinessRoadmapStatus", back_populates="roadmap_step", cascade="all, delete-orphan")

class BusinessRoadmapStatus(Base):
    __tablename__ = "business_roadmap_statuses"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    roadmap_step_id = Column(Integer, ForeignKey("roadmap_steps.id"), nullable=False, index=True)
    status = Column(String(30), default="NOT_STARTED")  # NOT_STARTED, IN_PROGRESS, DONE
    completed_at = Column(DateTime, nullable=True)
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    business = relationship("Business")
    roadmap_step = relationship("RoadmapStep", back_populates="statuses")
