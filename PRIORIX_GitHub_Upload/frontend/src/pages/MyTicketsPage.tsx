import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { Ticket, TicketStatus, PriorityLevel } from '../types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Inbox,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';

export const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('30');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await PriorixApi.getTickets({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page: currentPage,
        page_size: 5
      });
      if (res) {
        setTickets(res.tickets);
        setTotalCount(res.total || res.tickets.length);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [search, statusFilter, priorityFilter, dateFilter, currentPage]);

  return (
    <div className="space-y-6 max-w-[1300px] mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Tickets</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View and manage your support tickets.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/tickets/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Ticket</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar matching reference mockup */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap gap-2.5 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting">Waiting</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Date Filter Dropdown */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          {/* Filter Reset / Refresh */}
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPriorityFilter('');
              setDateFilter('30');
            }}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Ticket Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-5">ID</th>
                <th className="py-3 px-5">Title</th>
                <th className="py-3 px-5">Priority</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Created</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin text-purple-600 mb-2" />
                    <span>Loading tickets...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No tickets found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your filters or create a new ticket.</p>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-indigo-600 whitespace-nowrap">
                      #{t.ticket_number}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-900 max-w-sm truncate">
                      {t.title}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <PriorityBadge level={t.priority_level} score={t.priority_score} />
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(t.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })} • {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-right text-slate-400 group-hover:text-purple-600">
                      <ChevronRight className="w-4 h-4 inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer matching reference design */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {tickets.length > 0 ? (currentPage - 1) * 5 + 1 : 0} -{' '}
            {Math.min(currentPage * 5, totalCount || tickets.length)} of {totalCount || tickets.length}
          </div>

          <div className="flex items-center space-x-1.5">
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                  currentPage === page
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
