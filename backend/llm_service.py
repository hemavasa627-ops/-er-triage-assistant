"""
LLM Symptom Extraction Service for ER Triage Assistant.
Parses natural language symptom descriptions into structured clinical attributes.

Educational Prototype & Safety Constraints:
1. Extracts reported symptoms and stated durations without hallucination or invention.
2. Explicitly notes uncertain or ambiguous information.
3. STRICT SAFETY RULE: Does NOT produce medical diagnoses or final clinical priority tiers.
4. Operates in two modes:
   - Live LLM Mode: When LLM_API_KEY is configured in the environment.
   - Intelligent Heuristic NLP Mode: Standalone demo mode when no API key is present.
"""

import os
import re
import json
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error

DISCLAIMER_TEXT = (
    "AI/LLM-assisted symptom extraction is an illustrative demonstration feature. "
    "It only extracts patient-reported tokens and does NOT constitute clinical diagnosis, "
    "nor does it determine medical triage priority. All extracted data must be reviewed by triage staff."
)

class SymptomExtractionService:
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.provider = os.getenv("LLM_PROVIDER", "auto").lower()

    def extract_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extracts structured symptom attributes from unstructured text.
        Falls back seamlessly to local rule-based heuristic extraction if no LLM key is configured.
        """
        if not text or not text.strip():
            return {
                "symptoms": [],
                "duration": None,
                "explicit_details": [],
                "uncertain_or_missing": ["No symptom description text provided."],
                "disclaimer": DISCLAIMER_TEXT
            }

        # If LLM API key is available, attempt LLM call
        if self.api_key and self.provider != "heuristic_only":
            try:
                llm_result = self._call_llm_api(text.strip())
                if llm_result:
                    return llm_result
            except Exception as e:
                # Log error and gracefully fall back to heuristic NLP parser
                print(f"[LLM Service Warning] Live API failed ({e}), falling back to local heuristic NLP extractor.")

        # Local intelligent heuristic extractor (Demo Mode)
        return self._heuristic_nlp_extract(text.strip())

    def _call_llm_api(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Calls OpenAI-compatible or Gemini endpoint if configured.
        """
        # If OpenAI endpoint
        endpoint = os.getenv("LLM_ENDPOINT", "https://api.openai.com/v1/chat/completions")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        system_prompt = (
            "You are a medical NLP information extraction assistant in an educational triage prototype. "
            "Your task is strictly to extract reported symptoms, stated duration, and explicit details "
            "from the patient's statement into structured JSON. "
            "DO NOT diagnose diseases. DO NOT assign priority levels. "
            "Never invent vital signs or symptoms not in the text. "
            "Output JSON with keys: symptoms (array of strings), duration (string or null), "
            "explicit_details (array of strings), uncertain_or_missing (array of strings)."
        )

        payload = {
            "model": os.getenv("LLM_MODEL", "gpt-3.5-turbo"),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract symptoms from: {text}"}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status == 200:
                body = json.loads(response.read().decode("utf-8"))
                content = body["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                parsed["disclaimer"] = DISCLAIMER_TEXT
                return parsed
        return None

    def _heuristic_nlp_extract(self, text: str) -> Dict[str, Any]:
        """
        Transparent rule-based heuristic extractor for demo mode.
        Identifies clinical symptom keywords, duration expressions, and flags uncertainties.
        """
        clean_text = text.lower()

        # Clinical symptom keyword taxonomy
        symptom_lexicon = [
            ("crushing chest pain", "Crushing chest pain"),
            ("chest pain", "Chest pain"),
            ("chest discomfort", "Chest discomfort"),
            ("chest pressure", "Chest pressure"),
            ("difficulty breathing", "Difficulty breathing (dyspnea)"),
            ("shortness of breath", "Shortness of breath"),
            ("cannot breathe", "Severe shortness of breath"),
            ("stridor", "Stridor / upper airway sound"),
            ("wheezing", "Wheezing"),
            ("cough", "Cough"),
            ("high fever", "High fever"),
            ("fever", "Fever / pyrexia"),
            ("chills", "Chills / rigors"),
            ("headache", "Headache"),
            ("severe headache", "Severe acute headache"),
            ("migraine", "Migraine"),
            ("dizziness", "Dizziness / lightheadedness"),
            ("confusion", "Altered mental status / confusion"),
            ("slurred speech", "Slurred speech"),
            ("facial droop", "Facial droop"),
            ("numbness", "Numbness / paresthesia"),
            ("arm weakness", "Unilateral weakness"),
            ("abdominal pain", "Abdominal pain"),
            ("stomach ache", "Abdominal pain"),
            ("vomiting blood", "Hematemesis (vomiting blood)"),
            ("vomiting", "Vomiting / emesis"),
            ("nausea", "Nausea"),
            ("diarrhea", "Diarrhea"),
            ("sprained ankle", "Sprained ankle"),
            ("ankle pain", "Ankle pain"),
            ("leg pain", "Leg pain"),
            ("back pain", "Back pain"),
            ("rash", "Cutaneous rash"),
            ("bleeding", "Active bleeding"),
            ("cut", "Laceration / cut"),
            ("laceration", "Deep laceration"),
            ("fatigue", "Generalized fatigue"),
            ("lethargy", "Lethargy / extreme drowsiness")
        ]

        extracted_symptoms = []
        for phrase, label in symptom_lexicon:
            if re.search(r'\b' + re.escape(phrase) + r'\b', clean_text):
                if label not in extracted_symptoms:
                    extracted_symptoms.append(label)

        # Fallback if no specific keyword matched: use clauses
        if not extracted_symptoms:
            # Extract basic subject-predicate phrases
            tokens = [w.strip() for w in re.split(r'[,.;]|\band\b', text) if len(w.strip()) > 3]
            if tokens:
                extracted_symptoms.append(tokens[0].capitalize())

        # Duration detection
        duration_pattern = r'(\b(?:for|since|past|last|around)?\s*(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|a few|several)\s*(?:minutes?|hours?|hrs?|days?|weeks?|months?)\b)'
        duration_match = re.search(duration_pattern, clean_text)
        duration = duration_match.group(1).strip() if duration_match else None

        # Explicit details detection
        explicit_details = []
        if "radiat" in clean_text:
            explicit_details.append("Pain radiating pattern mentioned.")
        if "worse" in clean_text or "aggravat" in clean_text:
            explicit_details.append("Aggravating factors mentioned.")
        if "sudden" in clean_text:
            explicit_details.append("Sudden onset reported.")
        if "gradual" in clean_text:
            explicit_details.append("Gradual onset reported.")

        # Uncertain or missing elements
        uncertain_or_missing = []
        if not duration:
            uncertain_or_missing.append("Symptom onset duration was not specified in the text.")
        if not any(k in clean_text for k in ["severe", "mild", "moderate", "scale", "10"]):
            uncertain_or_missing.append("Pain/symptom intensity scale (1-10) was not reported.")
        uncertain_or_missing.append("Physiological vital signs must be recorded through physical examination.")

        return {
            "symptoms": extracted_symptoms,
            "duration": duration,
            "explicit_details": explicit_details,
            "uncertain_or_missing": uncertain_or_missing,
            "disclaimer": DISCLAIMER_TEXT
        }
