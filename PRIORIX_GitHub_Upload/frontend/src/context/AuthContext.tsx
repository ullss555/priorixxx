import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { PriorixApi } from '../services/api';
import { supabase, isSupabaseConfigured, supabaseSignIn, supabaseSignOut } from '../services/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<UserProfile>;
  signInDemo: (role: UserRole) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'priorix_auth_token';
const USER_STORAGE_KEY = 'priorix_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.role || 'customer';
      }
    } catch {
      // ignore
    }
    return (localStorage.getItem('priorix_demo_role') as UserRole) || 'customer';
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Validate stored session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (savedToken) {
        try {
          PriorixApi.setAuthToken(savedToken);
          const profile = await PriorixApi.getMe();
          if (profile) {
            setUser(profile);
            setRoleState(profile.role);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
          } else {
            // Token expired or invalid
            handleClearSession();
          }
        } catch (err) {
          console.warn('Session verification failed, resetting auth state:', err);
          handleClearSession();
        }
      } else {
        handleClearSession();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleClearSession = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    PriorixApi.setAuthToken(null);
    setUser(null);
  };

  const setRole = (newRole: UserRole) => {
    localStorage.setItem('priorix_demo_role', newRole);
    setRoleState(newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const signIn = async (email: string, password?: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      // 1. If Supabase is fully configured with production keys, attempt Supabase Auth
      if (isSupabaseConfigured() && password) {
        try {
          const { data, error } = await supabaseSignIn(email, password);
          if (error) {
            throw new Error(error.message);
          }
          if (data.session?.access_token) {
            PriorixApi.setAuthToken(data.session.access_token);
            localStorage.setItem(TOKEN_STORAGE_KEY, data.session.access_token);
            const profile = await PriorixApi.getMe();
            if (profile) {
              setUser(profile);
              setRoleState(profile.role);
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
              return profile;
            }
          }
        } catch (sbErr: any) {
          console.warn('Supabase auth attempt returned:', sbErr?.message);
          // Fall through to backend login
        }
      }

      // 2. Authenticate against FastAPI backend endpoint
      const pwd = password || 'PriorixDemo2026!';
      const res = await PriorixApi.login({ email, password: pwd });
      if (res && res.access_token && res.user) {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.access_token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        setUser(res.user);
        setRoleState(res.user.role);
        return res.user;
      }

      throw new Error('Authentication failed. No session token returned.');
    } finally {
      setLoading(false);
    }
  };

  const signInDemo = async (targetRole: UserRole): Promise<UserProfile> => {
    setLoading(true);
    try {
      const demoEmail = `${targetRole}@priorix.local`;
      const res = await PriorixApi.login({
        email: demoEmail,
        password: 'PriorixDemo2026!'
      });
      if (res && res.access_token && res.user) {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.access_token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        setUser(res.user);
        setRoleState(res.user.role);
        return res.user;
      }
      throw new Error('Failed to sign in demo persona.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await PriorixApi.logout();
      await supabaseSignOut();
    } catch {
      // ignore
    } finally {
      handleClearSession();
      setLoading(false);
    }
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, loading, signIn, signInDemo, signOut, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
