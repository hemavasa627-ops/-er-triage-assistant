import { DashboardMetrics, Patient, QueueItem, LLMExtractResult, VitalSigns } from './types';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:8000/api'
    : '/api');

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error('Failed to load dashboard metrics');
  return res.json();
}

export async function fetchQueue(): Promise<{ count: number; queue: QueueItem[] }> {
  const res = await fetch(`${API_BASE}/queue`);
  if (!res.ok) throw new Error('Failed to load active patient queue');
  return res.json();
}

export async function fetchPatients(params?: {
  search?: string;
  priority?: string;
  status?: string;
  sort_by?: string;
}): Promise<{ count: number; patients: Patient[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.status) query.set('status', params.status);
  if (params?.sort_by) query.set('sort_by', params.sort_by);

  const res = await fetch(`${API_BASE}/patients?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load patients list');
  return res.json();
}

export async function fetchPatientDetails(patientId: string): Promise<Patient> {
  const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(patientId)}`);
  if (!res.ok) throw new Error(`Failed to load patient details for ${patientId}`);
  return res.json();
}

export async function registerPatient(data: {
  id?: string;
  name: string;
  age: number;
  chief_complaint: string;
  symptoms: string[];
  symptom_duration?: string;
  vitals?: VitalSigns;
  arrival_time?: string;
  is_demo_record?: boolean;
}): Promise<{
  success: boolean;
  patient_id: string;
  queue_position: number;
  triage_result: any;
  score_breakdown: any;
}> {
  const res = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration error' }));
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function updatePatientStatus(
  patientId: string,
  newStatus: string,
  notes?: string
): Promise<{ success: boolean; queue_position?: number | null; message: string }> {
  const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(patientId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_status: newStatus, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Status update error' }));
    throw new Error(err.detail || 'Failed to update patient status');
  }
  return res.json();
}

export async function loadDemoPatients(): Promise<{
  success: boolean;
  added_count: number;
  skipped_count: number;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/demo/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to load demo patients');
  return res.json();
}

export async function extractSymptoms(text: string): Promise<LLMExtractResult> {
  const res = await fetch(`${API_BASE}/llm/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to extract symptoms');
  return res.json();
}

export async function checkJavaStatus(): Promise<{
  java_detected: boolean;
  javac_detected: boolean;
  source: string;
}> {
  const res = await fetch(`${API_BASE}/java-status`);
  if (!res.ok) throw new Error('Failed to check Java status');
  return res.json();
}

export async function runJavaTestSuite(): Promise<{
  success: boolean;
  stdout: string;
  stderr: string;
}> {
  const res = await fetch(`${API_BASE}/java-test`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to run Java test suite');
  return res.json();
}
