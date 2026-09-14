import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/skilltwin"
    JWT_SECRET: str = "supersecretkey"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    LLM_PROVIDER: str = "groq"
    
    # LLM Settings
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "llama-3.3-70b-versatile"

    GITHUB_TOKEN: Optional[str] = None

    # PRISM Settings
    PRISM_ENABLED: bool = False
    PRISM_API_KEY: Optional[str] = None
    PRISM_BASE_URL: Optional[str] = None
    PRISM_ENVIRONMENT: str = "development"

    MAX_QUESTIONS: int = 15
    MAX_FOLLOWUPS: int = 2
    MAX_LLM_RETRIES: int = 2

    model_config = SettingsConfigDict(
        env_file="../.env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
