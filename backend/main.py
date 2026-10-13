"""
ER TRIAGE ASSISTANT — Smart Emergency Patient Prioritization System
FastAPI Backend Application Entry Point.

CRITICAL MEDICAL DISCLAIMER:
This application is an educational prototype created solely for academic coursework demonstration
(Discrete Mathematics & Graph Theory, Artificial Intelligence, Advanced Data Structures & Algorithms,
and Object-Oriented Programming). It does NOT produce clinical diagnoses and is NOT a medical device.
All patients presenting to an emergency department require prompt evaluation by certified medical personnel.
"""

import os
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import init_db, get_db_connection
from models import (
    PatientRegistrationInput,
    StatusUpdateInput,
    TriageEvaluationResponse,
    QueuePatientResponse,
    PatientDetailResponse,
    LLMExtractInput,
    LLMExtractResponse,
    VitalSignsInput
)
from rule_engine import DMGTLogicalRuleEngine
from scoring_engine import SeverityScoringEngine
from priority_queue import TriagePriorityQueue
from demo_data import get_demo_patients
from llm_service import SymptomExtractionService
from java_bridge import find_java_executables, run_java_tests, run_java_demo, compile_java_module

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes SQLite database and compiles Java module on startup."""
    init_db()
    compile_java_module()
    yield

app = FastAPI(
    title="ER Triage Assistant API",
    description="Educational emergency room patient prioritization and triage decision-support prototype.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core singletons
rule_engine = DMGTLogicalRuleEngine()
scoring_engine = SeverityScoringEngine()
llm_service = SymptomExtractionService()

def build_priority_queue() -> TriagePriorityQueue:
    """
    Constructs an ADSA Min-Heap from currently active patients in SQLite.
    Only patients with status 'Waiting' or 'Under Review' are included in the active queue.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT p.id, p.name, p.age, p.chief_complaint, p.symptoms, p.symptom_duration,
           p.arrival_time, p.workflow_status, p.is_demo_record,
           v.temperature, v.heart_rate, v.respiratory_rate, v.systolic_bp, v.diastolic_bp, v.oxygen_saturation,
           tr.priority_level, tr.priority_name, tr.priority_code, tr.severity_score
    FROM patients p
    LEFT JOIN vitals v ON p.id = v.patient_id
    LEFT JOIN triage_results tr ON p.id = tr.patient_id
    WHERE p.workflow_status IN ('Waiting', 'Under Review')
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    pq = TriagePriorityQueue()
    for row in rows:
        vitals_dict = None
        if row["temperature"] is not None or row["heart_rate"] is not None or row["oxygen_saturation"] is not None:
            vitals_dict = {
                "temperature": row["temperature"],
                "heart_rate": row["heart_rate"],
                "respiratory_rate": row["respiratory_rate"],
                "systolic_bp": row["systolic_bp"],
                "diastolic_bp": row["diastolic_bp"],
                "oxygen_saturation": row["oxygen_saturation"]
            }

        symptoms_list = json.loads(row["symptoms"]) if row["symptoms"] else []

        data = {
            "name": row["name"],
            "age": row["age"],
            "chief_complaint": row["chief_complaint"],
            "symptoms": symptoms_list,
            "symptom_duration": row["symptom_duration"],
            "priority_name": row["priority_name"] or "Level 4 - Routine",
            "priority_code": row["priority_code"] or "GREEN",
            "workflow_status": row["workflow_status"],
            "is_demo_record": bool(row["is_demo_record"]),
            "vitals": vitals_dict
        }

        pq.push(
            patient_id=row["id"],
            priority_level=row["priority_level"] or 4,
            arrival_time=row["arrival_time"],
            severity_score=row["severity_score"] or 0.0,
            data=data
        )

    return pq

# -----------------------------------------------------------------------------
# PATIENT REGISTRATION & EVALUATION
# -----------------------------------------------------------------------------
@app.post("/api/patients", status_code=status.HTTP_201_CREATED)
def register_patient(payload: PatientRegistrationInput):
    """
    Registers an emergency patient, runs DMGT logical rule engine and Python scoring,
    and enqueues the record into the ADSA Priority Queue.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Generate patient ID if none provided
    patient_id = payload.id.strip() if payload.id else f"PT-{uuid.uuid4().hex[:6].upper()}"

    # Check for existing patient ID
    cursor.execute("SELECT id FROM patients WHERE id = ?", (patient_id,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Patient with ID '{patient_id}' already exists.")

    now_iso = datetime.now(timezone.utc).isoformat()
    arrival_time = payload.arrival_time or now_iso

    # Prepare vitals dictionary
    vitals_dict = payload.vitals.model_dump() if payload.vitals else {}

    patient_eval_dict = {
        "id": patient_id,
        "name": payload.name,
        "age": payload.age,
        "chief_complaint": payload.chief_complaint,
        "symptoms": payload.symptoms,
        "vitals": vitals_dict
    }

    # 1. Apply DMGT Logical Rule Engine
    rule_result = rule_engine.evaluate(patient_eval_dict)

    # 2. Calculate Python Demonstration Acuity Score
    score_result = scoring_engine.calculate_score(patient_eval_dict)

    # 3. Persist patient to SQLite
    cursor.execute("""
    INSERT INTO patients (id, name, age, chief_complaint, symptoms, symptom_duration,
                          arrival_time, workflow_status, is_demo_record, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Waiting', ?, ?, ?)
    """, (
        patient_id,
        payload.name,
        payload.age,
        payload.chief_complaint,
        json.dumps(payload.symptoms),
        payload.symptom_duration,
        arrival_time,
        1 if payload.is_demo_record else 0,
        now_iso,
        now_iso
    ))

    # 4. Persist vitals (strictly storing NULL for missing metrics)
    cursor.execute("""
    INSERT INTO vitals (patient_id, temperature, heart_rate, respiratory_rate,
                        systolic_bp, diastolic_bp, oxygen_saturation, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        patient_id,
        vitals_dict.get("temperature"),
        vitals_dict.get("heart_rate"),
        vitals_dict.get("respiratory_rate"),
        vitals_dict.get("systolic_bp"),
        vitals_dict.get("diastolic_bp"),
        vitals_dict.get("oxygen_saturation"),
        now_iso
    ))

    # 5. Persist Triage Result
    cursor.execute("""
    INSERT INTO triage_results (patient_id, priority_level, priority_name, priority_code,
                                severity_score, rules_triggered, rule_reasons, factors_considered,
                                missing_information, clinical_disclaimer, evaluated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        patient_id,
        rule_result["priority_level"],
        rule_result["priority_name"],
        rule_result["priority_code"],
        score_result["severity_score"],
        json.dumps(rule_result["rules_triggered"]),
        json.dumps(rule_result["rule_reasons"]),
        json.dumps(rule_result["factors_considered"]),
        json.dumps(rule_result["missing_information"]),
        rule_result["clinical_disclaimer"],
        now_iso
    ))

    # 6. Initial status audit log entry
    cursor.execute("""
    INSERT INTO status_history (patient_id, old_status, new_status, notes, changed_at)
    VALUES (?, NULL, 'Waiting', 'Initial patient registration and automated triage evaluation.', ?)
    """, (patient_id, now_iso))

    conn.commit()
    conn.close()

    # Calculate queue position using ADSA Min-Heap
    pq = build_priority_queue()
    position = pq.get_position(patient_id)

    return {
        "success": True,
        "patient_id": patient_id,
        "queue_position": position,
        "triage_result": {
            "patient_id": patient_id,
            "priority_level": rule_result["priority_level"],
            "priority_name": rule_result["priority_name"],
            "priority_code": rule_result["priority_code"],
            "severity_score": score_result["severity_score"],
            "rules_triggered": rule_result["rules_triggered"],
            "rule_reasons": rule_result["rule_reasons"],
            "factors_considered": rule_result["factors_considered"],
            "missing_information": rule_result["missing_information"],
            "clinical_disclaimer": rule_result["clinical_disclaimer"],
            "evaluated_at": now_iso
        },
        "score_breakdown": score_result
    }

# -----------------------------------------------------------------------------
# QUEUE & PATIENT RETRIEVAL
# -----------------------------------------------------------------------------
@app.get("/api/queue")
def get_priority_queue():
    """
    Returns the currently active patient queue ordered by the ADSA Heap Priority Queue.
    Deterministic sorting: Priority Level ASC -> Arrival Time ASC -> ID ASC.
    """
    pq = build_priority_queue()
    ranked = pq.get_ranked_list()
    return {
        "count": len(ranked),
        "queue": ranked
    }

@app.get("/api/patients")
def list_patients(
    search: Optional[str] = Query(None, description="Search by name, ID, or chief complaint"),
    priority: Optional[str] = Query(None, description="Filter by priority code (RED, ORANGE, YELLOW, GREEN)"),
    status: Optional[str] = Query(None, description="Filter by status (Waiting, Under Review, Assessment Completed)"),
    sort_by: str = Query("arrival", description="Sort by 'arrival', 'priority', or 'score'")
):
    """
    Retrieves full patient history and active records with optional filtering and sorting.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT p.id, p.name, p.age, p.chief_complaint, p.symptoms, p.symptom_duration,
           p.arrival_time, p.workflow_status, p.is_demo_record, p.created_at, p.updated_at,
           v.temperature, v.heart_rate, v.respiratory_rate, v.systolic_bp, v.diastolic_bp, v.oxygen_saturation,
           tr.priority_level, tr.priority_name, tr.priority_code, tr.severity_score,
           tr.rules_triggered, tr.rule_reasons, tr.factors_considered, tr.missing_information, tr.clinical_disclaimer
    FROM patients p
    LEFT JOIN vitals v ON p.id = v.patient_id
    LEFT JOIN triage_results tr ON p.id = tr.patient_id
    WHERE 1=1
    """
    params = []

    if search:
        s_pattern = f"%{search.strip()}%"
        query += " AND (p.name LIKE ? OR p.id LIKE ? OR p.chief_complaint LIKE ?)"
        params.extend([s_pattern, s_pattern, s_pattern])

    if priority:
        query += " AND tr.priority_code = ?"
        params.append(priority.upper())

    if status:
        query += " AND p.workflow_status = ?"
        params.append(status)

    if sort_by == "priority":
        query += " ORDER BY tr.priority_level ASC, p.arrival_time ASC"
    elif sort_by == "score":
        query += " ORDER BY tr.severity_score DESC, p.arrival_time ASC"
    else:
        query += " ORDER BY p.arrival_time DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    pq = build_priority_queue()

    results = []
    for r in rows:
        pid = r["id"]
        pos = pq.get_position(pid) if r["workflow_status"] in ("Waiting", "Under Review") else None
        vitals_dict = None
        if r["temperature"] is not None or r["heart_rate"] is not None or r["oxygen_saturation"] is not None:
            vitals_dict = {
                "temperature": r["temperature"],
                "heart_rate": r["heart_rate"],
                "respiratory_rate": r["respiratory_rate"],
                "systolic_bp": r["systolic_bp"],
                "diastolic_bp": r["diastolic_bp"],
                "oxygen_saturation": r["oxygen_saturation"]
            }

        results.append({
            "patient_id": pid,
            "name": r["name"],
            "age": r["age"],
            "chief_complaint": r["chief_complaint"],
            "symptoms": json.loads(r["symptoms"]) if r["symptoms"] else [],
            "symptom_duration": r["symptom_duration"],
            "arrival_time": r["arrival_time"],
            "workflow_status": r["workflow_status"],
            "is_demo_record": bool(r["is_demo_record"]),
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "queue_position": pos,
            "vitals": vitals_dict,
            "priority_level": r["priority_level"],
            "priority_name": r["priority_name"],
            "priority_code": r["priority_code"],
            "severity_score": r["severity_score"]
        })

    return {"count": len(results), "patients": results}

@app.get("/api/patients/{patient_id}")
def get_patient_details(patient_id: str):
    """
    Returns complete clinical details, DMGT rule audit, Python scoring factor breakdown,
    missing data notifications, and status change history for a single patient.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT p.id, p.name, p.age, p.chief_complaint, p.symptoms, p.symptom_duration,
           p.arrival_time, p.workflow_status, p.is_demo_record, p.created_at, p.updated_at,
           v.temperature, v.heart_rate, v.respiratory_rate, v.systolic_bp, v.diastolic_bp, v.oxygen_saturation,
           tr.priority_level, tr.priority_name, tr.priority_code, tr.severity_score,
           tr.rules_triggered, tr.rule_reasons, tr.factors_considered, tr.missing_information,
           tr.clinical_disclaimer, tr.evaluated_at
    FROM patients p
    LEFT JOIN vitals v ON p.id = v.patient_id
    LEFT JOIN triage_results tr ON p.id = tr.patient_id
    WHERE p.id = ?
    """, (patient_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")

    # Fetch status history audit log
    cursor.execute("""
    SELECT old_status, new_status, notes, changed_at
    FROM status_history
    WHERE patient_id = ?
    ORDER BY id ASC
    """, (patient_id,))
    history_rows = cursor.fetchall()
    conn.close()

    pq = build_priority_queue()
    pos = pq.get_position(patient_id) if row["workflow_status"] in ("Waiting", "Under Review") else None

    vitals_dict = {
        "temperature": row["temperature"],
        "heart_rate": row["heart_rate"],
        "respiratory_rate": row["respiratory_rate"],
        "systolic_bp": row["systolic_bp"],
        "diastolic_bp": row["diastolic_bp"],
        "oxygen_saturation": row["oxygen_saturation"]
    }

    patient_data_for_scoring = {
        "id": row["id"],
        "symptoms": json.loads(row["symptoms"]) if row["symptoms"] else [],
        "chief_complaint": row["chief_complaint"],
        "vitals": vitals_dict
    }
    score_breakdown = scoring_engine.calculate_score(patient_data_for_scoring)

    return {
        "patient_id": row["id"],
        "name": row["name"],
        "age": row["age"],
        "chief_complaint": row["chief_complaint"],
        "symptoms": json.loads(row["symptoms"]) if row["symptoms"] else [],
        "symptom_duration": row["symptom_duration"],
        "arrival_time": row["arrival_time"],
        "workflow_status": row["workflow_status"],
        "is_demo_record": bool(row["is_demo_record"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "queue_position": pos,
        "vitals": vitals_dict,
        "triage_result": {
            "patient_id": row["id"],
            "priority_level": row["priority_level"],
            "priority_name": row["priority_name"],
            "priority_code": row["priority_code"],
            "severity_score": row["severity_score"],
            "rules_triggered": json.loads(row["rules_triggered"]) if row["rules_triggered"] else [],
            "rule_reasons": json.loads(row["rule_reasons"]) if row["rule_reasons"] else [],
            "factors_considered": json.loads(row["factors_considered"]) if row["factors_considered"] else [],
            "missing_information": json.loads(row["missing_information"]) if row["missing_information"] else [],
            "clinical_disclaimer": row["clinical_disclaimer"],
            "evaluated_at": row["evaluated_at"]
        },
        "score_breakdown": score_breakdown,
        "status_history": [dict(h) for h in history_rows]
    }

# -----------------------------------------------------------------------------
# WORKFLOW STATUS MANAGEMENT
# -----------------------------------------------------------------------------
@app.patch("/api/patients/{patient_id}/status")
def update_patient_status(patient_id: str, payload: StatusUpdateInput):
    """
    Updates patient workflow status (Waiting -> Under Review -> Assessment Completed).
    Recalculates queue positions while strictly preserving records in database history.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT workflow_status FROM patients WHERE id = ?", (patient_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")

    old_status = row["workflow_status"]
    new_status = payload.new_status
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    UPDATE patients
    SET workflow_status = ?, updated_at = ?
    WHERE id = ?
    """, (new_status, now_iso, patient_id))

    cursor.execute("""
    INSERT INTO status_history (patient_id, old_status, new_status, notes, changed_at)
    VALUES (?, ?, ?, ?, ?)
    """, (patient_id, old_status, new_status, payload.notes or f"Status transitioned to {new_status}", now_iso))

    conn.commit()
    conn.close()

    # Get updated queue position
    pq = build_priority_queue()
    new_pos = pq.get_position(patient_id) if new_status in ("Waiting", "Under Review") else None

    return {
        "success": True,
        "patient_id": patient_id,
        "old_status": old_status,
        "new_status": new_status,
        "queue_position": new_pos,
        "message": f"Patient status updated to '{new_status}'. Patient records preserved in history."
    }

# -----------------------------------------------------------------------------
# METRICS & DASHBOARD SUMMARY
# -----------------------------------------------------------------------------
@app.get("/api/metrics")
def get_dashboard_metrics():
    """
    Returns live metrics computed directly from real application data:
    - Total patients
    - High priority (Level 1 Resuscitation + Level 2 Emergent)
    - Medium priority (Level 3 Urgent)
    - Low priority (Level 4 Routine)
    - Queue status breakdown (Waiting, Under Review, Completed)
    - Priority distribution for charts
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM patients")
    total_patients = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM patients WHERE workflow_status IN ('Waiting', 'Under Review')")
    active_in_queue = cursor.fetchone()[0]

    cursor.execute("""
    SELECT tr.priority_code, tr.priority_level, COUNT(*) as count
    FROM triage_results tr
    JOIN patients p ON tr.patient_id = p.id
    GROUP BY tr.priority_code, tr.priority_level
    ORDER BY tr.priority_level ASC
    """)
    priority_counts = {row["priority_code"]: row["count"] for row in cursor.fetchall()}

    cursor.execute("""
    SELECT workflow_status, COUNT(*) as count
    FROM patients
    GROUP BY workflow_status
    """)
    status_counts = {row["workflow_status"]: row["count"] for row in cursor.fetchall()}

    conn.close()

    high_priority = priority_counts.get("RED", 0) + priority_counts.get("ORANGE", 0)
    medium_priority = priority_counts.get("YELLOW", 0)
    low_priority = priority_counts.get("GREEN", 0)

    # Priority distribution for Recharts
    distribution = [
        {"name": "Level 1 - Immediate (Red)", "code": "RED", "value": priority_counts.get("RED", 0), "color": "#DC2626"},
        {"name": "Level 2 - Emergent (Orange)", "code": "ORANGE", "value": priority_counts.get("ORANGE", 0), "color": "#EA580C"},
        {"name": "Level 3 - Urgent (Yellow)", "code": "YELLOW", "value": priority_counts.get("YELLOW", 0), "color": "#D97706"},
        {"name": "Level 4 - Routine (Green)", "code": "GREEN", "value": priority_counts.get("GREEN", 0), "color": "#16A34A"},
    ]

    return {
        "total_patients": total_patients,
        "active_in_queue": active_in_queue,
        "high_priority": high_priority,
        "medium_priority": medium_priority,
        "low_priority": low_priority,
        "priority_breakdown": {
            "red": priority_counts.get("RED", 0),
            "orange": priority_counts.get("ORANGE", 0),
            "yellow": priority_counts.get("YELLOW", 0),
            "green": priority_counts.get("GREEN", 0),
        },
        "status_breakdown": {
            "waiting": status_counts.get("Waiting", 0),
            "under_review": status_counts.get("Under Review", 0),
            "completed": status_counts.get("Assessment Completed", 0),
        },
        "distribution": distribution
    }

# -----------------------------------------------------------------------------
# DEMO DATA LOADER (WITH DEDUPLICATION)
# -----------------------------------------------------------------------------
@app.post("/api/demo/load")
def load_demo_data():
    """
    Seeds realistic fictional emergency patients.
    Guarantees idempotence: skips any records that already exist to prevent duplicate accumulation.
    """
    demo_patients = get_demo_patients()
    conn = get_db_connection()
    cursor = conn.cursor()

    added_count = 0
    skipped_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for p in demo_patients:
        cursor.execute("SELECT id FROM patients WHERE id = ?", (p["id"],))
        if cursor.fetchone():
            skipped_count += 1
            continue

        # Evaluate rules and score
        rule_res = rule_engine.evaluate(p)
        score_res = scoring_engine.calculate_score(p)

        cursor.execute("""
        INSERT INTO patients (id, name, age, chief_complaint, symptoms, symptom_duration,
                              arrival_time, workflow_status, is_demo_record, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        """, (
            p["id"],
            p["name"],
            p["age"],
            p["chief_complaint"],
            json.dumps(p["symptoms"]),
            p["symptom_duration"],
            p["arrival_time"],
            p["workflow_status"],
            now_iso,
            now_iso
        ))

        v = p.get("vitals") or {}
        cursor.execute("""
        INSERT INTO vitals (patient_id, temperature, heart_rate, respiratory_rate,
                            systolic_bp, diastolic_bp, oxygen_saturation, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p["id"],
            v.get("temperature"),
            v.get("heart_rate"),
            v.get("respiratory_rate"),
            v.get("systolic_bp"),
            v.get("diastolic_bp"),
            v.get("oxygen_saturation"),
            now_iso
        ))

        cursor.execute("""
        INSERT INTO triage_results (patient_id, priority_level, priority_name, priority_code,
                                    severity_score, rules_triggered, rule_reasons, factors_considered,
                                    missing_information, clinical_disclaimer, evaluated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p["id"],
            rule_res["priority_level"],
            rule_res["priority_name"],
            rule_res["priority_code"],
            score_res["severity_score"],
            json.dumps(rule_res["rules_triggered"]),
            json.dumps(rule_res["rule_reasons"]),
            json.dumps(rule_res["factors_considered"]),
            json.dumps(rule_res["missing_information"]),
            rule_res["clinical_disclaimer"],
            now_iso
        ))

        cursor.execute("""
        INSERT INTO status_history (patient_id, old_status, new_status, notes, changed_at)
        VALUES (?, NULL, 'Waiting', 'Generated synthetic demo emergency patient record.', ?)
        """, (p["id"], now_iso))

        added_count += 1

    conn.commit()
    conn.close()

    return {
        "success": True,
        "added_count": added_count,
        "skipped_count": skipped_count,
        "message": f"Successfully loaded {added_count} demo patients ({skipped_count} skipped as already existing)."
    }

# -----------------------------------------------------------------------------
# LLM / HEURISTIC SYMPTOM EXTRACTION
# -----------------------------------------------------------------------------
@app.post("/api/llm/extract", response_model=LLMExtractResponse)
def extract_symptoms(payload: LLMExtractInput):
    """
    Extracts structured symptoms, duration, and details from free text.
    Works seamlessly without an API key using the transparent heuristic NLP engine.
    """
    result = llm_service.extract_from_text(payload.text)
    return result

# -----------------------------------------------------------------------------
# CONFIGURATION & RULES METADATA
# -----------------------------------------------------------------------------
@app.get("/api/rules")
def get_triage_rules():
    """Returns the editable DMGT logical rules configuration."""
    return rule_engine.rules_config

# -----------------------------------------------------------------------------
# JAVA OOP BRIDGE STATUS & TEST EXECUTION
# -----------------------------------------------------------------------------
@app.get("/api/java-status")
def get_java_status():
    """Reports status of the Java OOP and ADSA priority queue module."""
    execs = find_java_executables()
    return {
        "java_detected": bool(execs.get("java")),
        "javac_detected": bool(execs.get("javac")),
        "source": execs.get("source"),
        "executables": execs
    }

@app.post("/api/java-test")
def trigger_java_tests():
    """Runs the Java test suite via subprocess CLI bridge and returns the output."""
    res = run_java_tests()
    return res

# -----------------------------------------------------------------------------
# STATIC FRONTEND SERVING (SINGLE-PORT CONVENIENCE)
# -----------------------------------------------------------------------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Do not intercept API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
