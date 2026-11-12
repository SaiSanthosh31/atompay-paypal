import {
  AlertTriangle,
  BrainCircuit,
  RotateCcw,
  Sparkles,
  Store,
  Zap,
} from 'lucide-react';
import type { ScenarioPreset, VendorFaultMode } from '../types/atompay';

interface ScenarioBuilderProps {
  scenarios: ScenarioPreset[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  goalPrompt: string;
  onGoalPromptChange: (val: string) => void;
  autoSubstitute: boolean;
  onToggleAutoSubstitute: (val: boolean) => void;
  onSetFault: (legId: string, mode: VendorFaultMode) => void;
  onResetFaults: () => void;
  onCompileBundle: () => void;
  isCompiling: boolean;
}

const FAULT_OPTIONS: Array<{
  value: VendorFaultMode;
  label: string;
  badge: string;
}> = [
  { value: 'IN_STOCK', label: 'In Stock', badge: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock', badge: 'text-rose-300 bg-rose-500/10 border-rose-500/30' },
  { value: 'PRICE_SPIKE', label: 'Price +28%', badge: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  { value: 'TIMEOUT', label: 'API Timeout', badge: 'text-purple-300 bg-purple-500/10 border-purple-500/30' },
];

export function ScenarioBuilder({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  goalPrompt,
  onGoalPromptChange,
  autoSubstitute,
  onToggleAutoSubstitute,
  onSetFault,
  onResetFaults,
  onCompileBundle,
  isCompiling,
}: ScenarioBuilderProps) {
  const activeScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-[#0D1424] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5 text-cyan-400" />
            Multi-Seller Bundle
          </h2>
          <span className="text-[11px] text-slate-500">Step 1</span>
        </div>

        <div className="space-y-2">
          {scenarios.map((sc) => {
            const active = sc.id === selectedScenarioId;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => onSelectScenario(sc.id)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  active
                    ? 'bg-blue-600/15 border-blue-500/60 shadow-sm shadow-blue-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">
                    {sc.name}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300">
                    $
                    {sc.items
                      .reduce((s, i) => s + i.unitPrice * i.quantity, 0)
                      .toFixed(0)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {sc.tagline}
                </p>
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Purchase Intent (AI Dependency Context)
          </label>
          <textarea
            rows={2}
            value={goalPrompt}
            onChange={(e) => onGoalPromptChange(e.target.value)}
            className="w-full rounded-xl bg-slate-950/90 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            placeholder="Describe why these multi-vendor items depend on each other..."
          />
        </div>

        <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={autoSubstitute}
            onChange={(e) => onToggleAutoSubstitute(e.target.checked)}
            className="mt-0.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
          />
          <div className="text-xs">
            <span className="font-medium text-slate-200 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              AI Compatible Substitute Recovery
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              On: Gemini swaps a failed seller within hold cap. Off: strict all-or-nothing VOID.
            </p>
          </div>
        </label>

        <button
          type="button"
          onClick={onCompileBundle}
          disabled={isCompiling}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer"
        >
          <BrainCircuit className="h-4 w-4" />
          {isCompiling
            ? 'Compiling Dependency DAG...'
            : 'Compile AI Dependency Graph'}
        </button>
      </div>

      {activeScenario && (
        <div className="rounded-2xl border border-slate-800 bg-[#0D1424] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              Seller Fault Simulator
            </h2>
            <button
              type="button"
              onClick={onResetFaults}
              className="text-[11px] text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Inject a failure on any seller before running Phase 2 verification to watch AtomPay protect the buyer.
          </p>

          <div className="space-y-2.5">
            {activeScenario.items.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {item.sellerName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.title} · ${item.unitPrice}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                      item.criticality === 'CRITICAL'
                        ? 'text-rose-300 bg-rose-500/10 border-rose-500/30'
                        : 'text-sky-300 bg-sky-500/10 border-sky-500/30'
                    }`}
                  >
                    {item.criticality}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  {FAULT_OPTIONS.map((opt) => {
                    const active = item.faultMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onSetFault(item.id, opt.value)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition cursor-pointer flex items-center justify-center gap-1 ${
                          active
                            ? opt.badge
                            : 'text-slate-400 bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {active && <Zap className="h-2.5 w-2.5" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

