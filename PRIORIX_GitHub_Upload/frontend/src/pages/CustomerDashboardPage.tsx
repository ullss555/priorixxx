import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { Ticket, DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { DeadlineIndicator } from '../components/DeadlineIndicator';
import {
  Layers,
  Inbox,
  Flame,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PlusCircle,
  MessageSquare,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ticketsRes, statsRes] = await Promise.all([
          PriorixApi.getTickets({ page: 1, page_size: 5, sort_by: 'created_at', sort_order: 'desc' }),
          PriorixApi.getDashboardStats(7)
        ]);
        if (ticketsRes) setTickets(ticketsRes.tickets);
        if (statsRes) setStats(statsRes);
      } catch (err) {
        console.error('Failed to load customer dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-[1300px] mx-auto pb-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-7 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI-Powered Support Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good morning, {user?.display_name || 'Sarah'} 👋
          </h1>
          <p className="mt-1 text-indigo-200/80 text-xs leading-relaxed">
            PRIORIX prioritizes your support tickets with deterministic SLA guarantees and automated escalation. Need immediate assistance? Open AI Chat Triage or file a ticket below.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              to="/triage"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-transform hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat Triage</span>
            </Link>
            <Link
              to="/tickets/new"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-transform hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Ticket</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards (Matching Admin & Mockup Styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tickets</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.total_tickets ?? tickets.length}</span>
          </div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>+12% from last 7 days</span>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Open Tickets</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.open_tickets ?? 0}</span>
          </div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>+8% from last 7 days</span>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">High Priority</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {(stats?.critical_tickets || 0) + (stats?.priority_distribution?.High || 0)}
            </span>
          </div>
          <div className="flex items-center text-[11px] font-semibold text-rose-600">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>+2% from last 7 days</span>
          </div>
        </div>

        {/* SLA Breaches */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">SLA Breaches</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.overdue_tickets ?? 0}</span>
          </div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            <span>-50% from last 7 days</span>
          </div>
        </div>
      </div>

      {/* Recent Tickets Section matching reference table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Your Active Support Tickets</h2>
            <p className="text-xs text-slate-400">Scoped strictly to your customer account</p>
          </div>
          <Link
            to="/my-tickets"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>View all tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-700">No active tickets</h3>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
              You currently have no open support requests. Click below to open a ticket.
            </p>
            <Link
              to="/tickets/new"
              className="mt-3 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Ticket</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                      #{t.ticket_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {t.title}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge level={t.priority_level} score={t.priority_score} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {t.category}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                      <DeadlineIndicator
                        deadline={t.deadline}
                        isOverdue={t.is_overdue}
                        isApproaching={t.is_approaching_deadline}
                        status={t.status}
                      />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right text-slate-400 group-hover:text-purple-600">
                      <ChevronRight className="w-4 h-4 inline" />
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
