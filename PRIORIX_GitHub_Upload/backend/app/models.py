import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    display_name = Column(String(128), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(String(32), nullable=False, default="customer")  # customer, agent, admin
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_code = Column(String(32), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False, index=True)
    severity = Column(String(32), nullable=False, default="MAJOR")  # CRITICAL, MAJOR, MINOR
    status = Column(String(32), nullable=False, default="INVESTIGATING")  # INVESTIGATING, IDENTIFIED, MONITORING, RESOLVED
    is_verified_critical = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    tickets = relationship("Ticket", back_populates="incident", lazy="selectin")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(String(64), nullable=False, default="Support Specialist")
    avatar_url = Column(String(255), nullable=True)
    skills = Column(JSON, default=list, nullable=False)  # List of categories e.g. ["Service Outage", "Technical Issue"]
    max_capacity = Column(Integer, default=5, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    tickets = relationship("Ticket", back_populates="assigned_agent", lazy="selectin")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_number = Column(String(32), unique=True, nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_to = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_name = Column(String(128), nullable=False)
    customer_email = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    category = Column(String(64), nullable=False, index=True)
    
    # Priority evaluation inputs
    urgency = Column(String(32), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    impact = Column(String(32), nullable=False, default="MEDIUM")   # LOW, MEDIUM, HIGH, CRITICAL
    
    # Authoritative scoring outputs
    priority_score = Column(Float, nullable=False, default=50.0, index=True)
    priority_level = Column(String(32), nullable=False, default="MEDIUM", index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    priority_explanation = Column(Text, nullable=False, default="")
    reason_codes = Column(JSON, default=list, nullable=False)  # e.g. ["HIGH_IMPACT", "DEADLINE_NEAR"]
    
    # Lifecycle
    status = Column(String(32), nullable=False, default="OPEN", index=True)  # OPEN, IN_PROGRESS, WAITING, RESOLVED, CLOSED
    assigned_agent_id = Column(String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    deadline = Column(DateTime(timezone=True), nullable=True, index=True)
    escalation_level = Column(Integer, default=0, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Aliases/Properties for schema contract compatibility
    @property
    def subject(self) -> str:
        return self.title

    @subject.setter
    def subject(self, val: str):
        self.title = val

    @property
    def priority(self) -> str:
        return self.priority_level

    @priority.setter
    def priority(self, val: str):
        self.priority_level = val

    @property
    def sla_due_at(self) -> Optional[datetime]:
        return self.deadline

    @sla_due_at.setter
    def sla_due_at(self, val: Optional[datetime]):
        self.deadline = val

    # Relationships
    assigned_agent = relationship("Agent", back_populates="tickets", lazy="joined")
    incident = relationship("Incident", back_populates="tickets", lazy="joined")
    history = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan", order_by="desc(TicketHistory.timestamp)", lazy="selectin")
    events = relationship("TicketEvent", back_populates="ticket", cascade="all, delete-orphan", order_by="desc(TicketEvent.created_at)", lazy="selectin")


class TicketHistory(Base):
    __tablename__ = "ticket_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(64), nullable=False)  # CREATED, STATUS_CHANGED, ASSIGNED, INCIDENT_LINKED, etc.
    actor = Column(String(128), nullable=False, default="System")
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    ticket = relationship("Ticket", back_populates="history")


class TicketEvent(Base):
    __tablename__ = "ticket_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    actor = Column(String(128), nullable=False, default="System")
    event_type = Column(String(64), nullable=False, index=True)
    event_data = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    ticket = relationship("Ticket", back_populates="events")
