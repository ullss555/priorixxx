import React from 'react';
import { Ticket } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { X, ShieldAlert, Award, AlertTriangle, Clock, Zap } from 'lucide-react';

interface ScoreExplainerModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreExplainerModal: React.FC<ScoreExplainerModalProps> = ({
  ticket,
  isOpen,
  onClose
}) => {
  if (!isOpen || !ticket) return null;

  const isCriticalOverride = ticket.reason_codes.includes('CRITICAL_INCIDENT');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-lg">
              Priority Score Explanation: {ticket.ticket_number}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Score Display */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Authoritative Priority Score
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                {ticket.priority_score.toFixed(1)} <span className="text-sm font-normal text-slate-500">/ 100</span>
              </div>
            </div>
            <PriorityBadge level={ticket.priority_level} score={ticket.priority_score} size="lg" />
          </div>

          {/* Critical Incident Alert Banner if active */}
          {isCriticalOverride && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-800 text-sm">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Critical Incident Override Applied:</span> This ticket is linked to an authorized, rule-verified service outage. It is mathematically elevated to the top of the queue regardless of arrival order.
              </div>
            </div>
          )}

          {/* Mathematical Weight Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Scoring Engine Weight Distribution
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                  <span>Urgency (35%)</span>
                  <span className="font-semibold text-slate-700">{ticket.urgency}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: ticket.urgency === 'Critical' ? '100%' : ticket.urgency === 'High' ? '75%' : ticket.urgency === 'Medium' ? '50%' : '25%'
                    }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                  <span>Impact (30%)</span>
                  <span className="font-semibold text-slate-700">{ticket.impact}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-2 rounded-full"
                    style={{
                      width: ticket.impact === 'Critical' ? '100%' : ticket.impact === 'High' ? '75%' : ticket.impact === 'Medium' ? '50%' : '25%'
                    }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                  <span>Deadline Risk (20%)</span>
                  <span className="font-semibold text-slate-700">
                    {ticket.is_overdue ? 'Overdue' : ticket.is_approaching_deadline ? 'Near' : 'Standard'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${ticket.is_overdue ? 'bg-red-600' : ticket.is_approaching_deadline ? 'bg-amber-500' : 'bg-slate-400'}`}
                    style={{
                      width: ticket.is_overdue ? '100%' : ticket.is_approaching_deadline ? '75%' : '20%'
                    }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                  <span>Waiting Time (15%)</span>
                  <span className="font-semibold text-slate-700">Elapsed</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-2 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Reason Codes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Reason Codes Triggered
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {ticket.reason_codes.map((code) => (
                <span
                  key={code}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-slate-100 text-slate-800 border border-slate-300"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>

          {/* Full Text Explanation */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed font-mono">
            {ticket.priority_explanation}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
