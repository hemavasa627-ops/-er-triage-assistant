"""
Pydantic data models for ER Triage Assistant.
Defines schemas for validation, serialization, and API responses.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class VitalSignsInput(BaseModel):
    temperature: Optional[float] = Field(None, ge=25.0, le=45.0, description="Body temperature in Celsius")
    heart_rate: Optional[float] = Field(None, ge=20.0, le=260.0, description="Heart rate in beats per minute")
    respiratory_rate: Optional[float] = Field(None, ge=4.0, le=70.0, description="Respiratory rate in breaths/min")
    systolic_bp: Optional[float] = Field(None, ge=40.0, le=280.0, description="Systolic blood pressure in mmHg")
    diastolic_bp: Optional[float] = Field(None, ge=20.0, le=180.0, description="Diastolic blood pressure in mmHg")
    oxygen_saturation: Optional[float] = Field(None, ge=50.0, le=100.0, description="SpO2 percentage (50-100)")

    @field_validator('diastolic_bp')
    @classmethod
    def validate_bp(cls, v, info):
        systolic = info.data.get('systolic_bp')
        if systolic is not None and v is not None and v >= systolic:
            raise ValueError('Diastolic blood pressure must be lower than systolic blood pressure')
        return v

class PatientRegistrationInput(BaseModel):
    id: Optional[str] = Field(None, description="Optional custom ID, e.g. DEMO-001. Auto-generated if omitted.")
    name: str = Field(..., min_length=1, max_length=100, description="Patient name or demo identifier")
    age: int = Field(..., ge=0, le=130, description="Patient age in years")
    chief_complaint: str = Field(..., min_length=2, max_length=300, description="Primary reason for presentation")
    symptoms: List[str] = Field(..., min_length=1, description="List of individual symptoms")
    symptom_duration: Optional[str] = Field(None, description="Duration of symptoms, e.g. '2 hours', '3 days'")
    vitals: Optional[VitalSignsInput] = Field(default_factory=VitalSignsInput, description="Optional vital signs")
    arrival_time: Optional[str] = Field(None, description="ISO timestamp of arrival. Defaults to current time.")
    is_demo_record: bool = Field(False, description="Whether this is a synthetic demo patient")

class StatusUpdateInput(BaseModel):
    new_status: str = Field(..., description="Workflow state: 'Waiting', 'Under Review', or 'Assessment Completed'")
    notes: Optional[str] = Field(None, description="Optional clinical/administrative notes")

    @field_validator('new_status')
    @classmethod
    def validate_status(cls, v):
        allowed = {"Waiting", "Under Review", "Assessment Completed"}
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v

class TriageEvaluationResponse(BaseModel):
    patient_id: str
    priority_level: int
    priority_name: str
    priority_code: str
    severity_score: float
    rules_triggered: List[str]
    rule_reasons: List[str]
    factors_considered: List[str]
    missing_information: List[str]
    clinical_disclaimer: str
    evaluated_at: str

class QueuePatientResponse(BaseModel):
    queue_position: int
    patient_id: str
    name: str
    age: int
    chief_complaint: str
    symptoms: List[str]
    symptom_duration: Optional[str]
    severity_score: float
    priority_level: int
    priority_name: str
    priority_code: str
    arrival_time: str
    workflow_status: str
    is_demo_record: bool
    vitals: Optional[VitalSignsInput]

class PatientDetailResponse(BaseModel):
    patient_id: str
    name: str
    age: int
    chief_complaint: str
    symptoms: List[str]
    symptom_duration: Optional[str]
    arrival_time: str
    workflow_status: str
    is_demo_record: bool
    created_at: str
    updated_at: str
    queue_position: Optional[int]
    vitals: Optional[VitalSignsInput]
    triage_result: Optional[TriageEvaluationResponse]
    status_history: List[Dict[str, Any]]

class LLMExtractInput(BaseModel):
    text: str = Field(..., min_length=3, description="Natural language description of symptoms")

class LLMExtractResponse(BaseModel):
    symptoms: List[str]
    duration: Optional[str]
    explicit_details: List[str]
    uncertain_or_missing: List[str]
    disclaimer: str
