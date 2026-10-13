import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Inbox,
  Plus,
  BarChart3,
  User,
  LogIn
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { role } = useAuth();
  const homePath = role === 'customer' ? '/customer' : '/admin';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-4 py-2 shadow-lg flex items-center justify-around">
      {/* Home */}
      <NavLink
        to={homePath}
        className={({ isActive }) =>
          `flex flex-col items-center text-[10px] font-bold ${
            isActive ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
          }`
        }
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </NavLink>

      {/* Tickets */}
      <NavLink
        to="/my-tickets"
        className={({ isActive }) =>
          `flex flex-col items-center text-[10px] font-bold ${
            isActive ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
          }`
        }
      >
        <Inbox className="w-5 h-5 mb-0.5" />
        <span>Tickets</span>
      </NavLink>

      {/* Elevated Create Button in Center */}
      <NavLink
        to="/tickets/new"
        className="flex items-center justify-center -mt-5 w-11 h-11 rounded-full bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-transform active:scale-90"
      >
        <Plus className="w-6 h-6" />
      </NavLink>

      {/* Analytics */}
      <NavLink
        to="/admin"
        className={({ isActive }) =>
          `flex flex-col items-center text-[10px] font-bold ${
            isActive ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
          }`
        }
      >
        <BarChart3 className="w-5 h-5 mb-0.5" />
        <span>Analytics</span>
      </NavLink>

      {/* Login */}
      <NavLink
        to="/login"
        className={({ isActive }) =>
          `flex flex-col items-center text-[10px] font-bold ${
            isActive ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
          }`
        }
      >
        <LogIn className="w-5 h-5 mb-0.5" />
        <span>Login</span>
      </NavLink>
    </div>
  );
};
