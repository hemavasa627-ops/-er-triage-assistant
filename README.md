# ER TRIAGE ASSISTANT — Smart Emergency Patient Prioritization System

> **CRITICAL MEDICAL DISCLAIMER:**  
> This software is strictly an **educational demonstration prototype** built for college computer science coursework (synthesizing Discrete Mathematics & Graph Theory, Artificial Intelligence, Advanced Data Structures & Algorithms, and Object-Oriented Programming).  
> **IT IS NOT A CLINICALLY VALIDATED MEDICAL DEVICE OR DIAGNOSTIC SYSTEM.**  
> In real hospital settings, all presenting emergency patients require prompt physical evaluation and medical management by licensed healthcare professionals adhering to certified triage protocols (e.g., ESI, MTS, CTAS).

---

## 1. Project Overview

When multiple patients arrive at an emergency room, clinical staff must rapidly distinguish between time-critical emergencies and low-acuity complaints. **ER TRIAGE ASSISTANT** is a full-stack clinical decision-support web application that assists emergency room triage teams by structuring patient data, evaluating propositional emergency warning conditions, computing demonstration acuity scores, and maintaining a dynamically prioritized waiting queue using a Binary Min-Heap.

---

## 2. Technology Stack & Multi-Disciplinary Synthesis

| Component | Technology | Role & Educational Subject Connection |
|---|---|---|
| **Frontend UI/UX** | React 18, TypeScript, Tailwind CSS, Lucide React, Recharts | Hospital-inspired dashboard with accessible multi-attribute priority badges, Recharts acuity analytics, responsive dossier modals. |
| **Backend API** | Python 3.13, FastAPI, Pydantic V2, SQLite | RESTful API endpoints, input validation, audit trail history, dynamic weight scoring, and static frontend SPA hosting. |
| **Severity Rule Engine** | DMGT Propositional Logic (`rule_engine.py`, `triage_rules.json`) | Logical IF/THEN propositional rules evaluating compound Boolean predicates for Level 1 (Resuscitation) to Level 4 (Routine). |
| **Priority Queue Manager** | ADSA Binary Min-Heap (`priority_queue.py` & Java `PriorityQueueManager`) | In-memory priority queue maintaining deterministic total ordering with $O(\log N)$ enqueue/dequeue and arrival-time tie-breaking. |
| **Severity Acuity Scoring** | Python (`scoring_engine.py`) | Normalized deviation formula over verified present vital signs with explicit handling of omitted metrics. |
| **Object-Oriented Module** | Java 17 OOP (`java-module/src/er/triage/`) | Pure OOP domain modeling (`Patient`, `VitalSigns`, `TriageResult`, `PatientService`), encapsulation with nullable value types, and CLI IPC bridge. |
| **Symptom Extraction** | Heuristic NLP & Optional LLM (`llm_service.py`) | Unstructured clinical complaint parser extracting symptom tokens with strict diagnostic guardrails (offline demo mode supported). |
| **Data Storage** | SQLite (`triage.db`) | Relational persistence for patients, vital signs, triage assessments, and status change audit trails. |

---

## 3. Project Directory Structure

```
er-triage-assistant/
├── backend/                        # Python FastAPI Backend
│   ├── config/                     # Editable configuration files
│   │   ├── triage_rules.json       # DMGT propositional rule definitions
│   │   └── scoring_weights.json    # Physiological weight definitions
│   ├── database.py                 # SQLite database schema & connection pool
│   ├── models.py                   # Pydantic schemas and request/response models
│   ├── rule_engine.py              # DMGT propositional IF/THEN rule evaluator
│   ├── scoring_engine.py           # Python normalized weighted acuity scoring
│   ├── priority_queue.py           # ADSA Binary Min-Heap with inverted index map
│   ├── demo_data.py                # Synthetic realistic demo patient generator
│   ├── llm_service.py              # NLP & LLM symptom extractor with fallback
│   ├── java_bridge.py              # Subprocess bridge compiling and running Java engine
│   └── main.py                     # FastAPI application & static SPA mount
├── frontend/                       # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Navbar.tsx          # Top navigation & demo loader
│   │   │   ├── DisclaimerBanner.tsx# Prominent educational warning banner
│   │   │   ├── PriorityBadge.tsx   # Color + Icon + Text priority badge
│   │   │   ├── SummaryCards.tsx    # Live metric summary cards
│   │   │   ├── QueueTable.tsx      # Prioritized queue table with search & filters
│   │   │   └── PatientDetailsModal.tsx # Full dossier modal with status workflow
│   │   ├── views/                  # Main application views
│   │   │   ├── DashboardView.tsx   # Command center with Recharts distribution
│   │   │   ├── RegisterPatientView.tsx # Registration form with AI extraction
│   │   │   ├── QueueView.tsx       # Dedicated queue view with ADSA explainer
│   │   │   ├── HistoryView.tsx     # Institutional patient history archive
│   │   │   └── AboutView.tsx       # Subject synthesis & live Java test runner
│   │   ├── types.ts                # TypeScript data interfaces
│   │   ├── api.ts                  # REST API client
│   │   ├── App.tsx                 # Root application state & router
│   │   ├── index.css               # Tailwind CSS directives
│   │   └── main.tsx                # React DOM entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── java-module/                    # Standalone Java OOP & ADSA Module
│   └── src/er/triage/
│       ├── Patient.java            # Encapsulated patient entity with validation
│       ├── VitalSigns.java         # Nullable physiological vitals value object
│       ├── TriageResult.java       # Immutable evaluation outcome
│       ├── PriorityQueueManager.java # Binary Min-Heap with tie-breaker
│       ├── PatientService.java     # Service orchestrator & registry
│       └── Main.java               # CLI runner & automated test suite
├── shared/                         # Shared JSON configurations
│   ├── triage_rules.json
│   └── scoring_weights.json
├── tests/                          # Automated Pytest Suite
│   └── test_triage.py              # 11 unit & integration test cases
├── docs/                           # Architectural & Coursework Documentation
│   ├── architecture.md             # System component architecture
│   ├── dmgt_rules.md               # Propositional logic formulation
│   ├── adsa_heap.md                # Heap invariants & algorithmic complexity
│   └── oopj_design.md              # Java class diagrams & OOP principles
├── .env.example                    # Environment variable template
├── .gitignore
└── README.md
```

---

## 4. Priority Categories & DMGT Rule Structure

| Level | Category Code | Max Target Wait | Primary Demonstration Trigger Criteria |
|---|---|---|---|
| **Level 1** | `RED` (Immediate) | 0 minutes (Immediate) | $\text{SpO}_2 < 90\% \lor \text{CrushingChestPain} \lor \text{SBP} < 80 \text{ mmHg} \lor \text{CardiacArrest}$ |
| **Level 2** | `ORANGE` (Emergent) | $\le 15$ minutes | $\text{SpO}_2 \in [90\%, 93\%] \lor \text{Temp} \ge 39.5^\circ\text{C} \lor \text{FAST Stroke Signs} \lor \text{Severe Dyspnea}$ |
| **Level 3** | `YELLOW` (Urgent) | $\le 60$ minutes | $\text{Temp} \in [38.2, 39.4]^\circ\text{C} \lor \text{Deep Laceration} \lor \text{Moderate Abdominal Pain}$ |
| **Level 4** | `GREEN` (Routine) | $\le 120$ minutes | Stable baseline vitals, minor laceration, sprained ankle, upper respiratory congestion |

> **Critical Safety Constraint:** A numerical severity score can **NEVER** override a Level 1 Emergency Warning Condition. If a critical red trigger is detected, the patient remains Level 1 Resuscitation regardless of a low numerical score.

---

## 5. Algorithmic Complexity: ADSA Min-Heap

The priority queue orders patients using a deterministic 3-tuple:
$$\text{Tuple} = \langle \text{PriorityLevel}, \; \text{ArrivalTime}, \; \text{PatientID} \rangle$$

1. **Primary Key:** Lower numerical priority level indicates higher emergency ($1 < 2 < 3 < 4$).
2. **Secondary Key (Deterministic Tie-Breaker):** Earlier arrival ISO timestamp breaks ties within the same priority tier (FIFO fairness).
3. **Tertiary Key:** Patient ID ensures total order determinism.

| Operation | Heap Time Complexity | Description |
|---|---|---|
| `peek()` | $O(1)$ | Inspects highest-acuity patient at root (`heap[0]`). |
| `push()` | $O(\log N)$ | Enqueues patient at array leaf, restores invariant via `sift_up`. |
| `pop_min()` | $O(\log N)$ | Removes highest-acuity root, swaps with last element, restores via `sift_down`. |
| `update()` | $O(\log N)$ | Uses hash map index lookup ($O(1)$) to locate node and sifts up or down. |
| `remove()` | $O(\log N)$ | Discharges or completes patient review, recalculating active positions. |

---

## 6. Installation & Execution Guide

### Prerequisites
- **Python 3.10+** (Python 3.13 tested)
- **Node.js 18+** & **npm** (Node v24 tested)
- **Java JDK 17+** (Microsoft OpenJDK / Eclipse Adoptium Temurin)

### Step 1: Install Python Dependencies
```bash
cd er-triage-assistant
pip install fastapi uvicorn pydantic pytest pytest-asyncio httpx
```

### Step 2: Build the React Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 3: Run the FastAPI Server (Hosts API & Frontend on Port 8000)
```bash
python backend/main.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser!

*(Optional) For live HMR frontend development:*
```bash
cd frontend
npm run dev
```

---

## 7. Automated Test Suites

### Run Backend Pytest Suite (11 Tests)
```bash
pytest tests/test_triage.py -v
```
Verifies:
- Input validation & schema boundaries
- Nullability preservation for missing vital signs
- DMGT propositional logic rule evaluation (Levels 1 to 4)
- Severity score calculation & factor breakdown
- Binary Min-Heap ordering & FIFO arrival tie-breaking
- Status lifecycle updates & database audit logging
- Synthetic demo data duplicate prevention
- Heuristic NLP symptom extraction

### Run Java OOP & ADSA Test Suite (7 Tests)
```bash
python backend/java_bridge.py
```
*Or directly in Java:*
```bash
cd java-module
javac -d bin src/er/triage/*.java
java -cp bin er.triage.Main --test
```
Verifies:
- Object encapsulation and validation
- Strict nullability of missing physiological parameters
- Emergency warning rule triggering
- Binary Min-Heap invariants
- Equal-priority tie-breaking
- Queue position recalculation upon discharge
- Demo data duplicate prevention

---

## 8. Summary of Engineering Subject Deliverables

- **DMGT:** Compound Boolean logic, truth criteria, and transparent rule explanations.
- **AI / LLM:** Natural language symptom extraction with ethical constraints and local fallback.
- **ADSA:** Mathematical Min-Heap priority queue implementation with documented time complexity.
- **OOPJ / Java:** Clean object-oriented domain design with encapsulation, service pattern, and CLI IPC bridge.
- **Python:** RESTful microservice with FastAPI, dynamic weight scoring, and SQLite persistence.
- **UI/UX Design:** Healthcare technology product with responsive layout, Recharts data visualization, and accessibility.
