import React from 'react';
import { AlertOctagon, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface PriorityBadgeProps {
  level?: number;
  code?: string;
  name?: string;
  showIcon?: boolean;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  level,
  code,
  name,
  showIcon = true,
  className = '',
}) => {
  const normCode = (code || '').toUpperCase();
  const effLevel = level || (normCode === 'RED' ? 1 : normCode === 'ORANGE' ? 2 : normCode === 'YELLOW' ? 3 : 4);

  if (effLevel === 1 || normCode === 'RED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 shadow-sm ${className}`}
        title="Level 1 - Immediate / Resuscitation"
      >
        {showIcon && <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0 animate-pulse" />}
        <span>Level 1 (Red) - Immediate</span>
      </span>
    );
  }

  if (effLevel === 2 || normCode === 'ORANGE') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300 shadow-sm ${className}`}
        title="Level 2 - Emergent / Very Urgent"
      >
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
        <span>Level 2 (Orange) - Emergent</span>
      </span>
    );
  }

  if (effLevel === 3 || normCode === 'YELLOW') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm ${className}`}
        title="Level 3 - Urgent"
      >
        {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
        <span>Level 3 (Yellow) - Urgent</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm ${className}`}
      title="Level 4 - Routine / Less Urgent"
    >
      {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
      <span>Level 4 (Green) - Routine</span>
    </span>
  );
};
