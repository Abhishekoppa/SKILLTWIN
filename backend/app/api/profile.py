from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.candidate import CandidateProfile, Skill, CandidateSkill
from app.schemas.candidate import CandidateProfileResponse
from app.api.auth import get_current_user

router = APIRouter()

from app.models.resume import Resume

@router.get("/skill-twin", response_model=CandidateProfileResponse)
def get_skill_twin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        # Create a new profile if it doesn't exist
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    # Get latest resume for ATS score
    latest_resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).first()
    
    # Create response dictionary
    response_data = {
        "id": profile.id,
        "user_id": profile.user_id,
        "resume_id": profile.resume_id,
        "target_role": profile.target_role,
        "candidate_skills": profile.candidate_skills,
        "ats_score": None,
        "ats_feedback": None
    }
    
    if latest_resume and latest_resume.parsed_data:
        response_data["ats_score"] = latest_resume.parsed_data.get("ats_score", 0)
        response_data["ats_feedback"] = latest_resume.parsed_data.get("ats_feedback", "")
        
    return response_data

@router.post("/analyze")
def analyze_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # This endpoint is a placeholder for triggering an analysis
    # It would pull from the resumes and repositories, parse them, and update candidate_skills
    return {"message": "Profile analysis initiated"}
