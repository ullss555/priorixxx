import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { Ticket, Agent, CATEGORIES } from '../types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { DeadlineIndicator } from '../components/DeadlineIndicator';
import {
  Inbox,
  Filter,
  Search,
  Users,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export const AgentWorkspacePage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'overdue' | 'unassigned'>('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, agentsRes] = await Promise.all([
        PriorixApi.getTickets({ search: search || undefined }),
        PriorixApi.getAgents()
      ]);
      if (ticketsRes) setTickets(ticketsRes.tickets);
      if (agentsRes) setAgents(agentsRes);
    } catch (err) {
      console.error('Failed to load agent workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Tab Filtering
  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'critical') return t.priority_level === 'Critical';
    if (activeTab === 'overdue') return t.is_overdue;
    if (activeTab === 'unassigned') return !t.assigned_agent_id;
    return true;
  });

  const criticalCount = tickets.filter((t) => t.priority_level === 'Critical').length;
  const overdueCount = tickets.filter((t) => t.is_overdue).length;
  const unassignedCount = tickets.filter((t) => !t.assigned_agent_id).length;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agent Triage Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational queue prioritized by deterministic business rules and active SLA deadlines.
          </p>
        </div>
      </div>

      {/* Agent Workload Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Active Support Responders & Domain Capacities</span>
          </div>
          <span className="text-[11px] text-slate-400">{agents.length} Specialists Online</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {agents.map((ag) => (
            <div key={ag.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 truncate">{ag.name}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  (ag.active_tickets_count || 0) >= ag.max_capacity
                    ? 'bg-red-100 text-red-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {ag.active_tickets_count || 0}/{ag.max_capacity} Active
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">{ag.role}</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((ag.active_tickets_count || 0) / ag.max_capacity) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs and Quick Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Queue ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'critical' ? 'bg-red-600 text-white shadow-xs' : 'text-red-700 hover:text-red-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Critical ({criticalCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'overdue' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800 hover:text-amber-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Breached / Overdue ({overdueCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'unassigned' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:text-indigo-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Unassigned ({unassignedCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter queue..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading queue...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <div className="text-xs font-semibold text-slate-800">No tickets found in this view</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Score & Ticket</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Agent</th>
                  <th className="px-5 py-3.5">SLA Deadline</th>
                  <th className="px-5 py-3.5 text-right">Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 max-w-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {t.priority_score.toFixed(1)}
                        </span>
                        <PriorityBadge priority={t.priority_level} />
                        <span className="font-mono text-[11px] text-slate-400">{t.ticket_number}</span>
                      </div>
                      <div className="font-semibold text-slate-900 text-sm mt-1 line-clamp-1">{t.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{t.description}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{t.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{t.customer_email}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-700 font-medium">
                      {t.category}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {t.assigned_agent ? (
                        <div className="font-medium text-slate-800">{t.assigned_agent.name}</div>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <DeadlineIndicator
                        deadline={t.deadline}
                        isOverdue={t.is_overdue}
                        isApproaching={t.is_approaching_deadline}
                        status={t.status}
                      />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-semibold transition-colors"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
