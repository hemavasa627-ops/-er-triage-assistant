"""
Rule Engine module for ER Triage Assistant.
Applies DMGT-inspired logical IF/THEN propositional rules for provisional triage classification.

Educational Prototype Disclaimer:
These rules demonstrate logical proposition evaluation and discrete triage classification.
They are NOT clinically validated medical guidelines. Real emergency triage must be performed
by certified medical personnel.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional

RULES_PATH = Path(__file__).resolve().parent.parent / "shared" / "triage_rules.json"

class DMGTLogicalRuleEngine:
    """
    Evaluates patient symptoms and vital signs against configured propositional logic rules.
    Architecture:
    Rule P => Q
    Where P is a compound proposition (e.g. OxygenSaturation < 90 OR 'unresponsive' in symptoms)
    and Q is the resulting provisional priority state.
    """

    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or RULES_PATH
        self.rules_config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """Loads rules from editable JSON configuration."""
        if self.config_path.exists():
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        else:
            raise FileNotFoundError(f"Triage rules configuration file not found at {self.config_path}")

    def reload_config(self):
        """Allows hot-reloading of modified rule configuration."""
        self.rules_config = self._load_config()

    def evaluate(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates a patient's clinical inputs and assigns a provisional category.
        
        Returns:
            Dict containing priority_level, priority_name, priority_code,
            rules_triggered, rule_reasons, factors_considered, missing_information,
            and clinical_disclaimer.
        """
        vitals = patient_data.get("vitals") or {}
        symptoms = [s.strip().lower() for s in (patient_data.get("symptoms") or [])]
        chief_complaint = (patient_data.get("chief_complaint") or "").strip().lower()
        combined_text = " ".join(symptoms + [chief_complaint])

        factors_considered: List[str] = []
        missing_information: List[str] = []

        # Analyze vitals presence
        spo2 = vitals.get("oxygen_saturation")
        hr = vitals.get("heart_rate")
        rr = vitals.get("respiratory_rate")
        sbp = vitals.get("systolic_bp")
        dbp = vitals.get("diastolic_bp")
        temp = vitals.get("temperature")

        if spo2 is not None:
            factors_considered.append(f"Oxygen Saturation (SpO2): {spo2:.1f}%")
        else:
            missing_information.append("Oxygen Saturation (SpO2) is not recorded")

        if hr is not None:
            factors_considered.append(f"Heart Rate: {hr:.0f} bpm")
        else:
            missing_information.append("Heart Rate is not recorded")

        if rr is not None:
            factors_considered.append(f"Respiratory Rate: {rr:.0f} breaths/min")
        else:
            missing_information.append("Respiratory Rate is not recorded")

        if sbp is not None and dbp is not None:
            factors_considered.append(f"Blood Pressure: {sbp:.0f}/{dbp:.0f} mmHg")
        elif sbp is not None:
            factors_considered.append(f"Systolic Blood Pressure: {sbp:.0f} mmHg")
            missing_information.append("Diastolic Blood Pressure is not recorded")
        else:
            missing_information.append("Blood Pressure is not recorded")

        if temp is not None:
            factors_considered.append(f"Body Temperature: {temp:.1f} °C")
        else:
            missing_information.append("Body Temperature is not recorded")

        if symptoms:
            factors_considered.append(f"Reported Symptoms: {', '.join(patient_data.get('symptoms', []))}")
        if chief_complaint:
            factors_considered.append(f"Chief Complaint: {patient_data.get('chief_complaint')}")

        categories = self.rules_config.get("priority_categories", {})
        emergency_rules = self.rules_config.get("emergency_warning_rules", [])
        high_concern_rules = self.rules_config.get("high_concern_rules", [])
        moderate_concern_rules = self.rules_config.get("moderate_concern_rules", [])
        default_rule = self.rules_config.get("default_rule", {})

        triggered_rule_ids: List[str] = []
        rule_reasons: List[str] = []

        # -------------------------------------------------------------------------
        # STAGE 1: Emergency Warning Conditions (Level 1 - Red / Immediate)
        # -------------------------------------------------------------------------
        for rule in emergency_rules:
            matched = False
            # Check vitals criteria
            if "criteria" in rule:
                crit = rule["criteria"]
                if "vitals.oxygen_saturation_max" in crit and spo2 is not None:
                    if spo2 <= crit["vitals.oxygen_saturation_max"]:
                        matched = True
                if "vitals.systolic_bp_max" in crit and sbp is not None:
                    if sbp <= crit["vitals.systolic_bp_max"]:
                        matched = True
                if "vitals.heart_rate_max_or_min" in crit and hr is not None:
                    lim = crit["vitals.heart_rate_max_or_min"]
                    if hr <= lim.get("min", 0) or hr >= lim.get("max", 999):
                        matched = True

            # Check keyword match
            keywords = rule.get("symptom_keywords", [])
            for kw in keywords:
                if kw.lower() in combined_text:
                    matched = True
                    break

            if matched:
                triggered_rule_ids.append(rule["id"])
                rule_reasons.append(f"[{rule['id']}] {rule['condition_name']}: {rule['explanation']}")

        if triggered_rule_ids:
            cat = categories.get("LEVEL_1_RESUSCITATION", {})
            return {
                "priority_level": cat.get("level", 1),
                "priority_name": cat.get("name", "Level 1 - Immediate / Resuscitation"),
                "priority_code": cat.get("code", "RED"),
                "rules_triggered": triggered_rule_ids,
                "rule_reasons": rule_reasons,
                "factors_considered": factors_considered,
                "missing_information": missing_information,
                "clinical_disclaimer": self.rules_config.get("disclaimer", "")
            }

        # -------------------------------------------------------------------------
        # STAGE 2: High Concern Indicators (Level 2 - Orange / Emergent)
        # -------------------------------------------------------------------------
        for rule in high_concern_rules:
            matched = False
            if "criteria" in rule:
                crit = rule["criteria"]
                if "vitals.oxygen_saturation_range" in crit and spo2 is not None:
                    low, high = crit["vitals.oxygen_saturation_range"]
                    if low <= spo2 <= high:
                        matched = True
                if "vitals.temperature_min" in crit and temp is not None:
                    if temp >= crit["vitals.temperature_min"]:
                        matched = True

            keywords = rule.get("symptom_keywords", [])
            for kw in keywords:
                if kw.lower() in combined_text:
                    matched = True
                    break

            if matched:
                triggered_rule_ids.append(rule["id"])
                rule_reasons.append(f"[{rule['id']}] {rule['condition_name']}: {rule['explanation']}")

        if triggered_rule_ids:
            cat = categories.get("LEVEL_2_EMERGENT", {})
            return {
                "priority_level": cat.get("level", 2),
                "priority_name": cat.get("name", "Level 2 - Emergent / Very Urgent"),
                "priority_code": cat.get("code", "ORANGE"),
                "rules_triggered": triggered_rule_ids,
                "rule_reasons": rule_reasons,
                "factors_considered": factors_considered,
                "missing_information": missing_information,
                "clinical_disclaimer": self.rules_config.get("disclaimer", "")
            }

        # -------------------------------------------------------------------------
        # STAGE 3: Moderate Concern Rules (Level 3 - Yellow / Urgent)
        # -------------------------------------------------------------------------
        for rule in moderate_concern_rules:
            matched = False
            if "criteria" in rule:
                crit = rule["criteria"]
                if "vitals.temperature_range" in crit and temp is not None:
                    low, high = crit["vitals.temperature_range"]
                    if low <= temp <= high:
                        matched = True

            keywords = rule.get("symptom_keywords", [])
            for kw in keywords:
                if kw.lower() in combined_text:
                    matched = True
                    break

            if matched:
                triggered_rule_ids.append(rule["id"])
                rule_reasons.append(f"[{rule['id']}] {rule['condition_name']}: {rule['explanation']}")

        if triggered_rule_ids:
            cat = categories.get("LEVEL_3_URGENT", {})
            return {
                "priority_level": cat.get("level", 3),
                "priority_name": cat.get("name", "Level 3 - Urgent"),
                "priority_code": cat.get("code", "YELLOW"),
                "rules_triggered": triggered_rule_ids,
                "rule_reasons": rule_reasons,
                "factors_considered": factors_considered,
                "missing_information": missing_information,
                "clinical_disclaimer": self.rules_config.get("disclaimer", "")
            }

        # -------------------------------------------------------------------------
        # STAGE 4: Default Routine Presentation (Level 4 - Green / Semi-Urgent)
        # -------------------------------------------------------------------------
        cat = categories.get("LEVEL_4_SEMI_URGENT", {})
        triggered_rule_ids.append(default_rule.get("id", "RULE_NON_URGENT_ROUTINE"))
        rule_reasons.append(f"[{default_rule.get('id', 'RULE_NON_URGENT_ROUTINE')}] {default_rule.get('condition_name', 'Non-Urgent Routine Presentation')}: {default_rule.get('explanation', '')}")

        return {
            "priority_level": cat.get("level", 4),
            "priority_name": cat.get("name", "Level 4 - Less Urgent / Non-Emergency"),
            "priority_code": cat.get("code", "GREEN"),
            "rules_triggered": triggered_rule_ids,
            "rule_reasons": rule_reasons,
            "factors_considered": factors_considered,
            "missing_information": missing_information,
            "clinical_disclaimer": self.rules_config.get("disclaimer", "")
        }
