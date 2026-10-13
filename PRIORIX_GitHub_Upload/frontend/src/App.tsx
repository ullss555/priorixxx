import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { TicketCreatePage } from './pages/TicketCreatePage';
import { AiTriageChatPage } from './pages/AiTriageChatPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { AgentWorkspacePage } from './pages/AgentWorkspacePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { TicketsPage } from './pages/TicketsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AgentsPage } from './pages/AgentsPage';
import { SettingsPage } from './pages/SettingsPage';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role === 'customer') return <Navigate to="/customer" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/agent" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RootRedirect />} />
            
            {/* 8 Required Application Pages */}
            <Route path="customer" element={<CustomerDashboardPage />} />
            <Route path="my-tickets" element={<MyTicketsPage />} />
            <Route path="tickets/new" element={<TicketCreatePage />} />
            <Route path="triage" element={<AiTriageChatPage />} />
            <Route path="tickets/:id" element={<TicketDetailPage />} />
            <Route
              path="agent"
              element={
                <ProtectedRoute allowedRoles={['agent', 'admin']}>
                  <AgentWorkspacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Additional Operations Support Pages */}
            <Route
              path="tickets"
              element={
                <ProtectedRoute allowedRoles={['agent', 'admin']}>
                  <TicketsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="incidents"
              element={
                <ProtectedRoute allowedRoles={['agent', 'admin']}>
                  <IncidentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="agents"
              element={
                <ProtectedRoute allowedRoles={['agent', 'admin']}>
                  <AgentsPage />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<SettingsPage />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
