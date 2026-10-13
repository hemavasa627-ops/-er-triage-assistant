import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { Activity, ShieldAlert, Sparkles, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';
import { DashboardMetrics, QueueItem } from '../types';
import { SummaryCards } from '../components/SummaryCards';
import { QueueTable } from '../components/QueueTable';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  queue: QueueItem[];
  loading: boolean;
  onSelectPatient: (patientId: string) => void;
  onNavigateToRegister: () => void;
  onFilterPriority?: (code: string | null) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  queue,
  loading,
  onSelectPatient,
  onNavigateToRegister,
  onFilterPriority,
}) => {
  const chartData = metrics?.distribution || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/30 text-teal-200 border border-teal-400/30 mb-2">
              <Activity className="w-3.5 h-3.5" /> Emergency Decision Support
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hospital Emergency Room Triage Command
            </h1>
            <p className="text-sm text-teal-100/90 mt-1 leading-relaxed">
              Real-time patient acuity ranking powered by DMGT propositional logic and ADSA Min-Heap priority queue algorithms.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToRegister}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-teal-50 active:scale-95 transition-all shadow-md flex items-center gap-2 shrink-0"
            >
              <span>+ Register New Patient</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards metrics={metrics} onFilterPriority={onFilterPriority} />

      {/* Analytics & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Acuity Distribution Chart (Recharts) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Acuity Tier Distribution
              </h3>
              <p className="text-xs text-slate-500">Breakdown across all active & history records</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {metrics?.total_patients ?? 0} Total
            </span>
          </div>

          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val: any, name: any) => [`${val} Patients`, name]}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-slate-100 text-xs">
            {chartData.map((d) => (
              <div key={d.code} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600 truncate">{d.name.split(' - ')[0]}:</span>
                <strong className="text-slate-900">{d.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Pipeline Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Department Workflow Pipeline
              </h3>
              <p className="text-xs text-slate-500">Live operational department state</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 my-auto py-3">
            {/* Waiting */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Waiting in Queue
                </span>
                <span className="text-slate-900 font-bold">
                  {metrics?.status_breakdown.waiting ?? 0}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      metrics?.total_patients
                        ? ((metrics.status_breakdown.waiting / metrics.total_patients) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Under Review */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Under Clinical Review
                </span>
                <span className="text-slate-900 font-bold">
                  {metrics?.status_breakdown.under_review ?? 0}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      metrics?.total_patients
                        ? ((metrics.status_breakdown.under_review / metrics.total_patients) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Assessment Completed */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Assessment Completed
                </span>
                <span className="text-slate-900 font-bold">
                  {metrics?.status_breakdown.completed ?? 0}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      metrics?.total_patients
                        ? ((metrics.status_breakdown.completed / metrics.total_patients) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Active patients in ADSA Heap:</span>
            <strong className="text-teal-700 font-bold">{metrics?.active_in_queue ?? 0}</strong>
          </div>
        </div>

        {/* Algorithm Principles Card */}
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Prioritization Logic</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Deterministic Queue Order
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Patients are ordered via a <strong>Binary Min-Heap</strong> with a compound comparison tuple:
            </p>
            <div className="mt-3 bg-slate-800/80 rounded-lg p-3 font-mono text-[11px] text-teal-300 border border-slate-700 space-y-1">
              <div>1. Priority Level (1 &lt; 2 &lt; 3 &lt; 4)</div>
              <div>2. Deterministic Tie-Break: Earlier Arrival Time</div>
              <div>3. Patient ID Lexicographical Order</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Time Complexity: Insertion <strong>O(log N)</strong>, Peek <strong>O(1)</strong>, Removal <strong>O(log N)</strong>
          </div>
        </div>

      </div>

      {/* Main Patient Queue Table */}
      <QueueTable
        queue={queue}
        loading={loading}
        onSelectPatient={onSelectPatient}
      />
    </div>
  );
};
