import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-white tracking-wider">PRIORIX</span>
        </div>
        <p className="text-xs text-indigo-300 font-medium">Verifying security session...</p>
      </div>
    );
  }

  // Check user state with localStorage fallback for instantaneous transitions
  let effectiveUser = user;
  if (!effectiveUser) {
    try {
      const stored = localStorage.getItem('priorix_auth_user');
      if (stored) {
        effectiveUser = JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }

  if (!effectiveUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(effectiveUser.role)) {
    const targetPath = effectiveUser.role === 'customer' ? '/customer' : effectiveUser.role === 'admin' ? '/admin' : '/agent';
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};
