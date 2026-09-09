import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)

    approvals = relationship("Approval", back_populates="department")
    applications = relationship("Application", back_populates="department")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    authority = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    timeline_days = Column(Integer, default=30)  # SLA in days
    renewal_frequency_months = Column(Integer, default=12)  # 12 = 1 year, 36 = 3 years
    mandatory = Column(Boolean, default=True)
    dependencies = Column(String(255), nullable=True)  # Comma-separated approval codes if any
    fee_estimate = Column(String(100), default="₹2,500 - ₹5,000")
    penalty_info = Column(Text, nullable=True)

    department = relationship("Department", back_populates="approvals")
    rules = relationship("ApprovalRule", back_populates="approval", cascade="all, delete-orphan")
    requirements = relationship("ApprovalRequirement", back_populates="approval", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="approval")
    renewals = relationship("Renewal", back_populates="approval")

class ApprovalRule(Base):
    __tablename__ = "approval_rules"

    id = Column(Integer, primary_key=True, index=True)
    approval_id = Column(Integer, ForeignKey("approvals.id"), nullable=False, index=True)
    condition_field = Column(String(100), nullable=False)  # sector, state, business_stage, investment_min, etc.
    operator = Column(String(20), default="equals")  # equals, in, gte, lte, contains
    condition_value = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=True)

    approval = relationship("Approval", back_populates="rules")

class ApprovalRequirement(Base):
    __tablename__ = "approval_requirements"

    id = Column(Integer, primary_key=True, index=True)
    approval_id = Column(Integer, ForeignKey("approvals.id"), nullable=False, index=True)
    document_type = Column(String(100), nullable=False)  # e.g., "PAN Card", "Land Lease Deed"
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Compliance")
    description = Column(Text, nullable=True)
    is_mandatory = Column(Boolean, default=True)
    sample_format_url = Column(String(255), nullable=True)

    approval = relationship("Approval", back_populates="requirements")
