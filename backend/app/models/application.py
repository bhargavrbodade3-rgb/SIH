import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class ApplicationStatus(str):
    NOT_STARTED = "NOT STARTED"
    DOCUMENTS_REQUIRED = "DOCUMENTS REQUIRED"
    READY = "READY"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER REVIEW"
    QUERY_RAISED = "QUERY RAISED"
    INSPECTION_REQUIRED = "INSPECTION REQUIRED"
    INSPECTION_SCHEDULED = "INSPECTION SCHEDULED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(100), unique=True, index=True, nullable=False)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    approval_id = Column(Integer, ForeignKey("approvals.id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Assigned officer
    
    status = Column(String(50), default="SUBMITTED", nullable=False, index=True)
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH
    readiness_score = Column(Float, default=100.0)
    
    package_pdf_path = Column(String(500), nullable=True) # Merged submission dossier
    compression_level = Column(String(50), default="High Quality")
    
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    expected_completion_date = Column(DateTime, nullable=True)
    sla_days = Column(Integer, default=30)
    approved_at = Column(DateTime, nullable=True)
    certificate_number = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="applications")
    approval = relationship("Approval", back_populates="applications")
    department = relationship("Department", back_populates="applications")
    officer = relationship("User", foreign_keys=[officer_id])
    
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")
    queries = relationship("Query", back_populates="application", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="application", cascade="all, delete-orphan")
    renewal = relationship("Renewal", back_populates="application", uselist=False)

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    requirement_name = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)

    application = relationship("Application", back_populates="documents")
    document = relationship("Document", back_populates="application_links")

class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    remarks = Column(Text, nullable=True)
    changed_by_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="status_history")
