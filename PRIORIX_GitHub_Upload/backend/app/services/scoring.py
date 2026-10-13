from datetime import datetime, timezone
from typing import Optional, List, Tuple
from app.config import settings

# Normalization maps (0 to 100 base)
SEVERITY_SCALE = {
    "low": 25.0,
    "medium": 50.0,
    "high": 75.0,
    "critical": 100.0
}


def normalize_level(val: Optional[str]) -> float:
    if not val:
        return 50.0
    return SEVERITY_SCALE.get(val.strip().lower(), 50.0)


def calculate_deadline_risk(deadline: Optional[datetime], status: str, current_time: Optional[datetime] = None) -> Tuple[float, List[str]]:
    """
    Computes normalized deadline risk (0.0 to 1.0) and reason codes.
    Resolved or Closed tickets have 0.0 active deadline risk.
    """
    if status.strip().lower() in ["resolved", "closed"]:
        return 0.0, []

    if not deadline:
        return 0.15, []

    now = current_time or datetime.now(timezone.utc)
    
    # Ensure timezone aware
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    diff = (deadline - now).total_seconds()

    if diff <= 0:
        # Overdue
        return 1.0, ["DEADLINE_OVERDUE"]
    
    hours_left = diff / 3600.0
    if hours_left <= 2:
        return 0.95, ["DEADLINE_NEAR"]
    elif hours_left <= 6:
        return 0.80, ["DEADLINE_NEAR"]
    elif hours_left <= 12:
        return 0.65, ["DEADLINE_NEAR"]
    elif hours_left <= 24:
        return 0.50, ["DEADLINE_NEAR"]
    elif hours_left <= 48:
        return 0.35, []
    else:
        return 0.10, []


def calculate_waiting_risk(created_at: Optional[datetime], status: str, current_time: Optional[datetime] = None) -> Tuple[float, List[str]]:
    """
    Computes waiting time factor (0.0 to 1.0) based on age since ticket creation.
    Resolved or Closed tickets have 0.0 active waiting risk.
    """
    if status.strip().lower() in ["resolved", "closed"]:
        return 0.0, []

    if not created_at:
        return 0.1, []

    now = current_time or datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    hours_elapsed = max(0.0, (now - created_at).total_seconds() / 3600.0)

    if hours_elapsed >= 72:
        return 1.0, ["LONG_WAIT"]
    elif hours_elapsed >= 48:
        return 0.80, ["LONG_WAIT"]
    elif hours_elapsed >= 24:
        return 0.60, ["LONG_WAIT"]
    elif hours_elapsed >= 8:
        return 0.40, []
    else:
        # Linear scale up to 8 hours
        return (hours_elapsed / 8.0) * 0.40, []


def score_to_priority_level(score: float) -> str:
    """Maps 0-100 score to priority level."""
    if score >= 85.0:
        return "Critical"
    elif score >= 65.0:
        return "High"
    elif score >= 40.0:
        return "Medium"
    else:
        return "Low"


def calculate_priority_score(
    urgency: str,
    impact: str,
    deadline: Optional[datetime],
    created_at: Optional[datetime],
    status: str,
    is_verified_critical: bool = False,
    incident_code: Optional[str] = None,
    current_time: Optional[datetime] = None
) -> dict:
    """
    Authoritative deterministic priority calculation:
    Urgency: 35%
    Impact: 30%
    Deadline Risk: 20%
    Waiting Time: 15%
    
    Includes critical-incident overrides and explainable reasoning.
    """
    reasons = []

    # 1. Normalized urgency (0 - 100 scale)
    urgency_norm = normalize_level(urgency) / 100.0
    if urgency.strip().lower() in ["critical", "high"]:
        reasons.append("HIGH_URGENCY")

    # 2. Normalized impact (0 - 100 scale)
    impact_norm = normalize_level(impact) / 100.0
    if impact.strip().lower() in ["critical", "high"]:
        reasons.append("HIGH_IMPACT")

    # 3. Deadline risk (0.0 to 1.0)
    deadline_risk, deadline_reasons = calculate_deadline_risk(deadline, status, current_time)
    reasons.extend(deadline_reasons)

    # 4. Waiting time risk (0.0 to 1.0)
    waiting_risk, waiting_reasons = calculate_waiting_risk(created_at, status, current_time)
    reasons.extend(waiting_reasons)

    # Calculate weighted base score
    weighted_urgency = urgency_norm * settings.WEIGHT_URGENCY * 100.0
    weighted_impact = impact_norm * settings.WEIGHT_IMPACT * 100.0
    weighted_deadline = deadline_risk * settings.WEIGHT_DEADLINE * 100.0
    weighted_waiting = waiting_risk * settings.WEIGHT_WAITING * 100.0

    raw_score = weighted_urgency + weighted_impact + weighted_deadline + weighted_waiting
    final_score = round(min(100.0, max(0.0, raw_score)), 1)
    
    # Critical incident override
    if is_verified_critical:
        # Verified critical service incident outranks routine work regardless of arrival order
        final_score = max(final_score, 98.0)
        if "CRITICAL_INCIDENT" not in reasons:
            reasons.insert(0, "CRITICAL_INCIDENT")

    if not reasons:
        reasons.append("STANDARD_PRIORITY")

    priority_level = score_to_priority_level(final_score)

    # Build human-readable explanation
    explanation_parts = [
        f"Score: {final_score}/100 ({priority_level}).",
        f"Factors: Urgency ({weighted_urgency:.1f}/{settings.WEIGHT_URGENCY*100:.0f}), "
        f"Impact ({weighted_impact:.1f}/{settings.WEIGHT_IMPACT*100:.0f}), "
        f"Deadline Risk ({weighted_deadline:.1f}/{settings.WEIGHT_DEADLINE*100:.0f}), "
        f"Wait Time ({weighted_waiting:.1f}/{settings.WEIGHT_WAITING*100:.0f})."
    ]

    if is_verified_critical:
        code_str = f" ({incident_code})" if incident_code else ""
        explanation_parts.append(
            f"OVERRIDE APPLIED: Linked to authorized critical service incident{code_str}. Elevates priority above routine work."
        )
    elif "DEADLINE_OVERDUE" in reasons:
        explanation_parts.append("ESCALATION: Ticket has breached its resolution deadline and is actively overdue.")
    elif "DEADLINE_NEAR" in reasons:
        explanation_parts.append("WARNING: Ticket resolution deadline is approaching within critical threshold.")

    explanation = " ".join(explanation_parts)

    return {
        "priority_score": final_score,
        "priority_level": priority_level,
        "priority_explanation": explanation,
        "reason_codes": list(dict.fromkeys(reasons)),  # remove duplicates preserving order
        "weighted_breakdown": {
            "urgency": round(weighted_urgency, 1),
            "impact": round(weighted_impact, 1),
            "deadline": round(weighted_deadline, 1),
            "waiting": round(weighted_waiting, 1)
        }
    }
