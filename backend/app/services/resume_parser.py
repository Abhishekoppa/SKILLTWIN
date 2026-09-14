import fitz  # PyMuPDF
from typing import BinaryIO
from langchain_groq import ChatGroq
from app.core.config import settings
from app.schemas.resume import ParsedResumeData

def extract_text_from_pdf(file_stream: BinaryIO) -> str:
    """Extract raw text from PDF bytes stream using PyMuPDF and truncate to optimize LLM speed."""
    doc = fitz.open(stream=file_stream.read(), filetype="pdf")
    text = ""
    # Only process up to the first 3 pages
    for page in doc[:3]:
        text += page.get_text()
    # Truncate to ~6000 characters to keep LLM context window small and extremely fast
    return text[:6000]

def parse_resume_with_llm(raw_text: str, target_role: str = "") -> ParsedResumeData:
    """Pass the raw text to Groq LLM to extract structured data and calculate ATS score."""
    if not settings.LLM_API_KEY:
        raise ValueError("LLM_API_KEY not configured")
        
    llm = ChatGroq(
        model=settings.LLM_MODEL,  # Back to settings.LLM_MODEL to prevent 404
        temperature=0.1,
        max_tokens=4096,
        api_key=settings.LLM_API_KEY,
    )
    
    # We use LangChain's with_structured_output for easy Pydantic extraction
    structured_llm = llm.with_structured_output(ParsedResumeData)
    
    role_context = f"\nThe user is targeting the role: {target_role}. Please evaluate the resume against this role to generate a realistic ats_score (out of 100) and actionable ats_feedback." if target_role else "\nPlease evaluate the resume generally to generate an ats_score (out of 100) and actionable ats_feedback."

    prompt = f"""
    You are an expert technical recruiter and resume analyzer.
    Extract the structured information from the provided resume text.
    Be precise and VERY CONCISE in your descriptions to prevent output truncation. Keep all text fields short.
    If a field is not found, leave it empty or omit it.
    {role_context}
    
    Resume Text:
    {raw_text}
    """
    
    result = structured_llm.invoke(prompt)
    return result
