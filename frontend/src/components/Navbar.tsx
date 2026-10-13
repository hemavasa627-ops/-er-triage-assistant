import React from 'react';
import { Activity, UserPlus, Users, History, Info, Database, Layers, Sparkles, Check } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'register' | 'queue' | 'history' | 'about';
  setActiveTab: (tab: 'dashboard' | 'register' | 'queue' | 'history' | 'about') => void;
  onLoadDemo: () => void;
  loadingDemo: boolean;
  demoLoadedCount: number | null;
  javaStatus?: { java_detected: boolean; source: string } | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onLoadDemo,
  loadingDemo,
  demoLoadedCount,
  javaStatus,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  ER TRIAGE ASSISTANT
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  Decision Support
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Smart Emergency Patient Prioritization System
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register Patient
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Patient Queue
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              Patient History
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'about'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Info className="w-4 h-4" />
              About Project
            </button>
          </nav>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-3">
            {/* Java Integration Badge */}
            {javaStatus && (
              <div
                className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  javaStatus.java_detected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
                title="Java OOP & ADSA PriorityQueueManager Subprocess Bridge"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    javaStatus.java_detected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>{javaStatus.java_detected ? 'Java OOP Engine' : 'Java Bridge Offline'}</span>
              </div>
            )}

            {/* Load Demo Patients Button */}
            <button
              onClick={onLoadDemo}
              disabled={loadingDemo}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              <Database className="w-4 h-4 text-teal-400" />
              <span>{loadingDemo ? 'Loading...' : 'Load Demo Patients'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-between gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-teal-100 text-teal-800' : 'text-slate-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'register' ? 'bg-teal-100 text-teal-800' : 'text-slate-600'
          }`}
        >
          Register
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'queue' ? 'bg-teal-100 text-teal-800' : 'text-slate-600'
          }`}
        >
          Queue
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'history' ? 'bg-teal-100 text-teal-800' : 'text-slate-600'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'about' ? 'bg-teal-100 text-teal-800' : 'text-slate-600'
          }`}
        >
          About
        </button>
      </div>
    </header>
  );
};
