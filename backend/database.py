"""
SQLite Database module for ER Triage Assistant.
Manages SQLite connection, schema creation, and database utilities.
Educational prototype: Stores fictional demo patient data and audit logs.
"""

import sqlite3
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

DB_DIR = Path(__file__).resolve().parent
DB_PATH = DB_DIR / "triage.db"

def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection configured with Row factory."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initializes tables for patients, vitals, triage assessments, and status audit logs."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Patients table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        chief_complaint TEXT NOT NULL,
        symptoms TEXT NOT NULL,
        symptom_duration TEXT,
        arrival_time TEXT NOT NULL,
        workflow_status TEXT NOT NULL DEFAULT 'Waiting',
        is_demo_record INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # Vitals table (missing values stored explicitly as NULL, NEVER defaulted to normal)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vitals (
        patient_id TEXT PRIMARY KEY,
        temperature REAL,
        heart_rate REAL,
        respiratory_rate REAL,
        systolic_bp REAL,
        diastolic_bp REAL,
        oxygen_saturation REAL,
        recorded_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
    """)

    # Triage assessment results
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS triage_results (
        patient_id TEXT PRIMARY KEY,
        priority_level INTEGER NOT NULL,
        priority_name TEXT NOT NULL,
        priority_code TEXT NOT NULL,
        severity_score REAL NOT NULL,
        rules_triggered TEXT NOT NULL,
        rule_reasons TEXT NOT NULL,
        factors_considered TEXT NOT NULL,
        missing_information TEXT NOT NULL,
        clinical_disclaimer TEXT NOT NULL,
        evaluated_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
    """)

    # Audit log / Status changes history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        notes TEXT,
        changed_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
