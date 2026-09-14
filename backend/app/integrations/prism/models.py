from pydantic import BaseModel
from typing import Optional, Any, Dict

class GovernanceResult(BaseModel):
    approved: bool
    reason: Optional[str] = None
    audit_id: Optional[str] = None

class AIEvent(BaseModel):
    event_type: str  # e.g., 'question_generation', 'answer_evaluation'
    input_context: str
    ai_output: str
    metadata: Dict[str, Any]
