import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { Agent } from '../types';
import { Users, CheckCircle2, XCircle, ArrowRight, Briefcase, Zap, Shield } from 'lucide-react';

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PriorixApi.getAgents();
      setAgents(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load agent workloads.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Support Specialist Workloads</h2>
        <p className="text-xs text-slate-500 mt-1">
          Real-time agent capacity and domain skill coverage used by the transparent dispatch recommendation engine.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading agents...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const activeCount = agent.active_tickets_count || 0;
            const utilization = agent.utilization_percentage || 0;
            const isFull = activeCount >= agent.max_capacity;

            return (
              <div
                key={agent.id}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5"
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {agent.avatar_url ? (
                      <img
                        src={agent.avatar_url}
                        alt={agent.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-navy-800 text-white font-bold flex items-center justify-center text-base">
                        {agent.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{agent.name}</h3>
                      <div className="text-xs text-slate-500">{agent.role}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{agent.email}</div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                      agent.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {agent.is_active ? 'Active' : 'Offline'}
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Active Workload</span>
                    <span
                      className={`font-mono font-bold ${
                        isFull ? 'text-red-600' : 'text-slate-900'
                      }`}
                    >
                      {activeCount} / {agent.max_capacity} tickets ({utilization}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isFull
                          ? 'bg-red-500'
                          : utilization >= 70
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                  </div>
                  {isFull && (
                    <div className="text-[11px] text-red-600 font-semibold">
                      Max capacity reached. Dispatch will de-prioritize new assignments.
                    </div>
                  )}
                </div>

                {/* Domain Skills */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Domain Skills & Specializations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Filter Link */}
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <Link
                    to={`/tickets?agent_id=${agent.id}`}
                    className="inline-flex items-center text-xs font-semibold text-teal-600 hover:text-teal-700"
                  >
                    <span>View Assigned Tickets</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
