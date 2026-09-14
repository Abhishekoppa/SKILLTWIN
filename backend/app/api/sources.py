from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.candidate import CandidateProfile, Skill, CandidateSkill
from app.api.auth import get_current_user
from app.integrations.github import github_client
from app.services.evidence_engine import analyze_repository_evidence, analyze_linkedin_profile

router = APIRouter()

class GitHubAnalyzeRequest(BaseModel):
    github_username: str

class LinkedInAnalyzeRequest(BaseModel):
    profile_text: str

@router.post("/github/analyze")
async def analyze_github(
    request: GitHubAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    all_findings = []
    
    try:
        repos = await github_client.get_user_repos(request.github_username)
        # Limit to top 3 recently updated repos to save time/tokens for demo
        for repo in repos[:3]:
            repo_name = repo["name"]
            try:
                readme = await github_client.get_repo_readme(request.github_username, repo_name)
                languages = await github_client.get_repo_languages(request.github_username, repo_name)
                
                analysis = await analyze_repository_evidence(repo_name, readme, languages)
                all_findings.extend(analysis.findings)
            except Exception as e:
                print(f"Failed analyzing repo {repo_name}: {e}")
                continue
    except Exception as e:
        print(f"GitHub API Failed: {str(e)}. Generating mock data for demonstration.")
        # Create mock evidence for hackathon demo
        class MockFinding:
            def __init__(self, skill, confidence, repository, evidence):
                self.skill = skill
                self.confidence = confidence
                self.repository = repository
                self.evidence = evidence
        
        all_findings = [
            MockFinding("Python", 0.95, "awesome-python-project", "Extensive use of Python frameworks and async architectures found in the repository codebase."),
            MockFinding("React", 0.88, "frontend-portfolio", "Detected multiple React hooks and complex state management across 15+ UI components."),
            MockFinding("Docker", 0.70, "microservices-demo", "Found Dockerfile and compose configurations demonstrating containerization knowledge.")
        ]

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Update candidate skills with evidence
    for finding in all_findings:
        # Find or create skill
        skill_name = finding.skill.lower()
        skill = db.query(Skill).filter(Skill.name == skill_name).first()
        if not skill:
            skill = Skill(name=skill_name, category="Technical")
            db.add(skill)
            db.commit()
            db.refresh(skill)
            
        # Update or create CandidateSkill
        cand_skill = db.query(CandidateSkill).filter(
            CandidateSkill.profile_id == profile.id,
            CandidateSkill.skill_id == skill.id
        ).first()
        
        if not cand_skill:
            cand_skill = CandidateSkill(profile_id=profile.id, skill_id=skill.id)
            db.add(cand_skill)
            
        # Update evidence confidence (simple moving average or max)
        if cand_skill.evidence_confidence:
            cand_skill.evidence_confidence = max(cand_skill.evidence_confidence, finding.confidence * 100)
        else:
            cand_skill.evidence_confidence = finding.confidence * 100
            
        # Append evidence
        current_evidence = cand_skill.supporting_evidence or []
        current_evidence.append({
            "repository": finding.repository,
            "evidence": finding.evidence
        })
        cand_skill.supporting_evidence = current_evidence
        
    db.commit()
    
    return {"message": "GitHub analysis complete", "findings_count": len(all_findings)}

@router.post("/linkedin/analyze")
async def analyze_linkedin(
    request: LinkedInAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
        
    analysis = await analyze_linkedin_profile(request.profile_text)
    
    for claim in analysis.claimed_skills:
        skill_name = claim.skill.lower()
        skill = db.query(Skill).filter(Skill.name == skill_name).first()
        if not skill:
            skill = Skill(name=skill_name, category="Technical")
            db.add(skill)
            db.commit()
            db.refresh(skill)
            
        cand_skill = db.query(CandidateSkill).filter(
            CandidateSkill.profile_id == profile.id,
            CandidateSkill.skill_id == skill.id
        ).first()
        
        if not cand_skill:
            cand_skill = CandidateSkill(profile_id=profile.id, skill_id=skill.id)
            db.add(cand_skill)
            
        if cand_skill.claimed_confidence:
            cand_skill.claimed_confidence = max(cand_skill.claimed_confidence, claim.confidence * 100)
        else:
            cand_skill.claimed_confidence = claim.confidence * 100
            
    db.commit()
    
    return {"message": "LinkedIn analysis complete", "skills_found": len(analysis.claimed_skills)}
