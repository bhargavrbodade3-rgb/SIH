import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Renewal(Base):
    __tablename__ = "renewals"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    approval_id = Column(Integer, ForeignKey("approvals.id"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True, unique=True)
    
    certificate_number = Column(String(100), nullable=False, index=True)
    valid_from = Column(DateTime, default=datetime.datetime.utcnow)
    valid_until = Column(DateTime, nullable=False)
    renewal_due_date = Column(DateTime, nullable=False)
    
    status = Column(String(50), default="ACTIVE") # ACTIVE, RENEWAL_UPCOMING, RENEWAL_DUE, EXPIRED
    notification_sent = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="renewals")
    approval = relationship("Approval", back_populates="renewals")
    application = relationship("Application", back_populates="renewal")
