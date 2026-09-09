from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SchemeResponse(BaseModel):
    id: int
    name: str
    ministry: str
    sector: str
    target_stage: str
    min_investment: float
    max_investment: float
    benefits_summary: str
    subsidy_percentage: str
    max_subsidy_amount: str
    eligibility_criteria: str
    required_documents: Optional[str] = None
    application_url: Optional[str] = None
    deadline: str
    created_at: datetime

    class Config:
        from_attributes = True

class SchemeRecommendationResponse(BaseModel):
    scheme: SchemeResponse
    match_score: int # e.g. 95%
    match_reasons: List[str]
    potential_benefit: str
    required_documents_list: List[str]
