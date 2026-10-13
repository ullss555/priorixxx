from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Agent, Ticket
from app.schemas import AgentResponse
from app.services.assignment import evaluate_agent_workloads

router = APIRouter(prefix="/api/agents", tags=["Agents"])


@router.get("", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    workloads = evaluate_agent_workloads(db)
    results = []

    for item in workloads:
        agent: Agent = item["agent"]
        resp = AgentResponse.model_validate(agent)
        resp.active_tickets_count = item["active_tickets_count"]
        resp.utilization_percentage = item["utilization_percentage"]
        results.append(resp)

    return results


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    active_count = db.query(Ticket).filter(
        Ticket.assigned_agent_id == agent.id,
        Ticket.status.notin_(["Resolved", "Closed"])
    ).count()

    utilization = round((active_count / max(1, agent.max_capacity)) * 100.0, 1)

    resp = AgentResponse.model_validate(agent)
    resp.active_tickets_count = active_count
    resp.utilization_percentage = min(100.0, utilization)
    return resp
