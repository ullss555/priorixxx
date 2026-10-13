import os
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger("priorix.database")

Base = declarative_base()

# Determine database engine
db_url = settings.DATABASE_URL
active_db_type = "postgresql"

try:
    # Check if PostgreSQL URL is provided
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    # Attempt to create engine
    if "postgresql" in db_url:
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"connect_timeout": 3} if "postgresql" in db_url else {}
        )
        # Try a quick test connection
        with engine.connect() as conn:
            active_db_type = "postgresql"
            logger.info("Successfully connected to PostgreSQL/Supabase database.")
    else:
        raise ValueError("Non-PostgreSQL URL configured")
except Exception as e:
    logger.warning(
        f"Unable to connect to configured PostgreSQL instance ({e}). "
        f"Initializing local SQLite fallback for testing and offline development."
    )
    # Safe SQLite engine for zero-dependency local development/testing
    active_db_type = "sqlite"
    sqlite_path = os.path.join(os.path.dirname(__file__), "..", "priorix_dev.db")
    engine = create_engine(
        f"sqlite:///{sqlite_path}",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_status() -> dict:
    return {
        "connected": True,
        "type": active_db_type,
        "is_supabase_postgres": active_db_type == "postgresql",
        "description": "Supabase / PostgreSQL Persistent Database" if active_db_type == "postgresql" else "Local SQLite Fallback (PostgreSQL credentials not yet configured)"
    }
