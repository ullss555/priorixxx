import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { CATEGORIES, TicketUrgency, TicketImpact } from '../types';
import {
  Sparkles,
  Send,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  Zap
} from 'lucide-react';

export const TicketCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Technical Issue');
  const [urgency, setUrgency] = useState<TicketUrgency>('Medium');
  const [impact, setImpact] = useState<TicketImpact>('Medium');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deadlineHours, setDeadlineHours] = useState('24');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [modelUsed, setModelUsed] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Approximate client-side preview of priority score based on formula
  const getEstimatedScore = () => {
    const scale: Record<string, number> = { Low: 25, Medium: 50, High: 75, Critical: 100 };
    const u = (scale[urgency] / 100) * 35;
    const imp = (scale[impact] / 100) * 30;
    const hours = parseInt(deadlineHours) || 24;
    const dRisk = hours <= 2 ? 0.95 : hours <= 6 ? 0.8 : hours <= 12 ? 0.65 : hours <= 24 ? 0.5 : 0.35;
    const d = dRisk * 20;
    const w = 0.05 * 15; // fresh ticket
    return Math.round(u + imp + d + w);
  };

  const handleAiAnalyze = async () => {
    if (!title.trim() && !description.trim()) {
      setError('Please provide at least a title or description for AI analysis.');
      return;
    }
    try {
      setAiLoading(true);
      setError(null);
      const res = await PriorixApi.aiCategorize(title, description);
      setCategory(res.category);
      setUrgency(res.suggested_urgency);
      setImpact(res.suggested_impact);
      setAiRationale(res.rationale);
      setIsAiGenerated(res.is_ai_generated);
      setModelUsed(res.model_used);
    } catch (e: any) {
      setError(e.message || 'AI analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !customerName.trim() || !customerEmail.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const deadline = new Date(Date.now() + (parseInt(deadlineHours) || 24) * 60 * 60 * 1000).toISOString();

      const created = await PriorixApi.createTicket({
        title,
        description,
        category,
        customer_name: customerName,
        customer_email: customerEmail,
        urgency,
        impact,
        deadline,
      });

      navigate(`/tickets/${created.id}`);
    } catch (e: any) {
      setError(e.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedScore = getEstimatedScore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Log New Support Ticket</h2>
            <p className="text-xs text-slate-500">
              Submit customer issues with automatic AI triage and deterministic priority scoring.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Customer Name / Reference *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Sarah Jenkins (Acme Corp)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Customer Email *
              </label>
              <input
                type="email"
                required
                placeholder="sarah.jenkins@acme.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Issue Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Ticket Title / Summary *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., European Checkout API returning 502 Bad Gateway"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Full Customer Problem Description *
                </label>
                {/* AI Assist Action */}
                <button
                  type="button"
                  onClick={handleAiAnalyze}
                  disabled={aiLoading}
                  className="inline-flex items-center text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 mr-1.5 text-teal-600 ${aiLoading ? 'animate-spin' : ''}`} />
                  {aiLoading ? 'Analyzing with AI...' : 'Analyze with AI Triage'}
                </button>
              </div>
              <textarea
                required
                rows={5}
                placeholder="Paste customer report, logs, or error details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* AI Suggestion Feedback Box if triggered */}
          {aiRationale && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>AI Triaging Suggestion Applied</span>
                </span>
                <span className="text-[11px] font-mono opacity-80">
                  {isAiGenerated ? `Google ${modelUsed}` : 'Heuristic Mode'}
                </span>
              </div>
              <p className="text-xs text-teal-800 leading-relaxed">{aiRationale}</p>
            </div>
          )}

          {/* Category, Urgency, Impact, Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Urgency (35%)
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as TicketUrgency)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Impact (30%)
              </label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as TicketImpact)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                SLA Resolution Window
              </label>
              <select
                value={deadlineHours}
                onChange={(e) => setDeadlineHours(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white"
              >
                <option value="4">4 Hours (Urgent)</option>
                <option value="12">12 Hours (High)</option>
                <option value="24">24 Hours (Standard)</option>
                <option value="48">48 Hours (Extended)</option>
                <option value="72">72 Hours (Routine)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Priority Projection Banner */}
        <div className="bg-slate-900 text-white p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span>Projected Priority Score (Deterministic Formula)</span>
            </div>
            <div className="text-xs text-slate-300">
              Weighted calculation: Urgency (35%) + Impact (30%) + Deadline Risk (20%) + Age (15%)
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-teal-400">
                ~{estimatedScore} <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                {estimatedScore >= 85 ? 'Critical' : estimatedScore >= 65 ? 'High' : estimatedScore >= 40 ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting & Evaluating...' : 'Submit Ticket to Queue'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
