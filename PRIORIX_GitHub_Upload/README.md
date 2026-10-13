# PRIORIX — AI-Powered Intelligent Support Ticket Prioritization & Management System

> **Tagline**: *"Prioritize smarter. Resolve faster."*

PRIORIX is an enterprise-grade support ticket management system designed to eliminate queue bias and SLA breaches through a deterministic prioritization algorithm, AI-assisted triage, and independent background escalation workers.

---

## 1. Technology Stack

* **Frontend**: React 18, TypeScript 5.5, Vite 5.4, Tailwind CSS 3.4, Lucide Icons.
* **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic V2.
* **Database & Auth**: Supabase PostgreSQL (Row-Level Security) & Supabase Auth.
* **AI Engine**: Google Gemini (accessed strictly via backend service with strict schemas & prompt injection defenses).
* **Architecture**: Decoupled SaaS architecture with role-based access control (Customer, Agent, Administrator).

---

## 2. Core Capabilities by Engineering Role

### 2.1 Amaan — Backend, Database, Auth & SLA Governance
* **Deterministic Priority Engine**: Computes authoritative 0–100 scores using fixed weights:
  $$\text{Score} = (\text{Urgency} \times 0.35) + (\text{Impact} \times 0.30) + (\text{Deadline Risk} \times 0.20) + (\text{Wait Time Risk} \times 0.15)$$
* **Critical Incident Overrides**: Verified critical outages elevate linked tickets to $\ge 98.0$ (Critical), outranking all routine tasks.
* **Deterministic SLA Deadlines**: Automatically calculates and persists resolution deadlines:
  * **Critical**: 4 hours
  * **High**: 12 hours
  * **Medium**: 24 hours
  * **Low**: 48 hours
* **Independent SLA Background Worker**: Standalone background worker (`run_sla_worker.py`) detecting breached tickets and escalating them idempotently without duplicate audit events.
* **Role-Based Authorization & Customer Isolation**: Customers can only view and manage their own tickets. Agents and admins manage queues and assignments.

### 2.2 Ullas — AI & Intelligent Prioritization Engine
* **AI Ticket Analysis**: Structured recommendations for concise summary, category, urgency, impact, keywords, and reasoning via Google Gemini.
* **Interactive AI Chatbot Triage**: Multi-turn support triage chatbot that asks clarification questions when details are vague, assists customers in describing problems, and generates real-time reviewable ticket drafts.
* **Prompt Injection Defenses**: Treats all ticket text and user input as untrusted passive data wrapped in isolation delimiters. Never executes shell commands, SQL, or permission overrides.
* **Privacy-Preserving Related-Ticket Matching**: Recommends related tickets without leaking private customer data across tenant boundaries. Returns empty results for insufficient input rather than hallucinating matches.
* **Zero-Downtime Fallback**: If Gemini times out, hits quotas, or has no key configured, the system falls back safely to deterministic keyword heuristics. Ticket submission and management never fail.

### 2.3 Shashi — Frontend, UI/UX & React Application
* **Visual Identity**: Polished SaaS interface with an indigo-and-white visual identity.
* **8 Required Application Pages**:
  1. **Login** (`/login`): Authentication with role selection and instant test persona switching.
  2. **Customer Dashboard** (`/customer`): Personalized customer view with active ticket counts and quick CTAs.
  3. **Create Ticket** (`/tickets/new`): Structured ticket submission form with live AI analysis preview.
  4. **AI Support Chat / Triage** (`/triage`): Conversational triage chatbot with real-time draft card and confirmation modal.
  5. **My Tickets** (`/my-tickets`): Dedicated customer queue with status badges, priority scores, and SLA indicators.
  6. **Ticket Details** (`/tickets/:id`): Deep-dive view with immutable audit history, AI reply assistant, and related ticket suggestions.
  7. **Agent Workspace** (`/agent`): Specialized support queue with workload gauges, capacity tracking, and quick filters.
  8. **Admin Dashboard** (`/admin`): System-wide backlog analytics, category distribution, critical incidents, and manual SLA escalation trigger.

### 2.4 Ravena — Integration, QA, Security Verification & Deployment
* **Automated Test Suite**: 20 comprehensive automated tests covering deterministic scoring, SLA deadlines, worker idempotency, prompt injection defenses, customer isolation, and provider failure fallbacks.
* **Verification Runbook**: Comprehensive instructions for deployment, local development, and health verification.

---

## 3. Getting Started

### 3.1 Prerequisites
* Python 3.10+
* Node.js 18+ and npm
* Optional: Supabase account and Google Gemini API key

### 3.2 Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (if not already existing)
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Run FastAPI development server
python run.py
# Server will run at http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
```

### 3.3 Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Or run Vite dev server
npm run dev
# Application will run at http://localhost:5173
```

### 3.4 Demo Presentation Credentials & Security

For evaluation, grading, and project presentations, the system provides verified accounts with pre-seeded datasets:

| Role | Email | Default Demo Password | Access Rights |
|---|---|---|---|
| **Administrator** | `admin@priorix.local` | `PriorixDemo2026!` | Full analytics, SLA governance, incident management |
| **Support Agent** | `agent@priorix.local` | `PriorixDemo2026!` | Agent workspace, priority queue, reassignments |
| **Customer** | `customer@priorix.local` | `PriorixDemo2026!` | Customer portal, ticket submission, AI chat triage |

> [!NOTE]
> Demo passwords can be safely customized or rotated outside the source code via the `DEMO_ACCOUNT_PASSWORD` environment variable in `backend/.env`. In production with Supabase Auth enabled, users authenticate with their managed Supabase credentials.

### 3.5 Running the Independent SLA Worker
To run the background escalation worker independently of browser sessions:
```bash
# Single escalation scan
python backend/run_sla_worker.py --once

# Continuous daemon mode (runs every 60 seconds)
python backend/run_sla_worker.py --interval 60
```

---

## 4. Running Automated Tests

Run the full pytest suite (22 unit & integration tests):
```bash
python -m pytest backend/tests/test_priorix_suite.py -v
```

### Test Coverage Highlights:
1. `test_critical_incident_arriving_later_outranks_routine`: Critical incident override outranks queue arrival order.
2. `test_ticket_approaching_deadline`: Dynamic approaching deadline detection.
3. `test_overdue_unresolved_ticket`: Unresolved overdue ticket detection.
4. `test_resolved_or_closed_ticket_excluded_from_overdue`: Resolved/closed tickets excluded from overdue alerts.
5. `test_multiple_tickets_linked_to_incident_preserves_records`: Multi-ticket incident linking preserves distinct customer identities.
6. `test_incident_link_removable_without_deleting_ticket`: Unlinking incident safely without data loss.
7. `test_explainable_agent_assignment_recommendations`: Domain skill and capacity-based agent recommendations.
8. `test_gemini_failure_core_operations_continue`: Core ticket creation and management work even when Gemini fails.
9. `test_invalid_ticket_input_rejected`: Schema validation rejects malformed inputs.
10. `test_status_and_assignment_changes_recorded_in_history`: Status changes and reassignments recorded in immutable audit log.
11. `test_dashboard_metrics_match_dataset`: Database metrics match live statistics.
12. `test_ai_analyze_valid_mock_gemini`: AI analysis returns structured suggestions within allowlists.
13. `test_ai_analyze_prompt_injection_defense`: Prompt injection attempts safely sanitized.
14. `test_ai_analyze_invalid_categories_normalized`: Invalid external model categories normalized safely.
15. `test_ai_chatbot_triage_flow`: Chatbot clarifies missing info and prevents false submission claims.
16. `test_related_tickets_privacy_and_authorization`: Customer privacy enforced across related-ticket queries.
17. `test_customer_isolation_and_permissions`: Cross-customer access attempts return 403 Forbidden.
18. `test_sla_targets_calculated_per_priority`: Critical (4h), High (12h), and Low (48h) SLA windows persisted accurately.
19. `test_sla_escalation_cycle_idempotent_and_logs_events`: SLA scheduler cycle is strictly idempotent and creates audit events.
20. `test_api_me_and_ticket_events`: Verified user profile and ticket events API contracts.
21. `test_auth_login_flow`: Credentials verification, token issuance, and protected endpoint access.
22. `test_dashboard_analytics_volume_and_sla`: Historical volume trend calculation and SLA compliance metrics.

---

## 5. API Reference Summary

Full contracts, database schemas, and request/response payloads are documented in [`INTEGRATION.md`](file:///c:/Users/ullas/OneDrive/Desktop/GAT/INTEGRATION.md).

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/health` or `/api/health` | System health check (DB & AI status) | Public |
| `POST` | `/api/auth/login` | Authenticate user credentials & issue session token | Public |
| `POST` | `/api/auth/logout` | Terminate session | Authenticated |
| `GET` | `/api/me` | Current authenticated user profile | Authenticated |
| `GET` | `/api/tickets` | List tickets (filtered by role) | Customer / Agent / Admin |
| `POST` | `/api/tickets` | Create ticket with deterministic priority & SLA | Customer / Agent / Admin |
| `GET` | `/api/tickets/{id}` | Ticket details | Owner Customer / Agent / Admin |
| `PATCH` | `/api/tickets/{id}` | Update ticket fields | Agent / Admin |
| `GET` | `/api/tickets/{id}/events` | Immutable audit events history | Owner Customer / Agent / Admin |
| `POST` | `/api/tickets/{id}/assign` | Assign agent to ticket | Agent / Admin |
| `GET` | `/api/agents` | List agents with capacity & utilization | Agent / Admin |
| `GET` | `/api/dashboard` | Dashboard metrics & volume trends (scoped by role) | Authenticated |
| `POST` | `/api/tickets/analyze` | AI ticket categorization & suggestions | Authenticated |
| `POST` | `/api/chat/triage` | Interactive chatbot triage conversation | Authenticated |
| `POST` | `/api/tickets/related` | Privacy-preserving related tickets | Authenticated |
| `POST` | `/api/sla/escalate` | Trigger SLA escalation cycle | Admin |

---

## 6. License & Team Coordination

* **Project**: PRIORIX
* **Team**: Ullas (AI Integration), Shashi (Frontend UI/UX), Amaan (Backend/Auth/SLA), Ravena (QA & Verification)
* **Status**: Fully integrated, tested, and ready for deployment.
