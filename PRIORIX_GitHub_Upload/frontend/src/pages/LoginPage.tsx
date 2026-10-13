import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { PriorixLogo } from '../components/PriorixLogo';
import {
  Sparkles,
  Clock,
  Heart,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  UserCheck,
  Headphones,
  ShieldAlert,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, signInDemo, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Keep login page accessible for signing in and switching accounts
  // Only redirect if specifically submitted or navigated from a protected link


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const loggedUser = await signIn(email.trim(), password);
      if (loggedUser.role === 'customer') {
        navigate('/customer', { replace: true });
      } else if (loggedUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/agent', { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setErrorMessage(null);
    try {
      setLoading(true);
      const loggedUser = await signInDemo(role);
      if (loggedUser.role === 'customer') {
        navigate('/customer', { replace: true });
      } else if (loggedUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/agent', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate demo persona.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Branding Panel (Matching Reference Mockup Exactly) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B0F19] p-12 flex-col justify-between relative overflow-hidden text-white border-r border-slate-800">
        {/* Abstract Glowing Purple Waves (SVG illustration matching reference image) */}
        <div className="absolute inset-0 pointer-events-none opacity-90 overflow-hidden">
          <svg
            className="absolute -bottom-20 -left-20 w-[800px] h-[550px]"
            viewBox="0 0 800 550"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-50 450 C 200 520, 350 250, 550 400 C 650 475, 780 430, 850 380"
              stroke="url(#wave-grad-1)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
            <path
              d="M-80 470 C 180 540, 330 270, 530 420 C 630 495, 760 450, 830 400"
              stroke="url(#wave-grad-2)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M-30 430 C 220 500, 370 230, 570 380 C 670 455, 800 410, 870 360"
              stroke="url(#wave-grad-3)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
            <defs>
              <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#D946EF" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
                <stop offset="60%" stopColor="#A855F7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#C084FC" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#F472B6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10">
          <PriorixLogo size="md" showTagline={true} inverted={true} />
        </div>

        {/* Center Copy & 3 Circular Feature Badges */}
        <div className="relative z-10 my-auto py-8 max-w-lg space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              AI-Powered Intelligent Support Ticket Prioritization & Management System
            </h1>
          </div>

          <div className="space-y-5">
            {/* Feature 1: Smarter AI Triage */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full border border-indigo-500/30 bg-indigo-950/60 flex items-center justify-center flex-shrink-0 text-indigo-400 shadow-sm shadow-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Smarter AI Triage</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Automatically analyze and prioritize tickets with AI.
                </p>
              </div>
            </div>

            {/* Feature 2: Faster Resolution */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full border border-indigo-500/30 bg-indigo-950/60 flex items-center justify-center flex-shrink-0 text-indigo-400 shadow-sm shadow-indigo-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Faster Resolution</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Get the right tickets to the right people, instantly.
                </p>
              </div>
            </div>

            {/* Feature 3: Better Support */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full border border-indigo-500/30 bg-indigo-950/60 flex items-center justify-center flex-shrink-0 text-indigo-400 shadow-sm shadow-indigo-500/20">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Better Support</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Improve customer satisfaction with intelligent workflows.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 text-[11px] text-slate-500 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} PRIORIX Inc.</span>
          <span>Enterprise Support Engine</span>
        </div>
      </div>

      {/* Right Login Form Panel (Clean White, Matching Reference Mockup) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Header */}
          <div className="lg:hidden mb-6">
            <PriorixLogo size="sm" showTagline={true} inverted={false} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign in to your PRIORIX account
            </p>
          </div>

          {/* Active Session Notice */}
          {isAuthenticated && user && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-indigo-950 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block mr-1" />
                  <span>Signed in as {user.display_name}</span>
                </p>
                <p className="text-[11px] text-indigo-700 capitalize mt-0.5">Role: {user.role}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(user.role === 'customer' ? '/customer' : user.role === 'admin' ? '/admin' : '/agent')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-2xs"
              >
                Dashboard &rarr;
              </button>
            </div>
          )}

          {/* Verified Demo Credentials Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 uppercase tracking-wide">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Demo Accounts (Click to Fill)</span>
              </span>
              <span className="text-[10px] text-purple-600 font-semibold lowercase">password: PriorixDemo2026!</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setEmail('customer@priorix.local');
                  setPassword('PriorixDemo2026!');
                  handleDemoSignIn('customer');
                }}
                className="p-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
                title="Sign in as Customer"
              >
                <div className="font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
                  <span>Customer</span>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-semibold">login &rarr;</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">customer@priorix.local</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('agent@priorix.local');
                  setPassword('PriorixDemo2026!');
                  handleDemoSignIn('agent');
                }}
                className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
                title="Sign in as Agent"
              >
                <div className="font-bold text-slate-800 group-hover:text-indigo-700 flex items-center justify-between">
                  <span>Agent</span>
                  <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-semibold">login &rarr;</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">agent@priorix.local</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('admin@priorix.local');
                  setPassword('PriorixDemo2026!');
                  handleDemoSignIn('admin');
                }}
                className="p-2 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
                title="Sign in as Admin"
              >
                <div className="font-bold text-slate-800 group-hover:text-purple-700 flex items-center justify-between">
                  <span>Admin</span>
                  <span className="text-[9px] text-purple-600 bg-purple-50 px-1 py-0.2 rounded font-semibold">login &rarr;</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">admin@priorix.local</div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            action="javascript:void(0);"
            method="get"
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin / agent / customer or email"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                />
                <span className="text-slate-600 font-medium">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-purple-600 hover:text-purple-700 font-semibold focus:outline-none"
              >
                Forgot password?
              </button>
            </div>

            {/* Forgot password note */}
            {showForgotPassword && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-[11px] space-y-1">
                <p>
                  For the project evaluation, demo accounts use password: <code className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded font-mono font-bold">PriorixDemo2026!</code>
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-purple-700 hover:underline font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Solid Purple Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all transform active:scale-[0.99] focus:outline-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">
                or
              </span>
            </div>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={() => handleDemoSignIn('customer')}
            className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.15C3.25 21.37 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.59l4.02 3.15c.95-2.84 3.6-4.99 6.72-4.99z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick 1-Click Test Personas */}
          <div className="pt-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Presentation Demo Personas
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('customer')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all shadow-2xs group"
              >
                <div className="flex items-center space-x-1.5 text-emerald-600 mb-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Customer</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Sarah Johnson</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('agent')}
                className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all shadow-2xs group"
              >
                <div className="flex items-center space-x-1.5 text-indigo-600 mb-0.5">
                  <Headphones className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Agent</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Alex Carter</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('admin')}
                className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition-all shadow-2xs group"
              >
                <div className="flex items-center space-x-1.5 text-purple-600 mb-0.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Chief Admin</div>
              </button>
            </div>
          </div>

          <div className="text-center pt-1 text-xs text-slate-500">
            Don't have an account?{' '}
            <span className="text-purple-600 font-semibold cursor-pointer hover:underline">
              Contact your administrator
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
