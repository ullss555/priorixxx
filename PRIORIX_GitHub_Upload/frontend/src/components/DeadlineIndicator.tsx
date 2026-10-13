import React from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DeadlineIndicatorProps {
  deadline?: string | null;
  status: string;
  isOverdue?: boolean;
  isApproaching?: boolean;
}

export const DeadlineIndicator: React.FC<DeadlineIndicatorProps> = ({
  deadline,
  status,
  isOverdue = false,
  isApproaching = false
}) => {
  if (!deadline) {
    return (
      <span className="inline-flex items-center text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5 mr-1 opacity-70" />
        No deadline set
      </span>
    );
  }

  const isCompleted = ['Resolved', 'Closed'].includes(status);
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (isCompleted) {
    return (
      <span className="inline-flex items-center text-xs text-slate-500 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
        Resolved (Deadline was {deadlineDate.toLocaleDateString()})
      </span>
    );
  }

  if (isOverdue || diffHours < 0) {
    const overdueHours = Math.abs(diffHours);
    return (
      <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
        <AlertCircle className="w-3.5 h-3.5 mr-1 text-red-600 animate-pulse" />
        OVERDUE by {overdueHours >= 24 ? `${Math.floor(overdueHours / 24)}d ${overdueHours % 24}h` : `${overdueHours}h`}
      </span>
    );
  }

  if (isApproaching || diffHours <= 24) {
    return (
      <span className="inline-flex items-center text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
        Due in {diffHours}h ({deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-xs text-slate-600">
      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
      Due in {Math.round(diffHours / 24)}d ({deadlineDate.toLocaleDateString()})
    </span>
  );
};
