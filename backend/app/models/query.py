import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Query(Base):
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(50), default="HIGH")  # LOW, MEDIUM, HIGH, URGENT
    deadline = Column(String(50), nullable=True)   # Date string or datetime
    status = Column(String(50), default="OPEN")    # OPEN, RESPONDED, RESOLVED
    
    response_text = Column(Text, nullable=True)
    response_document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    responded_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="queries")
    officer = relationship("User", foreign_keys=[officer_id])
    response_document = relationship("Document", foreign_keys=[response_document_id])
