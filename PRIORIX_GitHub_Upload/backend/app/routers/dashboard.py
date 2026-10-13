from datetime import datetime, timezone, timedelta
from collections import Counter
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db, get_db_status
from app.models import Ticket, Incident, TicketHistory, Profile
from app.auth import get_current_user
from app.schemas import DashboardStats, TicketHistoryResponse, VolumeDataPoint, SlaMetrics
from app.services.deadlines import evaluate_ticket_deadlines
from app.routers.incidents import format_incident_response
from app.routers.agents import list_agents

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardStats)
@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    days: int = Query(30, ge=1, le=365, description="Historical trend window in days"),
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns authorized dashboard statistics derived strictly from actual database records.
    If requester is a customer, returns metrics scoped strictly to their tickets.
    """
    if current_user.role == "customer":
        all_tickets = db.query(Ticket).filter(
            or_(
                Ticket.created_by == current_user.id,
                Ticket.customer_email.ilike(current_user.email)
            )
        ).all()
    else:
        all_tickets = db.query(Ticket).all()
    
    total_tickets = len(all_tickets)
    open_tickets = sum(1 for t in all_tickets if t.status == "Open")
    in_progress_tickets = sum(1 for t in all_tickets if t.status == "In Progress")
    resolved_tickets = sum(1 for t in all_tickets if t.status in ["Resolved", "Closed"])
    
    # Priority level distribution
    priority_counts = Counter(t.priority_level for t in all_tickets)
    priority_distribution = {
        "Critical": priority_counts.get("Critical", 0),
        "High": priority_counts.get("High", 0),
        "Medium": priority_counts.get("Medium", 0),
        "Low": priority_counts.get("Low", 0)
    }

    # Status distribution
    status_counts = Counter(t.status for t in all_tickets)
    status_distribution = {
        "Open": status_counts.get("Open", 0),
        "In Progress": status_counts.get("In Progress", 0),
        "Waiting": status_counts.get("Waiting", 0),
        "Resolved": status_counts.get("Resolved", 0),
        "Closed": status_counts.get("Closed", 0)
    }

    # Category distribution
    category_counts = Counter(t.category for t in all_tickets)
    category_distribution = dict(category_counts)

    # Active Overdue and Approaching Deadlines calculations
    overdue_count = 0
    approaching_count = 0
    critical_tickets_count = 0

    for t in all_tickets:
        deadlines_info = evaluate_ticket_deadlines(t)
        if deadlines_info["is_overdue"]:
            overdue_count += 1
        if deadlines_info["is_approaching_deadline"]:
            approaching_count += 1
        if t.priority_level == "Critical" and t.status not in ["Resolved", "Closed"]:
            critical_tickets_count += 1

    # SLA Metrics calculation
    within_sla_count = max(0, total_tickets - overdue_count)
    compliance_rate = round((within_sla_count / total_tickets * 100), 1) if total_tickets > 0 else 100.0
    sla_metrics = SlaMetrics(
        within_sla=within_sla_count,
        overdue=overdue_count,
        compliance_rate=compliance_rate
    )

    # Calculate Volume Trend from actual ticket creation dates
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=days)).date()
    
    # Create daily bucket map
    daily_created = Counter()
    daily_resolved = Counter()
    for t in all_tickets:
        if t.created_at:
            c_date = t.created_at.date() if hasattr(t.created_at, "date") else datetime.fromisoformat(str(t.created_at)).date()
            if c_date >= start_date:
                daily_created[c_date] += 1
        if t.status in ["Resolved", "Closed"] and t.updated_at:
            r_date = t.updated_at.date() if hasattr(t.updated_at, "date") else datetime.fromisoformat(str(t.updated_at)).date()
            if r_date >= start_date:
                daily_resolved[r_date] += 1

    volume_trend = []
    # Build continuous sequence of dates
    for d_offset in range(days + 1):
        cur_date = start_date + timedelta(days=d_offset)
        if cur_date > now.date():
            break
        date_str = cur_date.strftime("%Y-%m-%d")
        volume_trend.append(VolumeDataPoint(
            date=date_str,
            tickets=daily_created.get(cur_date, 0),
            resolved=daily_resolved.get(cur_date, 0)
        ))

    # Active critical incidents (for agents/admins, or relevant to customer)
    critical_incidents_raw = db.query(Incident).filter(
        Incident.is_verified_critical == True,
        Incident.status != "Resolved"
    ).all()
    critical_incidents = [format_incident_response(inc, db) for inc in critical_incidents_raw]

    # Agent workloads (only for staff, empty for customer to prevent data leakage)
    agent_workloads = list_agents(db) if current_user.role in ["agent", "admin"] else []

    # Recent activity
    if current_user.role == "customer":
        ticket_ids = [t.id for t in all_tickets]
        recent_history_raw = db.query(TicketHistory).filter(TicketHistory.ticket_id.in_(ticket_ids)).order_by(desc(TicketHistory.timestamp)).limit(10).all() if ticket_ids else []
    else:
        recent_history_raw = db.query(TicketHistory).order_by(desc(TicketHistory.timestamp)).limit(10).all()

    recent_activity = [TicketHistoryResponse.model_validate(h) for h in recent_history_raw]

    db_status = get_db_status()

    return DashboardStats(
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        in_progress_tickets=in_progress_tickets,
        critical_tickets=critical_tickets_count,
        overdue_tickets=overdue_count,
        approaching_deadline_tickets=approaching_count,
        resolved_tickets=resolved_tickets,
        priority_distribution=priority_distribution,
        status_distribution=status_distribution,
        category_distribution=category_distribution,
        critical_incidents=critical_incidents,
        agent_workloads=agent_workloads,
        recent_activity=recent_activity,
        database_status=db_status,
        volume_trend=volume_trend,
        sla_metrics=sla_metrics
    )

