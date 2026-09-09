from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.app.schemas.document import DocumentResponse

class ApplicationCreate(BaseModel):
    business_id: int
    approval_id: int
    document_ids: List[int]
    compression_level: Optional[str] = "High Quality"

class ApplicationStatusChange(BaseModel):
    status: str
    remarks: Optional[str] = None

class ApplicationHistoryItem(BaseModel):
    id: int
    from_status: Optional[str] = None
    to_status: str
    remarks: Optional[str] = None
    changed_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationDocumentItem(BaseModel):
    id: int
    document_id: int
    requirement_name: Optional[str] = None
    sort_order: int
    document: DocumentResponse

    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: int
    application_number: str
    business_id: int
    approval_id: int
    department_id: int
    officer_id: Optional[int] = None
    status: str
    risk_level: str
    readiness_score: float
    package_pdf_path: Optional[str] = None
    compression_level: Optional[str] = None
    submitted_at: Optional[datetime] = None
    expected_completion_date: Optional[datetime] = None
    sla_days: int
    days_remaining: Optional[int] = None
    is_overdue: bool = False
    approved_at: Optional[datetime] = None
    certificate_number: Optional[str] = None
    created_at: datetime
    
    business_name: Optional[str] = None
    approval_name: Optional[str] = None
    department_name: Optional[str] = None
    officer_name: Optional[str] = None
    
    documents: List[ApplicationDocumentItem] = []
    status_history: List[ApplicationHistoryItem] = []

    class Config:
        from_attributes = True

class MergePackageRequest(BaseModel):
    business_id: int
    approval_id: int
    document_ids: List[int]
    compression_level: str = "High Quality"
