package er.triage;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Encapsulates the results of a DMGT rule evaluation and demonstration scoring.
 * Demonstrates OOP Immutable Result Pattern and Encapsulation.
 */
public class TriageResult implements Serializable {
    private static final long serialVersionUID = 1L;

    public static final String DISCLAIMER =
        "EDUCATIONAL PROTOTYPE ONLY: This triage classification is generated solely for educational " +
        "coursework demonstration. It is NOT clinically validated medical advice. Licensed clinical " +
        "personnel must independently assess and manage all emergency department patients.";

    private final int priorityLevel;           // 1 (Immediate), 2 (Emergent), 3 (Urgent), 4 (Routine)
    private final String priorityName;         // Human-readable category
    private final String priorityCode;         // RED, ORANGE, YELLOW, GREEN
    private final double severityScore;        // Illustrative 0.0 - 100.0 score
    private final List<String> rulesTriggered;
    private final List<String> ruleReasons;
    private final List<String> factorsConsidered;
    private final List<String> missingInformation;
    private final String evaluatedAt;

    public TriageResult(int priorityLevel, String priorityName, String priorityCode,
                        double severityScore, List<String> rulesTriggered,
                        List<String> ruleReasons, List<String> factorsConsidered,
                        List<String> missingInformation, String evaluatedAt) {
        if (priorityLevel < 1 || priorityLevel > 4) {
            throw new IllegalArgumentException("Priority level must be between 1 and 4");
        }
        this.priorityLevel = priorityLevel;
        this.priorityName = priorityName != null ? priorityName : "Unknown";
        this.priorityCode = priorityCode != null ? priorityCode : "GRAY";
        this.severityScore = Math.max(0.0, Math.min(100.0, severityScore));
        this.rulesTriggered = rulesTriggered != null ? new ArrayList<>(rulesTriggered) : new ArrayList<>();
        this.ruleReasons = ruleReasons != null ? new ArrayList<>(ruleReasons) : new ArrayList<>();
        this.factorsConsidered = factorsConsidered != null ? new ArrayList<>(factorsConsidered) : new ArrayList<>();
        this.missingInformation = missingInformation != null ? new ArrayList<>(missingInformation) : new ArrayList<>();
        this.evaluatedAt = evaluatedAt != null ? evaluatedAt : Instant.now().toString();
    }

    public int getPriorityLevel() {
        return priorityLevel;
    }

    public String getPriorityName() {
        return priorityName;
    }

    public String getPriorityCode() {
        return priorityCode;
    }

    public double getSeverityScore() {
        return severityScore;
    }

    public List<String> getRulesTriggered() {
        return Collections.unmodifiableList(rulesTriggered);
    }

    public List<String> getRuleReasons() {
        return Collections.unmodifiableList(ruleReasons);
    }

    public List<String> getFactorsConsidered() {
        return Collections.unmodifiableList(factorsConsidered);
    }

    public List<String> getMissingInformation() {
        return Collections.unmodifiableList(missingInformation);
    }

    public String getClinicalDisclaimer() {
        return DISCLAIMER;
    }

    public String getEvaluatedAt() {
        return evaluatedAt;
    }

    @Override
    public String toString() {
        return String.format("TriageResult[Level=%d (%s), Score=%.1f, Rules=%s]",
                priorityLevel, priorityCode, severityScore, rulesTriggered);
    }
}
