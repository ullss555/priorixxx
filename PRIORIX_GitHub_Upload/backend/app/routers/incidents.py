import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import Incident, Ticket, TicketHistory
from app.schemas import (
    IncidentCreate, IncidentUpdate, IncidentResponse, IncidentLinkRequest, TicketResponse
)
from app.services.scoring import calculate_priority_score
from app.services.deadlines import evaluate_ticket_deadlines
from app.services.gemini_service import find_related_tickets_ai

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


def format_incident_response(incident: Incident, db: Session) -> IncidentResponse:
    linked_tickets = db.query(Ticket).filter(Ticket.incident_id == incident.id).all()
    formatted_tickets = []
    for t in linked_tickets:
        d = evaluate_ticket_deadlines(t)
        tr = TicketResponse.model_validate(t)
        tr.is_overdue = d["is_overdue"]
        tr.is_approaching_deadline = d["is_approaching_deadline"]
        formatted_tickets.append(tr)

    resp = IncidentResponse.model_validate(incident)
    resp.linked_tickets_count = len(formatted_tickets)
    resp.tickets = formatted_tickets
    return resp


@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    category_filter: Optional[str] = Query(None, alias="category"),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if severity_filter:
        query = query.filter(Incident.severity == severity_filter)
    if category_filter:
        query = query.filter(Incident.category == category_filter)

    incidents = query.order_by(desc(Incident.created_at)).all()
    return [format_incident_response(inc, db) for inc in incidents]


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    count = db.query(Incident).count() + 1
    code = f"INC-2026-{count:03d}"

    now = datetime.now(timezone.utc)
    incident = Incident(
        id=str(uuid.uuid4()),
        incident_code=code,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        status=payload.status,
        is_verified_critical=payload.is_verified_critical,
        created_at=now,
        updated_at=now
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)
    return format_incident_response(incident, db)


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return format_incident_response(incident, db)


@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(incident_id: str, payload: IncidentUpdate, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.now(timezone.utc)
    critical_status_changed = False

    if payload.title is not None:
        incident.title = payload.title
    if payload.description is not None:
        incident.description = payload.description
    if payload.category is not None:
        incident.category = payload.category
    if payload.severity is not None:
        incident.severity = payload.severity
    if payload.status is not None:
        incident.status = payload.status
    if payload.is_verified_critical is not None and payload.is_verified_critical != incident.is_verified_critical:
        incident.is_verified_critical = payload.is_verified_critical
        critical_status_changed = True

    incident.updated_at = now

    # If critical verification status changed, update priority scores for all linked tickets!
    if critical_status_changed:
        linked_tickets = db.query(Ticket).filter(Ticket.incident_id == incident.id).all()
        for t in linked_tickets:
            score_data = calculate_priority_score(
                urgency=t.urgency,
                impact=t.impact,
                deadline=t.deadline,
                created_at=t.created_at,
                status=t.status,
                is_verified_critical=incident.is_verified_critical,
                incident_code=incident.incident_code
            )
            t.priority_score = score_data["priority_score"]
            t.priority_level = score_data["priority_level"]
            t.priority_explanation = score_data["priority_explanation"]
            t.reason_codes = score_data["reason_codes"]
            t.updated_at = now

            db.add(TicketHistory(
                ticket_id=t.id,
                action="PRIORITY_RECALCULATED",
                actor="Incident Manager",
                details=f"Incident {incident.incident_code} verification changed to {incident.is_verified_critical}. Priority recalculated to {t.priority_score}.",
                timestamp=now
            ))

    db.commit()
    db.refresh(incident)
    return format_incident_response(incident, db)


@router.post("/{incident_id}/link-ticket", response_model=IncidentResponse)
def link_ticket_to_incident(incident_id: str, payload: IncidentLinkRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    ticket = db.query(Ticket).filter(Ticket.id == payload.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    now = datetime.now(timezone.utc)
    ticket.incident_id = incident.id
    ticket.updated_at = now

    # Recalculate priority with incident critical status
    score_data = calculate_priority_score(
        urgency=ticket.urgency,
        impact=ticket.impact,
        deadline=ticket.deadline,
        created_at=ticket.created_at,
        status=ticket.status,
        is_verified_critical=incident.is_verified_critical,
        incident_code=incident.incident_code
    )
    ticket.priority_score = score_data["priority_score"]
    ticket.priority_level = score_data["priority_level"]
    ticket.priority_explanation = score_data["priority_explanation"]
    ticket.reason_codes = score_data["reason_codes"]

    db.add(TicketHistory(
        ticket_id=ticket.id,
        action="INCIDENT_LINKED",
        actor="Support Specialist",
        details=f"Linked to incident {incident.incident_code}: '{incident.title}'. Priority score updated to {ticket.priority_score}.",
        timestamp=now
    ))

    db.commit()
    db.refresh(incident)
    return format_incident_response(incident, db)


@router.post("/{incident_id}/unlink-ticket", response_model=IncidentResponse)
def unlink_ticket_from_incident(incident_id: str, payload: IncidentLinkRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    ticket = db.query(Ticket).filter(Ticket.id == payload.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.incident_id != incident.id:
        raise HTTPException(status_code=400, detail="Ticket is not linked to this incident")

    now = datetime.now(timezone.utc)
    ticket.incident_id = None
    ticket.updated_at = now

    # Recalculate priority without incident critical override
    score_data = calculate_priority_score(
        urgency=ticket.urgency,
        impact=ticket.impact,
        deadline=ticket.deadline,
        created_at=ticket.created_at,
        status=ticket.status,
        is_verified_critical=False
    )
    ticket.priority_score = score_data["priority_score"]
    ticket.priority_level = score_data["priority_level"]
    ticket.priority_explanation = score_data["priority_explanation"]
    ticket.reason_codes = score_data["reason_codes"]

    db.add(TicketHistory(
        ticket_id=ticket.id,
        action="INCIDENT_UNLINKED",
        actor="Support Specialist",
        details=f"Unlinked from incident {incident.incident_code}. Ticket preserved independently. Priority updated to {ticket.priority_score}.",
        timestamp=now
    ))

    db.commit()
    db.refresh(incident)
    return format_incident_response(incident, db)


@router.get("/{incident_id}/suggested-tickets", response_model=List[dict])
def suggest_tickets_for_incident(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Find open unlinked tickets
    open_tickets = db.query(Ticket).filter(
        Ticket.incident_id.is_(None),
        Ticket.status.notin_(["Resolved", "Closed"])
    ).all()

    candidates = [
        {
            "id": t.id,
            "ticket_number": t.ticket_number,
            "title": t.title,
            "description": t.description,
            "category": t.category
        }
        for t in open_tickets
    ]

    matches = find_related_tickets_ai(
        title=incident.title,
        description=incident.description,
        category=incident.category,
        candidates=candidates
    )
    return matches
