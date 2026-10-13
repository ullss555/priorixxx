from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Agent, Ticket


def evaluate_agent_workloads(db: Session) -> List[Dict[str, Any]]:
    """Calculates active ticket counts and utilization for all agents."""
    agents = db.query(Agent).all()
    results = []

    for agent in agents:
        active_count = db.query(Ticket).filter(
            Ticket.assigned_agent_id == agent.id,
            Ticket.status.notin_(["Resolved", "Closed"])
        ).count()

        utilization = round((active_count / max(1, agent.max_capacity)) * 100.0, 1)
        
        results.append({
            "agent": agent,
            "active_tickets_count": active_count,
            "utilization_percentage": min(100.0, utilization),
            "available_slots": max(0, agent.max_capacity - active_count)
        })

    return results


def recommend_agents_for_ticket(
    category: str,
    db: Session,
    ticket_id: str = None
) -> List[Dict[str, Any]]:
    """
    Evaluates active agents and produces transparent ranked recommendations.
    
    Scoring formula:
    - Skill match: 50 points if category is in agent skills, 15 points otherwise
    - Capacity availability: 40 points * (available_slots / max_capacity)
    - Active status: 10 points if active, 0 if inactive
    Total: 0 to 100 points
    """
    workloads = evaluate_agent_workloads(db)
    recommendations = []

    for item in workloads:
        agent: Agent = item["agent"]
        active_count = item["active_tickets_count"]
        available_slots = item["available_slots"]

        if not agent.is_active:
            recommendations.append({
                "agent": agent,
                "match_score": 0.0,
                "is_recommended": False,
                "explanation": f"{agent.name} is currently inactive and unavailable for assignment.",
                "reasons": ["Agent status is inactive"],
                "active_tickets_count": active_count,
                "utilization_percentage": item["utilization_percentage"]
            })
            continue

        reasons = []
        score = 0.0

        # 1. Skill Match (Max 50 points)
        category_lower = category.strip().lower()
        agent_skills_lower = [s.strip().lower() for s in (agent.skills or [])]
        
        has_skill = category_lower in agent_skills_lower
        if has_skill:
            score += 50.0
            reasons.append(f"Domain specialist in '{category}'")
        else:
            score += 15.0
            reasons.append("General tier support capability")

        # 2. Capacity & Workload (Max 40 points)
        capacity_ratio = available_slots / max(1, agent.max_capacity)
        capacity_score = capacity_ratio * 40.0
        score += capacity_score

        if available_slots <= 0:
            reasons.append(f"At max capacity ({active_count}/{agent.max_capacity} tickets)")
        elif available_slots >= 3:
            reasons.append(f"High availability ({available_slots} slots free)")
        else:
            reasons.append(f"Moderate capacity ({available_slots} slots free)")

        # 3. Active status baseline (10 points)
        score += 10.0

        score = round(min(100.0, max(0.0, score)), 1)
        is_recommended = score >= 60.0 and available_slots > 0

        explanation = (
            f"Match Score: {score}/100. "
            f"{'Primary skill match for ' + category if has_skill else 'General skill coverage'}. "
            f"Workload: {active_count}/{agent.max_capacity} active tickets ({item['utilization_percentage']}% utilized)."
        )

        recommendations.append({
            "agent": agent,
            "match_score": score,
            "is_recommended": is_recommended,
            "explanation": explanation,
            "reasons": reasons,
            "active_tickets_count": active_count,
            "utilization_percentage": item["utilization_percentage"]
        })

    # Sort descending by match_score
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return recommendations
