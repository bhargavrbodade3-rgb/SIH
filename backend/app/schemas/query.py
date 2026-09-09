from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.app.schemas.document import DocumentResponse

class QueryCreate(BaseModel):
    application_id: int
    title: str
    description: str
    priority: Optional[str] = "HIGH"
    deadline: Optional[str] = None

class QueryRespondRequest(BaseModel):
    response_text: str
    response_document_id: Optional[int] = None

class QueryResponse(BaseModel):
    id: int
    application_id: int
    officer_id: int
    title: str
    description: str
    priority: str
    deadline: Optional[str] = None
    status: str
    response_text: Optional[str] = None
    response_document_id: Optional[int] = None
    responded_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    
    officer_name: Optional[str] = None
    application_number: Optional[str] = None
    business_name: Optional[str] = None
    approval_name: Optional[str] = None
    response_document: Optional[DocumentResponse] = None

    class Config:
        from_attributes = True
