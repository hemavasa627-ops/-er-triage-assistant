"""
ADSA Priority Queue & Binary Min-Heap Implementation for ER Triage Assistant.

Data Structure Concept:
A Binary Min-Heap maintains the minimum element at the root (index 0).
For ER Triage, priority ordering is determined by:
1. Primary Key: Priority Level (Ascending: Level 1 - Immediate < Level 2 - Emergent < Level 3 - Urgent < Level 4 - Routine)
2. Secondary Key (Deterministic Tie-Breaker): Arrival Timestamp (Ascending: Earlier arrival timestamp has higher priority / lower comparison value)
3. Tertiary Key: Patient ID (Ascending lexicographical tie-breaker)

Time Complexity Analysis:
- Insertion (push): O(log N) - Appends to leaf, sifts up through parent nodes.
- Extraction (pop_min): O(log N) - Swaps root with last leaf, sifts down through smaller child.
- Peek (get_min): O(1) - Inspects heap[0] without removal.
- Update (decrease/increase priority): O(log N) - Uses position lookup map (patient_id -> heap index) to locate patient and sift up or down.
- Removal (delete by patient_id): O(log N) - Locates index via map, swaps with last element, sifts appropriately.
- Heapify (bulk build): O(N) - Bottom-up linear heap construction.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

class QueueNode:
    """Represents an individual patient entry inside the priority queue heap."""
    def __init__(
        self,
        patient_id: str,
        priority_level: int,
        arrival_time: str,
        severity_score: float,
        data: Optional[Dict[str, Any]] = None
    ):
        self.patient_id = patient_id
        self.priority_level = priority_level
        self.arrival_time = arrival_time
        self.severity_score = severity_score
        self.data = data or {}

    def __lt__(self, other: "QueueNode") -> bool:
        """
        Deterministic comparison operator for Min-Heap.
        Returns True if self has higher emergency precedence than other.
        """
        # Primary key: Lower numeric priority level indicates higher emergency (1 is Immediate, 4 is Routine)
        if self.priority_level != other.priority_level:
            return self.priority_level < other.priority_level

        # Secondary key: Earlier arrival timestamp wins tie-break (FIFO within same acuity tier)
        if self.arrival_time != other.arrival_time:
            return self.arrival_time < other.arrival_time

        # Tertiary key: Lexicographical ID comparison guarantees deterministic total ordering
        return self.patient_id < other.patient_id

    def __le__(self, other: "QueueNode") -> bool:
        return self < other or (
            self.priority_level == other.priority_level and
            self.arrival_time == other.arrival_time and
            self.patient_id == other.patient_id
        )

    def to_dict(self, queue_position: int) -> Dict[str, Any]:
        """Serializes queue entry with 1-indexed queue position."""
        res = {
            "queue_position": queue_position,
            "patient_id": self.patient_id,
            "priority_level": self.priority_level,
            "arrival_time": self.arrival_time,
            "severity_score": self.severity_score,
        }
        if self.data:
            res.update(self.data)
        res["queue_position"] = queue_position
        return res


class TriagePriorityQueue:
    """
    Min-Heap based Priority Queue with an inverted index map for O(log N) updates and removals.
    """

    def __init__(self):
        self._heap: List[QueueNode] = []
        self._pos_map: Dict[str, int] = {}  # patient_id -> heap index

    def __len__(self) -> int:
        return len(self._heap)

    def is_empty(self) -> bool:
        return len(self._heap) == 0

    def _swap(self, i: int, j: int):
        """Swaps elements at indices i and j and updates the position map."""
        self._heap[i], self._heap[j] = self._heap[j], self._heap[i]
        self._pos_map[self._heap[i].patient_id] = i
        self._pos_map[self._heap[j].patient_id] = j

    def _sift_up(self, index: int):
        """
        Restores heap invariant upward from given index.
        Time Complexity: O(log N)
        """
        current = index
        while current > 0:
            parent = (current - 1) // 2
            if self._heap[current] < self._heap[parent]:
                self._swap(current, parent)
                current = parent
            else:
                break

    def _sift_down(self, index: int):
        """
        Restores heap invariant downward from given index.
        Time Complexity: O(log N)
        """
        current = index
        size = len(self._heap)

        while True:
            smallest = current
            left = 2 * current + 1
            right = 2 * current + 2

            if left < size and self._heap[left] < self._heap[smallest]:
                smallest = left

            if right < size and self._heap[right] < self._heap[smallest]:
                smallest = right

            if smallest != current:
                self._swap(current, smallest)
                current = smallest
            else:
                break

    def push(
        self,
        patient_id: str,
        priority_level: int,
        arrival_time: str,
        severity_score: float,
        data: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Inserts a new patient or updates existing patient if already in queue.
        Time Complexity: O(log N)
        Returns: 1-indexed queue position after insertion.
        """
        if patient_id in self._pos_map:
            return self.update(patient_id, priority_level, severity_score, data)

        node = QueueNode(patient_id, priority_level, arrival_time, severity_score, data)
        new_index = len(self._heap)
        self._heap.append(node)
        self._pos_map[patient_id] = new_index
        self._sift_up(new_index)

        # Return updated position in ranked list
        return self.get_position(patient_id)

    def peek(self) -> Optional[QueueNode]:
        """
        Returns highest priority patient without removing.
        Time Complexity: O(1)
        """
        if not self._heap:
            return None
        return self._heap[0]

    def pop_min(self) -> Optional[QueueNode]:
        """
        Removes and returns highest priority patient.
        Time Complexity: O(log N)
        """
        if not self._heap:
            return None

        root = self._heap[0]
        last = self._heap.pop()
        del self._pos_map[root.patient_id]

        if self._heap:
            self._heap[0] = last
            self._pos_map[last.patient_id] = 0
            self._sift_down(0)

        return root

    def remove(self, patient_id: str) -> bool:
        """
        Removes patient from heap by ID.
        Time Complexity: O(log N)
        """
        if patient_id not in self._pos_map:
            return False

        idx = self._pos_map[patient_id]
        last_idx = len(self._heap) - 1

        if idx == last_idx:
            self._heap.pop()
            del self._pos_map[patient_id]
            return True

        # Swap with last element and remove last
        self._swap(idx, last_idx)
        self._heap.pop()
        del self._pos_map[patient_id]

        # Element at idx might need to sift up or down
        self._sift_down(idx)
        if idx < len(self._heap):
            self._sift_up(idx)

        return True

    def update(
        self,
        patient_id: str,
        new_priority_level: int,
        new_severity_score: float,
        data: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Updates patient's priority level and severity score.
        Time Complexity: O(log N)
        """
        if patient_id not in self._pos_map:
            raise KeyError(f"Patient {patient_id} not found in priority queue")

        idx = self._pos_map[patient_id]
        node = self._heap[idx]
        old_priority = node.priority_level
        node.priority_level = new_priority_level
        node.severity_score = new_severity_score
        if data:
            node.data.update(data)

        if new_priority_level < old_priority:
            self._sift_up(idx)
        else:
            self._sift_down(idx)

        return self.get_position(patient_id)

    def get_ranked_list(self) -> List[Dict[str, Any]]:
        """
        Returns full list of patients sorted in strict priority order.
        Time Complexity: O(N log N) via sorted copy of heap elements.
        """
        sorted_nodes = sorted(self._heap)
        return [node.to_dict(queue_position=i + 1) for i, node in enumerate(sorted_nodes)]

    def get_position(self, patient_id: str) -> int:
        """
        Returns 1-indexed queue position of patient in ranked list.
        Time Complexity: O(N log N)
        """
        ranked = self.get_ranked_list()
        for item in ranked:
            if item["patient_id"] == patient_id:
                return item["queue_position"]
        return -1
