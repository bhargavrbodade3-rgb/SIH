from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DocumentBase(BaseModel):
    category: str
    doc_type: str
    doc_number: Optional[str] = None
    issuing_authority: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    validity_status: Optional[str] = "VALID"

class DocumentUpdate(BaseModel):
    category: Optional[str] = None
    doc_type: Optional[str] = None
    doc_number: Optional[str] = None
    issuing_authority: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    validity_status: Optional[str] = None
    is_verified: Optional[bool] = None

class DocumentResponse(DocumentBase):
    id: int
    business_id: int
    uploaded_by_id: int
    filename: str
    original_name: str
    file_size: int
    mime_type: str
    is_verified: bool
    ai_detected: bool
    days_to_expiry: Optional[int] = None
    ocr_extracted_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MatchedRequirementItem(BaseModel):
    requirement_id: int
    required_name: str
    document_type: str
    category: str
    is_mandatory: bool
    status: str # "MATCHED", "MISSING", "EXPIRED", "EXPIRING_SOON", "UNKNOWN"
    matched_document: Optional[DocumentResponse] = None
    reason: Optional[str] = None

class ReadinessScoreResponse(BaseModel):
    approval_id: int
    approval_name: str
    total_required: int
    total_matched: int
    total_valid: int
    total_expiring: int
    total_missing: int
    readiness_percentage: float
    is_ready_for_submission: bool
    requirements_status: List[MatchedRequirementItem]

class StepReadinessResponse(BaseModel):
    step_code: str
    step_name: str
    total_required: int
    total_matched: int
    total_valid: int
    total_expiring: int
    total_missing: int
    readiness_percentage: float
    is_ready_for_submission: bool
    action_items: List[str]
    explanation: str
    requirements_status: List[MatchedRequirementItem]
