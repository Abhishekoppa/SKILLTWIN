from pydantic import BaseModel, Field
from typing import List, Optional

class AnswerEvaluation(BaseModel):
    correctness: int = Field(ge=0, le=100)
    technical_depth: int = Field(ge=0, le=100)
    reasoning: int = Field(ge=0, le=100)
    communication: int = Field(ge=0, le=100)
    overall: int = Field(ge=0, le=100)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    feedback: str
    recommended_action: str = Field(description="'increase_difficulty', 'maintain', 'follow_up', or 'recovery'")

class NextQuestion(BaseModel):
    question_text: str
    topic: str
    difficulty_level: int
    mode: str
