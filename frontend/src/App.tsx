import { useCallback, useEffect, useState } from 'react';
import { atomApi } from './api/client';
import { DagVisualizer } from './components/DagVisualizer';
import { LedgerGrid } from './components/LedgerGrid';
import { ScenarioBuilder } from './components/ScenarioBuilder';
import { TopBar } from './components/TopBar';
import { WireInspector } from './components/WireInspector';
import type {
  BundleSession,
  HealthResponse,
  LedgerEntry,
  ScenarioPreset,
  VendorFaultMode,
} from './types/atompay';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [goalPrompt, setGoalPrompt] = useState<string>('');
  const [autoSubstitute, setAutoSubstitute] = useState<boolean>(true);
  const [bundle, setBundle] = useState<BundleSession | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'control' | 'ledger'>('control');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadLedger = useCallback(async () => {
    try {
      const { entries } = await atomApi.getLedger();
      setLedger(entries);
    } catch {
      // Non-fatal on initial boot
    }
  }, []);

  const loadScenarios = useCallback(async () => {
    const { scenarios: list } = await atomApi.getScenarios();
    setScenarios(list);
    return list;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [h, sc] = await Promise.all([
          atomApi.getHealth(),
          loadScenarios(),
        ]);
        setHealth(h);
        if (sc.length > 0) {
          setSelectedScenarioId(sc[0].id);
          setGoalPrompt(sc[0].goalPrompt);
          const { bundle: initial } = await atomApi.analyzeBundle({
            scenarioId: sc[0].id,
            goalPrompt: sc[0].goalPrompt,
            autoSubstitute: true,
          });
          setBundle(initial);
        }
        await loadLedger();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to initialize AtomPay');
      }
    })();
  }, [loadLedger, loadScenarios]);

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    const match = scenarios.find((s) => s.id === id);
    if (match) setGoalPrompt(match.goalPrompt);
  };

  const handleSetFault = async (legId: string, mode: VendorFaultMode) => {
    try {
      setError(null);
      await atomApi.setVendorFault(legId, mode);
      await loadScenarios();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update seller fault');
    }
  };

  const handleResetFaults = async () => {
    try {
      setError(null);
      await atomApi.resetAllFaults();
      await loadScenarios();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset faults');
    }
  };

  const handleCompileBundle = async () => {
    try {
      setError(null);
      setIsCompiling(true);
      const { bundle: compiled } = await atomApi.analyzeBundle({
        scenarioId: selectedScenarioId,
        goalPrompt,
        autoSubstitute,
      });
      setBundle(compiled);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to compile bundle');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSimAuth = async () => {
    if (!bundle) return;
    try {
      setError(null);
      setIsBusy(true);
      if (
        bundle.phase === 'COMMITTED' ||
        bundle.phase === 'PARTIAL_COMMITTED' ||
        bundle.phase === 'ROLLED_BACK'
      ) {
        await handleCompileBundle();
        return;
      }
      const { bundle: ordered } = await atomApi.createPayPalOrder(bundle.id);
      const { bundle: authed } = await atomApi.authorizeOrderHold(
        ordered.id,
        ordered.paypalOrderId
      );
      setBundle(authed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authorization failed');
    } finally {
      setIsBusy(false);
    }
  };

  const handleBackendCreateOrder = async (bundleId: string): Promise<string> => {
    setError(null);
    const { orderId, bundle: updated } = await atomApi.createPayPalOrder(bundleId);
    setBundle(updated);
    return orderId;
  };

  const handleBackendAuthorizeOrder = async (
    bundleId: string,
    orderId: string
  ): Promise<void> => {
    setError(null);
    const { bundle: updated } = await atomApi.authorizeOrderHold(
      bundleId,
      orderId
    );
    setBundle(updated);
  };

  const handleExecute2PC = async () => {
    if (!bundle) return;
    try {
      setError(null);
      setIsBusy(true);
      const { bundle: settled } = await atomApi.executeTwoPhaseCommit(
        bundle.id,
        autoSubstitute
      );
      setBundle(settled);
      await loadLedger();
    } catch (e) {
      setError(e instanceof Error ? e.message : '2PC execution failed');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100">
      <TopBar
        health={health}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ledgerCount={ledger.length}
      />

      <main className="max-w-[1480px] mx-auto px-4 sm:px-6 py-5 space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-300 hover:text-white font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'control' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-3">
              <ScenarioBuilder
                scenarios={scenarios}
                selectedScenarioId={selectedScenarioId}
                onSelectScenario={handleSelectScenario}
                goalPrompt={goalPrompt}
                onGoalPromptChange={setGoalPrompt}
                autoSubstitute={autoSubstitute}
                onToggleAutoSubstitute={setAutoSubstitute}
                onSetFault={handleSetFault}
                onResetFaults={handleResetFaults}
                onCompileBundle={handleCompileBundle}
                isCompiling={isCompiling}
              />
            </div>

            <div className="lg:col-span-5">
              <DagVisualizer
                bundle={bundle}
                health={health}
                autoSubstitute={autoSubstitute}
                isBusy={isBusy}
                onCreateOrderAndSimAuth={handleSimAuth}
                onBackendCreateOrder={handleBackendCreateOrder}
                onBackendAuthorizeOrder={handleBackendAuthorizeOrder}
                onExecute2PC={handleExecute2PC}
                onError={setError}
              />
            </div>

            <div className="lg:col-span-4">
              <WireInspector events={bundle?.wireEvents || []} />
            </div>
          </div>
        ) : (
          <LedgerGrid entries={ledger} onRefresh={loadLedger} />
        )}
      </main>
    </div>
  );
}

export default App;

