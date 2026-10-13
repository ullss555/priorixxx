import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models import Agent, Incident, Ticket, TicketHistory, TicketEvent, Profile
from app.services.scoring import calculate_priority_score


def seed_database(db: Session, force: bool = False):
    """Seeds the database with representative demo records satisfying all criteria."""
    if not force:
        existing_agents = db.query(Agent).count()
        if existing_agents > 0:
            return  # Already seeded

    # Clear existing data if force reset
    db.query(TicketEvent).delete()
    db.query(TicketHistory).delete()
    db.query(Ticket).delete()
    db.query(Incident).delete()
    db.query(Agent).delete()
    db.query(Profile).delete()
    db.commit()

    now = datetime.now(timezone.utc)

    # 0. Seed Demo Profiles
    demo_profiles = [
        Profile(
            id="demo-customer-id",
            display_name="Demo Customer",
            email="customer@priorix.local",
            role="customer",
            created_at=now - timedelta(days=30)
        ),
        Profile(
            id="demo-agent-id",
            display_name="Demo Agent",
            email="agent@priorix.local",
            role="agent",
            created_at=now - timedelta(days=60)
        ),
        Profile(
            id="demo-admin-id",
            display_name="Demo Admin",
            email="admin@priorix.local",
            role="admin",
            created_at=now - timedelta(days=90)
        )
    ]
    for p in demo_profiles:
        db.add(p)
    db.commit()

    # 1. Create Agents with varied skills and capacities
    agents = [
        Agent(
            id=str(uuid.uuid4()),
            name="Sarah Connor",
            email="sarah.connor@priorix.internal",
            role="Senior Incident Specialist",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            skills=["Service Outage", "Technical Issue", "Performance"],
            max_capacity=5,
            is_active=True,
            created_at=now - timedelta(days=90)
        ),
        Agent(
            id=str(uuid.uuid4()),
            name="Alex Mercer",
            email="alex.mercer@priorix.internal",
            role="Billing & Accounts Lead",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            skills=["Payment/Billing", "Login/Account Access", "General Enquiry"],
            max_capacity=4,
            is_active=True,
            created_at=now - timedelta(days=60)
        ),
        Agent(
            id=str(uuid.uuid4()),
            name="Elena Rostova",
            email="elena.rostova@priorix.internal",
            role="Data & Platform Engineer",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            skills=["Data Issue", "Technical Issue", "Performance"],
            max_capacity=5,
            is_active=True,
            created_at=now - timedelta(days=45)
        ),
        Agent(
            id=str(uuid.uuid4()),
            name="Marcus Vance",
            email="marcus.vance@priorix.internal",
            role="Tier-1 Operations Specialist",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
            skills=["General Enquiry", "Login/Account Access", "Other"],
            max_capacity=3,
            is_active=False,  # Inactive agent to verify assignment filtering
            created_at=now - timedelta(days=30)
        )
    ]
    for agent in agents:
        db.add(agent)
    db.commit()

    sarah = agents[0]
    alex = agents[1]
    elena = agents[2]

    # 2. Create Incidents
    # Incident 1: Verified Critical Service-Wide Outage
    critical_incident = Incident(
        id=str(uuid.uuid4()),
        incident_code="INC-2026-001",
        title="US-East API Gateway Degradation & Payment Webhook Drops",
        description="Core API gateway in us-east is dropping 45% of incoming traffic. Payment gateway webhooks failing.",
        category="Service Outage",
        severity="Critical",
        status="Investigating",
        is_verified_critical=True,
        created_at=now - timedelta(hours=3),
        updated_at=now - timedelta(hours=1)
    )

    # Incident 2: Routine Major Incident
    routine_incident = Incident(
        id=str(uuid.uuid4()),
        incident_code="INC-2026-002",
        title="PDF Report Generation Latency on Enterprise Exports",
        description="Background report rendering workers are consuming excessive memory leading to worker restarts.",
        category="Performance",
        severity="Major",
        status="Identified",
        is_verified_critical=False,
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(hours=5)
    )

    db.add(critical_incident)
    db.add(routine_incident)
    db.commit()

    # 3. Create Sample Tickets matching all requirement categories
    # Ticket A: Routine ticket created 2 hours ago (Low/Medium urgency)
    t_routine = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1001",
        customer_name="Global Logistics Inc (Acme)",
        customer_email="it@acmelogistics.com",
        title="Need assistance with quarterly invoice export format",
        description="We would like to download our last 3 months invoices as a single consolidated CSV file instead of individual PDFs.",
        category="General Enquiry",
        urgency="Low",
        impact="Low",
        status="Open",
        assigned_agent_id=alex.id,
        deadline=now + timedelta(days=3),
        created_at=now - timedelta(hours=2)
    )
    score_data = calculate_priority_score(
        urgency=t_routine.urgency,
        impact=t_routine.impact,
        deadline=t_routine.deadline,
        created_at=t_routine.created_at,
        status=t_routine.status
    )
    t_routine.priority_score = score_data["priority_score"]
    t_routine.priority_level = score_data["priority_level"]
    t_routine.priority_explanation = score_data["priority_explanation"]
    t_routine.reason_codes = score_data["reason_codes"]
    db.add(t_routine)

    # Ticket B: Overdue unresolved ticket (created 3 days ago, deadline was yesterday)
    t_overdue = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1002",
        customer_name="Fintech Cloud Co",
        customer_email="security@fincloud.io",
        title="SSO SAML Certificate Expiration warning on production tenant",
        description="Our IdP SAML signing cert expired yesterday. Two departments cannot log into the production console.",
        category="Login/Account Access",
        urgency="High",
        impact="High",
        status="In Progress",
        assigned_agent_id=alex.id,
        deadline=now - timedelta(hours=8),  # OVERDUE
        escalation_level=2,
        created_at=now - timedelta(days=2)
    )
    score_data = calculate_priority_score(
        urgency=t_overdue.urgency,
        impact=t_overdue.impact,
        deadline=t_overdue.deadline,
        created_at=t_overdue.created_at,
        status=t_overdue.status
    )
    t_overdue.priority_score = score_data["priority_score"]
    t_overdue.priority_level = score_data["priority_level"]
    t_overdue.priority_explanation = score_data["priority_explanation"]
    t_overdue.reason_codes = score_data["reason_codes"]
    db.add(t_overdue)

    # Ticket C: Approaching deadline (deadline in 4 hours!)
    t_near_deadline = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1003",
        customer_name="Starlight Media",
        customer_email="devops@starlight.com",
        title="Database read replica replication lag exceeding 10 minutes",
        description="Replica replication lag is steadily climbing. Real-time analytics dashboards are showing stale data.",
        category="Data Issue",
        urgency="High",
        impact="High",
        status="Open",
        assigned_agent_id=elena.id,
        deadline=now + timedelta(hours=4),  # APPROACHING DEADLINE
        escalation_level=1,
        created_at=now - timedelta(hours=14)
    )
    score_data = calculate_priority_score(
        urgency=t_near_deadline.urgency,
        impact=t_near_deadline.impact,
        deadline=t_near_deadline.deadline,
        created_at=t_near_deadline.created_at,
        status=t_near_deadline.status
    )
    t_near_deadline.priority_score = score_data["priority_score"]
    t_near_deadline.priority_level = score_data["priority_level"]
    t_near_deadline.priority_explanation = score_data["priority_explanation"]
    t_near_deadline.reason_codes = score_data["reason_codes"]
    db.add(t_near_deadline)

    # Ticket D: Customer 1 linked to Verified Critical Incident INC-2026-001
    t_linked_1 = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1004",
        customer_name="OmniRetail Global",
        customer_email="billing@omniretail.com",
        title="Checkouts failing at POS: 502 Bad Gateway from API",
        description="Our European checkout terminals are receiving 502 Bad Gateway responses during checkout payment processing.",
        category="Service Outage",
        urgency="Critical",
        impact="Critical",
        status="In Progress",
        assigned_agent_id=sarah.id,
        incident_id=critical_incident.id,
        deadline=now + timedelta(hours=2),
        created_at=now - timedelta(hours=2, minutes=30)
    )
    score_data = calculate_priority_score(
        urgency=t_linked_1.urgency,
        impact=t_linked_1.impact,
        deadline=t_linked_1.deadline,
        created_at=t_linked_1.created_at,
        status=t_linked_1.status,
        is_verified_critical=True,
        incident_code=critical_incident.incident_code
    )
    t_linked_1.priority_score = score_data["priority_score"]
    t_linked_1.priority_level = score_data["priority_level"]
    t_linked_1.priority_explanation = score_data["priority_explanation"]
    t_linked_1.reason_codes = score_data["reason_codes"]
    db.add(t_linked_1)

    # Ticket E: Customer 2 linked to Verified Critical Incident INC-2026-001 (arrived AFTER routine tickets!)
    t_linked_2 = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1005",
        customer_name="PayStream Systems",
        customer_email="noc@paystream.net",
        title="Webhook timeouts and dropped settlement confirmation packets",
        description="We are experiencing packet drops communicating with the US-East gateway endpoints.",
        category="Service Outage",
        urgency="Critical",
        impact="Critical",
        status="Open",
        assigned_agent_id=sarah.id,
        incident_id=critical_incident.id,
        deadline=now + timedelta(hours=1),
        created_at=now - timedelta(minutes=45)  # Recent arrival, but highest priority!
    )
    score_data = calculate_priority_score(
        urgency=t_linked_2.urgency,
        impact=t_linked_2.impact,
        deadline=t_linked_2.deadline,
        created_at=t_linked_2.created_at,
        status=t_linked_2.status,
        is_verified_critical=True,
        incident_code=critical_incident.incident_code
    )
    t_linked_2.priority_score = score_data["priority_score"]
    t_linked_2.priority_level = score_data["priority_level"]
    t_linked_2.priority_explanation = score_data["priority_explanation"]
    t_linked_2.reason_codes = score_data["reason_codes"]
    db.add(t_linked_2)

    # Ticket F: Customer 3 linked to Verified Critical Incident INC-2026-001
    t_linked_3 = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1006",
        customer_name="HyperCommerce Online",
        customer_email="support@hypercommerce.de",
        title="Urgent: Customers reporting failed payment charges on web portal",
        description="Users click 'Place Order' and receive a connection timeout after 30 seconds.",
        category="Payment/Billing",
        urgency="High",
        impact="Critical",
        status="Open",
        incident_id=critical_incident.id,
        deadline=now + timedelta(hours=3),
        created_at=now - timedelta(minutes=25)
    )
    score_data = calculate_priority_score(
        urgency=t_linked_3.urgency,
        impact=t_linked_3.impact,
        deadline=t_linked_3.deadline,
        created_at=t_linked_3.created_at,
        status=t_linked_3.status,
        is_verified_critical=True,
        incident_code=critical_incident.incident_code
    )
    t_linked_3.priority_score = score_data["priority_score"]
    t_linked_3.priority_level = score_data["priority_level"]
    t_linked_3.priority_explanation = score_data["priority_explanation"]
    t_linked_3.reason_codes = score_data["reason_codes"]
    db.add(t_linked_3)

    # Ticket G: Resolved ticket with historical overdue deadline (MUST NOT count as active overdue!)
    t_resolved = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1007",
        customer_name="Apex Healthcare Tech",
        customer_email="compliance@apexhealth.org",
        title="Two-factor authentication SMS delays on mobile devices",
        description="SMS delivery carrier was experiencing carrier routing issues. Switched SMS provider gateway.",
        category="Login/Account Access",
        urgency="High",
        impact="Medium",
        status="Resolved",
        assigned_agent_id=alex.id,
        deadline=now - timedelta(days=1),  # Past deadline, but RESOLVED!
        created_at=now - timedelta(days=2)
    )
    score_data = calculate_priority_score(
        urgency=t_resolved.urgency,
        impact=t_resolved.impact,
        deadline=t_resolved.deadline,
        created_at=t_resolved.created_at,
        status=t_resolved.status
    )
    t_resolved.priority_score = score_data["priority_score"]
    t_resolved.priority_level = score_data["priority_level"]
    t_resolved.priority_explanation = score_data["priority_explanation"]
    t_resolved.reason_codes = score_data["reason_codes"]
    db.add(t_resolved)

    # Ticket 8 (PRX-1008): Duplicate Enterprise Payment / Billing Issue
    t_dup_charge = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1008",
        customer_name="CloudScale Networks",
        customer_email="billing@cloudscale.net",
        title="Duplicate enterprise charge: $14,500 billed twice on invoice INV-2026-8819",
        description="Our finance team discovered two identical $14,500 charges processed on Oct 9th for our annual enterprise tier renewal. Urgent refund and ledger adjustment required.",
        category="Payment/Billing",
        urgency="High",
        impact="High",
        status="Open",
        assigned_agent_id=alex.id,
        deadline=now + timedelta(hours=18),
        created_at=now - timedelta(hours=6)
    )
    score_data = calculate_priority_score(
        urgency=t_dup_charge.urgency,
        impact=t_dup_charge.impact,
        deadline=t_dup_charge.deadline,
        created_at=t_dup_charge.created_at,
        status=t_dup_charge.status
    )
    t_dup_charge.priority_score = score_data["priority_score"]
    t_dup_charge.priority_level = score_data["priority_level"]
    t_dup_charge.priority_explanation = score_data["priority_explanation"]
    t_dup_charge.reason_codes = score_data["reason_codes"]
    db.add(t_dup_charge)

    # Ticket 9 (PRX-1009): Mobile App Crashing on iOS 18
    t_ios_crash = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1009",
        customer_name="Vanguard Wealth Partners",
        customer_email="it-ops@vanguardwealth.co.uk",
        title="Mobile banking app crashes on launch after iOS 18.1 upgrade",
        description="Over 80 VIP wealth management clients report immediate app termination on splash screen with build 4.2.1. Crashlytics highlights SIGSEGV in BiometricAuthManager.",
        category="Technical Issue",
        urgency="Critical",
        impact="High",
        status="In Progress",
        assigned_agent_id=sarah.id,
        deadline=now + timedelta(hours=6),
        created_at=now - timedelta(hours=4)
    )
    score_data = calculate_priority_score(
        urgency=t_ios_crash.urgency,
        impact=t_ios_crash.impact,
        deadline=t_ios_crash.deadline,
        created_at=t_ios_crash.created_at,
        status=t_ios_crash.status
    )
    t_ios_crash.priority_score = score_data["priority_score"]
    t_ios_crash.priority_level = score_data["priority_level"]
    t_ios_crash.priority_explanation = score_data["priority_explanation"]
    t_ios_crash.reason_codes = score_data["reason_codes"]
    db.add(t_ios_crash)

    # Ticket 10 (PRX-1010): Performance Timeout on Large Dataset Export
    t_export_timeout = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1010",
        customer_name="BioGen Research Labs",
        customer_email="data@biogenlabs.com",
        title="CSV dataset export timeouts when querying clinical trial records (>180,000 rows)",
        description="Downloading Q3 patient biomarkers runs for 300 seconds and aborts with HTTP 504 Gateway Timeout. Needs async background export job with S3 presigned URL.",
        category="Performance",
        urgency="Medium",
        impact="High",
        status="In Progress",
        assigned_agent_id=elena.id,
        deadline=now + timedelta(hours=24),
        created_at=now - timedelta(hours=10)
    )
    score_data = calculate_priority_score(
        urgency=t_export_timeout.urgency,
        impact=t_export_timeout.impact,
        deadline=t_export_timeout.deadline,
        created_at=t_export_timeout.created_at,
        status=t_export_timeout.status
    )
    t_export_timeout.priority_score = score_data["priority_score"]
    t_export_timeout.priority_level = score_data["priority_level"]
    t_export_timeout.priority_explanation = score_data["priority_explanation"]
    t_export_timeout.reason_codes = score_data["reason_codes"]
    db.add(t_export_timeout)

    # Ticket 11 (PRX-1011): Admin Lockout via FIDO2 WebAuthn
    t_admin_lockout = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1011",
        customer_name="Atlas Defense Logistics",
        customer_email="security-lead@atlasdefense.gov",
        title="Tenant administrator locked out after mandatory FIDO2 hardware key policy",
        description="Primary admin YubiKey registration failed to store backup passkey. Security policy disabled SMS recovery. Manual out-of-band identity verification requested.",
        category="Login/Account Access",
        urgency="High",
        impact="Critical",
        status="Open",
        assigned_agent_id=alex.id,
        deadline=now + timedelta(hours=8),
        created_at=now - timedelta(hours=3)
    )
    score_data = calculate_priority_score(
        urgency=t_admin_lockout.urgency,
        impact=t_admin_lockout.impact,
        deadline=t_admin_lockout.deadline,
        created_at=t_admin_lockout.created_at,
        status=t_admin_lockout.status
    )
    t_admin_lockout.priority_score = score_data["priority_score"]
    t_admin_lockout.priority_level = score_data["priority_level"]
    t_admin_lockout.priority_explanation = score_data["priority_explanation"]
    t_admin_lockout.reason_codes = score_data["reason_codes"]
    db.add(t_admin_lockout)

    # Ticket 12 (PRX-1012): GDPR Article 17 Right to Erasure Request
    t_gdpr = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1012",
        customer_name="Nordic Consumer Rights",
        customer_email="legal-dpo@nordicdata.se",
        title="GDPR Article 17 statutory 'Right to Erasure' compliance for account #77218",
        description="Formal data deletion demand served under GDPR Art. 17. All telemetry, user identity records, and historical payment tokens must be scrubbed within statutory window.",
        category="Data Issue",
        urgency="Medium",
        impact="Medium",
        status="Open",
        assigned_agent_id=elena.id,
        deadline=now + timedelta(days=2),
        created_at=now - timedelta(hours=16)
    )
    score_data = calculate_priority_score(
        urgency=t_gdpr.urgency,
        impact=t_gdpr.impact,
        deadline=t_gdpr.deadline,
        created_at=t_gdpr.created_at,
        status=t_gdpr.status
    )
    t_gdpr.priority_score = score_data["priority_score"]
    t_gdpr.priority_level = score_data["priority_level"]
    t_gdpr.priority_explanation = score_data["priority_explanation"]
    t_gdpr.reason_codes = score_data["reason_codes"]
    db.add(t_gdpr)

    # Ticket 13 (PRX-1013): Cloud Storage CORS Upload Error
    t_cors = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1013",
        customer_name="Tokyo Freight Systems",
        customer_email="sysadmin@tokyofreight.jp",
        title="Cloud Storage bucket CORS policy blocking manifest PDF uploads in APAC",
        description="Direct-to-S3 pre-signed upload URLs in Tokyo and Singapore warehouses are rejected: No 'Access-Control-Allow-Origin' header on OPTIONS preflight.",
        category="Technical Issue",
        urgency="Medium",
        impact="Medium",
        status="Open",
        assigned_agent_id=sarah.id,
        deadline=now + timedelta(hours=36),
        created_at=now - timedelta(hours=12)
    )
    score_data = calculate_priority_score(
        urgency=t_cors.urgency,
        impact=t_cors.impact,
        deadline=t_cors.deadline,
        created_at=t_cors.created_at,
        status=t_cors.status
    )
    t_cors.priority_score = score_data["priority_score"]
    t_cors.priority_level = score_data["priority_level"]
    t_cors.priority_explanation = score_data["priority_explanation"]
    t_cors.reason_codes = score_data["reason_codes"]
    db.add(t_cors)

    # Ticket 14 (PRX-1014): Intermittent Frankfurt DNS Resolution Outage
    t_dns_drop = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1014",
        customer_name="E-Commerce Titans EU",
        customer_email="infrastructure@titans.eu",
        title="Intermittent DNS resolution drops connecting to Frankfurt primary database cluster",
        description="Transient socket errors resolving eu-central-db.priorix.internal occurring every 15 minutes. TCP connection resets causing checkout latency spikes.",
        category="Service Outage",
        urgency="High",
        impact="High",
        status="In Progress",
        assigned_agent_id=sarah.id,
        deadline=now + timedelta(hours=12),
        created_at=now - timedelta(hours=5)
    )
    score_data = calculate_priority_score(
        urgency=t_dns_drop.urgency,
        impact=t_dns_drop.impact,
        deadline=t_dns_drop.deadline,
        created_at=t_dns_drop.created_at,
        status=t_dns_drop.status
    )
    t_dns_drop.priority_score = score_data["priority_score"]
    t_dns_drop.priority_level = score_data["priority_level"]
    t_dns_drop.priority_explanation = score_data["priority_explanation"]
    t_dns_drop.reason_codes = score_data["reason_codes"]
    db.add(t_dns_drop)

    # Ticket 15 (PRX-1015): Webhook HMAC Signature Mismatch (Resolved)
    t_hmac = Ticket(
        id=str(uuid.uuid4()),
        ticket_number="PRX-1015",
        customer_name="Zapier Automated Integrations",
        customer_email="partner-support@zapflow.io",
        title="Webhook signature verification mismatch with HMAC-SHA256 secret key",
        description="Raw payload signature validation failing on incoming events. Clarified that payload hashing uses UTF-8 raw byte stream before JSON normalization.",
        category="General Enquiry",
        urgency="Low",
        impact="Medium",
        status="Resolved",
        assigned_agent_id=alex.id,
        deadline=now - timedelta(hours=12),
        created_at=now - timedelta(days=2)
    )
    score_data = calculate_priority_score(
        urgency=t_hmac.urgency,
        impact=t_hmac.impact,
        deadline=t_hmac.deadline,
        created_at=t_hmac.created_at,
        status=t_hmac.status
    )
    t_hmac.priority_score = score_data["priority_score"]
    t_hmac.priority_level = score_data["priority_level"]
    t_hmac.priority_explanation = score_data["priority_explanation"]
    t_hmac.reason_codes = score_data["reason_codes"]
    db.add(t_hmac)

    db.commit()

    # 4. Create Audit Histories
    histories = [
        TicketHistory(
            ticket_id=t_routine.id,
            action="CREATED",
            actor="Customer Portal",
            details="Ticket submitted by it@acmelogistics.com",
            timestamp=t_routine.created_at
        ),
        TicketHistory(
            ticket_id=t_routine.id,
            action="ASSIGNED",
            actor="Dispatch Auto-Router",
            details=f"Assigned to agent Alex Mercer based on skills: {', '.join(alex.skills)}",
            timestamp=t_routine.created_at + timedelta(minutes=5)
        ),
        TicketHistory(
            ticket_id=t_overdue.id,
            action="CREATED",
            actor="Customer Portal",
            details="Ticket submitted by security@fincloud.io",
            timestamp=t_overdue.created_at
        ),
        TicketHistory(
            ticket_id=t_overdue.id,
            action="ESCALATED_OVERDUE",
            actor="Escalation Service",
            details="Resolution deadline expired with status remaining unresolved. Priority elevated.",
            timestamp=t_overdue.deadline + timedelta(minutes=1)
        ),
        TicketHistory(
            ticket_id=t_linked_1.id,
            action="INCIDENT_LINKED",
            actor="Sarah Connor (Incident Commander)",
            details=f"Linked to Verified Critical Incident {critical_incident.incident_code} ({critical_incident.title})",
            timestamp=now - timedelta(hours=2)
        ),
        TicketHistory(
            ticket_id=t_linked_2.id,
            action="INCIDENT_LINKED",
            actor="Sarah Connor (Incident Commander)",
            details=f"Linked to Verified Critical Incident {critical_incident.incident_code}. Outranks queue arrival order.",
            timestamp=now - timedelta(minutes=30)
        ),
        TicketHistory(
            ticket_id=t_resolved.id,
            action="STATUS_CHANGED",
            actor="Alex Mercer",
            details="Status changed from In Progress to Resolved. Customer verified resolution.",
            timestamp=now - timedelta(hours=6)
        )
    ]
    for h in histories:
        db.add(h)
    db.commit()
