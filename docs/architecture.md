# System Architecture: ER TRIAGE ASSISTANT

**Smart Emergency Patient Prioritization System**  
*Educational Engineering Prototype (DMGT · AI · ADSA · OOPJ · Python)*

---

## 1. System Overview

The **ER Triage Assistant** is a full-stack clinical decision-support prototype engineered to organize emergency department patient queues by urgency and physiological severity. 

```
                                  +------------------------------------+
                                  |         REACT + TS FRONTEND        |
                                  |  (Tailwind CSS, Lucide, Recharts)  |
                                  +-----------------+------------------+
                                                    | REST / JSON
                                                    v
                                  +-----------------+------------------+
                                  |       FASTAPI PYTHON BACKEND       |
                                  |  (Pydantic, SQLite, REST Router)   |
                                  +--------+--------+--------+---------+
                                           |        |        |
         +---------------------------------+        |        +---------------------------------+
         |                                          |                                          |
         v                                          v                                          v
+------------------+                      +-------------------+                      +------------------+
|    DMGT RULES    |                      |   PYTHON SCORING  |                      |    ADSA HEAP     |
| Propositional IF |                      | Weighted Acuity   |                      | Binary Min-Heap  |
| / THEN Logic     |                      | Normalized Math   |                      | O(log N) Priority|
+------------------+                      +-------------------+                      +------------------+
         |                                          |                                          |
         +------------------------------------------+------------------------------------------+
                                                    |
                                                    v
                                  +-----------------+------------------+
                                  |       JAVA OOP MODULE (OOPJ)       |
                                  |  (Patient, Vitals, Service, Heap)  |
                                  |  CLI / Subprocess IPC Bridge       |
                                  +-----------------+------------------+
                                                    |
                                                    v
                                  +-----------------+------------------+
                                  |         SQLITE DATABASE            |
                                  | (Patients, Vitals, Triage, History)|
                                  +------------------------------------+
```

---

## 2. Core Modules & Engineering Foundations

| Engineering Domain | Module | Technical Responsibility |
|---|---|---|
| **DMGT (Discrete Mathematics & Graph Theory)** | `rule_engine.py` / `triage_rules.json` | Propositional logic rule engine ($P \rightarrow Q$) evaluating compound Boolean predicates for Level 1-4 classification. |
| **Artificial Intelligence & LLM** | `llm_service.py` | Information extraction of unstructured chief complaints with ethical guardrails and transparent local NLP fallback. |
| **ADSA (Advanced Data Structures & Algorithms)** | `priority_queue.py` & `PriorityQueueManager.java` | In-memory Binary Min-Heap priority queue with deterministic $O(\log N)$ enqueue, dequeue, and FIFO arrival-time tie breaking. |
| **OOPJ (Java Object-Oriented Programming)** | `java-module/src/er/triage/` | Complete Java object model with strict encapsulation, immutable results, service layer, and CLI bridge. |
| **Python Full-Stack** | `backend/main.py` & `scoring_engine.py` | FastAPI asynchronous REST API, normalized weighted physiological scoring, and SQLite persistence. |
| **Modern Frontend** | `frontend/` (React + TypeScript) | Responsive healthcare dashboard with Tailwind CSS, Lucide React icons, and Recharts analytics. |

---

## 3. Medical Disclaimer

> **IMPORTANT:** This software is strictly an educational demonstration prototype. It is NOT clinically validated, NOT a certified medical device, and MUST NOT be used for real patient diagnosis or treatment decisions. Real clinical triage requires licensed healthcare professionals adhering to certified triage protocols (such as ESI, MTS, or CTAS).
