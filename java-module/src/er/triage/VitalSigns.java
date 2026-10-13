package er.triage;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates patient physiological vital signs.
 * Demonstrates OOP Encapsulation and Data Validation.
 * 
 * NOTE: Vital signs are represented by nullable Double objects.
 * Missing vital signs are explicitly NULL and are NEVER silently defaulted to normal values.
 */
public class VitalSigns implements Serializable {
    private static final long serialVersionUID = 1L;

    private Double temperature;          // Celsius
    private Double heartRate;            // beats per minute
    private Double respiratoryRate;      // breaths per minute
    private Double systolicBp;           // mmHg
    private Double diastolicBp;          // mmHg
    private Double oxygenSaturation;     // % (50.0 - 100.0)

    public VitalSigns() {
    }

    public VitalSigns(Double temperature, Double heartRate, Double respiratoryRate,
                      Double systolicBp, Double diastolicBp, Double oxygenSaturation) {
        setTemperature(temperature);
        setHeartRate(heartRate);
        setRespiratoryRate(respiratoryRate);
        setSystolicBp(systolicBp);
        setDiastolicBp(diastolicBp);
        setOxygenSaturation(oxygenSaturation);
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        if (temperature != null && (temperature < 25.0 || temperature > 45.0)) {
            throw new IllegalArgumentException("Temperature must be between 25.0 and 45.0 °C");
        }
        this.temperature = temperature;
    }

    public Double getHeartRate() {
        return heartRate;
    }

    public void setHeartRate(Double heartRate) {
        if (heartRate != null && (heartRate < 20.0 || heartRate > 260.0)) {
            throw new IllegalArgumentException("Heart rate must be between 20 and 260 bpm");
        }
        this.heartRate = heartRate;
    }

    public Double getRespiratoryRate() {
        return respiratoryRate;
    }

    public void setRespiratoryRate(Double respiratoryRate) {
        if (respiratoryRate != null && (respiratoryRate < 4.0 || respiratoryRate > 70.0)) {
            throw new IllegalArgumentException("Respiratory rate must be between 4 and 70 breaths/min");
        }
        this.respiratoryRate = respiratoryRate;
    }

    public Double getSystolicBp() {
        return systolicBp;
    }

    public void setSystolicBp(Double systolicBp) {
        if (systolicBp != null && (systolicBp < 40.0 || systolicBp > 280.0)) {
            throw new IllegalArgumentException("Systolic BP must be between 40 and 280 mmHg");
        }
        this.systolicBp = systolicBp;
    }

    public Double getDiastolicBp() {
        return diastolicBp;
    }

    public void setDiastolicBp(Double diastolicBp) {
        if (diastolicBp != null && (diastolicBp < 20.0 || diastolicBp > 180.0)) {
            throw new IllegalArgumentException("Diastolic BP must be between 20 and 180 mmHg");
        }
        if (systolicBp != null && diastolicBp != null && diastolicBp >= systolicBp) {
            throw new IllegalArgumentException("Diastolic BP must be lower than systolic BP");
        }
        this.diastolicBp = diastolicBp;
    }

    public Double getOxygenSaturation() {
        return oxygenSaturation;
    }

    public void setOxygenSaturation(Double oxygenSaturation) {
        if (oxygenSaturation != null && (oxygenSaturation < 50.0 || oxygenSaturation > 100.0)) {
            throw new IllegalArgumentException("SpO2 must be between 50.0 and 100.0%");
        }
        this.oxygenSaturation = oxygenSaturation;
    }

    public List<String> getMissingMetricsList() {
        List<String> missing = new ArrayList<>();
        if (temperature == null) missing.add("Body Temperature");
        if (heartRate == null) missing.add("Heart Rate");
        if (respiratoryRate == null) missing.add("Respiratory Rate");
        if (systolicBp == null) missing.add("Systolic Blood Pressure");
        if (diastolicBp == null) missing.add("Diastolic Blood Pressure");
        if (oxygenSaturation == null) missing.add("Oxygen Saturation (SpO2)");
        return missing;
    }

    @Override
    public String toString() {
        return String.format("VitalSigns[Temp=%s, HR=%s, RR=%s, BP=%s/%s, SpO2=%s]",
                temperature != null ? temperature + "°C" : "N/A",
                heartRate != null ? heartRate + " bpm" : "N/A",
                respiratoryRate != null ? respiratoryRate + "/min" : "N/A",
                systolicBp != null ? systolicBp : "N/A",
                diastolicBp != null ? diastolicBp : "N/A",
                oxygenSaturation != null ? oxygenSaturation + "%" : "N/A");
    }
}
