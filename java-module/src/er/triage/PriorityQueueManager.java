package er.triage;

import java.io.Serializable;
import java.util.*;

/**
 * ADSA Priority Queue & Binary Min-Heap Manager.
 * 
 * Data Structure Analysis:
 * - A custom Binary Min-Heap with an inverted index Map (patientId -> heapIndex).
 * - Primary Key: Priority Level (Level 1 Resuscitation < Level 2 Emergent < Level 3 Urgent < Level 4 Routine)
 * - Secondary Key: Arrival Time string (Earlier arrival timestamp has higher precedence / deterministic FIFO tie-break)
 * - Tertiary Key: Patient ID (Guarantees total deterministic ordering)
 * 
 * Time Complexities:
 * - Insertion: O(log N)
 * - Peek: O(1)
 * - Extract-Min: O(log N)
 * - Remove: O(log N) (leveraging HashMap index lookup)
 * - Update: O(log N)
 * - Get Ranked Queue: O(N log N)
 */
public class PriorityQueueManager implements Serializable {
    private static final long serialVersionUID = 1L;

    public static class QueueEntry implements Comparable<QueueEntry>, Serializable {
        private static final long serialVersionUID = 1L;

        private final Patient patient;
        private final TriageResult triageResult;

        public QueueEntry(Patient patient, TriageResult triageResult) {
            this.patient = Objects.requireNonNull(patient, "Patient cannot be null");
            this.triageResult = Objects.requireNonNull(triageResult, "TriageResult cannot be null");
        }

        public Patient getPatient() {
            return patient;
        }

        public TriageResult getTriageResult() {
            return triageResult;
        }

        @Override
        public int compareTo(QueueEntry other) {
            // 1. Primary Key: Acuity level (1 < 2 < 3 < 4)
            int p1 = this.triageResult.getPriorityLevel();
            int p2 = other.triageResult.getPriorityLevel();
            if (p1 != p2) {
                return Integer.compare(p1, p2);
            }

            // 2. Secondary Key: Deterministic Tie-Breaker by Arrival Time (earlier wins)
            String a1 = this.patient.getArrivalTime();
            String a2 = other.patient.getArrivalTime();
            int cmpArrival = a1.compareTo(a2);
            if (cmpArrival != 0) {
                return cmpArrival;
            }

            // 3. Tertiary Key: Patient ID lexicographical tie-break
            return this.patient.getId().compareTo(other.patient.getId());
        }

        @Override
        public String toString() {
            return String.format("QueueEntry[ID=%s, Level=%d, Arrival=%s, Score=%.1f]",
                    patient.getId(), triageResult.getPriorityLevel(),
                    patient.getArrivalTime(), triageResult.getSeverityScore());
        }
    }

    private final List<QueueEntry> heap = new ArrayList<>();
    private final Map<String, Integer> positionMap = new HashMap<>();

    public PriorityQueueManager() {
    }

    public synchronized int size() {
        return heap.size();
    }

    public synchronized boolean isEmpty() {
        return heap.isEmpty();
    }

    private void swap(int i, int j) {
        QueueEntry temp = heap.get(i);
        heap.set(i, heap.get(j));
        heap.set(j, temp);

        positionMap.put(heap.get(i).getPatient().getId(), i);
        positionMap.put(heap.get(j).getPatient().getId(), j);
    }

    private void siftUp(int index) {
        int current = index;
        while (current > 0) {
            int parent = (current - 1) / 2;
            if (heap.get(current).compareTo(heap.get(parent)) < 0) {
                swap(current, parent);
                current = parent;
            } else {
                break;
            }
        }
    }

    private void siftDown(int index) {
        int current = index;
        int size = heap.size();

        while (true) {
            int smallest = current;
            int left = 2 * current + 1;
            int right = 2 * current + 2;

            if (left < size && heap.get(left).compareTo(heap.get(smallest)) < 0) {
                smallest = left;
            }
            if (right < size && heap.get(right).compareTo(heap.get(smallest)) < 0) {
                smallest = right;
            }

            if (smallest != current) {
                swap(current, smallest);
                current = smallest;
            } else {
                break;
            }
        }
    }

    /**
     * Inserts patient or updates their entry if already present in the heap.
     * Time Complexity: O(log N)
     */
    public synchronized void insertOrUpdate(Patient patient, TriageResult result) {
        String patientId = patient.getId();
        if (positionMap.containsKey(patientId)) {
            int idx = positionMap.get(patientId);
            QueueEntry oldEntry = heap.get(idx);
            QueueEntry newEntry = new QueueEntry(patient, result);
            heap.set(idx, newEntry);

            if (newEntry.compareTo(oldEntry) < 0) {
                siftUp(idx);
            } else {
                siftDown(idx);
            }
        } else {
            QueueEntry entry = new QueueEntry(patient, result);
            int newIdx = heap.size();
            heap.add(entry);
            positionMap.put(patientId, newIdx);
            siftUp(newIdx);
        }
    }

    /**
     * Peeks at highest-priority patient.
     * Time Complexity: O(1)
     */
    public synchronized QueueEntry peek() {
        if (heap.isEmpty()) {
            return null;
        }
        return heap.get(0);
    }

    /**
     * Extracts highest-priority patient.
     * Time Complexity: O(log N)
     */
    public synchronized QueueEntry extractMin() {
        if (heap.isEmpty()) {
            return null;
        }
        QueueEntry root = heap.get(0);
        int lastIdx = heap.size() - 1;
        QueueEntry last = heap.remove(lastIdx);
        positionMap.remove(root.getPatient().getId());

        if (!heap.isEmpty()) {
            heap.set(0, last);
            positionMap.put(last.getPatient().getId(), 0);
            siftDown(0);
        }
        return root;
    }

    /**
     * Removes patient from queue by ID.
     * Time Complexity: O(log N)
     */
    public synchronized boolean remove(String patientId) {
        if (!positionMap.containsKey(patientId)) {
            return false;
        }
        int idx = positionMap.get(patientId);
        int lastIdx = heap.size() - 1;

        if (idx == lastIdx) {
            heap.remove(lastIdx);
            positionMap.remove(patientId);
            return true;
        }

        swap(idx, lastIdx);
        heap.remove(lastIdx);
        positionMap.remove(patientId);

        siftDown(idx);
        if (idx < heap.size()) {
            siftUp(idx);
        }
        return true;
    }

    /**
     * Returns ordered list of patients according to priority heap ranking.
     * Time Complexity: O(N log N)
     */
    public synchronized List<QueueEntry> getRankedQueue() {
        List<QueueEntry> copy = new ArrayList<>(heap);
        Collections.sort(copy);
        return Collections.unmodifiableList(copy);
    }

    /**
     * Returns 1-indexed position of a patient in ranked queue, or -1 if not found.
     */
    public synchronized int getPosition(String patientId) {
        List<QueueEntry> ranked = getRankedQueue();
        for (int i = 0; i < ranked.size(); i++) {
            if (ranked.get(i).getPatient().getId().equals(patientId)) {
                return i + 1;
            }
        }
        return -1;
    }

    public synchronized void clear() {
        heap.clear();
        positionMap.clear();
    }
}
