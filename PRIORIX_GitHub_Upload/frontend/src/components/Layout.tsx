import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { PriorixApi } from '../services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const Layout: React.FC = () => {
  const location = useLocation();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo dataset to initial benchmark state?')) return;
    try {
      setIsResetting(true);
      await PriorixApi.resetDemoData();
      showNotification('success', 'Benchmark demo dataset successfully reloaded!');
      window.location.reload();
    } catch (e: any) {
      showNotification('error', `Failed to reset demo: ${e.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleEscalationScan = async () => {
    try {
      setIsScanning(true);
      const res = await PriorixApi.triggerSlaEscalate();
      showNotification('success', `Escalation scan completed: ${res?.escalated_count ?? 0} ticket(s) updated.`);
    } catch (e: any) {
      showNotification('error', `Escalation scan failed: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/admin') || path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/customer')) return 'Customer Dashboard';
    if (path === '/tickets/new') return 'Create Support Ticket';
    if (path.startsWith('/tickets/')) return 'Ticket Details';
    if (path.startsWith('/tickets')) return 'All Tickets';
    if (path.startsWith('/my-tickets')) return 'My Support Tickets';
    if (path.startsWith('/triage')) return 'AI Chat Triage';
    if (path.startsWith('/agent')) return 'Support Agent Workspace';
    if (path.startsWith('/incidents')) return 'Critical Incidents & Outages';
    if (path.startsWith('/agents')) return 'Agent Workload & Capacities';
    if (path.startsWith('/settings')) return 'Knowledge Base & Settings';
    return 'Dashboard';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Desktop Sidebar (hidden on mobile, visible on lg) */}
      <div className="hidden lg:block">
        <Sidebar onResetDemo={handleResetDemo} isResetting={isResetting} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getPageTitle()}
          onScanEscalations={handleEscalationScan}
          isScanning={isScanning}
        />

        {/* Global Toast Notification */}
        {notification && (
          <div
            className={`mx-6 sm:mx-8 mt-4 p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs transition-all animate-in slide-in-from-top-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="font-semibold">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto pb-20 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile Navigation Bar at bottom */}
        <MobileNav />
      </div>
    </div>
  );
};
