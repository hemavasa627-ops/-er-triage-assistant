# OOPJ: Object-Oriented Programming in Java

## 1. Class Hierarchy & Architectural Principles

The Java OOP module (`java-module/src/er/triage/`) illustrates core OOP principles in healthcare informatics:

```
+--------------------------------------------------------------+
|                         Patient                              |
+--------------------------------------------------------------+
| - id: String                                                 |
| - name: String                                               |
| - age: int                                                   |
| - chiefComplaint: String                                     |
| - symptoms: List<String>                                     |
| - vitals: VitalSigns                                         |
| - triageResult: TriageResult                                 |
| - workflowStatus: String                                     |
+--------------------------------------------------------------+
| + getVitals(): VitalSigns                                    |
| + setWorkflowStatus(status: String): void                    |
+--------------------------------------------------------------+
                              |
                              v has-a
+--------------------------------------------------------------+
|                        VitalSigns                            |
+--------------------------------------------------------------+
| - temperature: Double                                        |
| - heartRate: Double                                          |
| - systolicBp: Double                                         |
| - diastolicBp: Double                                        |
| - oxygenSaturation: Double                                   |
+--------------------------------------------------------------+
| + getMissingMetricsList(): List<String>                      |
+--------------------------------------------------------------+

+--------------------------------------------------------------+
|                       PatientService                         |
+--------------------------------------------------------------+
| - patientRegistry: Map<String, Patient>                      |
| - queueManager: PriorityQueueManager                         |
+--------------------------------------------------------------+
| + registerPatient(patient: Patient): Patient                 |
| + evaluateTriage(patient: Patient): TriageResult             |
| + updatePatientStatus(id: String, status: String): boolean   |
| + loadDemoPatients(list: List<Patient>): int                 |
+--------------------------------------------------------------+
```

## 2. Core OOP Principles Demonstrated

1. **Encapsulation:** Private fields, immutable identifiers (`final id`), defensive copying for collections (`Collections.unmodifiableList`), and domain constraint validation in mutators.
2. **Nullable Value Types vs Primitives:** Physiological vitals are encapsulated as nullable `Double` objects rather than primitive `double`. A zero or omitted reading is represented as `null` rather than a falsified normal reading.
3. **Single Responsibility Principle (SRP):**
   - `Patient`: Entity representing domain state.
   - `VitalSigns`: Value object managing physiological boundaries.
   - `TriageResult`: Immutable value object capturing point-in-time assessment.
   - `PriorityQueueManager`: ADSA Binary Min-Heap algorithm manager.
   - `PatientService`: Facade / business logic coordinator.
4. **IPC / CLI Bridge Pattern:**
   The Python FastAPI backend executes the Java bytecode using `java er.triage.Main --test` or `--demo` via subprocess IPC, verifying polyglot software architecture.
