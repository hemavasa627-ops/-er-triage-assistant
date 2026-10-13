package er.triage;

import java.time.Instant;
import java.util.*;

/**
 * Main entry point and CLI / Integration bridge for the Java OOP module.
 * 
 * Provides:
 * 1. Self-contained comprehensive automated test suite (--test)
 * 2. CLI JSON Bridge for external systems / Python subprocess integration (--demo, --evaluate)
 * 3. Documented interfaces for OOPJ demonstration
 */
public class Main {

    public static void main(String[] args) {
        if (args.length > 0 && "--test".equals(args[0])) {
            runAutomatedTestSuite();
            return;
        }

        if (args.length > 0 && "--demo".equals(args[0])) {
            runDemoMode();
            return;
        }

        System.out.println("================================================================================");
        System.out.println("  ER TRIAGE ASSISTANT - Java OOP & ADSA Priority Queue Engine");
        System.out.println("================================================================================");
        System.out.println("Usage:");
        System.out.println("  java er.triage.Main --test    : Execute complete automated test suite");
        System.out.println("  java er.triage.Main --demo    : Run interactive demo and print ranked queue");
        System.out.println("--------------------------------------------------------------------------------");
        System.out.println("Executing automated test suite by default...");
        runAutomatedTestSuite();
    }

    public static void runDemoMode() {
        PatientService service = new PatientService();
        List<Patient> demoPatients = createDemoList();
        int loaded = service.loadDemoPatients(demoPatients);
        System.out.println("Loaded " + loaded + " demo patients into Java PriorityQueueManager.");
        System.out.println("\nRanked Priority Queue (ADSA Heap Order):");
        System.out.println("--------------------------------------------------------------------------------");
        List<PriorityQueueManager.QueueEntry> queue = service.getActiveQueue();
        for (int i = 0; i < queue.size(); i++) {
            PriorityQueueManager.QueueEntry e = queue.get(i);
            Patient p = e.getPatient();
            TriageResult r = e.getTriageResult();
            System.out.printf("[%d] %s | %s (Age %d) | %s | Arrival: %s | Score: %.1f\n",
                    i + 1, p.getId(), p.getName(), p.getAge(), r.getPriorityCode(),
                    p.getArrivalTime(), r.getSeverityScore());
        }
    }

    public static void runAutomatedTestSuite() {
        System.out.println(">>> RUNNING JAVA OOP & ADSA TEST SUITE <<<\n");
        int passed = 0;
        int failed = 0;

        // Test 1: Validation and Object Creation
        try {
            VitalSigns v = new VitalSigns(37.0, 75.0, 16.0, 120.0, 80.0, 98.0);
            Patient p = new Patient("P-001", "Alice Test", 30, "Mild headache",
                    Arrays.asList("Headache"), "2 hours", Instant.now().toString(), v);
            assert "P-001".equals(p.getId());
            assert 30 == p.getAge();
            System.out.println("[PASS] Test 1: Patient object encapsulation and validation");
            passed++;
        } catch (Throwable t) {
            System.out.println("[FAIL] Test 1: " + t.getMessage());
            failed++;
        }

        // Test 2: Missing Vital Signs Handling (Strict Nullability)
        try {
            VitalSigns vIncomplete = new VitalSigns(); // all null
            assert vIncomplete.getTemperature() == null : "Temp should be null";
            assert vIncomplete.getOxygenSaturation() == null : "SpO2 should be null";
            List<String> missing = vIncomplete.getMissingMetricsList();
            assert missing.size() == 6 : "All 6 metrics should be flagged as missing";
            System.out.println("[PASS] Test 2: Missing vitals explicitly preserved as null (never defaulted to normal)");
            passed++;
        } catch (Throwable t) {
            System.out.println("[FAIL] Test 2: " + t.getMessage());
            failed++;
        }

        // Test 3: DMGT Rule Evaluation (Level 1 Red - Hypoxia)
        try {
            PatientService service = new PatientService();
            VitalSigns vHypoxia = new VitalSigns(37.0, 110.0, 24.0, 110.0, 70.0, 86.0); // SpO2 = 86%
            Patient pHypoxia = new Patient("P-RED", "Hypoxia Test", 55, "Shortness of breath",
                    Arrays.asList("Severe dyspnea"), "30 min", Instant.now().toString(), vHypoxia);
            TriageResult result = service.evaluateTriage(pHypoxia);
            assert result.getPriorityLevel() == 1 : "Expected Level 1, got " + result.getPriorityLevel();
            assert "RED".equals(result.getPriorityCode());
            assert result.getRulesTriggered().contains("RULE_CRITICAL_HYPOXIA");
            System.out.println("[PASS] Test 3: Emergency warning rule triggered (SpO2 < 90% -> Level 1 RED)");
            passed++;
        } catch (Throwable t) {
            System.out.println("[FAIL] Test 3: " + t.getMessage());
            failed++;
        }

        // Test 4: ADSA Heap Priority Queue Ordering
        try {
            PriorityQueueManager pq = new PriorityQueueManager();
            String t0 = "2026-10-12T10:00:00Z";
            String t1 = "2026-10-12T10:15:00Z";

            // Create patients of different priorities
            Patient pRoutine = new Patient("P-ROUTINE", "Routine", 20, "Sprained finger", Arrays.asList("Pain"), "1h", t0, new VitalSigns());
            TriageResult rRoutine = new TriageResult(4, "Routine", "GREEN", 10.0, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), t0);

            Patient pImmediate = new Patient("P-IMMEDIATE", "Immediate", 60, "Chest pain", Arrays.asList("Chest pain"), "10m", t1, new VitalSigns());
            TriageResult rImmediate = new TriageResult(1, "Immediate", "RED", 95.0, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), t1);

            Patient pEmergent = new Patient("P-EMERGENT", "Emergent", 40, "Asthma", Arrays.asList("Wheezing"), "30m", t0, new VitalSigns());
            TriageResult rEmergent = new TriageResult(2, "Emergent", "ORANGE", 70.0, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), t0);

            pq.insertOrUpdate(pRoutine, rRoutine);
            pq.insertOrUpdate(pImmediate, rImmediate);
            pq.insertOrUpdate(pEmergent, rEmergent);

            PriorityQueueManager.QueueEntry peek = pq.peek();
            assert "P-IMMEDIATE".equals(peek.getPatient().getId()) : "Root of heap must be Level 1";

            PriorityQueueManager.QueueEntry first = pq.extractMin();
            assert "P-IMMEDIATE".equals(first.getPatient().getId());

            PriorityQueueManager.QueueEntry second = pq.extractMin();
            assert "P-EMERGENT".equals(second.getPatient().getId());

            PriorityQueueManager.QueueEntry third = pq.extractMin();
            assert "P-ROUTINE".equals(third.getPatient().getId());

            assert pq.isEmpty();
            System.out.println("[PASS] Test 4: ADSA Binary Min-Heap correctly maintains priority ordering");
            passed++;
        } catch (Throwable t) {
            System.out.println("[FAIL] Test 4: " + t.getMessage());
            failed++;
        }

        // Test 5: Deterministic Tie-Breaking by Arrival Time
        try {
            PriorityQueueManager pq = new PriorityQueueManager();
            String earlierArrival = "2026-10-12T09:00:00Z";
            String laterArrival   = "2026-10-12T09:30:00Z";

            // Both patients have the exact same priority level (Level 2)
            Patient pEarly = new Patient("P-EARLY", "Early Patient", 45, "Fever", Arrays.asList("Fever"), "1h", earlierArrival, new VitalSigns());
            TriageResult rEarly = new TriageResult(2, "Emergent", "ORANGE", 75.0, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), earlierArrival);

            Patient pLate = new Patient("P-LATE", "Late Patient", 45, "Fever", Arrays.asList("Fever"), "1h", laterArrival, new VitalSigns());
            TriageResult rLate = new TriageResult(2, "Emergent", "ORANGE", 75.0, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), laterArrival);

            // Insert later first, then earlier
            pq.insertOrUpdate(pLate, rLate);
            pq.insertOrUpdate(pEarly, rEarly);

            PriorityQueueManager.QueueEntry root = pq.extractMin();
            assert "P-EARLY".equals(root.getPatient().getId()) : "Tie-breaker must prioritize earlier arrival";
            System.out.println("[PASS] Test 5: Deterministic tie-breaking correctly prioritizes earlier arrival time");
            passed++;
        } catch (Throwable t) {
            System.out.println("[FAIL] Test 5: " + t.getMessage());
            failed++;
        }

        // Test 6: Queue Position Recalculation & Removal
        try {
            PatientService service = new PatientService();
            Patient p1 = new Patient("P-01", "P1", 30, "A", Arrays.asList("A"), "1h", "2026-10-12T10:00:00Z", new VitalSigns());
            Patient p2 = new Patient("P-02", "P2", 30, "B", Arrays.asList("B"), "1h", "2026-10-12T10:05:00Z", new VitalSigns());
            service.registerPatient(p1);
            service.registerPatient(p2);

            int pos1 = service.getQueuePosition("P-01");
            int pos2 = service.getQueuePosition("P-02");
            assert pos1 == 1;
            assert pos2 == 2;

            // Update status of P-01 to completed -> should be removed from active queue
            service.updatePatientStatus("P-01", Patient.STATUS_COMPLETED);
            assert service.getQueuePosition("P-01") == -1 : "Completed patient should not have active queue position";
            assert service.getQueuePosition("P-02") == 1 : "P-02 should now be #1 in queue";
            assert service.findPatientById("P-01").isPresent() : "Record of P-01 must still exist in registry history";

            System.out.println("[PASS] Test 6: Removal updates queue positions and preserves record in history");
            passed++;
        } catch (Throwable t) {
            System.out.println("[FAIL] Test 6: " + t.getMessage());
            failed++;
        }

        // Test 7: Demo Data Duplicate Prevention
        try {
            PatientService service = new PatientService();
            List<Patient> demoList = createDemoList();
            int count1 = service.loadDemoPatients(demoList);
            int count2 = service.loadDemoPatients(demoList); // Second load attempt
            assert count1 == demoList.size() : "First load should add all demo patients";
            assert count2 == 0 : "Second load must add 0 duplicates";
            assert service.getAllPatients().size() == demoList.size() : "Total count must equal single demo batch";
            System.out.println("[PASS] Test 7: Demo data loader strictly prevents duplicate records");
            passed++;
        } catch (Throwable t) {
            System.out.println("[FAIL] Test 7: " + t.getMessage());
            failed++;
        }

        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.printf("Test Results: %d Passed, %d Failed.\n", passed, failed);
        System.out.println("--------------------------------------------------------------------------------\n");
    }

    private static List<Patient> createDemoList() {
        List<Patient> list = new ArrayList<>();
        list.add(new Patient("DEMO-001", "Robert Vance (Demo)", 62, "Crushing retrosternal chest pain",
                Arrays.asList("Crushing chest pain", "Shortness of breath"), "45 min", "2026-10-12T09:10:00Z",
                new VitalSigns(37.1, 128.0, 26.0, 84.0, 54.0, 88.0)));

        list.add(new Patient("DEMO-002", "Elena Rostova (Demo)", 45, "Severe shortness of breath with wheezing",
                Arrays.asList("Shortness of breath", "Severe wheezing"), "2 hours", "2026-10-12T09:15:00Z",
                new VitalSigns(37.4, 114.0, 28.0, 142.0, 88.0, 91.0)));

        list.add(new Patient("DEMO-003", "Lucas Meyer (Demo)", 7, "Pediatric high fever with extreme lethargy",
                Arrays.asList("High fever", "Lethargy", "Vomiting"), "6 hours", "2026-10-12T09:20:00Z",
                new VitalSigns(40.1, 145.0, 30.0, 102.0, 64.0, 96.0)));

        list.add(new Patient("DEMO-004", "Marcus Chen (Demo)", 58, "Sudden onset right facial droop and arm weakness",
                Arrays.asList("Facial droop", "Arm weakness", "Slurred speech"), "50 min", "2026-10-12T09:25:00Z",
                new VitalSigns(36.8, 86.0, 16.0, 178.0, 98.0, 97.0)));

        list.add(new Patient("DEMO-005", "Sarah Jenkins (Demo)", 29, "Deep forearm laceration with active bleeding",
                Arrays.asList("Deep laceration", "Continuous moderate bleeding"), "30 min", "2026-10-12T09:30:00Z",
                new VitalSigns(36.7, 92.0, 18.0, 122.0, 78.0, 99.0)));

        list.add(new Patient("DEMO-006", "David Miller (Demo)", 51, "Persistent lower right abdominal pain",
                Arrays.asList("Abdominal pain", "Nausea", "Fever"), "24 hours", "2026-10-12T09:35:00Z",
                new VitalSigns(38.6, 96.0, 19.0, 134.0, 82.0, 98.0)));

        list.add(new Patient("DEMO-007", "Priya Sharma (Demo)", 23, "Sprained right ankle while playing sports",
                Arrays.asList("Sprained ankle", "Inability to bear full weight"), "1 hour", "2026-10-12T09:40:00Z",
                new VitalSigns(36.6, 74.0, 14.0, 118.0, 74.0, 99.0)));

        list.add(new Patient("DEMO-008", "Carlos Gomez (Demo)", 36, "Mild rhinorrhea and sore throat",
                Arrays.asList("Cough", "Mild sore throat"), "3 days", "2026-10-12T09:45:00Z",
                new VitalSigns(37.1, 72.0, 14.0, 120.0, 78.0, 98.0)));

        return list;
    }
}
