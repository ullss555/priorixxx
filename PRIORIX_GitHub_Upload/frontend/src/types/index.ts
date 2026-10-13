export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type TicketUrgency = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketImpact = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed';
export type IncidentSeverity = 'Critical' | 'Major' | 'Minor';
export type IncidentStatus = 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
export type UserRole = 'customer' | 'agent' | 'admin';

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  skills: string[];
  max_capacity: number;
  is_active: boolean;
  created_at: string;
  active_tickets_count?: number;
  utilization_percentage?: number;
}

export interface Incident {
  id: string;
  incident_code: string;
  title: string;
  description: string;
  category: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  is_verified_critical: boolean;
  created_at: string;
  updated_at: string;
  linked_tickets_count: number;
  tickets?: Ticket[];
}

export interface TicketHistoryItem {
  id: string;
  ticket_id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

export interface TicketEventItem {
  id: string;
  ticket_id: string;
  actor_id?: string | null;
  actor: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  title: string;
  subject?: string;
  description: string;
  summary?: string | null;
  category: string;
  urgency: TicketUrgency;
  impact: TicketImpact;
  priority_score: number;
  priority_level: PriorityLevel;
  priority?: PriorityLevel;
  priority_explanation: string;
  reason_codes: string[];
  status: TicketStatus;
  created_by?: string | null;
  assigned_to?: string | null;
  assigned_agent_id?: string | null;
  incident_id?: string | null;
  deadline?: string | null;
  sla_due_at?: string | null;
  escalation_level: number;
  is_overdue: boolean;
  is_approaching_deadline: boolean;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  assigned_agent?: Agent | null;
  incident?: Incident | null;
  history?: TicketHistoryItem[];
  events?: TicketEventItem[];
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  page_size: number;
}

export interface AgentRecommendation {
  agent: Agent;
  match_score: number;
  is_recommended: boolean;
  explanation: string;
  reasons: string[];
  active_tickets_count?: number;
  utilization_percentage?: number;
}

export interface DatabaseStatus {
  connected: boolean;
  type: string;
  is_supabase_postgres: boolean;
  description: string;
}

export interface VolumeDataPoint {
  date: string;
  tickets: number;
  resolved: number;
}

export interface SlaMetrics {
  within_sla: number;
  overdue: number;
  compliance_rate: number;
}

export interface DashboardStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets?: number;
  critical_tickets: number;
  overdue_tickets: number;
  approaching_deadline_tickets: number;
  resolved_tickets: number;
  priority_distribution: Record<PriorityLevel, number>;
  status_distribution: Record<TicketStatus, number>;
  category_distribution: Record<string, number>;
  critical_incidents: Incident[];
  agent_workloads: Agent[];
  recent_activity: TicketHistoryItem[];
  database_status: DatabaseStatus;
  volume_trend?: VolumeDataPoint[];
  sla_metrics?: SlaMetrics;
}

export interface AiCategorizeResult {
  category: string;
  confidence: number;
  suggested_urgency: TicketUrgency;
  suggested_impact: TicketImpact;
  rationale: string;
  summary?: string;
  urgency_explanation?: string;
  keywords?: string[];
  is_ai_generated: boolean;
  model_used: string;
}

export interface AiAnalyzeResult {
  summary: string;
  category: string;
  suggested_urgency: TicketUrgency;
  urgency_explanation: string;
  suggested_impact: TicketImpact;
  keywords: string[];
  rationale: string;
  confidence: number;
  is_ai_generated: boolean;
  model_used: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TicketDraft {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  suggested_urgency?: TicketUrgency | null;
  urgency_explanation?: string | null;
  suggested_impact?: TicketImpact | null;
  keywords?: string[];
  missing_information?: string[];
  customer_name?: string | null;
  customer_email?: string | null;
}

export interface AiTriageChatResponse {
  message: string;
  suggested_ticket: TicketDraft;
  is_ready_for_review: boolean;
  disclaimer: string;
  is_ai_generated: boolean;
  model_used: string;
}

export interface AiSuggestResponseResult {
  ticket_id: string;
  suggested_reply: string;
  tone: string;
  key_points: string[];
  is_ai_generated: boolean;
  model_used: string;
  disclaimer: string;
}

export interface AiRelatedMatch {
  ticket_id: string;
  ticket_number: string;
  title: string;
  category: string;
  similarity_score: number;
  reason: string;
  is_suggestion?: boolean;
}

export interface AiRelatedTicketsResponse {
  matches: AiRelatedMatch[];
  suggested_incident_id?: string | null;
  is_ai_generated: boolean;
  human_review_required: boolean;
  disclaimer: string;
}

export const CATEGORIES = [
  "Payment/Billing",
  "Login/Account Access",
  "Technical Issue",
  "Service Outage",
  "Performance",
  "Data Issue",
  "General Enquiry",
  "Other"
] as const;
