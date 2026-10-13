import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db, get_db_status
from app.seed_data import seed_database
from app.routers import tickets, incidents, agents, dashboard, ai, demo, auth_routes
from app.services.sla_scheduler import run_sla_escalation_cycle
from app.schemas import AiTriageChatRequest, AiTriageChatResponse
from app.services.gemini_service import triage_support_chat

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("priorix")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing PRIORIX database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema validated/created successfully.")
        
        # Seed initial data
        db = SessionLocal()
        try:
            seed_database(db, force=False)
            logger.info("Database seed validation completed.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        
    yield
    logger.info("PRIORIX backend shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="PRIORIX: Prioritize smarter. Resolve faster. AI-assisted support prioritization engine.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(tickets.router)
app.include_router(incidents.router)
app.include_router(agents.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(demo.router)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    db_status = get_db_status()
    has_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": db_status,
        "ai": {
            "gemini_configured": has_gemini,
            "model": settings.GEMINI_MODEL,
            "status": "active" if has_gemini else "fallback_heuristic"
        }
    }


@app.post("/api/chat/triage", response_model=AiTriageChatResponse, tags=["AI Integration"])
def direct_chat_triage(payload: AiTriageChatRequest):
    """Agreed contract route: POST /api/chat/triage"""
    messages_data = [{"role": m.role, "content": m.content} for m in payload.messages]
    draft_data = payload.current_draft.model_dump() if payload.current_draft else None
    result = triage_support_chat(messages=messages_data, current_draft=draft_data)
    return AiTriageChatResponse(**result)


@app.post("/api/sla/escalate", tags=["SLA"])
def trigger_sla_escalation(db: Session = Depends(get_db)):
    """Triggers an idempotent SLA escalation cycle across active tickets."""
    escalations = run_sla_escalation_cycle(db, actor="API Escalation Trigger")
    return {
        "status": "success",
        "escalated_count": len(escalations),
        "escalations": escalations
    }


# Unified Single-Server Mode: Serve Built React SPA when available
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist_dir):
    assets_dir = os.path.join(frontend_dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="spa_assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_frontend(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Endpoint not found")
        file_path = os.path.join(frontend_dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Frontend index.html not found")

