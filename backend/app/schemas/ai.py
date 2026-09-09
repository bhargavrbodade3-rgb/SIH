from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AIChatRequest(BaseModel):
    message: str
    business_id: Optional[int] = None
    application_id: Optional[int] = None

class AIChatResponse(BaseModel):
    reply: str
    action_suggestion: Optional[str] = None
    action_link: Optional[str] = None
    confidence: float = 0.95
    source: str = "DEMO AI COMPLIANCE ENGINE"
