from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    APP_NAME: str = "PRIORIX API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Database configuration (Supabase PostgreSQL / PostgreSQL)
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/postgres",
        description="PostgreSQL connection string. If unavailable, in-memory SQLite test harness is used for unit tests."
    )
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DEMO_ACCOUNT_PASSWORD: str = "PriorixDemo2026!"
    
    # Gemini AI Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_TIMEOUT_SECONDS: float = 10.0
    GEMINI_MAX_RETRIES: int = 1
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Prioritization weights (sum = 100%)
    WEIGHT_URGENCY: float = 0.35
    WEIGHT_IMPACT: float = 0.30
    WEIGHT_DEADLINE: float = 0.20
    WEIGHT_WAITING: float = 0.15
    
    # Escalation defaults
    DEFAULT_DEADLINE_HOURS: int = 24
    DEADLINE_WARNING_HOURS: int = 12


settings = Settings()
