import React from 'react';
import { Users, AlertTriangle, Layers, Clock, ShieldAlert, Cpu } from 'lucide-react';
import { QueueItem } from '../types';
import { QueueTable } from '../components/QueueTable';

interface QueueViewProps {
  queue: QueueItem[];
  loading: boolean;
  onSelectPatient: (patientId: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ queue, loading, onSelectPatient }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Live Emergency Patient Queue
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Dynamically maintained via in-memory <strong>Binary Min-Heap</strong> Priority Queue. Immediate resuscitative cases (Level 1 Red) are placed at the root of the heap regardless of arrival order.
        </p>
      </div>

      {/* ADSA Educational Explainer Card */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 rounded-2xl p-6 text-white border border-teal-900/50 shadow-md">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Cpu className="w-4 h-4" />
          <span>ADSA Computer Science Implementation Note</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
          <div>
            <h4 className="text-sm font-bold text-white">Min-Heap Invariant</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Every parent node at index <code>i</code> satisfies <code>heap[i] &le; heap[2i+1]</code> and <code>heap[i] &le; heap[2i+2]</code>. The highest urgency patient is always available at <code>heap[0]</code> in <strong>O(1)</strong> time.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Deterministic Tie-Breaking</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              When two patients share an identical acuity level, the comparator falls back to <strong>arrival timestamp</strong> (FIFO). Equal urgency patients who arrived earlier receive priority.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Hash Inverted Index</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              An auxiliary position map <code>id &rarr; heap_index</code> allows instantaneous <strong>O(1)</strong> position lookup and <strong>O(log N)</strong> heap priority updates or removals upon review.
            </p>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <QueueTable
        queue={queue}
        loading={loading}
        onSelectPatient={onSelectPatient}
        title="Active Prioritized Queue"
        showFilters={true}
      />
    </div>
  );
};
