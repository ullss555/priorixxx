from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Ticket
from app.schemas import (
    AiCategorizeRequest, AiCategorizeResponse,
    AiAnalyzeRequest, AiAnalyzeResponse,
    AiTriageChatRequest, AiTriageChatResponse,
    AiSuggestResponseRequest, AiSuggestResponseResponse,
    AiRelatedTicketsRequest, AiRelatedTicketsResponse,
    AiRelatedTicketMatch
)
from app.services.gemini_service import (
    categorize_ticket_ai, analyze_ticket_ai, triage_support_chat,
    suggest_ticket_reply, find_related_tickets_ai
)

router = APIRouter(prefix="/api/ai", tags=["AI Integration"])


@router.post("/categorize", response_model=AiCategorizeResponse)
def ai_categorize(payload: AiCategorizeRequest):
    """Categorizes ticket content using Gemini AI with fallback heuristic."""
    result = categorize_ticket_ai(payload.title, payload.description)
    return AiCategorizeResponse(**result)


@router.post("/analyze", response_model=AiAnalyzeResponse)
def ai_analyze(payload: AiAnalyzeRequest):
    """
    Performs comprehensive AI ticket analysis.
    Returns concise summary, category, urgency with explanation, impact, keywords, and reasoning.
    """
    result = analyze_ticket_ai(
        title=payload.title,
        description=payload.description,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email
    )
    return AiAnalyzeResponse(**result)


@router.post("/triage/chat", response_model=AiTriageChatResponse)
def ai_triage_chat(payload: AiTriageChatRequest):
    """
    Interactive customer triage chatbot.
    Asks clarification questions when info is missing, drafts structured ticket details,
    and returns review card before ticket creation.
    """
    messages_data = [{"role": m.role, "content": m.content} for m in payload.messages]
    draft_data = payload.current_draft.model_dump() if payload.current_draft else None

    result = triage_support_chat(messages=messages_data, current_draft=draft_data)
    return AiTriageChatResponse(**result)


@router.post("/suggest-response", response_model=AiSuggestResponseResponse)
def ai_suggest_response(payload: AiSuggestResponseRequest, db: Session = Depends(get_db)):
    """Generates an empathetic draft response for support agent review."""
    ticket = db.query(Ticket).filter(Ticket.id == payload.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    result = suggest_ticket_reply(
        ticket_title=ticket.title,
        ticket_description=ticket.description,
        customer_name=ticket.customer_name,
        status=ticket.status,
        category=ticket.category,
        custom_instruction=payload.custom_instruction
    )

    return AiSuggestResponseResponse(
        ticket_id=ticket.id,
        suggested_reply=result["suggested_reply"],
        tone=result["tone"],
        key_points=result["key_points"],
        is_ai_generated=result["is_ai_generated"],
        model_used=result.get("model_used", "Gemini-1.5-Flash"),
        disclaimer=result.get("disclaimer", "AI Suggestion. Please review and edit before sending.")
    )


@router.post("/related-tickets", response_model=AiRelatedTicketsResponse)
def ai_related_tickets(payload: AiRelatedTicketsRequest, db: Session = Depends(get_db)):
    """
    Identifies potential duplicate tickets or incident correlations.
    Respects user authorization: customers only see permitted tickets; never leaks sensitive data.
    """
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

    matches_data = find_related_tickets_ai(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        candidates=candidates,
        requester_email=payload.requester_email,
        user_role=payload.user_role or "agent"
    )

    matches = [AiRelatedTicketMatch(**m) for m in matches_data]

    return AiRelatedTicketsResponse(
        matches=matches,
        suggested_incident_id=None,
        is_ai_generated=True,
        human_review_required=True,
        disclaimer="These matches are suggestions only and must be reviewed by support personnel before merging, closing, or linking."
    )
