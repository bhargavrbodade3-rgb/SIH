from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RenewalResponse(BaseModel):
    id: int
    business_id: int
    approval_id: int
    application_id: Optional[int] = None
    certificate_number: str
    valid_from: datetime
    valid_until: datetime
    renewal_due_date: datetime
    status: str # ACTIVE, RENEWAL_UPCOMING, RENEWAL_DUE, EXPIRED
    days_to_due: int
    created_at: datetime
    
    approval_name: Optional[str] = None
    authority: Optional[str] = None
    business_name: Optional[str] = None

    class Config:
        from_attributes = True
