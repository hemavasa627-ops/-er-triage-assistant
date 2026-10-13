"""
Unit and Integration Tests for ER Triage Assistant.
Tests cover:
1. Patient registration & input validation
2. Missing vital signs handling
3. DMGT propositional logic rule evaluation
4. Python demonstration severity score calculation
5. ADSA Min-Heap Priority Queue ordering & operations
6. Deterministic tie-breaking on arrival time
7. Workflow status update & queue position recalculation
8. FastAPI endpoints integration
9. Demo data loader idempotency & duplicate prevention
"""

import os
import sys
import pytest
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app, build_priority_queue
from database import init_db, get_db_connection
from rule_engine import DMGTLogicalRuleEngine
from scoring_engine import SeverityScoringEngine
from priority_queue import TriagePriorityQueue
from demo_data import get_demo_patients

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_clean_db():
    """Initializes and cleans test database before tests."""
    init_db()
    conn = get_db_connection()
    conn.execute("DELETE FROM status_history")
    conn.execute("DELETE FROM triage_results")
    conn.execute("DELETE FROM vitals")
    conn.execute("DELETE FROM patients")
    conn.commit()
    conn.close()

# -----------------------------------------------------------------------------
# 1. Input Validation Tests
# -----------------------------------------------------------------------------
def test_patient_registration_validation():
    # Age out of range (>130)
    res = client.post("/api/patients", json={
        "name": "Invalid Age",
        "age": 150,
        "chief_complaint": "Pain",
        "symptoms": ["Pain"]
    })
    assert res.status_code == 422

    # Diastolic BP >= Systolic BP
    res2 = client.post("/api/patients", json={
        "name": "Invalid BP",
        "age": 30,
        "chief_complaint": "Headache",
        "symptoms": ["Headache"],
        "vitals": {
            "systolic_bp": 110,
            "diastolic_bp": 120  # Invalid! Diastolic cannot be >= systolic
        }
    })
    assert res2.status_code == 422

# -----------------------------------------------------------------------------
# 2. Missing Vitals Handling
# -----------------------------------------------------------------------------
def test_missing_vital_signs_explicitly_handled():
    # Register patient with zero vitals provided
    payload = {
        "name": "Jane Doe",
        "age": 25,
        "chief_complaint": "Mild throat tickle",
        "symptoms": ["Cough"],
        "vitals": {}
    }
    res = client.post("/api/patients", json=payload)
    assert res.status_code == 201
    data = res.json()
    triage = data["triage_result"]

    # Must explicitly list all 5 missing metrics, never assume normal
    missing = triage["missing_information"]
    assert any("Oxygen Saturation" in m for m in missing)
    assert any("Heart Rate" in m for m in missing)
    assert any("Blood Pressure" in m for m in missing)

    # Database vitals must be NULL
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM vitals WHERE patient_id = ?", (data["patient_id"],))
    row = c.fetchone()
    assert row["temperature"] is None
    assert row["heart_rate"] is None
    assert row["oxygen_saturation"] is None
    conn.close()

# -----------------------------------------------------------------------------
# 3. DMGT Rule Evaluation Tests
# -----------------------------------------------------------------------------
def test_dmgt_emergency_warning_rule_hypoxia():
    re = DMGTLogicalRuleEngine()
    patient = {
        "chief_complaint": "Severe breathlessness",
        "symptoms": ["Dyspnea"],
        "vitals": {"oxygen_saturation": 87.0}  # SpO2 < 90%
    }
    result = re.evaluate(patient)
    assert result["priority_level"] == 1
    assert result["priority_code"] == "RED"
    assert "RULE_CRITICAL_HYPOXIA" in result["rules_triggered"]

def test_dmgt_cardiac_crushing_chest_pain():
    re = DMGTLogicalRuleEngine()
    patient = {
        "chief_complaint": "Crushing chest pain radiating to left jaw",
        "symptoms": ["Crushing chest pain", "Diaphoresis"],
        "vitals": {"oxygen_saturation": 98.0, "heart_rate": 80.0}
    }
    result = re.evaluate(patient)
    assert result["priority_level"] == 1
    assert result["priority_code"] == "RED"
    assert "RULE_SEVERE_CARDIAC_SYMPTOMS" in result["rules_triggered"]

def test_dmgt_high_concern_hyperpyrexia():
    re = DMGTLogicalRuleEngine()
    patient = {
        "chief_complaint": "Very high fever with lethargy",
        "symptoms": ["High fever", "Lethargy"],
        "vitals": {"temperature": 40.2, "oxygen_saturation": 97.0}
    }
    result = re.evaluate(patient)
    assert result["priority_level"] == 2
    assert result["priority_code"] == "ORANGE"
    assert "RULE_HYPERPYREXIA_WITH_LETHARGY" in result["rules_triggered"]

# -----------------------------------------------------------------------------
# 4. Severity Scoring Engine Tests
# -----------------------------------------------------------------------------
def test_severity_scoring_bounded_and_factors():
    se = SeverityScoringEngine()
    patient = {
        "chief_complaint": "Palpitations",
        "symptoms": ["Chest discomfort"],
        "vitals": {
            "heart_rate": 130.0,
            "oxygen_saturation": 92.0,
            "systolic_bp": 145.0
        }
    }
    score_res = se.calculate_score(patient)
    assert 0.0 <= score_res["severity_score"] <= 100.0
    assert len(score_res["contributing_factors"]) >= 3
    assert "Respiratory Rate" in score_res["missing_metrics"]
    assert "Body Temperature" in score_res["missing_metrics"]

# -----------------------------------------------------------------------------
# 5. ADSA Min-Heap Priority Queue Ordering
# -----------------------------------------------------------------------------
def test_adsa_heap_priority_ordering():
    pq = TriagePriorityQueue()
    pq.push("PT-GREEN", priority_level=4, arrival_time="2026-10-12T10:00:00Z", severity_score=15.0)
    pq.push("PT-RED", priority_level=1, arrival_time="2026-10-12T10:15:00Z", severity_score=90.0)
    pq.push("PT-ORANGE", priority_level=2, arrival_time="2026-10-12T10:05:00Z", severity_score=70.0)
    pq.push("PT-YELLOW", priority_level=3, arrival_time="2026-10-12T10:10:00Z", severity_score=45.0)

    # Peek must be Level 1
    assert pq.peek().patient_id == "PT-RED"

    # Extract all in order
    assert pq.pop_min().patient_id == "PT-RED"
    assert pq.pop_min().patient_id == "PT-ORANGE"
    assert pq.pop_min().patient_id == "PT-YELLOW"
    assert pq.pop_min().patient_id == "PT-GREEN"
    assert pq.is_empty()

# -----------------------------------------------------------------------------
# 6. Equal-Priority Deterministic Tie-Breaking
# -----------------------------------------------------------------------------
def test_adsa_heap_equal_priority_tie_breaking():
    pq = TriagePriorityQueue()
    # Both patients are Priority Level 2 (Orange)
    # Earlier arrival must be dequeued first
    pq.push("PT-LATE", priority_level=2, arrival_time="2026-10-12T11:30:00Z", severity_score=60.0)
    pq.push("PT-EARLY", priority_level=2, arrival_time="2026-10-12T11:00:00Z", severity_score=60.0)

    first = pq.pop_min()
    assert first.patient_id == "PT-EARLY"
    second = pq.pop_min()
    assert second.patient_id == "PT-LATE"

# -----------------------------------------------------------------------------
# 7. Status Update and Queue Recalculation
# -----------------------------------------------------------------------------
def test_status_update_and_history():
    # Register patient
    res = client.post("/api/patients", json={
        "id": "PT-STATUS-01",
        "name": "Status Tester",
        "age": 40,
        "chief_complaint": "Ear pain",
        "symptoms": ["Earache"]
    })
    assert res.status_code == 201

    # Check initially waiting
    q_res = client.get("/api/queue").json()
    assert any(p["patient_id"] == "PT-STATUS-01" for p in q_res["queue"])

    # Update to Under Review
    patch_res = client.patch("/api/patients/PT-STATUS-01/status", json={
        "new_status": "Under Review",
        "notes": "Doctor called to Cubicle 3"
    })
    assert patch_res.status_code == 200

    # Update to Assessment Completed
    patch_res2 = client.patch("/api/patients/PT-STATUS-01/status", json={
        "new_status": "Assessment Completed",
        "notes": "Antibiotics prescribed and discharged"
    })
    assert patch_res2.status_code == 200

    # Verify patient is NO LONGER in active waiting queue
    q_res2 = client.get("/api/queue").json()
    assert not any(p["patient_id"] == "PT-STATUS-01" for p in q_res2["queue"])

    # Verify patient STILL EXISTS in database history with full audit logs
    det_res = client.get("/api/patients/PT-STATUS-01").json()
    assert det_res["workflow_status"] == "Assessment Completed"
    assert len(det_res["status_history"]) >= 3

# -----------------------------------------------------------------------------
# 8. Demo Data Deduplication
# -----------------------------------------------------------------------------
def test_demo_data_loader_deduplication():
    # First load
    res1 = client.post("/api/demo/load").json()
    assert res1["success"] is True
    assert res1["added_count"] == 8
    assert res1["skipped_count"] == 0

    # Second load attempt (should skip all 8)
    res2 = client.post("/api/demo/load").json()
    assert res2["success"] is True
    assert res2["added_count"] == 0
    assert res2["skipped_count"] == 8

    # Verify database has exactly 8 records
    all_res = client.get("/api/patients").json()
    assert all_res["count"] == 8

# -----------------------------------------------------------------------------
# 9. Heuristic NLP Symptom Extraction
# -----------------------------------------------------------------------------
def test_nlp_symptom_extraction():
    text = "I have been experiencing crushing chest pain and shortness of breath since 2 hours"
    res = client.post("/api/llm/extract", json={"text": text})
    assert res.status_code == 200
    data = res.json()
    assert any("chest pain" in s.lower() for s in data["symptoms"])
    assert any("shortness of breath" in s.lower() or "dyspnea" in s.lower() for s in data["symptoms"])
    assert data["duration"] is not None
    assert "2 hours" in data["duration"]
    assert "clinical diagnosis" in data["disclaimer"]
