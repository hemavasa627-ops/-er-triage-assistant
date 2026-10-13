"""
Demo Data generator for ER Triage Assistant.
Provides realistic but entirely fictional synthetic emergency patient records.
Includes duplicate prevention check.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone

def get_demo_patients() -> List[Dict[str, Any]]:
    """Returns 8 diverse illustrative demo patient records with staggered arrival times."""
    now = datetime.now(timezone.utc)
    
    return [
        {
            "id": "DEMO-001",
            "name": "Robert Vance (Demo)",
            "age": 62,
            "chief_complaint": "Crushing retrosternal chest pain radiating to left arm and jaw",
            "symptoms": ["Crushing chest pain", "Radiating left arm pain", "Profuse diaphoresis", "Shortness of breath"],
            "symptom_duration": "45 minutes",
            "arrival_time": (now - timedelta(minutes=40)).isoformat(),
            "workflow_status": "Waiting",
            "is_demo_record": True,
            "vitals": {
                "temperature": 37.1,
                "heart_rate": 128.0,
                "respiratory_rate": 26.0,
                "systolic_bp": 84.0,
                "diastolic_bp": 54.0,
                "oxygen_saturation": 88.0
            }
        },
        {
            "id": "DEMO-002",
            "name": "Elena Rostova (Demo)",
            "age": 45,
            "chief_complaint": "Acute severe shortness of breath with audible expiratory wheeze",
            "symptoms": ["Shortness of breath", "Severe wheezing", "Difficulty speaking full sentences"],
            "symptom_duration": "2 hours",
            "arrival_time": (now - timedelta(minutes=35)).isoformat(),
            "workflow_status": "Waiting",
            "is_demo_record": True,
            "vitals": {
                "temperature": 37.4,
                "heart_rate": 114.0,
                "respiratory_rate": 28.0,
                "systolic_bp": 142.0,
                "diastolic_bp": 88.0,
                "oxygen_saturation": 91.0
            }
        },
        {
            "id": "DEMO-003",
            "name": "Lucas Meyer (Demo)",
            "age": 7,
            "chief_complaint": "Pediatric high fever with extreme lethargy and unresponsiveness to verbal cues",
            "symptoms": ["High fever", "Lethargy", "Stiff neck", "Vomiting"],
            "symptom_duration": "6 hours",
            "arrival_time": (now - timedelta(minutes=30)).isoformat(),
            "workflow_status": "Waiting",
            "is_demo_record": True,
            "vitals": {
                "temperature": 40.1,
                "heart_rate": 145.0,
                "respiratory_rate": 30.0,
                "systolic_bp": 102.0,
                "diastolic_bp": 64.0,
                "oxygen_saturation": 96.0
            }
        },
        {
            "id": "DEMO-004",
            "name": "Marcus Chen (Demo)",
            "age": 58,
            "chief_complaint": "Sudden onset right facial droop and right arm weakness (FAST positive)",
            "symptoms": ["Facial droop", "Arm weakness", "Slurred speech"],
            "symptom_duration": "50 minutes",
            "arrival_time": (now - timedelta(minutes=25)).isoformat(),
            "workflow_status": "Waiting",
            "is_demo_record": True,
            "vitals": {
                "temperature": 36.8,
                "heart_rate": 86.0,
                "respiratory_rate": 16.0,
                "systolic_bp": 178.0,
                "diastolic_bp": 98.0,
                "oxygen_saturation": 97.0
            }
        },
        {
            "id": "DEMO-005",
            "name": "Sarah Jenkins (Demo)",
            "age": 29,
            "chief_complaint": "Deep forearm laceration from broken window glass with active moderate bleeding",
            "symptoms": ["Deep laceration", "Continuous moderate bleeding", "Sharp localized pain"],
            "symptom_duration": "30 minutes",
            "arrival_time": (now - timedelta(minutes=20)).isoformat(),
            "workflow_status": "Waiting",
            "is_demo_record": True,
            "vitals": {
                "temperature": 36.7,
                "heart_rate": 92.0,
                "respiratory_rate": 18.0,
                "systolic_bp": 122.0,
                "diastolic_bp": 78.0,
                "oxygen_saturation": 99.0
            }
        },
        {
            "id": "DEMO-006",
            "name": "David Miller (Demo)",
            "age": 51,
            "chief_complaint": "Persistent crampy lower right quadrant abdominal pain and nausea",
            "symptoms": ["Abdominal pain", "Nausea", "Fever", "Loss of appetite"],
            "symptom_duration": "24 hours",
            "arrival_time": (now - timedelta(minutes=15)).isoformat(),
            "workflow_status": "Waiting",
            "is_demo_record": True,
            "vitals": {
                "temperature": 38.6,
                "heart_rate": 96.0,
                "respiratory_rate": 19.0,
                "systolic_bp": 134.0,
                "diastolic_bp": 82.0,
                "oxygen_saturation": 98.0
            }
        },
        {
            "id": "DEMO-007",
            "name": "Priya Sharma (Demo)",
            "age": 23,
            "chief_complaint": "Inversion injury to right ankle while playing sports, moderate edema",
            "symptoms": ["Sprained ankle", "Inability to bear full weight", "Localized swelling"],
            "symptom_duration": "1 hour",
            "arrival_time": (now - timedelta(minutes=10)).isoformat(),
            "workflow_status": "Waiting",
            "is_demo_record": True,
            "vitals": {
                "temperature": 36.6,
                "heart_rate": 74.0,
                "respiratory_rate": 14.0,
                "systolic_bp": 118.0,
                "diastolic_bp": 74.0,
                "oxygen_saturation": 99.0
            }
        },
        {
            "id": "DEMO-008",
            "name": "Carlos Gomez (Demo)",
            "age": 36,
            "chief_complaint": "Mild rhinorrhea, scratchy sore throat, and low-grade fatigue",
            "symptoms": ["Cough", "Mild sore throat", "Nasal congestion"],
            "symptom_duration": "3 days",
            "arrival_time": (now - timedelta(minutes=5)).isoformat(),
            "workflow_status": "Waiting",
            "is_demo_record": True,
            "vitals": {
                "temperature": 37.1,
                "heart_rate": 72.0,
                "respiratory_rate": 14.0,
                "systolic_bp": 120.0,
                "diastolic_bp": 78.0,
                "oxygen_saturation": 98.0
            }
        }
    ]
