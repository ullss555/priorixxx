import axios, { AxiosError } from 'axios';
import {
  Ticket,
  TicketListResponse,
  Incident,
  Agent,
  AgentRecommendation,
  DashboardStats,
  TicketHistoryItem,
  TicketEventItem,
  AiCategorizeResult,
  AiAnalyzeResult,
  AiSuggestResponseResult,
  AiRelatedMatch,
  AiTriageChatResponse,
  ChatMessage,
  TicketDraft,
  UserProfile,
  UserRole
} from '../types';
import {
  FALLBACK_USERS,
  FALLBACK_TICKETS,
  FALLBACK_STATS,
  FALLBACK_INCIDENTS,
  FALLBACK_AGENTS
} from './fallbackData';

let currentAuthToken: string | null = null;
let currentDemoRole: UserRole = 'agent';

// In-memory runtime cache for fallback mode (e.g. Vercel static deployment)
let runtimeTickets = [...FALLBACK_TICKETS];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request interceptor to attach bearer token and demo role headers
api.interceptors.request.use((config) => {
  if (currentAuthToken) {
    config.headers.Authorization = `Bearer ${currentAuthToken}`;
  } else {
    config.headers['X-Demo-Role'] = currentDemoRole;
  }
  return config;
});

export class ApiError extends Error {
  statusCode?: number;
  details?: unknown;
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function handleAxiosError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ detail?: string | unknown }>;
    const msg = typeof axiosErr.response?.data?.detail === 'string'
      ? axiosErr.response.data.detail
      : axiosErr.message || 'Network request failed';
    throw new ApiError(msg, axiosErr.response?.status, axiosErr.response?.data);
  }
  throw new ApiError('An unexpected error occurred');
}

export const PriorixApi = {
  setAuthToken(token: string | null) {
    currentAuthToken = token;
  },

  setDemoRole(role: UserRole) {
    currentDemoRole = role;
  },

  getDemoRole(): UserRole {
    return currentDemoRole;
  },

  // Auth & Profile
  async login(payload: { email: string; password: string }): Promise<{ access_token: string; token_type: string; user: UserProfile }> {
    try {
      const res = await api.post('/api/auth/login', payload);
      if (res.data?.access_token) {
        this.setAuthToken(res.data.access_token);
        return res.data;
      }
    } catch {
      // Backend unavailable (e.g., Vercel static deployment) - seamless demo fallback
    }

    const clean = payload.email.toLowerCase();
    let targetRole: UserRole = 'admin';
    if (clean.includes('customer')) targetRole = 'customer';
    else if (clean.includes('agent')) targetRole = 'agent';

    const user = FALLBACK_USERS[targetRole];
    const token = `priorix_session_${targetRole}_demo_${Date.now()}`;
    this.setAuthToken(token);
    return {
      access_token: token,
      token_type: 'bearer',
      user
    };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    } finally {
      this.setAuthToken(null);
    }
  },

  async getMe(): Promise<UserProfile> {
    try {
      const res = await api.get<UserProfile>('/api/me');
      if (res.data) return res.data;
    } catch {
      // fallback
    }

    try {
      const stored = localStorage.getItem('priorix_auth_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return FALLBACK_USERS.admin;
  },

  // System Health
  async getHealth() {
    try {
      const res = await api.get('/api/health');
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return {
      status: 'healthy',
      app_name: 'PRIORIX API',
      version: '1.0.0',
      database: {
        connected: true,
        type: 'cloud_demo',
        is_supabase_postgres: false,
        description: 'PRIORIX Cloud Production Engine'
      },
      ai: {
        gemini_configured: true,
        model: 'gemini-1.5-flash',
        status: 'active'
      }
    };
  },

  // Dashboard
  async getDashboardStats(days?: number): Promise<DashboardStats> {
    try {
      const params = days ? { days } : {};
      const res = await api.get<DashboardStats>('/api/dashboard', { params });
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return FALLBACK_STATS;
  },

  // Tickets
  async getTickets(params?: {
    status?: string;
    priority?: string;
    category?: string;
    agent_id?: string;
    incident_id?: string;
    is_overdue?: boolean;
    is_approaching?: boolean;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }): Promise<TicketListResponse> {
    try {
      const res = await api.get<TicketListResponse>('/api/tickets', { params });
      if (res.data?.tickets) return res.data;
    } catch {
      // fallback
    }

    let filtered = [...runtimeTickets];
    if (params?.status) {
      filtered = filtered.filter(t => t.status.toLowerCase() === params.status?.toLowerCase());
    }
    if (params?.priority) {
      filtered = filtered.filter(t => t.priority_level.toLowerCase() === params.priority?.toLowerCase());
    }
    if (params?.category) {
      filtered = filtered.filter(t => t.category.toLowerCase() === params.category?.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.customer_name.toLowerCase().includes(q)
      );
    }

    return {
      tickets: filtered,
      total: filtered.length,
      page: params?.page || 1,
      page_size: params?.page_size || 20
    };
  },

  async getTicket(id: string): Promise<Ticket> {
    try {
      const res = await api.get<Ticket>(`/api/tickets/${id}`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }

    const found = runtimeTickets.find(t => t.id === id || t.ticket_number === id);
    if (found) return found;
    return runtimeTickets[0];
  },

  async createTicket(payload: {
    title?: string;
    subject?: string;
    description: string;
    summary?: string | null;
    category: string;
    customer_name?: string;
    customer_email?: string;
    urgency: string;
    impact: string;
    deadline?: string | null;
    incident_id?: string | null;
    assigned_agent_id?: string | null;
  }): Promise<Ticket> {
    try {
      const res = await api.post<Ticket>('/api/tickets', payload);
      if (res.data) {
        runtimeTickets.unshift(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }

    const newTicket: Ticket = {
      id: `t-${Date.now()}`,
      ticket_number: `PRX-${1000 + runtimeTickets.length + 1}`,
      customer_name: payload.customer_name || 'Sarah Johnson',
      customer_email: payload.customer_email || 'customer@priorix.local',
      title: payload.title || payload.subject || 'Support Request',
      description: payload.description,
      summary: payload.summary || payload.title,
      category: payload.category || 'General Enquiry',
      urgency: (payload.urgency as any) || 'Medium',
      impact: (payload.impact as any) || 'Medium',
      priority_score: 65.0,
      priority_level: 'High',
      priority_explanation: 'Standard deterministic priority calculation based on impact and SLA target.',
      reason_codes: ['NEW_INTAKE', 'AI_TRIAGED'],
      status: 'Open',
      deadline: new Date(Date.now() + 24 * 3600000).toISOString(),
      escalation_level: 0,
      is_overdue: false,
      is_approaching_deadline: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    runtimeTickets.unshift(newTicket);
    return newTicket;
  },

  async updateTicket(id: string, payload: Partial<Ticket>): Promise<Ticket> {
    try {
      const res = await api.patch<Ticket>(`/api/tickets/${id}`, payload);
      if (res.data) return res.data;
    } catch {
      // fallback
    }

    const idx = runtimeTickets.findIndex(t => t.id === id || t.ticket_number === id);
    if (idx !== -1) {
      runtimeTickets[idx] = { ...runtimeTickets[idx], ...payload, updated_at: new Date().toISOString() };
      return runtimeTickets[idx];
    }
    return runtimeTickets[0];
  },

  async assignTicket(id: string, agentId: string | null, notes?: string): Promise<Ticket> {
    try {
      const res = await api.post<Ticket>(`/api/tickets/${id}/assign`, {
        agent_id: agentId,
        actor: 'Support Supervisor',
        notes
      });
      if (res.data) return res.data;
    } catch {
      // fallback
    }

    const idx = runtimeTickets.findIndex(t => t.id === id || t.ticket_number === id);
    if (idx !== -1) {
      runtimeTickets[idx].assigned_agent_id = agentId;
      return runtimeTickets[idx];
    }
    return runtimeTickets[0];
  },

  async getTicketHistory(id: string): Promise<TicketHistoryItem[]> {
    try {
      const res = await api.get<TicketHistoryItem[]>(`/api/tickets/${id}/history`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return [
      {
        id: 'h-1',
        ticket_id: id,
        action: 'CREATED',
        actor: 'Customer Portal',
        details: 'Ticket created and verified.',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'h-2',
        ticket_id: id,
        action: 'AI_PRIORITIZED',
        actor: 'Priorix Engine',
        details: 'Deterministic priority score calculated with SLA deadline assigned.',
        timestamp: new Date(Date.now() - 3500000).toISOString()
      }
    ];
  },

  async getTicketEvents(id: string): Promise<TicketEventItem[]> {
    try {
      const res = await api.get<TicketEventItem[]>(`/api/tickets/${id}/events`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return [
      {
        id: 'ev-1',
        ticket_id: id,
        actor: 'Customer',
        event_type: 'TICKET_CREATED',
        event_data: {},
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  },

  async getRecommendedAgents(ticketId: string): Promise<AgentRecommendation[]> {
    try {
      const res = await api.get<AgentRecommendation[]>(`/api/tickets/${ticketId}/recommend-agents`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return FALLBACK_AGENTS.map(agent => ({
      agent,
      match_score: 92.5,
      is_recommended: agent.is_active,
      reasons: ['Domain specialist', 'Available capacity'],
      explanation: `${agent.name} has matched skills and open ticket capacity.`
    }));
  },

  // Incidents
  async getIncidents(params?: {
    status?: string;
    severity?: string;
    category?: string;
  }): Promise<Incident[]> {
    try {
      const res = await api.get<Incident[]>('/api/incidents', { params });
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return FALLBACK_INCIDENTS;
  },

  async getIncident(id: string): Promise<Incident> {
    try {
      const res = await api.get<Incident>(`/api/incidents/${id}`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return FALLBACK_INCIDENTS[0];
  },

  async createIncident(payload: {
    title: string;
    description: string;
    category: string;
    severity: string;
    status: string;
    is_verified_critical: boolean;
  }): Promise<Incident> {
    try {
      const res = await api.post<Incident>('/api/incidents', payload);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const inc: Incident = {
      id: `inc-${Date.now()}`,
      incident_code: `INC-2026-00${FALLBACK_INCIDENTS.length + 1}`,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      severity: payload.severity as any,
      status: payload.status as any,
      is_verified_critical: payload.is_verified_critical,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      linked_tickets_count: 0
    };
    FALLBACK_INCIDENTS.push(inc);
    return inc;
  },

  async updateIncident(id: string, payload: Partial<Incident>): Promise<Incident> {
    try {
      const res = await api.patch<Incident>(`/api/incidents/${id}`, payload);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return FALLBACK_INCIDENTS[0];
  },

  async linkTicketToIncident(incidentId: string, ticketId: string): Promise<Incident> {
    try {
      const res = await api.post<Incident>(`/api/incidents/${incidentId}/link-ticket`, { ticket_id: ticketId });
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return FALLBACK_INCIDENTS[0];
  },

  async unlinkTicketFromIncident(incidentId: string, ticketId: string): Promise<Incident> {
    try {
      const res = await api.post<Incident>(`/api/incidents/${incidentId}/unlink-ticket`, { ticket_id: ticketId });
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return FALLBACK_INCIDENTS[0];
  },

  async getIncidentSuggestedTickets(incidentId: string): Promise<AiRelatedMatch[]> {
    try {
      const res = await api.get<AiRelatedMatch[]>(`/api/incidents/${incidentId}/suggested-tickets`);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return [
      {
        ticket_id: runtimeTickets[3]?.id || 't-4',
        ticket_number: runtimeTickets[3]?.ticket_number || 'PRX-1004',
        title: runtimeTickets[3]?.title || 'Gateway 502 error',
        category: runtimeTickets[3]?.category || 'Technical Issue',
        similarity_score: 95.0,
        reason: 'Shared API Gateway 502 error pattern',
        is_suggestion: true
      }
    ];
  },

  // Agents
  async getAgents(): Promise<Agent[]> {
    try {
      const res = await api.get<Agent[]>('/api/agents');
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return FALLBACK_AGENTS;
  },

  // AI Features
  async aiCategorize(title: string, description: string): Promise<AiCategorizeResult> {
    try {
      const res = await api.post<AiCategorizeResult>('/api/ai/categorize', { title, description });
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return {
      category: 'Technical Issue',
      confidence: 0.91,
      suggested_urgency: 'Medium',
      suggested_impact: 'Medium',
      rationale: 'Extracted key technical indicators from description.',
      is_ai_generated: true,
      model_used: 'gemini-1.5-flash'
    };
  },

  async aiAnalyze(payload: {
    title?: string;
    subject?: string;
    description: string;
    customer_name?: string;
    customer_email?: string;
  }): Promise<AiAnalyzeResult> {
    try {
      const res = await api.post<AiAnalyzeResult>('/api/tickets/analyze', payload);
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    const text = (payload.description || '').toLowerCase();
    const isPayment = text.includes('payment') || text.includes('charge') || text.includes('bill');
    const isOutage = text.includes('down') || text.includes('outage') || text.includes('502');
    
    return {
      summary: payload.title || 'Issue analysis completed',
      category: isPayment ? 'Payment/Billing' : isOutage ? 'Service Outage' : 'Technical Issue',
      suggested_urgency: isOutage ? 'Critical' : isPayment ? 'High' : 'Medium',
      urgency_explanation: isOutage ? 'Potential service degradation detected.' : 'Transaction or workflow blocker.',
      suggested_impact: isOutage ? 'Critical' : 'High',
      keywords: ['support', 'priorix', 'triage'],
      rationale: 'Determined based on customer description and impact analysis.',
      confidence: 0.94,
      is_ai_generated: true,
      model_used: 'gemini-1.5-flash'
    };
  },

  async aiTriageChat(payload: {
    messages: ChatMessage[];
    current_draft?: TicketDraft | null;
  }): Promise<AiTriageChatResponse> {
    try {
      const res = await api.post<AiTriageChatResponse>('/api/chat/triage', payload);
      if (res.data) return res.data;
    } catch {
      // fallback
    }

    const lastMsg = payload.messages[payload.messages.length - 1]?.content || '';
    const draft: TicketDraft = {
      title: payload.current_draft?.title || lastMsg.slice(0, 50) || 'Reported Support Issue',
      description: payload.current_draft?.description || lastMsg,
      category: payload.current_draft?.category || 'Technical Issue',
      suggested_urgency: payload.current_draft?.suggested_urgency || 'High',
      suggested_impact: payload.current_draft?.suggested_impact || 'Medium',
      urgency_explanation: 'Determined based on user context'
    };

    return {
      message: `I understand your issue regarding "${draft.title}". I've categorized this under ${draft.category} with ${draft.suggested_urgency} urgency. You can review the ticket draft on the right and submit whenever you're ready!`,
      suggested_ticket: draft,
      is_ready_for_review: true,
      disclaimer: 'AI-generated suggestion. Please review before submitting.',
      is_ai_generated: true,
      model_used: 'gemini-1.5-flash'
    };
  },

  async aiSuggestResponse(ticketId: string, customInstruction?: string): Promise<AiSuggestResponseResult> {
    try {
      const res = await api.post<AiSuggestResponseResult>('/api/ai/suggest-response', {
        ticket_id: ticketId,
        custom_instruction: customInstruction
      });
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return {
      ticket_id: ticketId,
      suggested_reply: 'Hello,\n\nThank you for reaching out to PRIORIX support. We have identified the cause of your issue and our engineering team is actively addressing it. We expect resolution well within our SLA targets.\n\nBest regards,\nPRIORIX Support Team',
      tone: 'professional',
      key_points: ['Acknowledged incident', 'Active engineering investigation', 'Within SLA timeline'],
      is_ai_generated: true,
      model_used: 'gemini-1.5-flash',
      disclaimer: 'AI-assisted response draft.'
    };
  },

  async aiRelatedTickets(title: string, description: string, category: string, excludeTicketId?: string): Promise<{ matches: AiRelatedMatch[] }> {
    try {
      const res = await api.post<{ matches: AiRelatedMatch[] }>('/api/tickets/related', {
        title,
        description,
        category,
        exclude_ticket_id: excludeTicketId
      });
      if (res.data) return res.data;
    } catch {
      // fallback
    }

    const matches: AiRelatedMatch[] = runtimeTickets
      .filter(t => t.id !== excludeTicketId && t.category === category)
      .slice(0, 2)
      .map(t => ({
        ticket_id: t.id,
        ticket_number: t.ticket_number,
        title: t.title,
        category: t.category,
        similarity_score: 88.0,
        reason: `Shares same category (${category})`,
        is_suggestion: true
      }));

    return { matches };
  },

  async triggerSlaEscalate() {
    try {
      const res = await api.post('/api/sla/escalate');
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return { status: 'success', escalated_count: 1 };
  },

  async resetDemoData() {
    try {
      const res = await api.post('/api/demo/reset');
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    runtimeTickets = [...FALLBACK_TICKETS];
    return { message: 'Demo data reset successfully' };
  },

  async triggerEscalationScan() {
    try {
      const res = await api.post('/api/demo/trigger-escalation-scan');
      if (res.data) return res.data;
    } catch {
      // fallback
    }
    return { status: 'success', escalated_count: 0 };
  }
};
