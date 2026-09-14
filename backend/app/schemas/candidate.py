from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None

class CandidateSkillBase(BaseModel):
    claimed_confidence: Optional[float] = None
    evidence_confidence: Optional[float] = None
    demonstrated_score: Optional[float] = None
    supporting_evidence: Optional[Any] = None
    weaknesses: Optional[Any] = None
    question_count: int = 0
    trend: Optional[str] = None
    last_assessed: Optional[datetime] = None

class CandidateSkillResponse(CandidateSkillBase):
    id: int
    skill: SkillBase

    class Config:
        from_attributes = True

class CandidateProfileResponse(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    target_role: Optional[str] = None
    ats_score: Optional[int] = None
    ats_feedback: Optional[str] = None
    candidate_skills: List[CandidateSkillResponse] = []
    
    class Config:
        from_attributes = True
