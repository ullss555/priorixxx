from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import Ticket, TicketHistory


def is_ticket_overdue(deadline: Optional[datetime], status: str, current_time: Optional[datetime] = None) -> bool:
    """Returns True if deadline is past and ticket is not resolved or closed."""
    if not deadline:
        return False
    if status.strip().lower() in ["resolved", "closed"]:
        return False
        
    now = current_time or datetime.now(timezone.utc)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
        
    return now > deadline


def is_ticket_approaching_deadline(
    deadline: Optional[datetime], 
    status: str, 
    threshold_hours: int = 24, 
    current_time: Optional[datetime] = None
) -> bool:
    """Returns True if deadline is in future but within threshold_hours, and unresolved."""
    if not deadline:
        return False
    if status.strip().lower() in ["resolved", "closed"]:
        return False
        
    now = current_time or datetime.now(timezone.utc)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
        
    if now >= deadline:
        return False  # Already overdue, not approaching
        
    return (deadline - now) <= timedelta(hours=threshold_hours)


def evaluate_ticket_deadlines(ticket: Ticket, current_time: Optional[datetime] = None) -> dict:
    """Helper to return flags for a single ticket."""
    return {
        "is_overdue": is_ticket_overdue(ticket.deadline, ticket.status, current_time),
        "is_approaching_deadline": is_ticket_approaching_deadline(ticket.deadline, ticket.status, 24, current_time)
    }


def scan_and_record_escalations(db: Session, actor: str = "Escalation Service") -> List[dict]:
    """
    Evaluates all active tickets against their deadlines.
    Records history when a ticket breaches deadline or nears threshold.
    """
    now = datetime.now(timezone.utc)
    active_tickets = db.query(Ticket).filter(
        Ticket.status.notin_(["Resolved", "Closed"])
    ).all()
    
    escalations = []
    for t in active_tickets:
        if t.deadline:
            deadline = t.deadline.replace(tzinfo=timezone.utc) if t.deadline.tzinfo is None else t.deadline
            if now > deadline and t.escalation_level < 2:
                t.escalation_level = 2
                history_entry = TicketHistory(
                    ticket_id=t.id,
                    action="ESCALATED_OVERDUE",
                    actor=actor,
                    details=f"Ticket breached resolution deadline of {deadline.isoformat()}. Escalated to Level 2 (Critical Overdue)."
                )
                db.add(history_entry)
                escalations.append({"ticket_id": t.id, "level": 2, "reason": "OVERDUE"})
            elif (deadline - now) <= timedelta(hours=12) and t.escalation_level < 1:
                t.escalation_level = 1
                history_entry = TicketHistory(
                    ticket_id=t.id,
                    action="ESCALATED_WARNING",
                    actor=actor,
                    details=f"Ticket resolution deadline is approaching in less than 12 hours ({deadline.isoformat()}). Escalated to Level 1 (Warning)."
                )
                db.add(history_entry)
                escalations.append({"ticket_id": t.id, "level": 1, "reason": "APPROACHING"})
                
    if escalations:
        db.commit()
    return escalations
