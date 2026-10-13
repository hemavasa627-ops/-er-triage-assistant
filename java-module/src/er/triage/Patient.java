package er.triage;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Domain entity representing an Emergency Department patient.
 * Demonstrates OOP Encapsulation, Validation, and Domain Invariants.
 */
public class Patient implements Serializable {
    private static final long serialVersionUID = 1L;

    public static final String STATUS_WAITING = "Waiting";
    public static final String STATUS_UNDER_REVIEW = "Under Review";
    public static final String STATUS_COMPLETED = "Assessment Completed";

    private final String id;
    private String name;
    private int age;
    private String chiefComplaint;
    private final List<String> symptoms = new ArrayList<>();
    private String symptomDuration;
    private final String arrivalTime;
    private String workflowStatus;
    private boolean isDemoRecord;
    private VitalSigns vitals;
    private TriageResult triageResult;
    private final String createdAt;
    private String updatedAt;

    public Patient(String id, String name, int age, String chiefComplaint,
                   List<String> symptoms, String symptomDuration,
                   String arrivalTime, VitalSigns vitals) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Patient ID cannot be empty");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Patient name cannot be empty");
        }
        if (age < 0 || age > 130) {
            throw new IllegalArgumentException("Age must be between 0 and 130");
        }
        if (chiefComplaint == null || chiefComplaint.trim().isEmpty()) {
            throw new IllegalArgumentException("Chief complaint cannot be empty");
        }

        this.id = id.trim();
        this.name = name.trim();
        this.age = age;
        this.chiefComplaint = chiefComplaint.trim();
        if (symptoms != null) {
            this.symptoms.addAll(symptoms);
        }
        this.symptomDuration = symptomDuration;
        this.arrivalTime = (arrivalTime != null && !arrivalTime.isEmpty()) ? arrivalTime : Instant.now().toString();
        this.workflowStatus = STATUS_WAITING;
        this.isDemoRecord = false;
        this.vitals = vitals != null ? vitals : new VitalSigns();
        this.createdAt = Instant.now().toString();
        this.updatedAt = this.createdAt;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        this.name = name.trim();
        this.updatedAt = Instant.now().toString();
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        if (age < 0 || age > 130) {
            throw new IllegalArgumentException("Age must be between 0 and 130");
        }
        this.age = age;
        this.updatedAt = Instant.now().toString();
    }

    public String getChiefComplaint() {
        return chiefComplaint;
    }

    public void setChiefComplaint(String chiefComplaint) {
        if (chiefComplaint == null || chiefComplaint.trim().isEmpty()) {
            throw new IllegalArgumentException("Chief complaint cannot be empty");
        }
        this.chiefComplaint = chiefComplaint.trim();
        this.updatedAt = Instant.now().toString();
    }

    public List<String> getSymptoms() {
        return Collections.unmodifiableList(symptoms);
    }

    public void setSymptoms(List<String> newSymptoms) {
        this.symptoms.clear();
        if (newSymptoms != null) {
            this.symptoms.addAll(newSymptoms);
        }
        this.updatedAt = Instant.now().toString();
    }

    public String getSymptomDuration() {
        return symptomDuration;
    }

    public void setSymptomDuration(String duration) {
        this.symptomDuration = duration;
        this.updatedAt = Instant.now().toString();
    }

    public String getArrivalTime() {
        return arrivalTime;
    }

    public String getWorkflowStatus() {
        return workflowStatus;
    }

    public void setWorkflowStatus(String status) {
        if (!STATUS_WAITING.equals(status) &&
            !STATUS_UNDER_REVIEW.equals(status) &&
            !STATUS_COMPLETED.equals(status)) {
            throw new IllegalArgumentException("Invalid workflow status: " + status);
        }
        this.workflowStatus = status;
        this.updatedAt = Instant.now().toString();
    }

    public boolean isDemoRecord() {
        return isDemoRecord;
    }

    public void setDemoRecord(boolean demoRecord) {
        isDemoRecord = demoRecord;
    }

    public VitalSigns getVitals() {
        return vitals;
    }

    public void setVitals(VitalSigns vitals) {
        this.vitals = vitals != null ? vitals : new VitalSigns();
        this.updatedAt = Instant.now().toString();
    }

    public TriageResult getTriageResult() {
        return triageResult;
    }

    public void setTriageResult(TriageResult triageResult) {
        this.triageResult = triageResult;
        this.updatedAt = Instant.now().toString();
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Patient)) return false;
        Patient patient = (Patient) o;
        return Objects.equals(id, patient.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("Patient[ID=%s, Name=%s, Age=%d, Status=%s, Complaint='%s']",
                id, name, age, workflowStatus, chiefComplaint);
    }
}
