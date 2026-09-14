from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from app.core.config import settings

class EvidenceGrounding(BaseModel):
    repository: str
    skill: str
    confidence: float
    evidence: List[str]

class RepositoryAnalysisResult(BaseModel):
    findings: List[EvidenceGrounding]

async def analyze_repository_evidence(repo_name: str, readme_content: str, languages: dict) -> RepositoryAnalysisResult:
    """Analyze repository metadata and README to find skill evidence."""
    if not settings.LLM_API_KEY:
        raise ValueError("LLM API Key not configured")

    llm = ChatGroq(
        model=settings.LLM_MODEL,
        temperature=0,
        api_key=settings.LLM_API_KEY,
    )

    structured_llm = llm.with_structured_output(RepositoryAnalysisResult)

    prompt = f"""
    Analyze the following GitHub repository for technical skills and provide evidence.
    
    Repository Name: {repo_name}
    Languages: {languages}
    
    README snippet:
    {readme_content[:3000]} # Limit to avoid token overflow
    
    Identify specific skills (e.g., Python, LangGraph, React, Postgres) and provide a confidence score (0.0 to 1.0) 
    based on how strongly the evidence supports the candidate using this skill in the repository.
    Extract specific evidence lines or architectural details as proof.
    """

    result = structured_llm.invoke(prompt)
    return result

class LinkedInClaim(BaseModel):
    skill: str
    confidence: float
    source: str

class LinkedInAnalysisResult(BaseModel):
    claimed_skills: List[LinkedInClaim]

async def analyze_linkedin_profile(profile_text: str) -> LinkedInAnalysisResult:
    """Analyze pasted LinkedIn text to extract claimed skills."""
    llm = ChatGroq(
        model=settings.LLM_MODEL,
        temperature=0,
        api_key=settings.LLM_API_KEY,
    )
    
    structured_llm = llm.with_structured_output(LinkedInAnalysisResult)
    
    prompt = f"""
    Analyze this LinkedIn profile text and extract claimed technical skills.
    Assign a confidence score (0.0 to 1.0) based on how strongly they claim it (e.g. just a keyword vs detailed explanation of use).
    
    Profile Text:
    {profile_text[:4000]}
    """
    
    return structured_llm.invoke(prompt)
