import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ArrowUpDown, Eye, Clock, AlertCircle, FileText } from 'lucide-react';
import { Patient } from '../types';
import { fetchPatients } from '../api';
import { PriorityBadge } from '../components/PriorityBadge';

interface HistoryViewProps {
  onSelectPatient: (patientId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('arrival');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchPatients({
        search: searchTerm || undefined,
        priority: priorityFilter || undefined,
        status: statusFilter || undefined,
        sort_by: sortBy,
      });
      setPatients(res.patients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, priorityFilter, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Patient Registry & History Archive
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Complete institutional log of all registered demo patients, including currently waiting patients and completed assessments. Records are permanently preserved.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ID, name, complaint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            <option value="">All Priorities</option>
            <option value="RED">Level 1 - Red (Immediate)</option>
            <option value="ORANGE">Level 2 - Orange (Emergent)</option>
            <option value="YELLOW">Level 3 - Yellow (Urgent)</option>
            <option value="GREEN">Level 4 - Green (Routine)</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            <option value="">All Workflow States</option>
            <option value="Waiting">Waiting</option>
            <option value="Under Review">Under Review</option>
            <option value="Assessment Completed">Assessment Completed</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            <option value="arrival">Sort by Arrival Time</option>
            <option value="priority">Sort by Priority Level</option>
            <option value="score">Sort by Severity Score</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600 tracking-wider">
                <th className="py-3 px-4">Patient ID & Name</th>
                <th className="py-3 px-3 text-center">Age</th>
                <th className="py-3 px-4">Chief Complaint</th>
                <th className="py-3 px-4">Triage Priority</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-4">Arrival Timestamp</th>
                <th className="py-3 px-3 text-center">Workflow State</th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading historical registry...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-400" />
                      <p className="font-semibold text-slate-700">No patient records match the filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.patient_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.is_demo_record && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            DEMO
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-500">{p.patient_id}</span>
                    </td>

                    <td className="py-3.5 px-3 text-center text-slate-700 font-medium">
                      {p.age}y
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-slate-800 line-clamp-1 text-xs sm:text-sm">
                        {p.chief_complaint}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.symptoms.slice(0, 2).map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <PriorityBadge
                        level={p.priority_level}
                        code={p.priority_code}
                        name={p.priority_name}
                      />
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {p.severity_score}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {new Date(p.arrival_time).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          p.workflow_status === 'Assessment Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : p.workflow_status === 'Under Review'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {p.workflow_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectPatient(p.patient_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
