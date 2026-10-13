-- ============================================================================
-- PRIORIX Seed Data (Supabase PostgreSQL Compatible)
-- Populates representative operational dataset
-- ============================================================================

-- 1. Insert Agents
INSERT INTO agents (id, name, email, role, avatar_url, skills, max_capacity, is_active, created_at)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Sarah Connor', 'sarah.connor@priorix.internal', 'Senior Incident Specialist', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', '["Service Outage", "Technical Issue", "Performance"]'::jsonb, 5, true, NOW() - INTERVAL '90 days'),
    ('a0000000-0000-0000-0000-000000000002', 'Alex Mercer', 'alex.mercer@priorix.internal', 'Billing & Accounts Lead', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '["Payment/Billing", "Login/Account Access", "General Enquiry"]'::jsonb, 4, true, NOW() - INTERVAL '60 days'),
    ('a0000000-0000-0000-0000-000000000003', 'Elena Rostova', 'elena.rostova@priorix.internal', 'Data & Platform Engineer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '["Data Issue", "Technical Issue", "Performance"]'::jsonb, 5, true, NOW() - INTERVAL '45 days'),
    ('a0000000-0000-0000-0000-000000000004', 'Marcus Vance', 'marcus.vance@priorix.internal', 'Tier-1 Operations Specialist', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '["General Enquiry", "Login/Account Access", "Other"]'::jsonb, 3, false, NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Incidents
INSERT INTO incidents (id, incident_code, title, description, category, severity, status, is_verified_critical, created_at, updated_at)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'INC-2026-001', 'US-East API Gateway Degradation & Payment Webhook Drops', 'Core API gateway in us-east is dropping 45% of incoming traffic. Payment gateway webhooks failing.', 'Service Outage', 'Critical', 'Investigating', true, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour'),
    ('b0000000-0000-0000-0000-000000000002', 'INC-2026-002', 'PDF Report Generation Latency on Enterprise Exports', 'Background report rendering workers are consuming excessive memory leading to worker restarts.', 'Performance', 'Major', 'Identified', false, NOW() - INTERVAL '24 hours', NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Tickets
INSERT INTO tickets (
    id, ticket_number, customer_name, customer_email, title, description, category,
    urgency, impact, priority_score, priority_level, priority_explanation, reason_codes,
    status, assigned_agent_id, incident_id, deadline, escalation_level, created_at, updated_at
)
VALUES
    -- Routine Ticket (Low Urgency)
    ('c0000000-0000-0000-0000-000000000001', 'PRX-1001', 'Global Logistics Inc (Acme)', 'it@acmelogistics.com', 'Need assistance with quarterly invoice export format', 'We would like to download our last 3 months invoices as a single consolidated CSV file instead of individual PDFs.', 'General Enquiry', 'Low', 'Low', 23.8, 'Low', 'Score: 23.8/100 (Low). Factors: Urgency (8.8/35), Impact (7.5/30), Deadline Risk (2.0/20), Wait Time (1.5/15).', '["STANDARD_PRIORITY"]'::jsonb, 'Open', 'a0000000-0000-0000-0000-000000000002', NULL, NOW() + INTERVAL '3 days', 0, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    
    -- Overdue Unresolved Ticket
    ('c0000000-0000-0000-0000-000000000002', 'PRX-1002', 'Fintech Cloud Co', 'security@fincloud.io', 'SSO SAML Certificate Expiration warning on production tenant', 'Our IdP SAML signing cert expired yesterday. Two departments cannot log into the production console.', 'Login/Account Access', 'High', 'High', 84.8, 'High', 'Score: 84.8/100 (High). Factors: Urgency (26.2/35), Impact (22.5/30), Deadline Risk (20.0/20), Wait Time (12.0/15). ESCALATION: Ticket has breached its resolution deadline and is actively overdue.', '["HIGH_URGENCY", "HIGH_IMPACT", "DEADLINE_OVERDUE", "LONG_WAIT"]'::jsonb, 'In Progress', 'a0000000-0000-0000-0000-000000000002', NULL, NOW() - INTERVAL '8 hours', 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '8 hours'),
    
    -- Approaching Deadline (< 6h)
    ('c0000000-0000-0000-0000-000000000003', 'PRX-1003', 'Starlight Media', 'devops@starlight.com', 'Database read replica replication lag exceeding 10 minutes', 'Replica replication lag is steadily climbing. Real-time analytics dashboards are showing stale data.', 'Data Issue', 'High', 'High', 70.7, 'High', 'Score: 70.7/100 (High). Factors: Urgency (26.2/35), Impact (22.5/30), Deadline Risk (16.0/20), Wait Time (6.0/15). WARNING: Ticket resolution deadline is approaching within critical threshold.', '["HIGH_URGENCY", "HIGH_IMPACT", "DEADLINE_NEAR"]'::jsonb, 'Open', 'a0000000-0000-0000-0000-000000000003', NULL, NOW() + INTERVAL '4 hours', 1, NOW() - INTERVAL '14 hours', NOW() - INTERVAL '14 hours'),
    
    -- Verified Critical Incident Outage Ticket 1
    ('c0000000-0000-0000-0000-000000000004', 'PRX-1004', 'OmniRetail Global', 'billing@omniretail.com', 'Checkouts failing at POS: 502 Bad Gateway from API', 'Our European checkout terminals are receiving 502 Bad Gateway responses during checkout payment processing.', 'Service Outage', 'Critical', 'Critical', 98.0, 'Critical', 'Score: 98.0/100 (Critical). Factors: Urgency (35.0/35), Impact (30.0/30), Deadline Risk (19.0/20), Wait Time (1.9/15). OVERRIDE APPLIED: Linked to authorized critical service incident (INC-2026-001). Elevates priority above routine work.', '["CRITICAL_INCIDENT", "HIGH_URGENCY", "HIGH_IMPACT", "DEADLINE_NEAR"]'::jsonb, 'In Progress', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NOW() + INTERVAL '2 hours', 0, NOW() - INTERVAL '2 hours 30 minutes', NOW() - INTERVAL '1 hour'),
    
    -- Verified Critical Incident Outage Ticket 2 (Arrived LATER than routine work)
    ('c0000000-0000-0000-0000-000000000005', 'PRX-1005', 'PayStream Systems', 'noc@paystream.net', 'Webhook timeouts and dropped settlement confirmation packets', 'We are experiencing packet drops communicating with the US-East gateway endpoints.', 'Service Outage', 'Critical', 'Critical', 98.0, 'Critical', 'Score: 98.0/100 (Critical). Factors: Urgency (35.0/35), Impact (30.0/30), Deadline Risk (19.0/20), Wait Time (0.6/15). OVERRIDE APPLIED: Linked to authorized critical service incident (INC-2026-001). Elevates priority above routine work.', '["CRITICAL_INCIDENT", "HIGH_URGENCY", "HIGH_IMPACT", "DEADLINE_NEAR"]'::jsonb, 'Open', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NOW() + INTERVAL '1 hour', 0, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'),
    
    -- Verified Critical Incident Outage Ticket 3
    ('c0000000-0000-0000-0000-000000000006', 'PRX-1006', 'HyperCommerce Online', 'support@hypercommerce.de', 'Urgent: Customers reporting failed payment charges on web portal', 'Users click Place Order and receive a connection timeout after 30 seconds.', 'Payment/Billing', 'High', 'Critical', 98.0, 'Critical', 'Score: 98.0/100 (Critical). Factors: Urgency (26.2/35), Impact (30.0/30), Deadline Risk (16.0/20), Wait Time (0.3/15). OVERRIDE APPLIED: Linked to authorized critical service incident (INC-2026-001). Elevates priority above routine work.', '["CRITICAL_INCIDENT", "HIGH_URGENCY", "HIGH_IMPACT", "DEADLINE_NEAR"]'::jsonb, 'Open', NULL, 'b0000000-0000-0000-0000-000000000001', NOW() + INTERVAL '3 hours', 0, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'),
    
    -- Resolved Ticket with past deadline (MUST NOT count as active overdue)
    ('c0000000-0000-0000-0000-000000000007', 'PRX-1007', 'Apex Healthcare Tech', 'compliance@apexhealth.org', 'Two-factor authentication SMS delays on mobile devices', 'SMS delivery carrier was experiencing carrier routing issues. Switched SMS provider gateway.', 'Login/Account Access', 'High', 'Medium', 41.2, 'Medium', 'Score: 41.2/100 (Medium). Factors: Urgency (26.2/35), Impact (15.0/30), Deadline Risk (0.0/20), Wait Time (0.0/15). Ticket resolved; zero active deadline risk.', '["HIGH_URGENCY"]'::jsonb, 'Resolved', 'a0000000-0000-0000-0000-000000000002', NULL, NOW() - INTERVAL '24 hours', 0, NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Audit Histories
INSERT INTO ticket_history (id, ticket_id, action, actor, details, timestamp)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CREATED', 'Customer Portal', 'Ticket submitted by it@acmelogistics.com', NOW() - INTERVAL '2 hours'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'ASSIGNED', 'Dispatch Auto-Router', 'Assigned to Alex Mercer based on skills match for Billing/Account categories.', NOW() - INTERVAL '1 hour 55 minutes'),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'CREATED', 'Customer Portal', 'Ticket submitted by security@fincloud.io', NOW() - INTERVAL '2 days'),
    ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'ESCALATED_OVERDUE', 'Escalation Service', 'Resolution deadline expired with status remaining unresolved. Priority elevated.', NOW() - INTERVAL '8 hours'),
    ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'INCIDENT_LINKED', 'Sarah Connor', 'Linked to Verified Critical Incident INC-2026-001 (US-East API Gateway Degradation).', NOW() - INTERVAL '2 hours'),
    ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000005', 'INCIDENT_LINKED', 'Sarah Connor', 'Linked to Verified Critical Incident INC-2026-001. Elevates priority above routine work.', NOW() - INTERVAL '30 minutes'),
    ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'STATUS_CHANGED', 'Alex Mercer', 'Status changed from In Progress to Resolved. Customer verified resolution.', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;
