import React, { useState, useEffect } from 'react';
import {
  fetchMetrics, fetchQueue, fetchPatientDetails, loadDemoPatients,
  updatePatientStatus, checkJavaStatus
} from './api';
import { DashboardMetrics, QueueItem, Patient } from './types';
import { Navbar } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { PatientDetailsModal } from './components/PatientDetailsModal';
import { DashboardView } from './views/DashboardView';
import { RegisterPatientView } from './views/RegisterPatientView';
import { QueueView } from './views/QueueView';
import { HistoryView } from './views/HistoryView';
import { AboutView } from './views/AboutView';
import { ShieldAlert, Heart, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'queue' | 'history' | 'about'>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(true);
  const [loadingDemo, setLoadingDemo] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [javaStatus, setJavaStatus] = useState<{ java_detected: boolean; source: string } | null>(null);

  // Load metrics, queue, and check Java status
  const refreshAll = async () => {
    try {
      const [m, q, js] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchQueue().catch(() => ({ count: 0, queue: [] })),
        checkJavaStatus().catch(() => null),
      ]);
      if (m) setMetrics(m);
      if (q) setQueue(q.queue);
      if (js) setJavaStatus(js);
    } catch (err) {
      console.error('Error refreshing triage data:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 15000); // 15s periodic sync
    return () => clearInterval(interval);
  }, []);

  // Handle opening patient details modal
  const handleSelectPatient = async (patientId: string) => {
    try {
      const p = await fetchPatientDetails(patientId);
      setSelectedPatient(p);
    } catch (err: any) {
      alert('Could not load patient details: ' + err.message);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (patientId: string, newStatus: string, notes?: string) => {
    await updatePatientStatus(patientId, newStatus, notes);
    // Refresh modal patient and overall queue
    const updated = await fetchPatientDetails(patientId);
    setSelectedPatient(updated);
    await refreshAll();
  };

  // Handle Load Demo Patients
  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await loadDemoPatients();
      setToastMessage(res.message);
      await refreshAll();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      setToastMessage('Error loading demo patients: ' + err.message);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Sticky Top Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadDemo={handleLoadDemo}
        loadingDemo={loadingDemo}
        demoLoadedCount={metrics?.total_patients ?? null}
        javaStatus={javaStatus}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-teal-500/30 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Activity className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            queue={queue}
            loading={loadingQueue}
            onSelectPatient={handleSelectPatient}
            onNavigateToRegister={() => setActiveTab('register')}
          />
        )}

        {activeTab === 'register' && (
          <RegisterPatientView
            onSuccess={async (newId) => {
              await refreshAll();
              setActiveTab('queue');
              handleSelectPatient(newId);
            }}
          />
        )}

        {activeTab === 'queue' && (
          <QueueView
            queue={queue}
            loading={loadingQueue}
            onSelectPatient={handleSelectPatient}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView onSelectPatient={handleSelectPatient} />
        )}

        {activeTab === 'about' && <AboutView />}
      </main>

      {/* Patient Dossier Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-700">ER TRIAGE ASSISTANT</span>
            <span>&bull; Academic Engineering Prototype</span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-400">
            Synthesizing DMGT Rules &bull; AI Information Extraction &bull; ADSA Min-Heap &bull; Java OOP &bull; Python FastAPI
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
