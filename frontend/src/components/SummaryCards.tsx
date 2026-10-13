import React from 'react';
import { Users, AlertOctagon, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface SummaryCardsProps {
  metrics: DashboardMetrics | null;
  onFilterPriority?: (code: string | null) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics, onFilterPriority }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Patients */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Patients
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
              {metrics ? metrics.total_patients : '--'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span>Active in queue: <strong className="text-slate-800">{metrics?.active_in_queue ?? 0}</strong></span>
          <span className="text-teal-600 font-medium">All recorded</span>
        </div>
      </div>

      {/* 2. High-Priority (Immediate & Emergent: Red & Orange) */}
      <div
        onClick={() => onFilterPriority && onFilterPriority('RED')}
        className="bg-white rounded-xl p-5 border border-red-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              High Priority (L1 / L2)
            </p>
            <h3 className="text-3xl font-extrabold text-red-600 mt-1">
              {metrics ? metrics.high_priority : '--'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-red-600/90 border-t border-red-50 pt-3">
          <span>Red: {metrics?.priority_breakdown.red ?? 0} | Orange: {metrics?.priority_breakdown.orange ?? 0}</span>
          <span className="font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Immediate attention <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* 3. Medium-Priority (Urgent: Yellow) */}
      <div
        onClick={() => onFilterPriority && onFilterPriority('YELLOW')}
        className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Medium Priority (L3)
            </p>
            <h3 className="text-3xl font-extrabold text-amber-600 mt-1">
              {metrics ? metrics.medium_priority : '--'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-amber-700 border-t border-amber-50 pt-3">
          <span>Review target: &le; 60 mins</span>
          <span className="font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Urgent care <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* 4. Low-Priority (Routine: Green) */}
      <div
        onClick={() => onFilterPriority && onFilterPriority('GREEN')}
        className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Low Priority (L4)
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
              {metrics ? metrics.low_priority : '--'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-emerald-700 border-t border-emerald-50 pt-3">
          <span>Standard ambulatory flow</span>
          <span className="font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Non-urgent <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
