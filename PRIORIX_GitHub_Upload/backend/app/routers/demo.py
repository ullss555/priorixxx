from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.seed_data import seed_database
from app.services.deadlines import scan_and_record_escalations

router = APIRouter(prefix="/api/demo", tags=["Demo & System Controls"])


@router.post("/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    """Resets the demo environment to initial seed data for repeatable hackathon demonstrations."""
    seed_database(db, force=True)
    return {"message": "Demo data successfully reinitialized to benchmark state.", "status": "ok"}


@router.post("/trigger-escalation-scan")
def trigger_escalation_scan(db: Session = Depends(get_db)):
    """Triggers an immediate scan for approaching and overdue deadlines."""
    escalations = scan_and_record_escalations(db, actor="Manual Dispatcher Trigger")
    return {
        "message": f"Escalation scan completed. {len(escalations)} tickets escalated.",
        "escalations": escalations
    }
