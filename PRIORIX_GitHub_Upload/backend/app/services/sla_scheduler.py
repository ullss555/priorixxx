import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models import Ticket, TicketEvent, TicketHistory

logger = logging.getLogger("priorix.sla")

# SLA Targets based on priority level
SLA_TARGET_HOURS: Dict[str, int] = {
    "Critical": 4,   # 4 hours resolution target
    "High": 12,      # 12 hours resolution target
    "Medium": 24,    # 24 hours resolution target
    "Low": 48        # 48 hours resolution target
}


def compute_sla_due_date(priority_level: str, start_time: Optional[datetime] = None) -> datetime:
    """Calculates target sla_due_at date based on ticket priority."""
    now = start_time or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    
    hours = SLA_TARGET_HOURS.get(priority_level.capitalize(), 24)
    return now + timedelta(hours=hours)


def run_sla_escalation_cycle(db: Session, actor: str = "PRIORIX SLA Worker") -> List[Dict[str, Any]]:
    """
    Idempotent SLA Escalation Process:
    1. Scans all active tickets (status NOT in ['Resolved', 'Closed']).
    2. Compares persisted deadline (sla_due_at) against current UTC time.
    3. If overdue (now > deadline) and escalation_level < 2:
       - Sets escalation_level = 2
       - Writes an immutable event to ticket_events and ticket_history
    4. If approaching deadline (within 12 hours) and escalation_level < 1:
       - Sets escalation_level = 1
       - Writes an immutable warning event to ticket_events and ticket_history
    5. Repeated runs are completely IDEMPOTENT: tickets already at the escalated level
       are not re-escalated, producing zero duplicate events.
    6. Returns detailed summary of processed escalations.
    """
    now = datetime.now(timezone.utc)
    active_tickets = db.query(Ticket).filter(
        Ticket.status.notin_(["Resolved", "Closed"])
    ).all()

    escalated_results = []

    for ticket in active_tickets:
        deadline = ticket.deadline
        if not deadline:
            continue

        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        # Check for Overdue breach (Level 2)
        if now > deadline:
            if ticket.escalation_level < 2:
                ticket.escalation_level = 2
                event_data = {
                    "reason": "BREACHED_DEADLINE",
                    "deadline": deadline.isoformat(),
                    "evaluated_at": now.isoformat(),
                    "previous_level": ticket.escalation_level,
                    "new_level": 2
                }

                # Record in ticket_events
                event = TicketEvent(
                    ticket_id=ticket.id,
                    actor=actor,
                    event_type="SLA_BREACH_ESCALATION",
                    event_data=event_data,
                    created_at=now
                )
                db.add(event)

                # Record in legacy ticket_history for backward compatibility
                history = TicketHistory(
                    ticket_id=ticket.id,
                    action="ESCALATED_OVERDUE",
                    actor=actor,
                    details=f"SLA breached: deadline was {deadline.isoformat()}. Escalated to Level 2.",
                    timestamp=now
                )
                db.add(history)

                escalated_results.append({
                    "ticket_id": ticket.id,
                    "ticket_number": ticket.ticket_number,
                    "level": 2,
                    "status": "BREACHED",
                    "deadline": deadline.isoformat()
                })

        # Check for Approaching Warning (Level 1)
        elif (deadline - now) <= timedelta(hours=12):
            if ticket.escalation_level < 1:
                ticket.escalation_level = 1
                event_data = {
                    "reason": "APPROACHING_DEADLINE",
                    "hours_remaining": round((deadline - now).total_seconds() / 3600.0, 1),
                    "deadline": deadline.isoformat(),
                    "evaluated_at": now.isoformat(),
                    "new_level": 1
                }

                event = TicketEvent(
                    ticket_id=ticket.id,
                    actor=actor,
                    event_type="SLA_WARNING_ESCALATION",
                    event_data=event_data,
                    created_at=now
                )
                db.add(event)

                history = TicketHistory(
                    ticket_id=ticket.id,
                    action="ESCALATED_WARNING",
                    actor=actor,
                    details=f"SLA warning: deadline approaches within 12 hours ({deadline.isoformat()}). Escalated to Level 1.",
                    timestamp=now
                )
                db.add(history)

                escalated_results.append({
                    "ticket_id": ticket.id,
                    "ticket_number": ticket.ticket_number,
                    "level": 1,
                    "status": "APPROACHING",
                    "deadline": deadline.isoformat()
                })

    if escalated_results:
        db.commit()
        logger.info(f"SLA Escalation cycle processed: {len(escalated_results)} ticket(s) updated.")
    else:
        logger.debug("SLA Escalation cycle completed: 0 new escalations.")

    return escalated_results
