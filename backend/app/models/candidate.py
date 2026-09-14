from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    target_role = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    candidate_skills = relationship("CandidateSkill", back_populates="profile", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=True)

class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("candidate_profiles.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)

    # 3 Evidence Layers
    claimed_confidence = Column(Float, nullable=True)     # Resume + LinkedIn
    evidence_confidence = Column(Float, nullable=True)    # GitHub
    demonstrated_score = Column(Float, nullable=True)     # Interview
    
    # Metadata
    supporting_evidence = Column(JSON, nullable=True)     # JSON list of evidence
    weaknesses = Column(JSON, nullable=True)              # JSON list of weaknesses
    question_count = Column(Integer, default=0)
    trend = Column(String, nullable=True)                 # "improving", "declining", "stable"
    last_assessed = Column(DateTime(timezone=True), nullable=True)

    profile = relationship("CandidateProfile", back_populates="candidate_skills")
    skill = relationship("Skill")
