import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { PriorixLogo } from './PriorixLogo';
import {
  LayoutDashboard,
  Inbox,
  PlusCircle,
  Sparkles,
  Layers,
  BarChart3,
  BookOpen,
  RotateCcw,
  Zap,
  LogOut,
  LogIn,
  ChevronUp,
  UserCheck,
  Headphones,
  ShieldAlert,
  User
} from 'lucide-react';

interface SidebarProps {
  onResetDemo?: () => void;
  isResetting?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onResetDemo, isResetting = false }) => {
  const { role, setRole, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Exact navigation items from the reference design
  const navItems = [
    {
      to: role === 'customer' ? '/customer' : '/admin',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      to: '/my-tickets',
      label: 'My Tickets',
      icon: <Inbox className="w-4 h-4" />
    },
    {
      to: '/tickets/new',
      label: 'Create Ticket',
      icon: <PlusCircle className="w-4 h-4" />
    },
    {
      to: '/triage',
      label: 'AI Chat Triage',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />
    },
    {
      to: '/tickets',
      label: 'All Tickets',
      icon: <Layers className="w-4 h-4" />
    },
    {
      to: '/admin',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      to: '/settings',
      label: 'Knowledge Base',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      to: '/login',
      label: 'Login / Sign In',
      icon: <LogIn className="w-4 h-4 text-purple-400" />
    }
  ];

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setShowUserMenu(false);
    if (newRole === 'customer') {
      navigate('/customer');
    } else if (newRole === 'admin') {
      navigate('/admin');
    } else {
      navigate('/agent');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <PriorixLogo size="sm" showTagline={true} inverted={true} />
      </div>

      {/* Main Navigation Links matching reference mockup */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Area with Evaluator Reset & User Profile Pill */}
      <div className="p-3 border-t border-slate-800 space-y-3 bg-slate-950/40 relative">
        {/* Reset Demo Data Button */}
        {onResetDemo && (
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-[11px] font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700/60 transition-colors disabled:opacity-50"
            title="Reset database to seed records"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting Data...' : 'Reset Demo Data'}</span>
          </button>
        )}

        {/* User Profile Pill at Bottom (Matching Reference Design) */}
        <div className="relative">
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl text-xs space-y-1 z-50 animate-fadeIn">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Switch Role / Persona
              </div>
              <button
                onClick={() => handleRoleChange('customer')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  role === 'customer' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Customer (Sarah Johnson)</span>
                </div>
              </button>
              <button
                onClick={() => handleRoleChange('agent')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  role === 'agent' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Agent (Alex Carter)</span>
                </div>
              </button>
              <button
                onClick={() => handleRoleChange('admin')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  role === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin (Chief Admin)</span>
                </div>
              </button>

              <div className="pt-1 mt-1 border-t border-slate-700 space-y-0.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/login');
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-purple-300 hover:bg-slate-700 text-left transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-purple-400" />
                  <span>Go to Login Screen</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-left transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all text-left group"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-xs">
                {user?.display_name?.charAt(0) || 'S'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white leading-tight truncate">
                  {user?.display_name || (role === 'customer' ? 'Sarah Johnson' : role === 'agent' ? 'Alex Carter' : 'Chief Admin')}
                </div>
                <div className="text-[10px] text-indigo-300 font-medium capitalize">
                  {role}
                </div>
              </div>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-slate-400 transition-transform ${
                showUserMenu ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
};
