"""
Demonstration Severity Scoring Engine for ER Triage Assistant.
Calculates an illustrative acuity score (0 - 100) from validated, present vital signs
and reported symptom flags using configurable weighted physiological deviation metrics.

CRITICAL DISCLAIMER:
This score is an illustrative demonstration metric designed for educational coursework.
It is NOT a probability of death, NOT a clinical risk score, and NOT a diagnostic tool.
Numerical scores can NEVER override clinical emergency warning conditions.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

WEIGHTS_PATH = Path(__file__).resolve().parent.parent / "shared" / "scoring_weights.json"

class SeverityScoringEngine:
    """
    Computes demonstrative severity scores with dynamic weight normalization over present factors.
    Formula:
        Score = ( Sum(Metric_Score_i * Weight_i) / Sum(Present_Weights) ) + Symptom_Acuity_Bonus
        clamped to [0.0, 100.0].
    """

    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or WEIGHTS_PATH
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        if self.config_path.exists():
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def _score_spo2(self, value: float) -> Tuple[float, str]:
        """Calculates SpO2 severity: 95-100% is 0 pts; <90% is 90-100 pts."""
        if value >= 95.0:
            return 0.0, f"SpO2 {value:.1f}% is in optimal range (>=95%)"
        elif value >= 93.0:
            return 30.0, f"SpO2 {value:.1f}% indicates mild desaturation (93-94%)"
        elif value >= 90.0:
            return 65.0, f"SpO2 {value:.1f}% indicates moderate hypoxemia (90-92%)"
        else:
            return 95.0, f"SpO2 {value:.1f}% indicates critical hypoxemia (<90%)"

    def _score_hr(self, value: float) -> Tuple[float, str]:
        """Calculates HR severity: 60-100 is 0 pts; tachy/bradycardia increases score."""
        if 60.0 <= value <= 100.0:
            return 0.0, f"Heart rate {value:.0f} bpm is within normal resting range"
        elif 101.0 <= value <= 120.0:
            return 35.0, f"Heart rate {value:.0f} bpm indicates mild tachycardia"
        elif 121.0 <= value <= 145.0:
            return 70.0, f"Heart rate {value:.0f} bpm indicates marked tachycardia"
        elif value > 145.0:
            return 90.0, f"Heart rate {value:.0f} bpm indicates severe tachycardia"
        elif 45.0 <= value < 60.0:
            return 40.0, f"Heart rate {value:.0f} bpm indicates mild-to-moderate bradycardia"
        else:
            return 85.0, f"Heart rate {value:.0f} bpm indicates severe bradycardia (<45 bpm)"

    def _score_sbp(self, value: float) -> Tuple[float, str]:
        """Calculates Systolic BP severity."""
        if 100.0 <= value <= 135.0:
            return 0.0, f"Systolic BP {value:.0f} mmHg is within normal target"
        elif 136.0 <= value <= 160.0:
            return 25.0, f"Systolic BP {value:.0f} mmHg indicates stage 1 hypertension"
        elif 161.0 <= value <= 190.0:
            return 60.0, f"Systolic BP {value:.0f} mmHg indicates stage 2 hypertension"
        elif value > 190.0:
            return 85.0, f"Systolic BP {value:.0f} mmHg indicates hypertensive urgency/emergency"
        elif 85.0 <= value < 100.0:
            return 45.0, f"Systolic BP {value:.0f} mmHg indicates borderline hypotension"
        else:
            return 95.0, f"Systolic BP {value:.0f} mmHg indicates severe hypotensive shock (<85 mmHg)"

    def _score_rr(self, value: float) -> Tuple[float, str]:
        """Calculates Respiratory Rate severity."""
        if 12.0 <= value <= 20.0:
            return 0.0, f"Respiratory rate {value:.0f} breaths/min is normal"
        elif 21.0 <= value <= 26.0:
            return 35.0, f"Respiratory rate {value:.0f} breaths/min indicates mild tachypnea"
        elif 27.0 <= value <= 32.0:
            return 70.0, f"Respiratory rate {value:.0f} breaths/min indicates severe tachypnea"
        elif value > 32.0:
            return 90.0, f"Respiratory rate {value:.0f} breaths/min indicates extreme tachypnea"
        else:
            return 85.0, f"Respiratory rate {value:.0f} breaths/min indicates severe bradypnea (<12 bpm)"

    def _score_temp(self, value: float) -> Tuple[float, str]:
        """Calculates Temperature severity in Celsius."""
        if 36.5 <= value <= 37.5:
            return 0.0, f"Temperature {value:.1f} °C is normothermic"
        elif 37.6 <= value <= 38.4:
            return 20.0, f"Temperature {value:.1f} °C indicates low-grade fever"
        elif 38.5 <= value <= 39.4:
            return 50.0, f"Temperature {value:.1f} °C indicates moderate pyrexia"
        elif value >= 39.5:
            return 80.0, f"Temperature {value:.1f} °C indicates high-grade hyperpyrexia (>=39.5 °C)"
        else:
            return 75.0, f"Temperature {value:.1f} °C indicates hypothermia (<36.5 °C)"

    def calculate_score(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates illustrative severity score and detailed factor breakdown.
        """
        vitals = patient_data.get("vitals") or {}
        symptoms = [s.strip().lower() for s in (patient_data.get("symptoms") or [])]
        chief_complaint = (patient_data.get("chief_complaint") or "").strip().lower()
        combined_text = " ".join(symptoms + [chief_complaint])

        weights_cfg = self.config.get("vital_sign_weights", {})
        
        contributing_factors: List[Dict[str, Any]] = []
        missing_metrics: List[str] = []
        total_weighted_points = 0.0
        total_weights_present = 0.0

        # Evaluate oxygen saturation
        spo2 = vitals.get("oxygen_saturation")
        spo2_w = weights_cfg.get("oxygen_saturation", {}).get("weight", 0.28)
        if spo2 is not None:
            pts, desc = self._score_spo2(spo2)
            contributing_factors.append({
                "metric": "Oxygen Saturation (SpO2)",
                "raw_value": f"{spo2:.1f}%",
                "subscore": pts,
                "weight": spo2_w,
                "description": desc
            })
            total_weighted_points += pts * spo2_w
            total_weights_present += spo2_w
        else:
            missing_metrics.append("Oxygen Saturation (SpO2)")

        # Evaluate heart rate
        hr = vitals.get("heart_rate")
        hr_w = weights_cfg.get("heart_rate", {}).get("weight", 0.22)
        if hr is not None:
            pts, desc = self._score_hr(hr)
            contributing_factors.append({
                "metric": "Heart Rate",
                "raw_value": f"{hr:.0f} bpm",
                "subscore": pts,
                "weight": hr_w,
                "description": desc
            })
            total_weighted_points += pts * hr_w
            total_weights_present += hr_w
        else:
            missing_metrics.append("Heart Rate")

        # Evaluate systolic BP
        sbp = vitals.get("systolic_bp")
        sbp_w = weights_cfg.get("systolic_blood_pressure", {}).get("weight", 0.20)
        if sbp is not None:
            pts, desc = self._score_sbp(sbp)
            contributing_factors.append({
                "metric": "Systolic Blood Pressure",
                "raw_value": f"{sbp:.0f} mmHg",
                "subscore": pts,
                "weight": sbp_w,
                "description": desc
            })
            total_weighted_points += pts * sbp_w
            total_weights_present += sbp_w
        else:
            missing_metrics.append("Systolic Blood Pressure")

        # Evaluate respiratory rate
        rr = vitals.get("respiratory_rate")
        rr_w = weights_cfg.get("respiratory_rate", {}).get("weight", 0.18)
        if rr is not None:
            pts, desc = self._score_rr(rr)
            contributing_factors.append({
                "metric": "Respiratory Rate",
                "raw_value": f"{rr:.0f} breaths/min",
                "subscore": pts,
                "weight": rr_w,
                "description": desc
            })
            total_weighted_points += pts * rr_w
            total_weights_present += rr_w
        else:
            missing_metrics.append("Respiratory Rate")

        # Evaluate temperature
        temp = vitals.get("temperature")
        temp_w = weights_cfg.get("temperature", {}).get("weight", 0.12)
        if temp is not None:
            pts, desc = self._score_temp(temp)
            contributing_factors.append({
                "metric": "Body Temperature",
                "raw_value": f"{temp:.1f} °C",
                "subscore": pts,
                "weight": temp_w,
                "description": desc
            })
            total_weighted_points += pts * temp_w
            total_weights_present += temp_w
        else:
            missing_metrics.append("Body Temperature")

        # Base vitals score (normalized over present weights)
        if total_weights_present > 0:
            vitals_score = total_weighted_points / total_weights_present
        else:
            # When zero vitals are present, base score is zero; relies on symptoms
            vitals_score = 0.0

        # Symptom severity bonus
        symptom_bonus = 0.0
        high_risk_keywords = ["chest pain", "shortness of breath", "unconscious", "collapse", "severe bleeding", "stridor", "cyanosis"]
        medium_risk_keywords = ["fever", "vomiting", "fracture", "deep laceration", "abdominal pain", "asthma", "migraine"]

        matched_high = [kw for kw in high_risk_keywords if kw in combined_text]
        matched_med = [kw for kw in medium_risk_keywords if kw in combined_text]

        if matched_high:
            bonus = min(25.0, len(matched_high) * 12.0)
            symptom_bonus += bonus
            contributing_factors.append({
                "metric": "High-Risk Symptom Keywords",
                "raw_value": ", ".join(matched_high),
                "subscore": bonus,
                "weight": 0.0,
                "description": f"Presence of high-risk keywords added +{bonus:.1f} illustrative points."
            })

        if matched_med:
            bonus = min(15.0, len(matched_med) * 6.0)
            symptom_bonus += bonus
            contributing_factors.append({
                "metric": "Moderate-Risk Symptom Keywords",
                "raw_value": ", ".join(matched_med),
                "subscore": bonus,
                "weight": 0.0,
                "description": f"Presence of moderate-risk keywords added +{bonus:.1f} illustrative points."
            })

        final_raw_score = vitals_score + symptom_bonus
        final_score = round(max(0.0, min(100.0, final_raw_score)), 1)

        limitations: List[str] = [
            "Demonstration metric only; not validated for clinical risk assessment.",
            "Vital sign deviations are weighted only across verified present values."
        ]
        if missing_metrics:
            limitations.append(f"Missing {len(missing_metrics)} vital signs ({', '.join(missing_metrics)}). The score is an approximation based solely on present data.")

        return {
            "severity_score": final_score,
            "vitals_normalized_score": round(vitals_score, 1),
            "symptom_bonus_points": round(symptom_bonus, 1),
            "contributing_factors": contributing_factors,
            "missing_metrics": missing_metrics,
            "present_metrics_count": len(contributing_factors) - (1 if matched_high else 0) - (1 if matched_med else 0),
            "limitations": limitations,
            "formula_documentation": "Score = (Sum(Metric_Subscore * Weight) / Sum(Present_Weights)) + Symptom_Bonus [Bounded 0-100]"
        }
