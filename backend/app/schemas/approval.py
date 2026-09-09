from pydantic import BaseModel
from typing import List, Optional

class ApprovalRequirementResponse(BaseModel):
    id: int
    approval_id: int
    document_type: str
    name: str
    category: str
    description: Optional[str] = None
    is_mandatory: bool = True
    sample_format_url: Optional[str] = None

    class Config:
        from_attributes = True

class ApprovalRuleResponse(BaseModel):
    id: int
    condition_field: str
    operator: str
    condition_value: str
    explanation: Optional[str] = None

    class Config:
        from_attributes = True

class ApprovalResponse(BaseModel):
    id: int
    department_id: int
    name: str
    code: str
    authority: str
    description: Optional[str] = None
    timeline_days: int
    renewal_frequency_months: int
    mandatory: bool
    dependencies: Optional[str] = None
    fee_estimate: Optional[str] = None
    penalty_info: Optional[str] = None
    requirements: List[ApprovalRequirementResponse] = []

    class Config:
        from_attributes = True

class DiscoveredApprovalResponse(BaseModel):
    approval: ApprovalResponse
    is_applicable: bool
    reasons: List[str]
    timeline_days: int
    mandatory: bool
    dependencies: Optional[str] = None
    renewal_requirement: str
    total_required_docs: int

class ApprovalDiscoveryRequest(BaseModel):
    sector: str
    state: str
    district: Optional[str] = None
    investment: float
    employees: int
    business_stage: str
    business_activity: Optional[str] = None
