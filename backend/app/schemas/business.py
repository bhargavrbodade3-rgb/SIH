from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BusinessBase(BaseModel):
    name: str
    business_type: Optional[str] = "Manufacturing"
    sector: str
    description: Optional[str] = None
    applicant_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    state: str = "Maharashtra"
    district: str
    city: str
    address: Optional[str] = None
    pincode: Optional[str] = None
    investment: float = 0.0
    employees: int = 1
    business_stage: str = "PLANNING"
    land_property: Optional[str] = "Rented Industrial / Commercial Premises"
    premises_type: Optional[str] = "RENTED"
    business_activity: Optional[str] = None
    electricity_load_kw: Optional[str] = None
    water_usage_lpd: Optional[str] = None
    food_handling: Optional[bool] = False
    manufacturing_activity: Optional[bool] = True
    construction_activity: Optional[bool] = False
    storage_activity: Optional[bool] = False
    logistics_activity: Optional[bool] = False
    sector_answers: Optional[str] = None

class BusinessCreate(BusinessBase):
    pass

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    business_type: Optional[str] = None
    sector: Optional[str] = None
    description: Optional[str] = None
    applicant_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    investment: Optional[float] = None
    employees: Optional[int] = None
    business_stage: Optional[str] = None
    land_property: Optional[str] = None
    premises_type: Optional[str] = None
    business_activity: Optional[str] = None
    electricity_load_kw: Optional[str] = None
    water_usage_lpd: Optional[str] = None
    food_handling: Optional[bool] = None
    manufacturing_activity: Optional[bool] = None
    construction_activity: Optional[bool] = None
    storage_activity: Optional[bool] = None
    logistics_activity: Optional[bool] = None
    sector_answers: Optional[str] = None

class BusinessResponse(BusinessBase):
    id: int
    owner_id: int
    profile_completion: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
