import {
  ArrowRight,
  Check,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { LegCriticality, ScenarioPreset } from '../types/atompay';

export interface CartItem {
  id: string;
  presetScenarioId?: string;
  sku: string;
  title: string;
  sellerName: string;
  category: string;
  unitPrice: number;
  quantity: number;
  criticality: LegCriticality;
}

interface MarketplaceViewProps {
  scenarios: ScenarioPreset[];
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onAddBundle: (scenario: ScenarioPreset) => void;
  onGenerateSmartCart: (goal: string) => Promise<void>;
  isGeneratingCart: boolean;
  bundleNotice: string | null;
  onRemoveFromCart: (id: string) => void;
  onToggleCriticality: (id: string) => void;
  autoSubstitute: boolean;
  onToggleAutoSubstitute: (val: boolean) => void;
  onProceedToCheckout: () => void;
  isCheckingOut: boolean;
}

const BUNDLE_LABELS: Record<string, string> = {
  'creator-camera-rig': 'Camera Kit',
  'ai-workstation-build': 'PC Build',
  'saas-launch-stack': 'Cloud Stack',
};

export function MarketplaceView({
  scenarios,
  cart,
  onAddToCart,
  onAddBundle,
  onGenerateSmartCart,
  isGeneratingCart,
  bundleNotice,
  onRemoveFromCart,
  onToggleCriticality,
  autoSubstitute,
  onToggleAutoSubstitute,
  onProceedToCheckout,
  isCheckingOut,
}: MarketplaceViewProps) {
  const [activeKitId, setActiveKitId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSeller, setCustomSeller] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customCriticality, setCustomCriticality] =
    useState<LegCriticality>('CRITICAL');

  const allProducts = scenarios.flatMap((sc) =>
    sc.items.map((item) => ({
      ...item,
      scenarioId: sc.id,
    }))
  );

  const q = searchQuery.trim().toLowerCase();
  const visibleProducts = allProducts.filter((p) => {
    if (activeKitId !== 'ALL' && p.scenarioId !== activeKitId) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.sellerName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const cartIds = new Set(cart.map((c) => c.id));
  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(customPrice);
    if (!customTitle.trim() || !customSeller.trim() || !price || price <= 0) {
      return;
    }
    onAddToCart({
      id: `custom-${Date.now()}`,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      title: customTitle.trim(),
      sellerName: customSeller.trim(),
      category: 'Custom',
      unitPrice: Number(price.toFixed(2)),
      quantity: 1,
      criticality: customCriticality,
    });
    setCustomTitle('');
    setCustomSeller('');
    setCustomPrice('');
    setShowCustomForm(false);
  };

  const activeScenario = scenarios.find((s) => s.id === activeKitId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-4">
        {/* Search + AI Bundle + Custom Bar */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!searchQuery.trim() || isGeneratingCart) return;
            await onGenerateSmartCart(searchQuery.trim());
          }}
          className="bg-white border border-slate-200 rounded-2xl p-2.5 flex flex-wrap sm:flex-nowrap items-center gap-2 shadow-2xs"
        >
          <div className="relative flex-1 min-w-[180px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or enter goal..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
            />
          </div>

          <button
            type="submit"
            disabled={isGeneratingCart || !searchQuery.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isGeneratingCart ? 'Building...' : 'AI Bundle'}
          </button>

          <button
            type="button"
            onClick={() => setShowCustomForm((v) => !v)}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition shrink-0"
          >
            + Custom
          </button>
        </form>

        {bundleNotice && (
          <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2">
            {bundleNotice}
          </div>
        )}

        {showCustomForm && (
          <form
            onSubmit={handleAddCustom}
            className="bg-white border border-blue-200 rounded-2xl p-3.5 grid grid-cols-2 sm:grid-cols-5 gap-2 items-center"
          >
            <input
              type="text"
              required
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Item name"
              className="col-span-2 sm:col-span-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-[#0070BA]"
            />
            <input
              type="text"
              required
              value={customSeller}
              onChange={(e) => setCustomSeller(e.target.value)}
              placeholder="Seller"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-[#0070BA]"
            />
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="$ Price"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-[#0070BA]"
            />
            <div className="flex items-center gap-1.5">
              <select
                value={customCriticality}
                onChange={(e) =>
                  setCustomCriticality(e.target.value as LegCriticality)
                }
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white flex-1"
              >
                <option value="CRITICAL">Req</option>
                <option value="OPTIONAL">Opt</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#003087] text-white text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* Single-Row Bundle Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveKitId('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition ${
                activeKitId === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              All
            </button>
            {scenarios.map((sc) => {
              const active = activeKitId === sc.id;
              const total = sc.items.reduce(
                (s, i) => s + i.unitPrice * i.quantity,
                0
              );
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setActiveKitId(sc.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {BUNDLE_LABELS[sc.id] || sc.name} · ${total.toFixed(0)}
                </button>
              );
            })}
          </div>

          {activeScenario && (
            <button
              type="button"
              onClick={() => onAddBundle(activeScenario)}
              className="text-xs font-semibold text-[#0070BA] hover:text-[#003087] cursor-pointer"
            >
              Load Kit →
            </button>
          )}
        </div>

        {/* Clean Product Grid */}
        {visibleProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
            No matches. Click <strong>AI Bundle</strong> to generate items for "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleProducts.map((product) => {
              const inCart = cartIds.has(product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{product.sellerName}</span>
                      <span>{product.category}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mt-1">
                      {product.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-900">
                      ${product.unitPrice.toFixed(2)}
                    </span>

                    {inCart ? (
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(product.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Added
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onAddToCart({
                            id: product.id,
                            presetScenarioId: product.scenarioId,
                            sku: product.sku,
                            title: product.title,
                            sellerName: product.sellerName,
                            category: product.category,
                            unitPrice: product.unitPrice,
                            quantity: product.quantity,
                            criticality: product.criticality,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0070BA] hover:bg-[#003087] text-white text-xs font-semibold transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Minimal Cart Panel */}
      <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 sticky top-20 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Cart</h2>
          <span className="text-xs font-semibold text-slate-500">
            ${cartTotal.toFixed(2)}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Cart is empty
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-slate-500 truncate">
                        {item.sellerName}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleCriticality(item.id)}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border cursor-pointer ${
                          item.criticality === 'CRITICAL'
                            ? 'bg-blue-50 text-[#003087] border-blue-200'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {item.criticality === 'CRITICAL' ? 'Req' : 'Opt'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-900">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5 text-[#003087]" />
                Auto-swap
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={autoSubstitute}
                onClick={() => onToggleAutoSubstitute(!autoSubstitute)}
                className={`w-9 h-5 rounded-full transition relative cursor-pointer ${
                  autoSubstitute ? 'bg-[#003087]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition transform ${
                    autoSubstitute ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              disabled={isCheckingOut}
              onClick={onProceedToCheckout}
              className="w-full py-2.5 px-4 rounded-xl bg-[#003087] hover:bg-[#002569] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isCheckingOut ? 'Loading...' : `PayPal Checkout · $${cartTotal.toFixed(2)}`}
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
