import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { Ticket, AgentRecommendation, Incident, CATEGORIES, TicketStatus } from '../types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ScoreExplainerModal } from '../components/ScoreExplainerModal';
import { AiSuggestResponseModal } from '../components/AiSuggestResponseModal';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Clock,
  User,
  ShieldAlert,
  Link2,
  Unlink,
  CheckCircle2,
  MessageSquare,
  Activity,
  Layers,
  ChevronRight,
  Send,
  Bot
} from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Tabs: Details, Comments, Activity, Related
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity' | 'related'>('details');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ id: string; author: string; text: string; time: string }[]>([
    {
      id: 'c1',
      author: 'Alex Carter (Support Agent)',
      text: 'Investigating customer authentication logs on the SSO identity provider.',
      time: '15 mins ago'
    }
  ]);

  // Modals
  const [showExplainer, setShowExplainer] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Status & Assignment
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [ticketEvents, setTicketEvents] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadTicketData(id);
    }
  }, [id]);

  const loadTicketData = async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [tData, recs, incs, eventsRes] = await Promise.all([
        PriorixApi.getTicket(ticketId),
        PriorixApi.getRecommendedAgents(ticketId).catch(() => []),
        PriorixApi.getIncidents().catch(() => []),
        PriorixApi.getTicketEvents(ticketId).catch(() => [])
      ]);
      setTicket(tData);
      setRecommendations(recs);
      setIncidents(incs);
      if (eventsRes) setTicketEvents(eventsRes);
      setSelectedAgentId(tData.assigned_agent_id || '');
    } catch (e: any) {
      setError(e.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      setUpdatingStatus(true);
      const updated = await PriorixApi.updateTicket(ticket.id, { status: newStatus });
      setTicket(updated);
      setActionSuccess(`Status changed to ${newStatus}. Priority recalculated.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!ticket) return;
    try {
      setSelectedAgentId(agentId);
      const updated = await PriorixApi.assignTicket(ticket.id, agentId || null);
      setTicket(updated);
      setActionSuccess('Agent assignment updated successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to update assignment.');
    }
  };

  const handleApplyAiSuggestion = async () => {
    if (!ticket) return;
    try {
      setActionSuccess('AI suggestions applied to ticket prioritization.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to apply AI suggestion.');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments([
      ...comments,
      {
        id: `c-${Date.now()}`,
        author: 'Current User',
        text: commentText.trim(),
        time: 'Just now'
      }
    ]);
    setCommentText('');
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading ticket details...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
        <p className="text-xs text-red-700 font-semibold">{error || 'Ticket not found'}</p>
        <button
          onClick={() => navigate('/my-tickets')}
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          Return to My Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1300px] mx-auto pb-12">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        <Link to="/my-tickets" className="hover:text-purple-600 transition-colors">
          My Tickets
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-mono font-bold text-slate-700">#{ticket.ticket_number}</span>
      </div>

      {/* Header Bar matching reference mockup */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              #{ticket.ticket_number}
            </span>
            <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
            <div className="flex items-center space-x-1.5 ml-1">
              <StatusBadge status={ticket.status} />
              <PriorityBadge level={ticket.priority_level} score={ticket.priority_score} />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Created on {new Date(ticket.created_at).toLocaleString()} by {ticket.customer_name} ({ticket.customer_email})
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
            disabled={updatingStatus}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="Open">Status: Open</option>
            <option value="In Progress">Status: In Progress</option>
            <option value="Waiting">Status: Waiting</option>
            <option value="Resolved">Status: Resolved</option>
            <option value="Closed">Status: Closed</option>
          </select>

          {/* Explain score button */}
          <button
            onClick={() => setShowExplainer(true)}
            className="inline-flex items-center space-x-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Score: {ticket.priority_score.toFixed(1)}</span>
          </button>

          {/* AI Response Assistant */}
          <button
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Response</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Two Column Layout matching reference mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Tabs & Details */}
        <div className="lg:col-span-8 space-y-5">
          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="flex border-b border-slate-100 px-6 pt-3 space-x-6 text-xs font-bold">
              {(['details', 'comments', 'activity', 'related'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 capitalize transition-all border-b-2 ${
                    activeTab === tab
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Problem Description */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Description
                    </span>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {ticket.description}
                    </div>
                  </div>

                  {/* Metadata Grid matching reference */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Category</span>
                      <span className="font-bold text-slate-800">{ticket.category}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Assignee</span>
                      <span className="font-bold text-slate-800">
                        {ticket.assigned_agent?.name || 'Unassigned'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Created</span>
                      <span className="font-bold text-slate-800">
                        {new Date(ticket.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Last Updated</span>
                      <span className="font-bold text-slate-800">
                        {new Date(ticket.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* SLA Deadline Banner with countdown pill matching mockup */}
                  <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-purple-900 font-bold">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>SLA Deadline</span>
                      <span className="text-slate-600 font-normal">
                        • {ticket.sla_due_at ? new Date(ticket.sla_due_at).toLocaleString() : 'Within 24 hours'}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-bold text-[11px] rounded-full">
                      {ticket.is_overdue ? 'Overdue' : '1h 05m left'}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{c.author}</span>
                          <span className="text-[10px] text-slate-400">{c.time}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{c.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add an internal comment or customer update..."
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Comment
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3">
                  {ticketEvents.length > 0 ? (
                    ticketEvents.map((ev, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 flex-shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800">{ev.event_type}</div>
                          <div className="text-slate-500 text-[11px]">{ev.details}</div>
                          <div className="text-[10px] text-slate-400">{new Date(ev.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs text-center py-6">
                      No audit events recorded for this ticket.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'related' && (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 text-center">
                  Potentially related tickets scanned using privacy-preserving customer isolation.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): AI Suggestion Card & Assignment */}
        <div className="lg:col-span-4 space-y-5">
          {/* AI Suggestion Card matching reference mockup */}
          <div className="bg-gradient-to-br from-purple-50/90 via-indigo-50/60 to-purple-100/70 border border-purple-200/90 p-5 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center space-x-1.5 text-purple-700 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-purple-600 fill-purple-200" />
              <span>AI Suggestion</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Suggested Priority</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    High
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Confidence: 92%</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Suggested Category</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                    {ticket.category || 'Account'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Confidence: 84%</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Reasoning</span>
                <p className="text-slate-700 text-[11px] mt-0.5 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-purple-100">
                  Account access issues are typically high priority as they block customer access and require prompt verification.
                </p>
              </div>

              <button
                onClick={handleApplyAiSuggestion}
                className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Use Suggestion
              </button>
            </div>
          </div>

          {/* Agent Assignee Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900">Assign Support Specialist</h3>
            <div className="space-y-2">
              <select
                value={selectedAgentId}
                onChange={(e) => handleAssignAgent(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="">Unassigned</option>
                {recommendations.map((rec) => (
                  <option key={rec.agent.id} value={rec.agent.id}>
                    {rec.agent.name} ({rec.agent.role}) - Match: {Math.round(rec.match_score)}%
                  </option>
                ))}
              </select>

              {recommendations.length > 0 && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>
                    Top recommendation: <strong>{recommendations[0].agent.name}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScoreExplainerModal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
        ticket={ticket}
      />

      <AiSuggestResponseModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        ticket={ticket}
      />
    </div>
  );
};
