package er.triage;

import java.time.Instant;
import java.util.*;

/**
 * Service orchestrating ER triage patient registration, rule evaluation,
 * priority queue management, and workflow lifecycle.
 * Demonstrates Service Layer Pattern and Single Responsibility Principle in OOP.
 */
public class PatientService {
    private final Map<String, Patient> patientRegistry = new LinkedHashMap<>();
    private final PriorityQueueManager queueManager = new PriorityQueueManager();

    public PatientService() {
    }

    public synchronized Patient registerPatient(Patient patient) {
        Objects.requireNonNull(patient, "Patient cannot be null");
        if (patientRegistry.containsKey(patient.getId())) {
            throw new IllegalArgumentException("Patient with ID " + patient.getId() + " already exists");
        }

        // 1. Evaluate DMGT rules & severity scoring
        TriageResult result = evaluateTriage(patient);
        patient.setTriageResult(result);

        // 2. Persist in registry
        patientRegistry.put(patient.getId(), patient);

        // 3. Insert into ADSA Priority Queue if active
        if (Patient.STATUS_WAITING.equals(patient.getWorkflowStatus()) ||
            Patient.STATUS_UNDER_REVIEW.equals(patient.getWorkflowStatus())) {
            queueManager.insertOrUpdate(patient, result);
        }

        return patient;
    }

    public synchronized Optional<Patient> findPatientById(String patientId) {
        return Optional.ofNullable(patientRegistry.get(patientId));
    }

    public synchronized List<Patient> getAllPatients() {
        return new ArrayList<>(patientRegistry.values());
    }

    public synchronized List<PriorityQueueManager.QueueEntry> getActiveQueue() {
        return queueManager.getRankedQueue();
    }

    public synchronized int getQueuePosition(String patientId) {
        return queueManager.getPosition(patientId);
    }

    public synchronized boolean updatePatientStatus(String patientId, String newStatus) {
        Patient patient = patientRegistry.get(patientId);
        if (patient == null) {
            return false;
        }

        patient.setWorkflowStatus(newStatus);

        if (Patient.STATUS_COMPLETED.equals(newStatus)) {
            // Patient review completed: remove from active waiting queue, preserve record in registry!
            queueManager.remove(patientId);
        } else {
            // Re-insert or update in active queue
            queueManager.insertOrUpdate(patient, patient.getTriageResult());
        }

        return true;
    }

    /**
     * Demonstrates DMGT IF/THEN logical rules and weighted scoring implemented directly in Java.
     */
    public TriageResult evaluateTriage(Patient patient) {
        VitalSigns v = patient.getVitals();
        List<String> symptoms = patient.getSymptoms();
        String complaint = patient.getChiefComplaint().toLowerCase();
        String combined = (String.join(" ", symptoms) + " " + complaint).toLowerCase();

        List<String> triggeredRules = new ArrayList<>();
        List<String> ruleReasons = new ArrayList<>();
        List<String> factors = new ArrayList<>();
        List<String> missing = v.getMissingMetricsList();

        if (v.getOxygenSaturation() != null) factors.add("SpO2: " + v.getOxygenSaturation() + "%");
        if (v.getHeartRate() != null) factors.add("HR: " + v.getHeartRate() + " bpm");
        if (v.getRespiratoryRate() != null) factors.add("RR: " + v.getRespiratoryRate() + " /min");
        if (v.getSystolicBp() != null) factors.add("SBP: " + v.getSystolicBp() + " mmHg");
        if (v.getTemperature() != null) factors.add("Temp: " + v.getTemperature() + " °C");
        factors.add("Symptoms: " + String.join(", ", symptoms));

        // 1. Level 1 Emergency Warning Rules
        boolean isLevel1 = false;
        if (v.getOxygenSaturation() != null && v.getOxygenSaturation() < 90.0) {
            isLevel1 = true;
            triggeredRules.add("RULE_CRITICAL_HYPOXIA");
            ruleReasons.add("Critical Hypoxemia (SpO2 < 90%): Oxygen saturation dangerously low (" + v.getOxygenSaturation() + "%).");
        }
        if (combined.contains("crushing chest pain") || combined.contains("unconscious") || combined.contains("cardiac arrest")) {
            isLevel1 = true;
            triggeredRules.add("RULE_SEVERE_CARDIAC_SYMPTOMS");
            ruleReasons.add("Acute Cardiac Alarm: Acute crushing chest pain or unconsciousness flagged.");
        }
        if (v.getSystolicBp() != null && v.getSystolicBp() < 80.0) {
            isLevel1 = true;
            triggeredRules.add("RULE_SEVERE_HEMODYNAMIC_INSTABILITY");
            ruleReasons.add("Hemodynamic Collapse: SBP < 80 mmHg (" + v.getSystolicBp() + " mmHg).");
        }

        if (isLevel1) {
            double score = calculateDemoScore(v, symptoms, true);
            return new TriageResult(1, "Level 1 - Immediate / Resuscitation", "RED", score,
                    triggeredRules, ruleReasons, factors, missing, Instant.now().toString());
        }

        // 2. Level 2 High Concern Rules
        boolean isLevel2 = false;
        if (v.getOxygenSaturation() != null && v.getOxygenSaturation() <= 93.0) {
            isLevel2 = true;
            triggeredRules.add("RULE_MODERATE_HYPOXIA_RESPIRATORY");
            ruleReasons.add("Moderate Hypoxemia (SpO2 90-93%): Requires urgent respiratory stabilization.");
        }
        if (v.getTemperature() != null && v.getTemperature() >= 39.5) {
            isLevel2 = true;
            triggeredRules.add("RULE_HYPERPYREXIA_WITH_LETHARGY");
            ruleReasons.add("Hyperpyrexia (Temp >= 39.5°C): High fever detected (" + v.getTemperature() + "°C).");
        }
        if (combined.contains("facial droop") || combined.contains("slurred speech") || combined.contains("arm weakness")) {
            isLevel2 = true;
            triggeredRules.add("RULE_NEUROLOGICAL_DEFICIT");
            ruleReasons.add("Acute Neurological Deficit: FAST stroke indicator present.");
        }
        if (combined.contains("shortness of breath") || combined.contains("severe wheezing")) {
            isLevel2 = true;
            triggeredRules.add("RULE_ACUTE_DYSPNEA");
            ruleReasons.add("Acute Dyspnea: Severe respiratory effort reported.");
        }

        if (isLevel2) {
            double score = calculateDemoScore(v, symptoms, false);
            return new TriageResult(2, "Level 2 - Emergent / Very Urgent", "ORANGE", score,
                    triggeredRules, ruleReasons, factors, missing, Instant.now().toString());
        }

        // 3. Level 3 Moderate Concern Rules
        boolean isLevel3 = false;
        if (v.getTemperature() != null && v.getTemperature() >= 38.2) {
            isLevel3 = true;
            triggeredRules.add("RULE_MODERATE_FEVER_VOMITING");
            ruleReasons.add("Moderate Pyrexia: Body temperature elevated (" + v.getTemperature() + "°C).");
        }
        if (combined.contains("laceration") || combined.contains("bleeding") || combined.contains("abdominal pain")) {
            isLevel3 = true;
            triggeredRules.add("RULE_FRACTURE_LACERATION_BLEEDING");
            ruleReasons.add("Tissue Trauma or Acute Pain: Requires clinical wound evaluation/diagnostics.");
        }

        if (isLevel3) {
            double score = calculateDemoScore(v, symptoms, false);
            return new TriageResult(3, "Level 3 - Urgent", "YELLOW", score,
                    triggeredRules, ruleReasons, factors, missing, Instant.now().toString());
        }

        // 4. Level 4 Routine
        triggeredRules.add("RULE_NON_URGENT_ROUTINE");
        ruleReasons.add("Routine Presentation: Stable parameters suitable for standard ambulatory queue.");
        double score = calculateDemoScore(v, symptoms, false);
        return new TriageResult(4, "Level 4 - Less Urgent / Non-Emergency", "GREEN", score,
                triggeredRules, ruleReasons, factors, missing, Instant.now().toString());
    }

    private double calculateDemoScore(VitalSigns v, List<String> symptoms, boolean isRed) {
        double weightedPoints = 0.0;
        double presentWeights = 0.0;

        if (v.getOxygenSaturation() != null) {
            double pts = v.getOxygenSaturation() >= 95.0 ? 0.0 : (v.getOxygenSaturation() >= 90.0 ? 50.0 : 95.0);
            weightedPoints += pts * 0.28;
            presentWeights += 0.28;
        }
        if (v.getHeartRate() != null) {
            double pts = (v.getHeartRate() >= 60.0 && v.getHeartRate() <= 100.0) ? 0.0 : 60.0;
            weightedPoints += pts * 0.22;
            presentWeights += 0.22;
        }
        if (v.getSystolicBp() != null) {
            double pts = (v.getSystolicBp() >= 100.0 && v.getSystolicBp() <= 135.0) ? 0.0 : 50.0;
            weightedPoints += pts * 0.20;
            presentWeights += 0.20;
        }
        if (v.getTemperature() != null) {
            double pts = (v.getTemperature() >= 36.5 && v.getTemperature() <= 37.5) ? 0.0 : 40.0;
            weightedPoints += pts * 0.12;
            presentWeights += 0.12;
        }

        double base = presentWeights > 0 ? (weightedPoints / presentWeights) : 0.0;
        if (isRed) {
            base = Math.max(base, 85.0);
        }
        return Math.round(Math.min(100.0, base) * 10.0) / 10.0;
    }

    public synchronized int loadDemoPatients(List<Patient> demoList) {
        int added = 0;
        for (Patient p : demoList) {
            if (!patientRegistry.containsKey(p.getId())) {
                p.setDemoRecord(true);
                registerPatient(p);
                added++;
            }
        }
        return added;
    }
}
