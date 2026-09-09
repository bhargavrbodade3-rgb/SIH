import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    business_type = Column(String(100), default="Manufacturing")  # Manufacturing, Services, Trading, IT, Retail, etc.
    sector = Column(String(100), nullable=False, index=True)       # Food Processing, IT / Software, Manufacturing, Retail, etc.
    description = Column(Text, nullable=True)

    # Owner details
    applicant_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)

    # Location & Premises
    state = Column(String(100), nullable=False, default="Maharashtra")
    district = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    pincode = Column(String(20), nullable=True)
    land_property = Column(String(100), default="Rented Industrial / Commercial Premises")  # Legacy label
    premises_type = Column(String(50), default="RENTED")  # OWNED, RENTED, LEASED, CONSENT_SHARED

    # Project parameters
    investment = Column(Float, default=0.0)  # in INR
    employees = Column(Integer, default=1)
    business_stage = Column(String(50), default="PLANNING")  # IDEA, PLANNING, REGISTRATION, SETUP, OPERATIONAL, EXPANSION
    business_activity = Column(Text, nullable=True)

    # Sector-Specific & Progressive Disclosure Parameters
    electricity_load_kw = Column(String(50), nullable=True)     # e.g. "25 kW"
    water_usage_lpd = Column(String(50), nullable=True)         # e.g. "5000 Litres/Day"
    food_handling = Column(Boolean, default=False)              # Food processing, restaurant, catering
    manufacturing_activity = Column(Boolean, default=True)      # Physical manufacturing / assembly
    construction_activity = Column(Boolean, default=False)     # Civil construction / structural
    storage_activity = Column(Boolean, default=False)          # Warehouse / hazardous storage
    logistics_activity = Column(Boolean, default=False)        # Commercial vehicle fleet / transport
    sector_answers = Column(Text, nullable=True)               # JSON encoded answers to sector questionnaires

    profile_completion = Column(Integer, default=0)  # Percentage 0-100
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="businesses")
    documents = relationship("Document", back_populates="business", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="business", cascade="all, delete-orphan")
    renewals = relationship("Renewal", back_populates="business", cascade="all, delete-orphan")
