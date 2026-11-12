import { Activity, Cpu, Layers, ShieldCheck, Table2 } from 'lucide-react';
import type { HealthResponse } from '../types/atompay';

interface TopBarProps {
  health: HealthResponse | null;
  activeTab: 'control' | 'ledger';
  onTabChange: (tab: 'control' | 'ledger') => void;
  ledgerCount: number;
}

export function TopBar({
  health,
  activeTab,
  onTabChange,
  ledgerCount,
}: TopBarProps) {
  return (
    <header className="border-b border-slate-800/80 bg-[#0B1120]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                AtomPay
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                2PC Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Atomic Multi-Vendor Checkout &amp; Dependency Rollback for PayPal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                health?.paypalConfigured
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {health?.paypalConfigured
                ? 'PayPal Sandbox Live'
                : 'PayPal Keys Missing (Sim Mode)'}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                health?.geminiConfigured
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              {health?.geminiConfigured
                ? `Gemini (${health.geminiModel})`
                : 'AI Heuristic Fallback'}
            </span>
          </div>

          <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onTabChange('control')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'control'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              2PC Control Plane
            </button>
            <button
              type="button"
              onClick={() => onTabChange('ledger')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'ledger'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              AG Grid Ledger
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-cyan-300">
                {ledgerCount}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

