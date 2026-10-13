import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { DatabaseStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Bell,
  Plus,
  Database,
  Sparkles,
  RefreshCw,
  User,
  LogOut,
  LogIn,
  Calendar
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  onScanEscalations?: () => void;
  isScanning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Dashboard',
  onScanEscalations,
  isScanning = false
}) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    PriorixApi.getHealth()
      .then((health) => {
        if (health) {
          setDbStatus(health.database);
        }
      })
      .catch(() => {
        setDbStatus({
          connected: false,
          type: 'disconnected',
          is_supabase_postgres: false,
          description: 'Backend Offline'
        });
      });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tickets?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Search Input Bar (Matching Reference Mockup) */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mr-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets, keywords, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </form>

      {/* Right Controls: Notifications, DB Badge, New Ticket, Profile */}
      <div className="flex items-center space-x-3">
        {/* Database Health Pill */}
        {dbStatus && (
          <div
            className={`hidden md:inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border ${
              dbStatus.is_supabase_postgres
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : dbStatus.connected
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
            title={dbStatus.description}
          >
            <Database className="w-3 h-3 mr-1.5" />
            <span className="font-semibold">
              {dbStatus.is_supabase_postgres ? 'Supabase DB' : dbStatus.connected ? 'Dev DB' : 'Disconnected'}
            </span>
          </div>
        )}

        {/* SLA Escalation Button for Admin */}
        {onScanEscalations && role === 'admin' && (
          <button
            onClick={onScanEscalations}
            disabled={isScanning}
            className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
            title="Scan active tickets against resolution deadlines"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'SLA Scan'}</span>
          </button>
        )}

        {/* New Ticket CTA */}
        <Link
          to="/tickets/new"
          className="inline-flex items-center text-xs font-bold px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-transform active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          <span>Create Ticket</span>
        </Link>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 text-xs z-50 animate-fadeIn">
              <div className="flex items-center justify-between font-bold text-slate-900 pb-2 border-b border-slate-100">
                <span>Notifications</span>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold">2 new</span>
              </div>
              <div className="divide-y divide-slate-100 mt-1">
                <div className="py-2">
                  <div className="font-semibold text-slate-800">SLA Warning: #PRX-1003</div>
                  <div className="text-[11px] text-slate-500">Approaching resolution deadline in 4 hours.</div>
                </div>
                <div className="py-2">
                  <div className="font-semibold text-slate-800">Critical Incident Active</div>
                  <div className="text-[11px] text-slate-500">INC-2026-001 (US-East API Gateway) linked.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Direct Login / Switch Account Link */}
        <Link
          to="/login"
          className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-xl transition-all shadow-2xs"
          title="Go to Login Page / Switch Account"
        >
          <LogIn className="w-3.5 h-3.5 mr-1 text-purple-600" />
          <span>Login</span>
        </Link>

        {/* User Profile Info (Matching Reference Design) */}
        <div className="flex items-center space-x-2.5 pl-2 sm:border-l sm:border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {user?.display_name?.charAt(0) || 'S'}
          </div>
          <div className="hidden sm:block text-left text-xs">
            <div className="font-bold text-slate-800 leading-tight">
              {user?.display_name || (role === 'customer' ? 'Sarah Johnson' : role === 'agent' ? 'Alex Carter' : 'Chief Admin')}
            </div>
            <div className="text-[10px] text-indigo-600 font-semibold capitalize">
              {role}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg ml-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
