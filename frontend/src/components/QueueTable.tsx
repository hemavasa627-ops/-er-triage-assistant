import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, Eye, Clock, Activity, AlertCircle, ChevronRight, User } from 'lucide-react';
import { QueueItem } from '../types';
import { PriorityBadge } from './PriorityBadge';

interface QueueTableProps {
  queue: QueueItem[];
  loading: boolean;
  onSelectPatient: (patientId: string) => void;
  onUpdateStatus?: (patientId: string, status: string) => void;
  title?: string;
  showFilters?: boolean;
}

export const QueueTable: React.FC<QueueTableProps> = ({
  queue,
  loading,
  onSelectPatient,
  onUpdateStatus,
  title = 'Active Emergency Priority Queue',
  showFilters = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Format arrival time and compute relative elapsed wait
  const formatWaitTime = (isoTime: string) => {
    try {
      const arrival = new Date(isoTime);
      const now = new Date();
      const diffMs = now.getTime() - arrival.getTime();
      const diffMins = Math.max(0, Math.floor(diffMs / 60000));
      if (diffMins < 60) {
        return `${diffMins}m wait`;
      }
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m wait`;
    } catch {
      return 'Recent';
    }
  };

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.symptoms.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPriority =
      priorityFilter === 'ALL' || item.priority_code.toUpperCase() === priorityFilter.toUpperCase();

    const matchesStatus =
      statusFilter === 'ALL' || item.workflow_status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {title}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                {queue.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked in real time via ADSA Binary Min-Heap (Deterministic Acuity Level &gt; Earlier Arrival Time)
            </p>
          </div>

          {/* Quick Search and Filter Bar */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search patient, ID, symptom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-all"
                />
              </div>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
              >
                <option value="ALL">All Priorities</option>
                <option value="RED">Level 1 - Red (Immediate)</option>
                <option value="ORANGE">Level 2 - Orange (Emergent)</option>
                <option value="YELLOW">Level 3 - Yellow (Urgent)</option>
                <option value="GREEN">Level 4 - Green (Routine)</option>
              </select>

              {/* Workflow Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="Waiting">Waiting</option>
                <option value="Under Review">Under Review</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600 tracking-wider">
              <th className="py-3 px-4 text-center w-16">Pos</th>
              <th className="py-3 px-4">Patient ID & Name</th>
              <th className="py-3 px-3 text-center">Age</th>
              <th className="py-3 px-4">Chief Complaint & Symptoms</th>
              <th className="py-3 px-4">Demonstration Priority</th>
              <th className="py-3 px-3 text-center">Demo Score</th>
              <th className="py-3 px-4">Arrival & Wait</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Activity className="w-6 h-6 text-teal-600 animate-spin" />
                    <span>Evaluating queue order with ADSA Min-Heap...</span>
                  </div>
                </td>
              </tr>
            ) : filteredQueue.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                    <p className="font-semibold text-slate-700">No patients found</p>
                    <p className="text-xs text-slate-400">
                      No matching records match the selected search or filter criteria. Click "Load Demo Patients" above to populate realistic cases.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredQueue.map((patient) => {
                const isHighPriority = patient.priority_code === 'RED';
                return (
                  <tr
                    key={patient.patient_id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isHighPriority ? 'bg-red-50/20' : ''
                    }`}
                  >
                    {/* 1. Queue Position */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          patient.queue_position === 1
                            ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-200'
                            : patient.queue_position <= 3
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {patient.queue_position}
                      </span>
                    </td>

                    {/* 2. Patient ID & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{patient.name}</span>
                            {patient.is_demo_record && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                DEMO
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-500">
                            {patient.patient_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Age */}
                    <td className="py-3.5 px-3 text-center text-slate-700 font-medium">
                      {patient.age}y
                    </td>

                    {/* 4. Chief Complaint & Symptoms */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-slate-800 line-clamp-1 text-xs sm:text-sm">
                        {patient.chief_complaint}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patient.symptoms.slice(0, 3).map((sym, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {sym}
                          </span>
                        ))}
                        {patient.symptoms.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{patient.symptoms.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Priority Level */}
                    <td className="py-3.5 px-4">
                      <PriorityBadge
                        level={patient.priority_level}
                        code={patient.priority_code}
                        name={patient.priority_name}
                      />
                    </td>

                    {/* 6. Severity Score */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-bold text-slate-800 text-sm">
                          {patient.severity_score}
                          <span className="text-[10px] text-slate-400 font-normal">/100</span>
                        </span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              patient.severity_score >= 80
                                ? 'bg-red-500'
                                : patient.severity_score >= 50
                                ? 'bg-orange-500'
                                : patient.severity_score >= 25
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, patient.severity_score)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 7. Arrival & Wait Time */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="text-slate-800 font-medium">
                          {new Date(patient.arrival_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatWaitTime(patient.arrival_time)}</span>
                        </div>
                      </div>
                    </td>

                    {/* 8. Workflow Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
                          patient.workflow_status === 'Under Review'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {patient.workflow_status}
                      </span>
                    </td>

                    {/* 9. Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectPatient(patient.patient_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
