import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { Incident, AiRelatedMatch, CATEGORIES, IncidentSeverity, IncidentStatus } from '../types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  AlertOctagon,
  Plus,
  ShieldAlert,
  Link2,
  Unlink,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight
} from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New incident modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Service Outage');
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>('Critical');
  const [newIsVerifiedCritical, setNewIsVerifiedCritical] = useState(true);
  const [creating, setCreating] = useState(false);

  // Suggestion modal state
  const [selectedIncidentForSuggestions, setSelectedIncidentForSuggestions] = useState<Incident | null>(null);
  const [suggestedTickets, setSuggestedTickets] = useState<AiRelatedMatch[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PriorixApi.getIncidents();
      setIncidents(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load incidents.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    try {
      setCreating(true);
      await PriorixApi.createIncident({
        title: newTitle,
        description: newDescription,
        category: newCategory,
        severity: newSeverity,
        status: 'Investigating',
        is_verified_critical: newIsVerifiedCritical,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setActionSuccess('Incident registered successfully. Overrides active for linked tickets.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadIncidents();
    } catch (e: any) {
      setError(e.message || 'Failed to create incident.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenSuggestions = async (inc: Incident) => {
    try {
      setSelectedIncidentForSuggestions(inc);
      setLoadingSuggestions(true);
      const matches = await PriorixApi.getIncidentSuggestedTickets(inc.id);
      setSuggestedTickets(matches);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch candidate tickets.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleLinkTicket = async (incidentId: string, ticketId: string) => {
    try {
      await PriorixApi.linkTicketToIncident(incidentId, ticketId);
      setActionSuccess('Customer ticket linked to incident. Priority recalculated.');
      setTimeout(() => setActionSuccess(null), 3000);
      // Remove from suggestions
      setSuggestedTickets((prev) => prev.filter((m) => m.ticket_id !== ticketId));
      loadIncidents();
    } catch (e: any) {
      setError(e.message || 'Failed to link ticket.');
    }
  };

  const handleUnlinkTicket = async (incidentId: string, ticketId: string) => {
    try {
      await PriorixApi.unlinkTicketFromIncident(incidentId, ticketId);
      setActionSuccess('Ticket unlinked. Independent record and history preserved.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadIncidents();
    } catch (e: any) {
      setError(e.message || 'Failed to unlink ticket.');
    }
  };

  const handleToggleVerifiedCritical = async (inc: Incident) => {
    try {
      const updatedVal = !inc.is_verified_critical;
      await PriorixApi.updateIncident(inc.id, { is_verified_critical: updatedVal });
      setActionSuccess(
        `Incident critical verification set to ${updatedVal}. All linked tickets recalculated.`
      );
      setTimeout(() => setActionSuccess(null), 3000);
      loadIncidents();
    } catch (e: any) {
      setError(e.message || 'Failed to update verification.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Incident Management & Duplicate Correlation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Group multiple customer tickets under verified incidents without merging or losing customer records.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center text-sm font-semibold px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Declare Incident
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Incidents List */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading incidents...</div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <AlertOctagon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No active incidents declared.</p>
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              className={`bg-white rounded-xl border shadow-2xs overflow-hidden transition-all ${
                inc.is_verified_critical ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
              }`}
            >
              {/* Incident Header */}
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                      {inc.incident_code}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        inc.severity === 'Critical'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {inc.severity} Severity
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {inc.status}
                    </span>
                    {inc.is_verified_critical && (
                      <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                        <Flame className="w-3.5 h-3.5 mr-1 text-red-600 animate-pulse" />
                        Verified Outage Override Active
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{inc.title}</h3>
                  <p className="text-xs text-slate-600">{inc.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggleVerifiedCritical(inc)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      inc.is_verified_critical
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {inc.is_verified_critical ? 'Revoke Critical Override' : 'Verify as Critical Outage'}
                  </button>

                  <button
                    onClick={() => handleOpenSuggestions(inc)}
                    className="inline-flex items-center text-xs font-semibold px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-600" />
                    <span>Correlate Tickets ({inc.linked_tickets_count})</span>
                  </button>
                </div>
              </div>

              {/* Linked Customer Tickets Table */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Linked Customer Reports ({inc.linked_tickets_count})</span>
                  <span>Preserves Original Customer Records & History</span>
                </div>

                {inc.tickets && inc.tickets.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Ticket</th>
                          <th className="py-2.5 px-3">Priority Score</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Title</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inc.tickets.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              <Link to={`/tickets/${t.id}`} className="hover:text-teal-600 underline">
                                {t.ticket_number}
                              </Link>
                            </td>
                            <td className="py-2.5 px-3">
                              <PriorityBadge level={t.priority_level} score={t.priority_score} size="sm" />
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {t.customer_name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">
                              {t.title}
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusBadge status={t.status} size="sm" />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleUnlinkTicket(inc.id, t.id)}
                                className="inline-flex items-center text-xs text-red-600 hover:text-red-800 font-medium ml-2"
                                title="Unlink ticket without deleting"
                              >
                                <Unlink className="w-3.5 h-3.5 mr-1" />
                                Unlink
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-400">
                    No customer tickets currently linked to this incident. Use 'Correlate Tickets' to match duplicates.
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Declare Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Declare Support Incident</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Incident Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., US-East API Gateway Degradation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description / Technical Assessment *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Details of the underlying problem..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Severity
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as IncidentSeverity)}
                    className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsVerifiedCritical}
                    onChange={(e) => setNewIsVerifiedCritical(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-red-900 block">Verified Critical Service Incident</span>
                    <span className="text-red-700">
                      Authorizes priority engine override: elevated to priority score ≥98 for all linked tickets.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
                >
                  {creating ? 'Registering...' : 'Declare Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suggested Correlation Modal */}
      {selectedIncidentForSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Correlate Customer Reports: {selectedIncidentForSuggestions.incident_code}
                </h3>
                <p className="text-xs text-slate-500">
                  AI analysis detects customer tickets likely reporting this same underlying issue.
                </p>
              </div>
              <button
                onClick={() => setSelectedIncidentForSuggestions(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {loadingSuggestions ? (
                <div className="p-8 text-center text-slate-400">Analyzing open customer reports...</div>
              ) : suggestedTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  No unlinked candidate tickets currently match this incident.
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestedTickets.map((match) => (
                    <div
                      key={match.ticket_id}
                      className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">{match.ticket_number}</span>
                          <span className="font-semibold text-slate-800">{match.title}</span>
                          <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-mono">
                            {(match.similarity_score * 100).toFixed(0)}% Match
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">{match.reason}</p>
                      </div>

                      <button
                        onClick={() => handleLinkTicket(selectedIncidentForSuggestions.id, match.ticket_id)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs whitespace-nowrap"
                      >
                        Confirm Link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedIncidentForSuggestions(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
