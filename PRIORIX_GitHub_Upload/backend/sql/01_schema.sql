-- ============================================================================
-- PRIORIX Database Schema (Supabase PostgreSQL Compatible)
-- "Prioritize smarter. Resolve faster."
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing tables if performing fresh migration
DROP TABLE IF EXISTS ticket_events CASCADE;
DROP TABLE IF EXISTS ticket_history CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Linked to Supabase Auth UUID (auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'agent', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ----------------------------------------------------------------------------
-- 2. INCIDENTS TABLE
-- High-level outages, defects, or widespread incidents
-- ----------------------------------------------------------------------------
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_code VARCHAR(32) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'Major' CHECK (severity IN ('Critical', 'Major', 'Minor')),
    status VARCHAR(32) NOT NULL DEFAULT 'Investigating' CHECK (status IN ('Investigating', 'Identified', 'Monitoring', 'Resolved')),
    is_verified_critical BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_is_verified ON incidents(is_verified_critical);

-- ----------------------------------------------------------------------------
-- 3. AGENTS TABLE
-- Responders with categorized domain skills and capacity
-- ----------------------------------------------------------------------------
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'Support Specialist',
    avatar_url VARCHAR(255),
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    max_capacity INTEGER NOT NULL DEFAULT 5 CHECK (max_capacity > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_agents_is_active ON agents(is_active);

-- ----------------------------------------------------------------------------
-- 4. TICKETS TABLE
-- Customer reports with calculated priority and SLA targets
-- ----------------------------------------------------------------------------
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(32) UNIQUE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    customer_name VARCHAR(128) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    summary TEXT,
    category VARCHAR(64) NOT NULL,
    
    -- Priority factors
    urgency VARCHAR(32) NOT NULL DEFAULT 'Medium' CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
    impact VARCHAR(32) NOT NULL DEFAULT 'Medium' CHECK (impact IN ('Low', 'Medium', 'High', 'Critical')),
    
    -- Calculated deterministic score (0 - 100)
    priority_score NUMERIC(5, 1) NOT NULL DEFAULT 50.0 CHECK (priority_score >= 0.0 AND priority_score <= 100.0),
    priority_level VARCHAR(32) NOT NULL DEFAULT 'Medium' CHECK (priority_level IN ('Critical', 'High', 'Medium', 'Low')),
    priority_explanation TEXT NOT NULL DEFAULT '',
    reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Lifecycle
    status VARCHAR(32) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Waiting', 'Resolved', 'Closed')),
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    escalation_level INTEGER NOT NULL DEFAULT 0,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_priority_score ON tickets(priority_score DESC);
CREATE INDEX idx_tickets_priority_level ON tickets(priority_level);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_deadline ON tickets(deadline);
CREATE INDEX idx_tickets_assigned_agent ON tickets(assigned_agent_id);
CREATE INDEX idx_tickets_incident_id ON tickets(incident_id);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. TICKET_EVENTS & TICKET_HISTORY TABLES
-- Immutable audit log for events
-- ----------------------------------------------------------------------------
CREATE TABLE ticket_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor VARCHAR(128) NOT NULL DEFAULT 'System',
    event_type VARCHAR(64) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_events_ticket_id ON ticket_events(ticket_id);
CREATE INDEX idx_ticket_events_created_at ON ticket_events(created_at DESC);

CREATE TABLE ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    action VARCHAR(64) NOT NULL,
    actor VARCHAR(128) NOT NULL DEFAULT 'System',
    details TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_timestamp ON ticket_history(timestamp DESC);

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read and write to profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow authenticated read and write to incidents" ON incidents FOR ALL USING (true);
CREATE POLICY "Allow authenticated read and write to agents" ON agents FOR ALL USING (true);
CREATE POLICY "Allow authenticated read and write to tickets" ON tickets FOR ALL USING (true);
CREATE POLICY "Allow authenticated read and write to ticket_events" ON ticket_events FOR ALL USING (true);
CREATE POLICY "Allow authenticated read and write to ticket_history" ON ticket_history FOR ALL USING (true);
