from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Schema for the LLM structured output
class Experience(BaseModel):
    title: str
    company: str
    duration: Optional[str] = None
    description: Optional[str] = None

class Education(BaseModel):
    degree: str
    institution: str
    year: Optional[str] = None

class Project(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)

class ParsedResumeData(BaseModel):
    target_roles: List[str] = Field(description="Target job roles identified")
    skills: List[str] = Field(description="List of technical and soft skills")
    experience: List[Experience] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(description="Relevant keywords for the candidate")
    ats_score: Optional[int] = Field(description="Estimated ATS match score out of 100 based on the target role.", default=0)
    ats_feedback: Optional[str] = Field(description="Actionable feedback on how to improve the resume for ATS systems.", default="")

# API Schemas
class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    parsed_data: Optional[ParsedResumeData] = None
    created_at: datetime

    class Config:
        from_attributes = True
