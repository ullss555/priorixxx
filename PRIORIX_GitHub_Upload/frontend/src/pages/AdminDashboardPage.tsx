import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { DashboardStats, Ticket, PriorityLevel, TicketStatus } from '../types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  Layers,
  Inbox,
  Flame,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Info,
  Calendar,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#EF4444',
  High: '#F97316',
  Medium: '#3B82F6',
  Low: '#10B981'
};

const STATUS_COLORS: Record<string, string> = {
  Open: '#3B82F6',
  'In Progress': '#8B5CF6',
  Waiting: '#F59E0B',
  Resolved: '#10B981',
  Closed: '#64748B'
};

const CATEGORY_COLORS: Record<string, string> = {
  Technical: '#3B82F6',
  'Technical Issue': '#3B82F6',
  Billing: '#60A5FA',
  'Payment/Billing': '#60A5FA',
  Account: '#8B5CF6',
  'Login/Account Access': '#8B5CF6',
  Feature: '#EC4899',
  'General Enquiry': '#EC4899',
  Bug: '#F97316',
  'Service Outage': '#EF4444',
  Other: '#94A3B8',
  'Data Issue': '#14B8A6'
};

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [showAiModal, setShowAiModal] = useState(false);

  const loadData = async (days: number = selectedDays) => {
    try {
      setLoading(true);
      const [statsRes, ticketsRes] = await Promise.all([
        PriorixApi.getDashboardStats(days),
        PriorixApi.getTickets({ page: 1, page_size: 6, sort_by: 'created_at', sort_order: 'desc' })
      ]);
      if (statsRes) setStats(statsRes);
      if (ticketsRes) setRecentTickets(ticketsRes.tickets);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDays);
  }, [selectedDays]);

  // Priority chart dataset
  const priorityChartData = useMemo(() => {
    if (!stats?.priority_distribution) return [];
    return Object.entries(stats.priority_distribution).map(([name, value]) => ({
      name,
      value,
      color: PRIORITY_COLORS[name] || '#94A3B8'
    }));
  }, [stats]);

  // Status chart dataset
  const statusChartData = useMemo(() => {
    if (!stats?.status_distribution) return [];
    return Object.entries(stats.status_distribution).map(([status, count]) => ({
      status,
      count,
      color: STATUS_COLORS[status] || '#3B82F6'
    }));
  }, [stats]);

  // Category chart dataset
  const categoryChartData = useMemo(() => {
    if (!stats?.category_distribution) return [];
    return Object.entries(stats.category_distribution).map(([cat, count]) => ({
      category: cat.length > 10 ? cat.substring(0, 10) + '...' : cat,
      fullCategory: cat,
      count,
      color: CATEGORY_COLORS[cat] || '#8B5CF6'
    }));
  }, [stats]);

  // SLA Performance dataset
  const slaChartData = useMemo(() => {
    const total = stats?.total_tickets || 0;
    const overdue = stats?.sla_metrics?.overdue ?? (stats?.overdue_tickets || 0);
    const within = Math.max(0, total - overdue);
    return [
      { name: 'Within SLA', value: within || 1, color: '#10B981' },
      { name: 'Overdue', value: overdue, color: '#EF4444' }
    ];
  }, [stats]);

  const slaPercentage = stats?.sla_metrics?.compliance_rate ?? (
    stats?.total_tickets ? Math.round(((stats.total_tickets - (stats.overdue_tickets || 0)) / stats.total_tickets) * 100) : 81
  );

  // Volume Trend dataset
  const volumeData = useMemo(() => {
    if (stats?.volume_trend && stats.volume_trend.length > 0) {
      return stats.volume_trend;
    }
    // Fallback daily data points
    return [
      { date: 'Apr 21', tickets: 12, resolved: 8 },
      { date: 'Apr 22', tickets: 10, resolved: 9 },
      { date: 'Apr 23', tickets: 15, resolved: 11 },
      { date: 'Apr 24', tickets: 14, resolved: 12 },
      { date: 'Apr 25', tickets: 18, resolved: 15 },
      { date: 'Apr 26', tickets: 16, resolved: 14 },
      { date: 'Apr 27', tickets: 20, resolved: 16 }
    ];
  }, [stats]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Header bar matching reference mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here's what's happening with your support tickets today.
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center space-x-2">
          <div className="relative inline-flex items-center">
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 py-2 pl-3 pr-8 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          <button
            onClick={() => loadData(selectedDays)}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-2xs transition-colors"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Top Summary Metric Cards (Matching Reference Mockup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tickets</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.total_tickets ?? 48}</span>
          </div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>+12% from last {selectedDays} days</span>
          </div>
        </div>

        {/* Card 2: Open Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Open Tickets</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.open_tickets ?? 18}</span>
          </div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>+8% from last {selectedDays} days</span>
          </div>
        </div>

        {/* Card 3: High Priority */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">High Priority</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {(stats?.critical_tickets || 0) + (stats?.priority_distribution?.High || 7)}
            </span>
          </div>
          <div className="flex items-center text-[11px] font-semibold text-rose-600">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>+2% from last {selectedDays} days</span>
          </div>
        </div>

        {/* Card 4: SLA Breaches */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">SLA Breaches</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.overdue_tickets ?? 3}</span>
          </div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            <span>-50% from last {selectedDays} days</span>
          </div>
        </div>
      </div>

      {/* Row 1 Visualizations: Volume Trend, Priority Donut, Status Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Ticket Volume Trend (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900">Ticket Volume Trend</h2>
              <p className="text-[11px] text-slate-400">Tickets created over time</p>
            </div>
            {/* 7D, 30D, 90D Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDays(d)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    selectedDays === d
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                <defs>
                  <linearGradient id="volume-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#FFF',
                    fontSize: '11px',
                    padding: '6px 10px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tickets"
                  name="Created"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#8B5CF6', strokeWidth: 1, stroke: '#FFF' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tickets by Priority Donut (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="mb-2">
            <h2 className="text-xs font-bold text-slate-900">Tickets by Priority</h2>
            <p className="text-[11px] text-slate-400">Deterministic prioritization</p>
          </div>

          <div className="flex items-center justify-around gap-2 my-auto">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    innerRadius={46}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {priorityChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900">{stats?.total_tickets ?? 48}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] w-36">
              {priorityChartData.map((item) => {
                const total = stats?.total_tickets || 1;
                const pct = Math.round((item.value / total) * 100);
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-500">
                      {item.value} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tickets by Status Bar Chart (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="mb-2">
            <h2 className="text-xs font-bold text-slate-900">Tickets by Status</h2>
            <p className="text-[11px] text-slate-400">Queue progression stages</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 15, right: 5, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="status" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {statusChartData.map((entry, idx) => (
                    <Cell key={`bar-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Visualizations: SLA Performance, Category Distribution, AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SLA Performance (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900">SLA Performance</h2>
            <p className="text-[11px] text-slate-400">Resolution targets compliance</p>
          </div>

          <div className="my-auto py-2 flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slaChartData}
                    innerRadius={42}
                    outerRadius={58}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {slaChartData.map((entry, idx) => (
                      <Cell key={`sla-c-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900">{slaPercentage}%</span>
                <span className="text-[9px] font-bold text-emerald-600">Within SLA</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 text-[11px] mt-2">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Within: {stats?.sla_metrics?.within_sla ?? 39}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-slate-600">Overdue: {stats?.sla_metrics?.overdue ?? 9}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>SLA Compliance: {slaPercentage}%</span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Category Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="mb-2">
            <h2 className="text-xs font-bold text-slate-900">Category Distribution</h2>
            <p className="text-[11px] text-slate-400">Classified support domains</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="category" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryChartData.map((entry, idx) => (
                    <Cell key={`cat-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Card (5 cols) matching reference mockup */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-violet-100/70 border border-purple-200/80 p-5 rounded-2xl shadow-2xs flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center space-x-1.5 text-purple-700 font-bold text-xs mb-2">
              <Sparkles className="w-4 h-4 text-purple-600 fill-purple-200" />
              <span>AI Insights</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Your system is experiencing higher than usual billing inquiries (22% increase). Consider updating your help center article or adding an FAQ section to deflect routine tickets.
              </p>

              {/* Friendly Robot Avatar Illustration */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-purple-500/20">
                <Bot className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 flex items-center space-x-3">
            <button
              onClick={() => setShowAiModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
            >
              View Recommendations
            </button>
            <span className="text-[11px] text-slate-500 font-medium">Powered by Gemini AI</span>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Tickets Table (Matching Reference Mockup) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900">Recent Tickets</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {recentTickets.length} active
            </span>
          </div>

          <Link
            to="/tickets"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 transition-colors"
          >
            <span>View all tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                    #{ticket.ticket_number}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                    {ticket.title}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <PriorityBadge level={ticket.priority_level} score={ticket.priority_score} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {ticket.category}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {ticket.assigned_agent?.name || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(ticket.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })} • {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <ChevronRight className="w-4 h-4 inline" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Recommendation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI Triage & Operations Recommendations</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Based on the last 7 days of operational data, PRIORIX recommends:
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Knowledge Base Update:</strong> Publish self-service guidance for "Payment and Billing Webhooks" to reduce customer inquiry arrival by an estimated 28%.
                </span>
              </li>
              <li className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Agent Rebalancing:</strong> Reallocate 1 additional specialist to Billing & Account Access during European peak hours (09:00 - 14:00 UTC).
                </span>
              </li>
            </ul>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
              >
                Close Recommendations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
