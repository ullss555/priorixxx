import React, { useState } from 'react';
import { Ticket, AiSuggestResponseResult } from '../types';
import { PriorixApi } from '../services/api';
import { Sparkles, Copy, Check, AlertCircle, X, RefreshCw, Send } from 'lucide-react';

interface AiSuggestResponseModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AiSuggestResponseModal: React.FC<AiSuggestResponseModalProps> = ({
  ticket,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [result, setResult] = useState<AiSuggestResponseResult | null>(null);
  const [draftText, setDraftText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PriorixApi.aiSuggestResponse(ticket.id, instruction.trim() || undefined);
      setResult(res);
      setDraftText(res.suggested_reply);
    } catch (e: any) {
      setError(e.message || 'Failed to generate AI suggestion.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-lg">
              AI Support Response Draft: {ticket.ticket_number}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Important Human Review Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Human Review Required:</span> All generated replies are AI recommendations. Agents must verify technical facts and adjust tone before sending to the customer.
            </div>
          </div>

          {/* Ticket Context Summary */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <div><span className="font-semibold text-slate-700">Customer:</span> {ticket.customer_name} ({ticket.customer_email})</div>
            <div><span className="font-semibold text-slate-700">Issue:</span> {ticket.title}</div>
            <div><span className="font-semibold text-slate-700">Category:</span> {ticket.category} | <span className="font-semibold text-slate-700">Status:</span> {ticket.status}</div>
          </div>

          {/* Custom Prompt Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Additional Agent Guidance (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Mention engineering is applying hotfix within 2 hours..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Action Button to Generate */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center text-sm font-medium px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Draft...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {result ? 'Regenerate Draft' : 'Generate Suggested Reply'}
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Generated Draft Output Area */}
          {result && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Draft Reply (Editable)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {result.is_ai_generated ? result.model_used : 'Fallback Template'}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-slate-900 px-2 py-1 bg-slate-100 rounded hover:bg-slate-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy Text
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={8}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full text-sm font-sans p-3.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 text-slate-900 leading-relaxed"
              />

              {result.key_points && result.key_points.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700 block mb-1">Key Communication Points Covered:</span>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                    {result.key_points.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            {result?.is_ai_generated ? 'Powered by Google Gemini 1.5' : 'Heuristic Mode'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
