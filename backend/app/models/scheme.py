import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from backend.app.database import Base

class GovernmentScheme(Base):
    __tablename__ = "government_schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    ministry = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=False)  # Food Processing, MSME, Manufacturing, All
    target_stage = Column(String(100), default="PLANNING, SETUP, OPERATIONAL")
    
    min_investment = Column(Float, default=0.0)
    max_investment = Column(Float, default=1000000000.0)
    
    benefits_summary = Column(Text, nullable=False)
    subsidy_percentage = Column(String(50), default="25% - 35%")
    max_subsidy_amount = Column(String(100), default="₹50,00,000")
    eligibility_criteria = Column(Text, nullable=False)
    required_documents = Column(Text, nullable=True) # Comma-separated or JSON list
    application_url = Column(String(255), nullable=True)
    deadline = Column(String(100), default="Open Throughout Year")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
