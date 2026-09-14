from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, resumes, profile, sources, interviews

app = FastAPI(
    title="SkillTwin API",
    description="Adaptive AI Interview Simulator + Resume/GitHub/LinkedIn Intelligence + Block Convey PRISM Governance",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(auth.router, prefix="/api", tags=["Users"]) # For /api/me if it belongs there
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(sources.router, prefix="/api/sources", tags=["Sources"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["Interviews"])

@app.get("/")
def read_root():
    return {"message": "SkillTwin API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
