# ADSA: Advanced Data Structures & Algorithms

## Priority Queue and Binary Min-Heap Implementation

### 1. Mathematical Data Structure Properties

A **Binary Min-Heap** is a complete binary tree satisfying the Min-Heap Invariant:
$$\forall i > 0, \quad A[\text{parent}(i)] \le A[i]$$
Where:
- $\text{parent}(i) = \lfloor (i - 1) / 2 \rfloor$
- $\text{left}(i) = 2i + 1$
- $\text{right}(i) = 2i + 2$

### 2. Deterministic Total Order Tuple

To eliminate queue non-determinism, queue nodes are compared using a lexicographical 3-tuple:

$$K(p) = \langle \text{PriorityLevel}(p), \; \text{ArrivalTime}(p), \; \text{PatientID}(p) \rangle$$

Given two patients $A$ and $B$:
1. $K(A) < K(B) \iff \text{PriorityLevel}(A) < \text{PriorityLevel}(B)$  
   *(e.g., Level 1 Resuscitation precedes Level 2 Emergent)*
2. If $\text{PriorityLevel}(A) = \text{PriorityLevel}(B)$:  
   $\text{ArrivalTime}(A) < \text{ArrivalTime}(B)$  
   *(Deterministic FIFO tie-break: patient arriving earlier is served first)*
3. If arrival times are identical to the millisecond:  
   $\text{PatientID}(A) < \text{PatientID}(B)$  
   *(Guarantees a strict mathematical total order)*

### 3. Time Complexity Summary

| Operation | Time Complexity | Mechanism |
|---|---|---|
| `peek()` | $O(1)$ | Direct inspection of heap root $A[0]$ |
| `push()` | $O(\log N)$ | Append to array leaf, execute `sift_up` |
| `pop_min()` | $O(\log N)$ | Swap root with last leaf, execute `sift_down` |
| `update()` | $O(\log N)$ | Lookup index via hash map in $O(1)$, sift up/down |
| `remove()` | $O(\log N)$ | Swap with leaf, pop, sift up/down |
| `get_ranked_list()` | $O(N \log N)$ | Full deterministic ranking for queue display |
