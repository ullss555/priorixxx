from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator


# Category Constants
CATEGORIES = [
    "Payment/Billing",
    "Login/Account Access",
    "Technical Issue",
    "Service Outage",
    "Performance",
    "Data Issue",
    "General Enquiry",
    "Other"
]

STATUSES = ["Open", "In Progress", "Waiting", "Resolved", "Closed"]
PRIORITY_LEVELS = ["Critical", "High", "Medium", "Low"]
SEVERITIES = ["Critical", "Major", "Minor"]
INCIDENT_STATUSES = ["Investigating", "Identified", "Monitoring", "Resolved"]


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    display_name: str
    email: str
    role: str
    created_at: datetime


class AgentBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    skills: List[str] = []
    max_capacity: int = 5
    is_active: bool = True


class IncidentBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    incident_code: str
    title: str
    category: str
    severity: str
    status: str
    is_verified_critical: bool


class TicketHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ticket_id: str
    action: str
    actor: str
    details: str
    timestamp: datetime


class TicketEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ticket_id: str
    actor_id: Optional[str] = None
    actor: str
    event_type: str
    event_data: Dict[str, Any] = {}
    created_at: datetime


class TicketCreate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    subject: Optional[str] = Field(None, min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    summary: Optional[str] = None
    category: str = Field(default="Technical Issue")
    customer_name: Optional[str] = Field(None, min_length=2, max_length=128)
    customer_email: Optional[EmailStr] = None
    urgency: str = Field(default="Medium", pattern="^(Low|Medium|High|Critical)$")
    impact: str = Field(default="Medium", pattern="^(Low|Medium|High|Critical)$")
    deadline: Optional[datetime] = None
    sla_due_at: Optional[datetime] = None
    incident_id: Optional[str] = None
    assigned_agent_id: Optional[str] = None
    assigned_to: Optional[str] = None

    @model_validator(mode="after")
    def validate_title_or_subject(self):
        if not self.title and not self.subject:
            raise ValueError("Either 'title' or 'subject' must be provided.")
        if not self.title:
            self.title = self.subject
        if not self.subject:
            self.subject = self.title
        if self.sla_due_at and not self.deadline:
            self.deadline = self.sla_due_at
        return self


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    urgency: Optional[str] = Field(default=None, pattern="^(Low|Medium|High|Critical)$")
    impact: Optional[str] = Field(default=None, pattern="^(Low|Medium|High|Critical)$")
    status: Optional[str] = Field(default=None, pattern="^(Open|In Progress|Waiting|Resolved|Closed)$")
    assigned_agent_id: Optional[str] = None
    assigned_to: Optional[str] = None
    incident_id: Optional[str] = None
    deadline: Optional[datetime] = None
    sla_due_at: Optional[datetime] = None


class TicketAssignRequest(BaseModel):
    agent_id: Optional[str] = None
    actor: Optional[str] = "Supervisor"
    notes: Optional[str] = None


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ticket_number: str
    customer_name: str
    customer_email: str
    title: str
    subject: Optional[str] = None
    description: str
    summary: Optional[str] = None
    category: str
    urgency: str
    impact: str
    priority_score: float
    priority_level: str
    priority: Optional[str] = None
    priority_explanation: str
    reason_codes: List[str]
    status: str
    created_by: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_agent_id: Optional[str] = None
    incident_id: Optional[str] = None
    deadline: Optional[datetime] = None
    sla_due_at: Optional[datetime] = None
    escalation_level: int = 0
    is_overdue: bool = False
    is_approaching_deadline: bool = False
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    
    # Related nested objects
    assigned_agent: Optional[AgentBrief] = None
    incident: Optional[IncidentBrief] = None
    history: List[TicketHistoryResponse] = []
    events: List[TicketEventResponse] = []

    @model_validator(mode="after")
    def populate_synonyms(self):
        if not self.subject:
            self.subject = self.title
        if not self.priority:
            self.priority = self.priority_level
        if not self.sla_due_at:
            self.sla_due_at = self.deadline
        return self


class TicketListResponse(BaseModel):
    tickets: List[TicketResponse]
    total: int
    page: int
    page_size: int


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    category: str = Field(default="Service Outage")
    severity: str = Field(default="Major", pattern="^(Critical|Major|Minor)$")
    status: str = Field(default="Investigating", pattern="^(Investigating|Identified|Monitoring|Resolved)$")
    is_verified_critical: bool = False


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = Field(default=None, pattern="^(Critical|Major|Minor)$")
    status: Optional[str] = Field(default=None, pattern="^(Investigating|Identified|Monitoring|Resolved)$")
    is_verified_critical: Optional[bool] = None


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    incident_code: str
    title: str
    description: str
    category: str
    severity: str
    status: str
    is_verified_critical: bool
    created_at: datetime
    updated_at: datetime
    linked_tickets_count: int = 0
    tickets: List[TicketResponse] = []


class IncidentLinkRequest(BaseModel):
    ticket_id: str


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    skills: List[str] = []
    max_capacity: int = 5
    is_active: bool = True
    created_at: datetime
    active_tickets_count: int = 0
    utilization_percentage: float = 0.0


class AgentRecommendation(BaseModel):
    agent: AgentResponse
    match_score: float
    is_recommended: bool
    explanation: str
    reasons: List[str]


# AI Request and Response Models
class AiCategorizeRequest(BaseModel):
    title: str = ""
    description: str


class AiCategorizeResponse(BaseModel):
    category: str
    confidence: float
    suggested_urgency: str
    suggested_impact: str
    rationale: str
    summary: Optional[str] = None
    urgency_explanation: Optional[str] = None
    keywords: List[str] = []
    is_ai_generated: bool = True
    model_used: str = "Gemini-1.5-Flash"


class AiAnalyzeRequest(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: str = Field(..., min_length=1, max_length=5000)
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None

    @model_validator(mode="after")
    def unify_title_subject(self):
        if not self.title and self.subject:
            self.title = self.subject
        return self


class AiAnalyzeResponse(BaseModel):
    summary: str
    category: str
    suggested_urgency: str
    urgency_explanation: str
    suggested_impact: str
    keywords: List[str] = []
    rationale: str
    confidence: float
    is_ai_generated: bool = True
    model_used: str = "Gemini-1.5-Flash"


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=3000)


class TicketDraft(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    suggested_urgency: Optional[str] = None
    urgency_explanation: Optional[str] = None
    suggested_impact: Optional[str] = None
    keywords: List[str] = []
    missing_information: List[str] = []
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None


class AiTriageChatRequest(BaseModel):
    messages: List[ChatMessage]
    current_draft: Optional[TicketDraft] = None


class AiTriageChatResponse(BaseModel):
    message: str
    suggested_ticket: TicketDraft
    is_ready_for_review: bool = False
    disclaimer: str = "The AI triage assistant helps collect and organize your ticket details. Your ticket has NOT been submitted yet. Please review and confirm your details before creating a ticket."
    is_ai_generated: bool = True
    model_used: str = "Gemini-1.5-Flash"


class AiSuggestResponseRequest(BaseModel):
    ticket_id: str
    custom_instruction: Optional[str] = None


class AiSuggestResponseResponse(BaseModel):
    ticket_id: str
    suggested_reply: str
    tone: str
    key_points: List[str]
    is_ai_generated: bool = True
    model_used: str = "Gemini-1.5-Flash"
    disclaimer: str = "AI Suggestion. Please review and edit before sending to the customer."


class AiRelatedTicketsRequest(BaseModel):
    title: Optional[str] = ""
    subject: Optional[str] = None
    description: Optional[str] = ""
    category: Optional[str] = "Technical Issue"
    exclude_ticket_id: Optional[str] = None
    requester_email: Optional[str] = None
    user_role: Optional[str] = Field(default="agent", pattern="^(customer|agent|admin)$")

    @model_validator(mode="after")
    def unify_title(self):
        if not self.title and self.subject:
            self.title = self.subject
        return self


class AiRelatedTicketMatch(BaseModel):
    ticket_id: str
    ticket_number: str
    title: str
    category: str
    similarity_score: float
    reason: str
    is_suggestion: bool = True


class AiRelatedTicketsResponse(BaseModel):
    matches: List[AiRelatedTicketMatch]
    suggested_incident_id: Optional[str] = None
    suggested_incident_title: Optional[str] = None
    is_ai_generated: bool = True
    human_review_required: bool = True
    disclaimer: str = "These matches are suggestions only and must be reviewed by support personnel before merging, closing, or linking."


# Analytics & Dashboard Models
class VolumeDataPoint(BaseModel):
    date: str
    tickets: int
    resolved: int


class SlaMetrics(BaseModel):
    within_sla: int
    overdue: int
    compliance_rate: float


# Dashboard Metrics Models
class DashboardStats(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int = 0
    critical_tickets: int
    overdue_tickets: int
    approaching_deadline_tickets: int
    resolved_tickets: int
    priority_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
    critical_incidents: List[IncidentResponse]
    agent_workloads: List[AgentResponse]
    recent_activity: List[TicketHistoryResponse]
    database_status: Dict[str, Any]
    volume_trend: List[VolumeDataPoint] = []
    sla_metrics: Optional[SlaMetrics] = None


# Authentication Models
class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: ProfileResponse

