import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    file_path = Column(String(500), nullable=False)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0)  # in bytes
    mime_type = Column(String(100), default="application/pdf")
    
    category = Column(String(100), default="Other")  # Business, Identity, Financial, Land/Property, Technical, Environmental, Certificates, Licences, NOCs, Compliance, Other
    doc_type = Column(String(150), nullable=False)   # Matched type, e.g., "Food Safety Plan", "Incorporation Certificate"
    doc_number = Column(String(150), nullable=True)  # Extracted document number
    issuing_authority = Column(String(255), nullable=True) # Extracted authority
    issue_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    
    validity_status = Column(String(50), default="VALID")  # VALID, EXPIRING_SOON, EXPIRED, UNKNOWN
    days_to_expiry = Column(Integer, nullable=True)
    
    is_verified = Column(Boolean, default=False)      # User Verified vs AI Detected
    ai_detected = Column(Boolean, default=True)
    ocr_extracted_text = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)       # JSON string for extra fields
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="documents")
    uploader = relationship("User", back_populates="documents")
    application_links = relationship("ApplicationDocument", back_populates="document", cascade="all, delete-orphan")
