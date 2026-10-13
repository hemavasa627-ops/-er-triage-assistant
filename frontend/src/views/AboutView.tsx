import React, { useState } from 'react';
import {
  Info, Cpu, Layers, Sparkles, BookOpen, Terminal, CheckCircle2,
  AlertTriangle, ShieldAlert, Code2, Server, Play, Activity
} from 'lucide-react';
import { runJavaTestSuite, checkJavaStatus } from '../api';

export const AboutView: React.FC = () => {
  const [isRunningJavaTest, setIsRunningJavaTest] = useState(false);
  const [javaTestOutput, setJavaTestOutput] = useState<string | null>(null);

  const handleRunJavaTests = async () => {
    setIsRunningJavaTest(true);
    setJavaTestOutput(null);
    try {
      const res = await runJavaTestSuite();
      setJavaTestOutput(res.stdout || res.stderr || 'Tests executed successfully.');
    } catch (err: any) {
      setJavaTestOutput('Error triggering Java test suite: ' + err.message);
    } finally {
      setIsRunningJavaTest(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2">
          <Info className="w-7 h-7 text-teal-600" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            About ER Triage Assistant
          </h1>
        </div>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          An educational computer science prototype demonstrating the synthesis of Discrete Mathematics (DMGT), Artificial Intelligence (AI/LLM), Advanced Data Structures & Algorithms (ADSA), Object-Oriented Programming in Java (OOPJ), and Modern Full-Stack Python.
        </p>
      </div>

      {/* Prominent Educational Disclaimer */}
      <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200/90 shadow-xs flex items-start gap-4 text-amber-900">
        <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-sm uppercase tracking-wider text-amber-800">
            Crucial Educational Prototype Notice
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed text-amber-900/90">
            This system was developed solely for academic coursework demonstration. It is <strong>NOT</strong> clinically validated, <strong>NOT</strong> an approved medical device, and <strong>NEVER</strong> safe for diagnostic triage in real hospitals. Emergency patients must always be evaluated in-person by certified emergency physicians or triage nurses.
          </p>
        </div>
      </div>

      {/* Engineering Curriculum Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. DMGT */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-teal-700">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center font-bold text-sm border border-teal-200">
              <Layers className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              1. DMGT (Discrete Mathematics)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Propositional Logic & Compound Predicates:</strong> Medical decision trees are modeled as Boolean propositions &Phi; &rarr; &Psi;. Emergency warning conditions evaluate compound predicates over physiological inputs (e.g., SpO2 &lt; 90% or SystolicBP &lt; 80 mmHg). When inputs are missing, the logic engine preserves explicit three-valued logic (True / False / Unknown) rather than coercing omitted vitals to normal.
          </p>
        </div>

        {/* 2. ADSA */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-cyan-700">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center font-bold text-sm border border-cyan-200">
              <Cpu className="w-4 h-4 text-cyan-600" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              2. ADSA (Data Structures & Algorithms)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Binary Min-Heap Priority Queue:</strong> Active emergency patients are organized in an in-memory Min-Heap. The queue uses a deterministic comparison tuple: <code>&lang;PriorityLevel, ArrivalTime, PatientID&rang;</code>. Enqueue and dequeue operate in $O(\log N)$ time, peek runs in $O(1)$ time, and an inverted index map provides $O(\log N)$ updates when patient clinical states transition.
          </p>
        </div>

        {/* 3. OOPJ / Java */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-indigo-700">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-sm border border-indigo-200">
              <Code2 className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              3. OOPJ (Object-Oriented Programming in Java)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Domain Modeling & Service Patterns:</strong> Built in <code>java-module/src/er/triage/</code> featuring <code>Patient</code>, <code>VitalSigns</code>, <code>TriageResult</code>, <code>PriorityQueueManager</code>, and <code>PatientService</code>. Demonstrates encapsulation with nullable value types, immutability, defensive validation, and a standalone CLI bridge executable via <code>Main --test</code>.
          </p>
        </div>

        {/* 4. Artificial Intelligence & LLM */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-amber-700">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center font-bold text-sm border border-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              4. AI & LLM Information Extraction
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Natural Language Symptom Processing:</strong> Parses patient statements into structured JSON (symptoms, duration, explicit details) while enforcing strict guardrails: the AI engine never invents vitals, never generates a medical diagnosis, and cannot assign clinical priority tiers. Works in demo mode with a local heuristic NLP parser without requiring paid API keys.
          </p>
        </div>

        {/* 5. Python Backend */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-700">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center font-bold text-sm border border-emerald-200">
              <Server className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              5. Python Acuity Scoring & FastAPI
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Normalized Deviation Scoring:</strong> Calculates an illustrative 0-100 numerical score weighted across verified present vital signs. The scoring module enforces the rule that numerical scores can never override an active Level 1 emergency warning rule. Persisted in SQLite with complete audit logging.
          </p>
        </div>

        {/* 6. Modern React Frontend */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-teal-700">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center font-bold text-sm border border-teal-200">
              <Activity className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              6. React 18, TypeScript & Tailwind CSS
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Clean Hospital Interface Design:</strong> Modern healthcare technology aesthetic with white/light-gray backgrounds, teal/blue accents, accessible multi-attribute priority badges (icon + color + text), Recharts data visualization, and instant responsive layouts.
          </p>
        </div>

      </div>

      {/* Live Interactive Java Module Test Runner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Terminal className="w-4 h-4" />
              <span>Polyglot Verification</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Execute Java OOP & ADSA Test Suite via Subprocess Bridge
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Runs <code>java -cp bin er.triage.Main --test</code> via the Python FastAPI bridge to verify heap invariant, tie-breaking, and OOP encapsulation.
            </p>
          </div>
          <button
            onClick={handleRunJavaTests}
            disabled={isRunningJavaTest}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 shrink-0"
          >
            <Play className="w-4 h-4" />
            <span>{isRunningJavaTest ? 'Executing Java Tests...' : 'Run Java Tests'}</span>
          </button>
        </div>

        {/* Live Terminal Console */}
        <div className="bg-black/80 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto min-h-[140px] border border-slate-800">
          {isRunningJavaTest ? (
            <div className="flex items-center gap-2 text-teal-400 animate-pulse">
              <Activity className="w-4 h-4 animate-spin" />
              <span>Invoking Java runtime and compiling classes...</span>
            </div>
          ) : javaTestOutput ? (
            <pre className="whitespace-pre-wrap leading-relaxed text-emerald-400">
              {javaTestOutput}
            </pre>
          ) : (
            <div className="text-slate-500 italic">
              Click "Run Java Tests" above to verify the standalone Java OOP module in real time.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
