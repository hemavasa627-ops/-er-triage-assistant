export interface VitalSigns {
  temperature?: number | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  oxygen_saturation?: number | null;
}

export interface TriageResult {
  patient_id: string;
  priority_level: number;
  priority_name: string;
  priority_code: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | string;
  severity_score: number;
  rules_triggered: string[];
  rule_reasons: string[];
  factors_considered: string[];
  missing_information: string[];
  clinical_disclaimer: string;
  evaluated_at: string;
}

export interface ScoreContributingFactor {
  metric: string;
  raw_value: string;
  subscore: number;
  weight: number;
  description: string;
}

export interface ScoreBreakdown {
  severity_score: number;
  vitals_normalized_score: number;
  symptom_bonus_points: number;
  contributing_factors: ScoreContributingFactor[];
  missing_metrics: string[];
  present_metrics_count: number;
  limitations: string[];
  formula_documentation: string;
}

export interface StatusHistoryItem {
  old_status: string | null;
  new_status: string;
  notes?: string | null;
  changed_at: string;
}

export interface Patient {
  patient_id: string;
  name: string;
  age: number;
  chief_complaint: string;
  symptoms: string[];
  symptom_duration?: string | null;
  arrival_time: string;
  workflow_status: 'Waiting' | 'Under Review' | 'Assessment Completed' | string;
  is_demo_record: boolean;
  created_at: string;
  updated_at: string;
  queue_position?: number | null;
  vitals?: VitalSigns | null;
  triage_result?: TriageResult | null;
  score_breakdown?: ScoreBreakdown | null;
  status_history?: StatusHistoryItem[];
  priority_level?: number;
  priority_name?: string;
  priority_code?: string;
  severity_score?: number;
}

export interface QueueItem {
  queue_position: number;
  patient_id: string;
  name: string;
  age: number;
  chief_complaint: string;
  symptoms: string[];
  symptom_duration?: string | null;
  severity_score: number;
  priority_level: number;
  priority_name: string;
  priority_code: string;
  arrival_time: string;
  workflow_status: string;
  is_demo_record: boolean;
  vitals?: VitalSigns | null;
}

export interface DashboardMetrics {
  total_patients: number;
  active_in_queue: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  priority_breakdown: {
    red: number;
    orange: number;
    yellow: number;
    green: number;
  };
  status_breakdown: {
    waiting: number;
    under_review: number;
    completed: number;
  };
  distribution: Array<{
    name: string;
    code: string;
    value: number;
    color: string;
  }>;
}

export interface LLMExtractResult {
  symptoms: string[];
  duration?: string | null;
  explicit_details: string[];
  uncertain_or_missing: string[];
  disclaimer: string;
}
