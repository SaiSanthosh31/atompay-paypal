import {
  ArrowRight,
  Check,
  PackagePlus,
  Plus,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  Store,
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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

  const categories = [
    'All',
    ...Array.from(new Set(allProducts.map((p) => p.category))),
  ];

  const q = searchQuery.trim().toLowerCase();
  const visibleProducts = allProducts.filter((p) => {
    const matchesCat =
      selectedCategory === 'All' || p.category === selectedCategory;
    if (!matchesCat) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.sellerName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const cartIds = new Set(cart.map((c) => c.id));
  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const uniqueSellers = new Set(cart.map((c) => c.sellerName)).size;

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-base font-bold text-slate-900">
              Multi-Seller Storefront
            </h1>
            <button
              type="button"
              onClick={() => setShowCustomForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition"
            >
              <PackagePlus className="h-3.5 w-3.5 text-[#0070BA]" />
              + Custom Item
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!searchQuery.trim() || isGeneratingCart) return;
              await onGenerateSmartCart(searchQuery.trim());
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 min-w-0">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items below, or type a goal and click AI Bundle..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0070BA]"
              />
            </div>
            <button
              type="submit"
              disabled={isGeneratingCart || !searchQuery.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isGeneratingCart ? 'Building Cart...' : 'AI Build Cart'}
            </button>
          </form>

          {bundleNotice && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {bundleNotice}
            </div>
          )}
        </div>

        {showCustomForm && (
          <form
            onSubmit={handleAddCustom}
            className="bg-white border border-blue-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Item
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="4K Field Monitor"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:border-[#0070BA]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Seller
              </label>
              <input
                type="text"
                required
                value={customSeller}
                onChange={(e) => setCustomSeller(e.target.value)}
                placeholder="DisplayHub"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:border-[#0070BA]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="149.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:border-[#0070BA]"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={customCriticality}
                onChange={(e) =>
                  setCustomCriticality(e.target.value as LegCriticality)
                }
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white"
              >
                <option value="CRITICAL">Required</option>
                <option value="OPTIONAL">Optional</option>
              </select>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-[#003087] text-white text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scenarios.map((sc) => {
            const total = sc.items.reduce(
              (sum, i) => sum + i.unitPrice * i.quantity,
              0
            );
            return (
              <div
                key={sc.id}
                className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between gap-2.5"
              >
                <div className="text-xs font-semibold text-slate-900">
                  {sc.name}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-900">
                    ${total.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddBundle(sc)}
                    className="text-xs font-semibold text-[#0070BA] hover:text-[#003087] cursor-pointer"
                  >
                    Load →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
              No catalog items match "{searchQuery}". Click <strong>AI Build Cart</strong> above to generate a custom multi-seller bundle for it.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleProducts.map((product) => {
                const inCart = cartIds.has(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          <Store className="h-3 w-3" />
                          {product.sellerName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {product.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">
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
      </div>

      <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 sticky top-20">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-[#003087]" />
            Cart
          </h2>
          <span className="text-xs text-slate-500">
            {cart.length} items · {uniqueSellers} sellers
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Add items or load a bundle.
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-500 truncate">
                        {item.sellerName}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleCriticality(item.id)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                          item.criticality === 'CRITICAL'
                            ? 'bg-blue-50 text-[#003087] border-blue-200'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.criticality === 'CRITICAL'
                          ? 'Required'
                          : 'Optional'}
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

            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                <Shield className="h-3.5 w-3.5 text-[#003087] shrink-0" />
                <span>$0 charged unless all required sellers confirm</span>
              </div>

              <label className="flex items-center gap-2 pt-1.5 border-t border-blue-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSubstitute}
                  onChange={(e) => onToggleAutoSubstitute(e.target.checked)}
                  className="rounded border-slate-300 text-[#003087]"
                />
                <span className="text-[11px] font-medium text-slate-700">
                  Auto-swap if out of stock
                </span>
              </label>
            </div>

            <button
              type="button"
              disabled={isCheckingOut}
              onClick={onProceedToCheckout}
              className="w-full py-3 px-4 rounded-xl bg-[#003087] hover:bg-[#002569] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isCheckingOut
                ? 'Preparing Checkout...'
                : `Checkout · $${cartTotal.toFixed(2)}`}
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
