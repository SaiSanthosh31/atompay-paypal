import { useCallback, useEffect, useState } from 'react';
import { atomApi } from './api/client';
import { CheckoutAndTrackerView } from './components/CheckoutAndTrackerView';
import { LedgerGrid } from './components/LedgerGrid';
import { type CartItem, MarketplaceView } from './components/MarketplaceView';
import { type AppTab, TopBar } from './components/TopBar';
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [autoSubstitute, setAutoSubstitute] = useState<boolean>(true);
  const [activeBundle, setActiveBundle] = useState<BundleSession | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>('shop');
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [isGeneratingCart, setIsGeneratingCart] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadLedger = useCallback(async () => {
    try {
      const { entries } = await atomApi.getLedger();
      setLedger(entries);
    } catch {
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
        if (sc.length > 0 && cart.length === 0) {
          setCart(
            sc[0].items.map((item) => ({
              id: item.id,
              presetScenarioId: sc[0].id,
              sku: item.sku,
              title: item.title,
              sellerName: item.sellerName,
              category: item.category,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              criticality: item.criticality,
            }))
          );
        }
        await loadLedger();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load storefront');
      }
    })();
  }, []);

  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item]));
  };

  const handleAddBundle = (scenario: ScenarioPreset) => {
    setCart(
      scenario.items.map((item) => ({
        id: item.id,
        presetScenarioId: scenario.id,
        sku: item.sku,
        title: item.title,
        sellerName: item.sellerName,
        category: item.category,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        criticality: item.criticality,
      }))
    );
  };

  const handleGenerateSmartCart = async (goal: string) => {
    try {
      setError(null);
      setIsGeneratingCart(true);
      const { items } = await atomApi.generateCart(goal);
      setCart(
        items.map((item, idx) => ({
          id: `gen-${Date.now()}-${idx}`,
          sku: `GEN-${idx + 1}-${Math.floor(100 + Math.random() * 900)}`,
          title: item.title,
          sellerName: item.sellerName,
          category: item.category,
          unitPrice: Number(item.unitPrice.toFixed(2)),
          quantity: 1,
          criticality: item.criticality,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build bundle');
    } finally {
      setIsGeneratingCart(false);
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleCriticality = (id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              criticality:
                item.criticality === 'CRITICAL' ? 'OPTIONAL' : 'CRITICAL',
            }
          : item
      )
    );
  };

  const handleProceedToCheckout = async () => {
    if (cart.length === 0) return;
    try {
      setError(null);
      setIsCheckingOut(true);

      const matchingPreset = scenarios.find(
        (sc) =>
          sc.items.length === cart.length &&
          sc.items.every((si) => cart.some((ci) => ci.id === si.id))
      );

      const { bundle } = await atomApi.analyzeBundle(
        matchingPreset
          ? {
              scenarioId: matchingPreset.id,
              autoSubstitute,
            }
          : {
              customTitle: 'Custom Multi-Seller Order',
              autoSubstitute,
              customLegs: cart.map((c) => ({
                id: c.id,
                title: c.title,
                sellerName: c.sellerName,
                category: c.category,
                unitPrice: c.unitPrice,
                quantity: c.quantity,
                criticality: c.criticality,
              })),
            }
      );

      setActiveBundle(bundle);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not prepare checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSetFault = async (legId: string, mode: VendorFaultMode) => {
    try {
      setError(null);
      await atomApi.setVendorFault(legId, mode);
      await loadScenarios();
      if (activeBundle) {
        setActiveBundle({
          ...activeBundle,
          legs: activeBundle.legs.map((l) =>
            l.id === legId ? { ...l, faultMode: mode } : l
          ),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update seller status');
    }
  };

  const handleSimAuthorize = async () => {
    if (!activeBundle) return;
    try {
      setError(null);
      setIsBusy(true);
      const { bundle: ordered } = await atomApi.createPayPalOrder(activeBundle.id);
      const { bundle: authed } = await atomApi.authorizeOrderHold(
        ordered.id,
        ordered.paypalOrderId
      );
      setActiveBundle(authed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authorization failed');
    } finally {
      setIsBusy(false);
    }
  };

  const handleBackendCreateOrder = async (bundleId: string): Promise<string> => {
    setError(null);
    const { orderId, bundle } = await atomApi.createPayPalOrder(bundleId);
    setActiveBundle(bundle);
    return orderId;
  };

  const handleBackendAuthorizeOrder = async (
    bundleId: string,
    orderId: string
  ): Promise<void> => {
    setError(null);
    const { bundle } = await atomApi.authorizeOrderHold(bundleId, orderId);
    setActiveBundle(bundle);
  };

  const handleExecuteSettlement = async () => {
    if (!activeBundle) return;
    try {
      setError(null);
      setIsBusy(true);
      const { bundle: settled } = await atomApi.executeTwoPhaseCommit(
        activeBundle.id,
        autoSubstitute
      );
      setActiveBundle(settled);
      await loadLedger();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Settlement failed');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-900">
      <TopBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'shop') setActiveBundle(null);
        }}
        cartCount={cart.length}
        ledgerCount={ledger.length}
        wireCount={activeBundle?.wireEvents.length || 0}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="font-semibold text-rose-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'shop' && !activeBundle && (
          <MarketplaceView
            scenarios={scenarios}
            cart={cart}
            onAddToCart={handleAddToCart}
            onAddBundle={handleAddBundle}
            onGenerateSmartCart={handleGenerateSmartCart}
            isGeneratingCart={isGeneratingCart}
            onRemoveFromCart={handleRemoveFromCart}
            onToggleCriticality={handleToggleCriticality}
            autoSubstitute={autoSubstitute}
            onToggleAutoSubstitute={setAutoSubstitute}
            onProceedToCheckout={handleProceedToCheckout}
            isCheckingOut={isCheckingOut}
          />
        )}

        {activeTab === 'shop' && activeBundle && (
          <CheckoutAndTrackerView
            bundle={activeBundle}
            health={health}
            autoSubstitute={autoSubstitute}
            isBusy={isBusy}
            onBackToShop={() => setActiveBundle(null)}
            onSetFault={handleSetFault}
            onSimAuthorize={handleSimAuthorize}
            onBackendCreateOrder={handleBackendCreateOrder}
            onBackendAuthorizeOrder={handleBackendAuthorizeOrder}
            onExecuteSettlement={handleExecuteSettlement}
            onError={setError}
          />
        )}

        {activeTab === 'orders' && (
          <LedgerGrid entries={ledger} onRefresh={loadLedger} />
        )}

        {activeTab === 'logs' && (
          <WireInspector events={activeBundle?.wireEvents || []} />
        )}
      </main>
    </div>
  );
}

export default App;
