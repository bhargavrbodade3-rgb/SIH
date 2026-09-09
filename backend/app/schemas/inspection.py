from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class InspectionCreate(BaseModel):
    application_id: int
    scheduled_date: str
    scheduled_time: str
    checklist_items: Optional[List[str]] = None
    remarks: Optional[str] = None

class InspectionUpdate(BaseModel):
    status: Optional[str] = None # SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    result: Optional[str] = None # PASSED, CONDITIONAL, FAILED
    remarks: Optional[str] = None
    checklist_results: Optional[Dict[str, bool]] = None

class InspectionResponse(BaseModel):
    id: int
    application_id: int
    officer_id: int
    scheduled_date: str
    scheduled_time: str
    status: str
    result: Optional[str] = None
    checklist_json: Optional[str] = None
    remarks: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    officer_name: Optional[str] = None
    application_number: Optional[str] = None
    business_name: Optional[str] = None
    approval_name: Optional[str] = None

    class Config:
        from_attributes = True
