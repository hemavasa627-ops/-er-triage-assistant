import React, { useState } from 'react';
import {
  X, AlertTriangle, ShieldAlert, Heart, Activity, Thermometer, Wind,
  CheckCircle2, Clock, FileText, ArrowRight, Check, History, Layers
} from 'lucide-react';
import { Patient } from '../types';
import { PriorityBadge } from './PriorityBadge';

interface PatientDetailsModalProps {
  patient: Patient | null;
  onClose: () => void;
  onUpdateStatus: (patientId: string, newStatus: string, notes?: string) => Promise<void>;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  patient,
  onClose,
  onUpdateStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('Waiting');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    if (patient) {
      setSelectedStatus(patient.workflow_status || 'Waiting');
      setStatusNotes('');
      setUpdateSuccess(false);
    }
  }, [patient]);

  if (!patient) return null;

  const vitals = patient.vitals || {};
  const triage = patient.triage_result;
  const scoreBreakdown = patient.score_breakdown;

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(patient.patient_id, selectedStatus, statusNotes);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              {patient.age}y
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {patient.name}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                  {patient.patient_id}
                </span>
                {patient.is_demo_record && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    SYNTHETIC DEMO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Arrival: {new Date(patient.arrival_time).toLocaleString()} &bull; Queue Position:{' '}
                <strong className="text-slate-800 font-bold">
                  {patient.queue_position ? `#${patient.queue_position}` : 'Completed'}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-sm">
          
          {/* Prominent Educational Warning */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-amber-900 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold uppercase tracking-wider text-amber-800 mr-1">
                Clinical Precedence Warning:
              </strong>
              This decision-support prototype applies demonstrative discrete rules for educational review.
              It is NOT a medical diagnosis. In-person clinical assessment by certified physicians or triage nurses always overrides any automated output.
            </div>
          </div>

          {/* Top Classification Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Provisional Acuity Tier
              </span>
              <PriorityBadge
                level={triage?.priority_level}
                code={triage?.priority_code}
                name={triage?.priority_name}
                className="text-sm py-1.5 px-3"
              />
              <p className="text-xs text-slate-500 mt-2">
                {triage?.priority_name || 'Assigned based on DMGT logical IF/THEN conditions'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Demonstration Severity Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {triage?.severity_score ?? '--'}
                </span>
                <span className="text-xs text-slate-500">/ 100 points</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${Math.min(100, triage?.severity_score || 0)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Normalized physiological deviation (illustrative only)
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Current Workflow State
              </span>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {patient.workflow_status}
              </span>
              <p className="text-[11px] text-slate-400 mt-2">
                Administrative workflow state (not medical clearance)
              </p>
            </div>
          </div>

          {/* Chief Complaint & Symptoms */}
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              Chief Complaint & Clinical Symptoms
            </h4>
            <p className="font-semibold text-slate-900 text-base">
              "{patient.chief_complaint}"
            </p>
            {patient.symptom_duration && (
              <p className="text-xs text-slate-500 mt-1">
                Reported onset duration: <strong className="text-slate-700">{patient.symptom_duration}</strong>
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {patient.symptoms.map((sym, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>

          {/* Vital Signs Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              Physiological Vital Signs (Physical Examination)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* SpO2 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-600" /> SpO2 (Oxygen)
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {vitals.oxygen_saturation !== null && vitals.oxygen_saturation !== undefined
                    ? `${vitals.oxygen_saturation}%`
                    : <span className="text-slate-400 font-normal italic">Not Recorded</span>}
                </p>
                <span className="text-[10px] text-slate-400">Target: &ge; 95%</span>
              </div>

              {/* Heart Rate */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-600" /> Heart Rate
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {vitals.heart_rate !== null && vitals.heart_rate !== undefined
                    ? `${vitals.heart_rate} bpm`
                    : <span className="text-slate-400 font-normal italic">Not Recorded</span>}
                </p>
                <span className="text-[10px] text-slate-400">Target: 60 - 100 bpm</span>
              </div>

              {/* Blood Pressure */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-purple-600" /> Blood Pressure
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {vitals.systolic_bp !== null && vitals.systolic_bp !== undefined
                    ? `${vitals.systolic_bp} / ${vitals.diastolic_bp ?? '--'} mmHg`
                    : <span className="text-slate-400 font-normal italic">Not Recorded</span>}
                </p>
                <span className="text-[10px] text-slate-400">Target: 100-130 / 60-80</span>
              </div>

              {/* Respiratory Rate */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-blue-600" /> Resp. Rate
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {vitals.respiratory_rate !== null && vitals.respiratory_rate !== undefined
                    ? `${vitals.respiratory_rate} /min`
                    : <span className="text-slate-400 font-normal italic">Not Recorded</span>}
                </p>
                <span className="text-[10px] text-slate-400">Target: 12 - 20 bpm</span>
              </div>

              {/* Temperature */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600" /> Temperature
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {vitals.temperature !== null && vitals.temperature !== undefined
                    ? `${vitals.temperature} °C`
                    : <span className="text-slate-400 font-normal italic">Not Recorded</span>}
                </p>
                <span className="text-[10px] text-slate-400">Target: 36.5 - 37.5 °C</span>
              </div>
            </div>
          </div>

          {/* DMGT Logical Rules Triggered */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-600" />
              DMGT Rule Engine Audit (Propositional Logic)
            </h4>
            <div className="space-y-2 mt-2">
              {triage?.rule_reasons && triage.rule_reasons.length > 0 ? (
                triage.rule_reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-medium"
                  >
                    {reason}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No specific emergency rules triggered; default routine assigned.</p>
              )}
            </div>
          </div>

          {/* Missing Information Alerts */}
          {triage?.missing_information && triage.missing_information.length > 0 && (
            <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Missing Physiological Parameters ({triage.missing_information.length})
              </h4>
              <p className="text-xs text-amber-700 mb-2">
                The scoring engine strictly treated these missing values as unverified observations and never assumed them to be normal:
              </p>
              <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                {triage.missing_information.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Status Change & Workflow Controls */}
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Update Patient Workflow State
            </h4>
            <form onSubmit={handleStatusSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {['Waiting', 'Under Review', 'Assessment Completed'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatus(st)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                      selectedStatus === st
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Optional clinical/triage workflow notes..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Assessment Completed removes the patient from active queue while preserving all records in history.
                </span>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {isUpdating ? 'Saving...' : updateSuccess ? 'Updated!' : 'Save Status Change'}
                </button>
              </div>
            </form>
          </div>

          {/* Audit History Timeline */}
          {patient.status_history && patient.status_history.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-teal-600" />
                Status Audit Trail & Timeline
              </h4>
              <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4">
                {patient.status_history.map((hist, idx) => (
                  <div key={idx} className="relative text-xs">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-white" />
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-slate-800">{hist.new_status}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(hist.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    {hist.notes && (
                      <p className="text-slate-600 text-[11px] mt-0.5">{hist.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
