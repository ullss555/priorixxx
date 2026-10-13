import React, { useEffect, useState } from 'react';
import { PriorixApi } from '../services/api';
import { DatabaseStatus } from '../types';
import {
  Zap,
  ShieldAlert,
  Database,
  Sparkles,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Terminal,
  Sliders
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [aiStatus, setAiStatus] = useState<any>(null);

  useEffect(() => {
    PriorixApi.getHealth().then((h) => {
      if (h) {
        setDbStatus(h.database);
        setAiStatus(h.ai);
      }
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Architecture & Rules</h2>
        <p className="text-xs text-slate-500 mt-1">
          Authoritative scoring parameters, database status, AI configuration, and hackathon demo instructions.
        </p>
      </div>

      {/* 1. Authoritative Prioritization Engine */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-base">
            Authoritative Priority Scoring Engine (0–100 Scale)
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          PRIORIX calculates a deterministic score in Python based on 4 normalized factors.
          Unlike arrival order queues, verified critical service incidents rise immediately to the top.
        </p>

        {/* Weights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 text-sm">Urgency Factor: 35%</div>
            <p className="text-slate-500 mt-1 text-[11px]">
              Customer operational urgency normalized: Low (25%), Med (50%), High (75%), Crit (100%).
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 text-sm">Impact Factor: 30%</div>
            <p className="text-slate-500 mt-1 text-[11px]">
              Customer business blast radius: Single user to company-wide financial impact.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 text-sm">Deadline Risk: 20%</div>
            <p className="text-slate-500 mt-1 text-[11px]">
              Overdue tickets get 1.0 (100%). Near SLA (&lt;12h) gets 0.65–0.95. Resolved tickets get 0.0.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 text-sm">Waiting Time: 15%</div>
            <p className="text-slate-500 mt-1 text-[11px]">
              Gradual linear penalty scaling with ticket age (&gt;24h=0.6, &gt;48h=0.8, &gt;72h=1.0).
            </p>
          </div>
        </div>

        {/* Reason Codes Table */}
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Deterministic Reason Codes
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Condition</th>
                  <th className="py-2 px-3">Operational Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-red-600">CRITICAL_INCIDENT</td>
                  <td className="py-2 px-3">Linked to an authorized verified outage</td>
                  <td className="py-2 px-3 font-semibold text-red-700">Overrides queue: Score elevated to ≥98.0</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-amber-700">DEADLINE_OVERDUE</td>
                  <td className="py-2 px-3">Current time exceeds resolution target and unresolved</td>
                  <td className="py-2 px-3">Escalates ticket to maximum deadline risk factor</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-amber-600">DEADLINE_NEAR</td>
                  <td className="py-2 px-3">Less than 24 hours remaining to SLA target</td>
                  <td className="py-2 px-3">Elevates urgency to prevent SLA breach</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-slate-800">HIGH_IMPACT</td>
                  <td className="py-2 px-3">Customer impact evaluated as High or Critical</td>
                  <td className="py-2 px-3">Significant boost to base priority score</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-bold text-slate-800">LONG_WAIT</td>
                  <td className="py-2 px-3">Ticket open for more than 24 hours</td>
                  <td className="py-2 px-3">Prevents queue starvation of non-critical tickets</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Database & Persistence Architecture */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-base">Database Configuration</h3>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Active Storage Engine:</span>
            <span className="font-mono font-bold text-slate-900">
              {dbStatus?.is_supabase_postgres ? 'Supabase PostgreSQL' : 'Local SQLite Fallback'}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {dbStatus?.description}
          </p>
          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200">
            To connect your live Supabase database, set <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres</code> in <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">backend/.env</code> and apply the schema migrations from <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">backend/sql/01_schema.sql</code>.
          </div>
        </div>
      </div>

      {/* 3. Google Gemini AI Status */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-base">Google Gemini AI Integration</h3>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Gemini Status:</span>
            <span className={`font-semibold ${aiStatus?.gemini_configured ? 'text-teal-700' : 'text-slate-600'}`}>
              {aiStatus?.gemini_configured ? 'Active (Gemini 1.5 Flash)' : 'Fallback Mode (Rule-based heuristics)'}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            All AI operations run server-side through FastAPI. If <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">GEMINI_API_KEY</code> is unset or the API times out, PRIORIX continues normal operations using rule-based heuristics without disruption.
          </p>
        </div>
      </div>

      {/* 4. Hackathon Demonstration Flow */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-base">
            Repeatable Hackathon Demonstration Script (Section 16)
          </h3>
        </div>

        <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2.5 leading-relaxed pl-1">
          <li>
            <span className="font-semibold text-slate-900">Open Dashboard:</span> View live metrics (Active queue, critical counts, overdue alerts, agent workloads).
          </li>
          <li>
            <span className="font-semibold text-slate-900">Create a Routine Ticket:</span> Click "+ Create Ticket" and enter a low-urgency question (e.g. quarterly CSV export). Notice its low score (~23).
          </li>
          <li>
            <span className="font-semibold text-slate-900">Create Critical Incident:</span> Go to "Critical Incidents", declare a verified service outage (e.g. API Gateway 502 Bad Gateway).
          </li>
          <li>
            <span className="font-semibold text-slate-900">Verify Outranking:</span> Notice customer tickets linked to this incident rise directly to the top of the queue with score ≥98, regardless of arrival order!
          </li>
          <li>
            <span className="font-semibold text-slate-900">Explain the Priority Score:</span> Click on the Priority badge to open the Explainer Modal showing the mathematical breakdown of weights.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Inspect Deadlines:</span> Notice ticket PRX-1002 marked as OVERDUE and PRX-1003 approaching deadline within 4 hours.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Duplicate Correlation:</span> Link multiple customer reports to one incident without deleting or merging individual customer records.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Agent Dispatch:</span> View agent recommendations ranked by skills match and current capacity.
          </li>
          <li>
            <span className="font-semibold text-slate-900">AI Response Assistant:</span> Draft customer replies with human-in-the-loop verification.
          </li>
          <li>
            <span className="font-semibold text-slate-900">Reset Demo:</span> Click "Reset Demo Dataset" in the sidebar anytime to reload the benchmark dataset.
          </li>
        </ol>
      </div>
    </div>
  );
};
