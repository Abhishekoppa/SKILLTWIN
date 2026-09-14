from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse, ParsedResumeData
from app.api.auth import get_current_user
from app.services.resume_parser import extract_text_from_pdf, parse_resume_with_llm

router = APIRouter()

@router.post("/", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    target_role: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        raw_text = extract_text_from_pdf(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")
        
    try:
        parsed_data = parse_resume_with_llm(raw_text, target_role)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume with LLM: {str(e)}")

    new_resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        raw_text=raw_text,
        parsed_data=parsed_data.model_dump()
    )
    db.add(new_resume)
    
    # Also update/create the CandidateProfile and Skills
    from app.models.candidate import CandidateProfile, Skill, CandidateSkill
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id, target_role=target_role)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    elif target_role:
        profile.target_role = target_role
        db.commit()
    
    for skill_name in parsed_data.skills:
        # Check if skill exists
        skill = db.query(Skill).filter(Skill.name == skill_name).first()
        if not skill:
            skill = Skill(name=skill_name, category="general")
            db.add(skill)
            db.commit()
            db.refresh(skill)
            
        # Check if candidate_skill exists
        cand_skill = db.query(CandidateSkill).filter(
            CandidateSkill.profile_id == profile.id,
            CandidateSkill.skill_id == skill.id
        ).first()
        
        if not cand_skill:
            cand_skill = CandidateSkill(
                profile_id=profile.id,
                skill_id=skill.id,
                claimed_confidence=75.0, # Base claimed score
                evidence_confidence=0.0,
                demonstrated_score=0.0
            )
            db.add(cand_skill)
        else:
            if cand_skill.claimed_confidence is None:
                cand_skill.claimed_confidence = 75.0
            else:
                cand_skill.claimed_confidence = max(cand_skill.claimed_confidence, 75.0)
            
    db.commit()
    db.refresh(new_resume)
    
    return new_resume

@router.get("/", response_model=list[ResumeResponse])
def get_all_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume
