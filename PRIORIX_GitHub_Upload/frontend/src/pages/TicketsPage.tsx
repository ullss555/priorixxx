import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { Ticket, CATEGORIES, PriorityLevel, TicketStatus } from '../types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { DeadlineIndicator } from '../components/DeadlineIndicator';
import { ScoreExplainerModal } from '../components/ScoreExplainerModal';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  HelpCircle,
  ExternalLink,
  Flame,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldAlert,
  Inbox
} from 'lucide-react';

export const TicketsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting state from URL or defaults
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'priority_score');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort_order') || 'desc');
  const [onlyOverdue, setOnlyOverdue] = useState(searchParams.get('is_overdue') === 'true');

  // Modal state
  const [explainingTicket, setExplainingTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    loadTickets();
  }, [status, priority, category, sortBy, sortOrder, onlyOverdue]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PriorixApi.getTickets({
        status: status || undefined,
        priority: priority || undefined,
        category: category || undefined,
        search: search.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        is_overdue: onlyOverdue ? true : undefined,
      });
      setTickets(res.tickets);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTickets();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Support Prioritization Queue</h2>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic 0–100 ranking ensuring critical impact and tight deadlines rise to the top first.
          </p>
        </div>

        <Link
          to="/tickets/new"
          className="inline-flex items-center text-sm font-semibold px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket #, customer name, title or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filters and Sorting controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-lg text-slate-700 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting">Waiting</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-lg text-slate-700 bg-white"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-lg text-slate-700 bg-white"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-lg text-slate-700 bg-white"
            >
              <option value="priority_score">Priority Score</option>
              <option value="deadline">Resolution Deadline</option>
              <option value="created_at">Creation Time</option>
            </select>
          </div>

          {/* Order */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-lg text-slate-700 bg-white"
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>

          {/* Overdue quick toggle */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center space-x-2 py-1.5 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                checked={onlyOverdue}
                onChange={(e) => setOnlyOverdue(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="font-semibold text-red-600 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Only Overdue
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Ticket List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading tickets...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Inbox className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium">No tickets found matching your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Priority Score</th>
                  <th className="py-3 px-4">Customer & Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4">Deadline Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => {
                  const hasIncidentOverride = t.reason_codes.includes('CRITICAL_INCIDENT');

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasIncidentOverride ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* Ticket Number & Outage Flag */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900 whitespace-nowrap">
                        <Link to={`/tickets/${t.id}`} className="hover:text-teal-600 underline">
                          {t.ticket_number}
                        </Link>
                        {hasIncidentOverride && (
                          <div className="flex items-center text-[10px] text-red-600 font-sans font-bold mt-0.5">
                            <ShieldAlert className="w-3 h-3 mr-0.5" />
                            INCIDENT OVERRIDE
                          </div>
                        )}
                      </td>

                      {/* Priority Badge with Score Click Explainer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <PriorityBadge
                            level={t.priority_level}
                            score={t.priority_score}
                            onClick={() => setExplainingTicket(t)}
                          />
                          <button
                            onClick={() => setExplainingTicket(t)}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                            title="Why is this prioritized? Click to explain."
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Customer & Title */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          <Link to={`/tickets/${t.id}`} className="hover:text-teal-600">
                            {t.title}
                          </Link>
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {t.customer_name} ({t.customer_email})
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {t.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>

                      {/* Assigned Agent */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                        {t.assigned_agent ? (
                          <div className="flex items-center space-x-1.5">
                            <div className="w-5 h-5 rounded-full bg-navy-700 text-white flex items-center justify-center text-[10px] font-bold">
                              {t.assigned_agent.name.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-900">{t.assigned_agent.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Deadline Indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <DeadlineIndicator
                          deadline={t.deadline}
                          status={t.status}
                          isOverdue={t.is_overdue}
                          isApproaching={t.is_approaching_deadline}
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <Link
                          to={`/tickets/${t.id}`}
                          className="inline-flex items-center text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <span>Manage</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Explainer Modal */}
      <ScoreExplainerModal
        ticket={explainingTicket}
        isOpen={!!explainingTicket}
        onClose={() => setExplainingTicket(null)}
      />
    </div>
  );
};
