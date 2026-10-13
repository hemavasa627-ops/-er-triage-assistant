import React, { useState } from 'react';
import {
  UserPlus, Sparkles, AlertCircle, ShieldAlert, Heart, Activity,
  Thermometer, Wind, CheckCircle2, Clock, Plus, X, ArrowRight
} from 'lucide-react';
import { extractSymptoms, registerPatient } from '../api';
import { VitalSigns } from '../types';
import { PriorityBadge } from '../components/PriorityBadge';

interface RegisterPatientViewProps {
  onSuccess: (patientId: string) => void;
}

export const RegisterPatientView: React.FC<RegisterPatientViewProps> = ({ onSuccess }) => {
  const [patientId, setPatientId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<number | ''>('');
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [rawSymptomText, setRawSymptomText] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState<string>('');
  const [symptomDuration, setSymptomDuration] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionNote, setExtractionNote] = useState<string | null>(null);

  // Vital Signs
  const [temperature, setTemperature] = useState<string>('');
  const [heartRate, setHeartRate] = useState<string>('');
  const [respiratoryRate, setRespiratoryRate] = useState<string>('');
  const [systolicBp, setSystolicBp] = useState<string>('');
  const [diastolicBp, setDiastolicBp] = useState<string>('');
  const [oxygenSaturation, setOxygenSaturation] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle AI / Heuristic Symptom Extraction
  const handleExtract = async () => {
    if (!rawSymptomText.trim()) return;
    setIsExtracting(true);
    setExtractionNote(null);
    try {
      const res = await extractSymptoms(rawSymptomText);
      const combined = Array.from(new Set([...symptoms, ...res.symptoms]));
      setSymptoms(combined);
      if (res.duration && !symptomDuration) {
        setSymptomDuration(res.duration);
      }
      setExtractionNote(`Extracted ${res.symptoms.length} symptom tokens. No clinical priority assigned.`);
    } catch (err: any) {
      setExtractionNote('Could not extract symptoms: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim() && !symptoms.includes(customSymptom.trim())) {
      setSymptoms([...symptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleRemoveSymptom = (sym: string) => {
    setSymptoms(symptoms.filter((s) => s !== sym));
  };

  // Quick symptom chips for rapid ER entry
  const quickChips = [
    'Chest Pain', 'Shortness of breath', 'High fever', 'Wheezing',
    'Severe headache', 'Vomiting', 'Abdominal pain', 'Deep laceration', 'Dizziness'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Patient name or anonymous demo identifier is required.');
      return;
    }
    if (age === '' || Number(age) < 0 || Number(age) > 130) {
      setErrorMessage('Valid patient age (0 - 130) is required.');
      return;
    }
    if (!chiefComplaint.trim()) {
      setErrorMessage('Chief complaint is required.');
      return;
    }
    if (symptoms.length === 0) {
      setErrorMessage('Please add at least one clinical symptom.');
      return;
    }

    // Validate BP if entered
    if (systolicBp && diastolicBp) {
      if (parseFloat(diastolicBp) >= parseFloat(systolicBp)) {
        setErrorMessage('Diastolic blood pressure must be lower than systolic blood pressure.');
        return;
      }
    }

    const vitalsObj: VitalSigns = {};
    if (temperature) vitalsObj.temperature = parseFloat(temperature);
    if (heartRate) vitalsObj.heart_rate = parseFloat(heartRate);
    if (respiratoryRate) vitalsObj.respiratory_rate = parseFloat(respiratoryRate);
    if (systolicBp) vitalsObj.systolic_bp = parseFloat(systolicBp);
    if (diastolicBp) vitalsObj.diastolic_bp = parseFloat(diastolicBp);
    if (oxygenSaturation) vitalsObj.oxygen_saturation = parseFloat(oxygenSaturation);

    setIsSubmitting(true);
    try {
      const res = await registerPatient({
        id: patientId.trim() || undefined,
        name: name.trim(),
        age: Number(age),
        chief_complaint: chiefComplaint.trim(),
        symptoms,
        symptom_duration: symptomDuration.trim() || undefined,
        vitals: vitalsObj,
        is_demo_record: false,
      });

      onSuccess(res.patient_id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-teal-600" />
          Patient Registration & Provisional Triage
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Register emergency department presentation. Inputs are immediately evaluated against configured DMGT logical rules and entered into the ADSA Heap queue.
        </p>
      </div>

      {/* Safety Alert */}
      <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold uppercase tracking-wider text-amber-800 mr-1">
            Clinical Priority Rule:
          </strong>
          Do not delay emergency resuscitative care while entering information. Missing vital signs are never assumed to be normal and must be explicitly obtained during physical examination.
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Demographics */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            1. Patient Demographics & Identification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient ID (Optional)
              </label>
              <input
                type="text"
                placeholder="Auto-generated if empty"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <span className="text-[10px] text-slate-400">e.g. PT-A8F2 or DEMO-009</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Name or Demo ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Full name or anonymous identifier"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                max={130}
                placeholder="e.g. 42"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Symptom Duration
              </label>
              <input
                type="text"
                placeholder="e.g. 30 minutes, 2 days, sudden onset"
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Presentation & NLP Extraction */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              2. Clinical Complaint & AI Symptom Extraction
            </h3>
            <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Heuristic / LLM Supported
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chief Complaint (Primary Presentation) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Crushing retrosternal chest pain radiating to left shoulder"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Unstructured Free Text AI Extractor */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Natural Language Patient Statement (Optional AI Parser)
            </label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                placeholder="e.g. 'I woke up 2 hours ago with severe chest discomfort, sweating, and difficulty breathing...'"
                value={rawSymptomText}
                onChange={(e) => setRawSymptomText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting || !rawSymptomText.trim()}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs transition-all flex flex-col items-center justify-center gap-1 shrink-0 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isExtracting ? 'Parsing...' : 'Extract'}</span>
              </button>
            </div>
            {extractionNote && (
              <p className="text-[11px] text-teal-700 font-medium">{extractionNote}</p>
            )}
          </div>

          {/* Quick Symptoms & Active Symptom Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Active Clinical Symptoms ({symptoms.length}) <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[32px] p-2 rounded-lg bg-slate-50 border border-slate-200">
              {symptoms.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No symptoms added yet. Click suggestions below or type custom.</span>
              ) : (
                symptoms.map((sym, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-100 text-teal-900 border border-teal-300"
                  >
                    {sym}
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(sym)}
                      className="hover:text-red-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Quick add:</span>
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    if (!symptoms.includes(chip)) setSymptoms([...symptoms, chip]);
                  }}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>

            {/* Custom symptom input */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Add custom symptom..."
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <button
                type="button"
                onClick={handleAddCustomSymptom}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Physiological Vital Signs */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              3. Physiological Vital Signs (Optional but Recommended)
            </h3>
            <span className="text-[11px] text-slate-400">
              Leave blank if unmeasured (handled explicitly as missing)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* SpO2 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-cyan-600" /> SpO2 (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="50"
                max="100"
                placeholder="e.g. 97"
                value={oxygenSaturation}
                onChange={(e) => setOxygenSaturation(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <span className="text-[10px] text-slate-400">&lt;90% triggers Red</span>
            </div>

            {/* Heart Rate */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-600" /> HR (bpm)
              </label>
              <input
                type="number"
                min="20"
                max="260"
                placeholder="e.g. 76"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <span className="text-[10px] text-slate-400">Normal 60-100</span>
            </div>

            {/* Systolic BP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-purple-600" /> SBP (mmHg)
              </label>
              <input
                type="number"
                min="40"
                max="280"
                placeholder="e.g. 120"
                value={systolicBp}
                onChange={(e) => setSystolicBp(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <span className="text-[10px] text-slate-400">&lt;80 collapses shock</span>
            </div>

            {/* Diastolic BP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DBP (mmHg)
              </label>
              <input
                type="number"
                min="20"
                max="180"
                placeholder="e.g. 80"
                value={diastolicBp}
                onChange={(e) => setDiastolicBp(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <span className="text-[10px] text-slate-400">Normal 60-80</span>
            </div>

            {/* Respiratory Rate */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-blue-600" /> RR (/min)
              </label>
              <input
                type="number"
                min="4"
                max="70"
                placeholder="e.g. 16"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <span className="text-[10px] text-slate-400">Normal 12-20</span>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" /> Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="25"
                max="45"
                placeholder="e.g. 37.0"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <span className="text-[10px] text-slate-400">&ge;39.5 hyperpyrexia</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Submission automatically triggers DMGT logic evaluation and heap enqueue.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Evaluating & Enqueueing...</span>
            ) : (
              <>
                <span>Register & Prioritize Patient</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
