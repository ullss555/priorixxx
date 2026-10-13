import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.database import get_db
from app.models import Ticket, Incident, Agent, TicketHistory, TicketEvent, Profile
from app.auth import get_current_user, check_ticket_access, require_role
from app.schemas import (
    TicketCreate, TicketUpdate, TicketResponse, TicketListResponse,
    TicketAssignRequest, TicketHistoryResponse, TicketEventResponse,
    AgentRecommendation, AiAnalyzeRequest, AiAnalyzeResponse,
    AiRelatedTicketsRequest, AiRelatedTicketsResponse, AiRelatedTicketMatch
)
from app.services.scoring import calculate_priority_score
from app.services.deadlines import evaluate_ticket_deadlines
from app.services.assignment import recommend_agents_for_ticket
from app.services.sla_scheduler import compute_sla_due_date, run_sla_escalation_cycle
from app.services.gemini_service import analyze_ticket_ai, find_related_tickets_ai

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


def format_ticket_response(ticket: Ticket) -> TicketResponse:
    deadlines_info = evaluate_ticket_deadlines(ticket)
    resp = TicketResponse.model_validate(ticket)
    resp.is_overdue = deadlines_info["is_overdue"]
    resp.is_approaching_deadline = deadlines_info["is_approaching_deadline"]
    resp.subject = ticket.title
    resp.priority = ticket.priority_level
    resp.sla_due_at = ticket.deadline
    return resp


@router.get("", response_model=TicketListResponse)
def list_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    category_filter: Optional[str] = Query(None, alias="category"),
    agent_id: Optional[str] = Query(None),
    incident_id: Optional[str] = Query(None),
    is_overdue: Optional[bool] = Query(None),
    is_approaching: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("priority_score", pattern="^(priority_score|deadline|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists tickets with filtering, pagination, and sorting.
    Enforces customer isolation: customers only see their own tickets.
    """
    query = db.query(Ticket)

    # Customer isolation
    if current_user.role == "customer":
        query = query.filter(
            or_(
                Ticket.created_by == current_user.id,
                Ticket.customer_email.ilike(current_user.email)
            )
        )

    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if priority_filter:
        query = query.filter(Ticket.priority_level == priority_filter)
    if category_filter:
        query = query.filter(Ticket.category == category_filter)
    if agent_id:
        query = query.filter(or_(Ticket.assigned_agent_id == agent_id, Ticket.assigned_to == agent_id))
    if incident_id:
        query = query.filter(Ticket.incident_id == incident_id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Ticket.title.ilike(search_pattern),
                Ticket.description.ilike(search_pattern),
                Ticket.ticket_number.ilike(search_pattern),
                Ticket.customer_name.ilike(search_pattern),
                Ticket.customer_email.ilike(search_pattern)
            )
        )

    # Sorting
    sort_col = getattr(Ticket, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    total = query.count()
    raw_tickets = query.offset((page - 1) * page_size).limit(page_size).all()

    formatted_tickets = [format_ticket_response(t) for t in raw_tickets]

    # In-memory post-filter for dynamic deadline flags if requested
    if is_overdue is not None:
        formatted_tickets = [t for t in formatted_tickets if t.is_overdue == is_overdue]
    if is_approaching is not None:
        formatted_tickets = [t for t in formatted_tickets if t.is_approaching_deadline == is_approaching]

    return TicketListResponse(
        tickets=formatted_tickets,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new support ticket.
    Calculates deterministic priority score and binds deterministic SLA target deadline.
    Records creation audit events in ticket_events and ticket_history.
    """
    count = db.query(Ticket).count() + 1001
    ticket_num = f"PRX-{count}"

    now = datetime.now(timezone.utc)
    title_val = payload.title or payload.subject or "Untitled Ticket"
    cust_name = payload.customer_name or current_user.display_name
    cust_email = str(payload.customer_email) if payload.customer_email else current_user.email

    # Check if linked to verified critical incident
    is_verified_critical = False
    incident_code = None
    if payload.incident_id:
        inc = db.query(Incident).filter(Incident.id == payload.incident_id).first()
        if inc:
            is_verified_critical = inc.is_verified_critical
            incident_code = inc.incident_code

    # Temporary provisional deadline for priority score calculation
    provisional_deadline = payload.deadline or (now + timedelta(hours=24))

    score_data = calculate_priority_score(
        urgency=payload.urgency,
        impact=payload.impact,
        deadline=provisional_deadline,
        created_at=now,
        status="Open",
        is_verified_critical=is_verified_critical,
        incident_code=incident_code
    )

    # Determine authoritative SLA deadline based on calculated priority level
    priority_level = score_data["priority_level"]
    authoritative_deadline = payload.deadline or compute_sla_due_date(priority_level, now)

    ticket = Ticket(
        id=str(uuid.uuid4()),
        ticket_number=ticket_num,
        created_by=current_user.id,
        customer_name=cust_name,
        customer_email=cust_email,
        title=title_val,
        description=payload.description,
        summary=payload.summary,
        category=payload.category,
        urgency=payload.urgency,
        impact=payload.impact,
        priority_score=score_data["priority_score"],
        priority_level=priority_level,
        priority_explanation=score_data["priority_explanation"],
        reason_codes=score_data["reason_codes"],
        status="Open",
        assigned_agent_id=payload.assigned_agent_id or payload.assigned_to,
        assigned_to=payload.assigned_to or payload.assigned_agent_id,
        incident_id=payload.incident_id,
        deadline=authoritative_deadline,
        created_at=now,
        updated_at=now
    )

    db.add(ticket)
    db.commit()

    # Record event in ticket_events
    event = TicketEvent(
        ticket_id=ticket.id,
        actor_id=current_user.id,
        actor=current_user.display_name,
        event_type="TICKET_CREATED",
        event_data={
            "priority": ticket.priority_level,
            "priority_score": ticket.priority_score,
            "sla_due_at": authoritative_deadline.isoformat(),
            "category": ticket.category
        },
        created_at=now
    )
    db.add(event)

    # Record in ticket_history
    history_entry = TicketHistory(
        ticket_id=ticket.id,
        action="CREATED",
        actor=current_user.display_name,
        details=f"Ticket submitted. Priority: {ticket.priority_level} ({ticket.priority_score}/100). SLA target: {authoritative_deadline.isoformat()}.",
        timestamp=now
    )
    db.add(history_entry)

    if ticket.assigned_agent_id:
        agent = db.query(Agent).filter(Agent.id == ticket.assigned_agent_id).first()
        agent_name = agent.name if agent else ticket.assigned_agent_id
        db.add(TicketHistory(
            ticket_id=ticket.id,
            action="ASSIGNED",
            actor="Dispatch Auto-Router",
            details=f"Assigned to agent {agent_name} at ticket creation.",
            timestamp=now
        ))

    db.commit()
    db.refresh(ticket)
    return format_ticket_response(ticket)


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: str,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    check_ticket_access(ticket, current_user)
    return format_ticket_response(ticket)


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: str,
    payload: TicketUpdate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    check_ticket_access(ticket, current_user)

    now = datetime.now(timezone.utc)
    changes = []

    # Update basic fields
    new_title = payload.title or payload.subject
    if new_title is not None and new_title != ticket.title:
        ticket.title = new_title
        changes.append("Title updated")
    if payload.description is not None and payload.description != ticket.description:
        ticket.description = payload.description
        changes.append("Description updated")
    if payload.summary is not None and payload.summary != ticket.summary:
        ticket.summary = payload.summary
        changes.append("Summary updated")

    # Permissions check: Only agents and admins can reassign, change status, or change category
    is_staff = current_user.role in ["agent", "admin"]

    if payload.category is not None and payload.category != ticket.category:
        if not is_staff:
            raise HTTPException(status_code=403, detail="Only agents or admins can re-categorize tickets.")
        changes.append(f"Category changed from {ticket.category} to {payload.category}")
        ticket.category = payload.category

    # Status changes
    if payload.status is not None and payload.status != ticket.status:
        if not is_staff and payload.status not in ["Closed"]:
            raise HTTPException(status_code=403, detail="Customers may only close their own tickets.")

        old_status = ticket.status
        ticket.status = payload.status
        changes.append(f"Status changed from {old_status} to {payload.status}")

        if payload.status in ["Resolved", "Closed"]:
            ticket.resolved_at = now
        else:
            ticket.resolved_at = None

        db.add(TicketEvent(
            ticket_id=ticket.id,
            actor_id=current_user.id,
            actor=current_user.display_name,
            event_type="STATUS_CHANGED",
            event_data={"from": old_status, "to": payload.status},
            created_at=now
        ))
        db.add(TicketHistory(
            ticket_id=ticket.id,
            action="STATUS_CHANGED",
            actor=current_user.display_name,
            details=f"Status transitioned from '{old_status}' to '{payload.status}'.",
            timestamp=now
        ))

    # Agent assignment
    new_agent_id = payload.assigned_agent_id or payload.assigned_to
    if new_agent_id is not None and new_agent_id != ticket.assigned_agent_id:
        if not is_staff:
            raise HTTPException(status_code=403, detail="Only agents or admins can assign tickets.")
        ticket.assigned_agent_id = new_agent_id
        ticket.assigned_to = new_agent_id
        agent = db.query(Agent).filter(Agent.id == new_agent_id).first()
        agent_name = agent.name if agent else "Unassigned"
        changes.append(f"Assigned to {agent_name}")

        db.add(TicketEvent(
            ticket_id=ticket.id,
            actor_id=current_user.id,
            actor=current_user.display_name,
            event_type="TICKET_ASSIGNED",
            event_data={"assigned_to": new_agent_id, "agent_name": agent_name},
            created_at=now
        ))
        db.add(TicketHistory(
            ticket_id=ticket.id,
            action="ASSIGNED",
            actor=current_user.display_name,
            details=f"Reassigned to {agent_name}.",
            timestamp=now
        ))

    # Incident link changes
    if payload.incident_id is not None and payload.incident_id != ticket.incident_id:
        if not is_staff:
            raise HTTPException(status_code=403, detail="Only staff can link incidents.")
        ticket.incident_id = payload.incident_id
        inc = db.query(Incident).filter(Incident.id == payload.incident_id).first()
        inc_title = f"{inc.incident_code} - {inc.title}" if inc else payload.incident_id
        changes.append(f"Linked to incident {inc_title}")

        db.add(TicketHistory(
            ticket_id=ticket.id,
            action="INCIDENT_LINKED",
            actor=current_user.display_name,
            details=f"Linked to incident {inc_title}.",
            timestamp=now
        ))

    priority_input_changed = False
    if payload.urgency is not None and payload.urgency != ticket.urgency:
        changes.append(f"Urgency updated from {ticket.urgency} to {payload.urgency}")
        ticket.urgency = payload.urgency
        priority_input_changed = True
    if payload.impact is not None and payload.impact != ticket.impact:
        changes.append(f"Impact updated from {ticket.impact} to {payload.impact}")
        ticket.impact = payload.impact
        priority_input_changed = True
    if payload.deadline is not None and payload.deadline != ticket.deadline:
        changes.append("Deadline adjusted")
        ticket.deadline = payload.deadline
        priority_input_changed = True

    # Recalculate priority score
    is_verified_critical = False
    incident_code = None
    if ticket.incident_id:
        inc = db.query(Incident).filter(Incident.id == ticket.incident_id).first()
        if inc:
            is_verified_critical = inc.is_verified_critical
            incident_code = inc.incident_code

    score_data = calculate_priority_score(
        urgency=ticket.urgency,
        impact=ticket.impact,
        deadline=ticket.deadline,
        created_at=ticket.created_at,
        status=ticket.status,
        is_verified_critical=is_verified_critical,
        incident_code=incident_code
    )

    old_score = ticket.priority_score
    ticket.priority_score = score_data["priority_score"]
    ticket.priority_level = score_data["priority_level"]
    ticket.priority_explanation = score_data["priority_explanation"]
    ticket.reason_codes = score_data["reason_codes"]
    ticket.updated_at = now

    if abs(old_score - ticket.priority_score) > 0.1:
        db.add(TicketHistory(
            ticket_id=ticket.id,
            action="PRIORITY_RECALCULATED",
            actor="Priority Engine",
            details=f"Score updated from {old_score} to {ticket.priority_score} ({ticket.priority_level}).",
            timestamp=now
        ))

    db.commit()
    db.refresh(ticket)
    return format_ticket_response(ticket)


@router.post("/{ticket_id}/assign", response_model=TicketResponse)
def assign_agent(
    ticket_id: str,
    payload: TicketAssignRequest,
    current_user: Profile = Depends(require_role(["agent", "admin"])),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    now = datetime.now(timezone.utc)
    ticket.assigned_agent_id = payload.agent_id
    ticket.assigned_to = payload.agent_id
    ticket.updated_at = now

    agent_name = "Unassigned"
    if payload.agent_id:
        agent = db.query(Agent).filter(Agent.id == payload.agent_id).first()
        if agent:
            agent_name = agent.name

    note_text = f" Notes: {payload.notes}" if payload.notes else ""
    actor_name = payload.actor or current_user.display_name

    db.add(TicketEvent(
        ticket_id=ticket.id,
        actor_id=current_user.id,
        actor=actor_name,
        event_type="TICKET_ASSIGNED",
        event_data={"assigned_to": payload.agent_id, "agent_name": agent_name, "notes": payload.notes},
        created_at=now
    ))

    db.add(TicketHistory(
        ticket_id=ticket.id,
        action="ASSIGNED",
        actor=actor_name,
        details=f"Assigned ticket to {agent_name}.{note_text}",
        timestamp=now
    ))

    db.commit()
    db.refresh(ticket)
    return format_ticket_response(ticket)


@router.get("/{ticket_id}/events", response_model=List[TicketEventResponse])
def get_ticket_events(
    ticket_id: str,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    check_ticket_access(ticket, current_user)
    events = db.query(TicketEvent).filter(TicketEvent.ticket_id == ticket_id).order_by(desc(TicketEvent.created_at)).all()
    return events


@router.get("/{ticket_id}/history", response_model=List[TicketHistoryResponse])
def get_ticket_history(
    ticket_id: str,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    check_ticket_access(ticket, current_user)
    history = db.query(TicketHistory).filter(TicketHistory.ticket_id == ticket_id).order_by(desc(TicketHistory.timestamp)).all()
    return history


@router.get("/{ticket_id}/recommend-agents", response_model=List[AgentRecommendation])
def get_recommended_agents(
    ticket_id: str,
    current_user: Profile = Depends(require_role(["agent", "admin"])),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    recommendations = recommend_agents_for_ticket(
        category=ticket.category,
        db=db,
        ticket_id=ticket.id
    )
    return recommendations


@router.post("/analyze", response_model=AiAnalyzeResponse)
def analyze_ticket_endpoint(payload: AiAnalyzeRequest):
    """API contract endpoint: POST /api/tickets/analyze"""
    title_text = payload.title or payload.subject or ""
    result = analyze_ticket_ai(
        title=title_text,
        description=payload.description,
        customer_name=payload.customer_name,
        customer_email=str(payload.customer_email) if payload.customer_email else None
    )
    return AiAnalyzeResponse(**result)


@router.post("/related", response_model=AiRelatedTicketsResponse)
def related_tickets_endpoint(
    payload: AiRelatedTicketsRequest,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """API contract endpoint: POST /api/tickets/related"""
    query = db.query(Ticket).filter(Ticket.status.notin_(["Resolved", "Closed"]))
    if payload.exclude_ticket_id:
        query = query.filter(Ticket.id != payload.exclude_ticket_id)

    candidates_raw = query.all()
    candidates = [
        {
            "id": t.id,
            "ticket_number": t.ticket_number,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "customer_email": t.customer_email
        }
        for t in candidates_raw
    ]

    title_text = payload.title or payload.subject or ""
    matches_data = find_related_tickets_ai(
        title=title_text,
        description=payload.description,
        category=payload.category,
        candidates=candidates,
        requester_email=current_user.email,
        user_role=current_user.role
    )

    matches = [AiRelatedTicketMatch(**m) for m in matches_data]
    return AiRelatedTicketsResponse(
        matches=matches,
        suggested_incident_id=None,
        is_ai_generated=True,
        human_review_required=True,
        disclaimer="These matches are suggestions only and must be reviewed by support personnel before merging, closing, or linking."
    )
