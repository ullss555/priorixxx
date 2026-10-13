import React from 'react';
import { PriorityLevel } from '../types';
import { AlertTriangle, AlertCircle, Info, Flame } from 'lucide-react';

interface PriorityBadgeProps {
  level?: PriorityLevel;
  priority?: PriorityLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  level,
  priority,
  score,
  showScore = true,
  size = 'md',
  onClick
}) => {
  const finalLevel = level || priority || 'Medium';

  const getStyles = () => {
    switch (finalLevel) {
      case 'Critical':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-300',
          dot: 'bg-red-500',
          icon: <Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" />
        };
      case 'High':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        };
      case 'Medium':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
          icon: <AlertCircle className="w-3.5 h-3.5 text-sky-600" />
        };
      case 'Low':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: <Info className="w-3.5 h-3.5 text-slate-500" />
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: null
        };
    }
  };

  const styles = getStyles();
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold'
  }[size];

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-full border transition-all ${styles.bg} ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:shadow-sm hover:scale-[1.02]' : ''
      }`}
    >
      {styles.icon}
      <span>{finalLevel}</span>
      {showScore && score !== undefined && (
        <span className="font-mono text-[11px] opacity-80 border-l border-current/20 pl-1.5 ml-0.5">
          {score.toFixed(1)}
        </span>
      )}
    </span>
  );
};
