import {
  ArrowRight,
  Check,
  PackagePlus,
  Plus,
  Shield,
  ShoppingCart,
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
  onRemoveFromCart,
  onToggleCriticality,
  autoSubstitute,
  onToggleAutoSubstitute,
  onProceedToCheckout,
  isCheckingOut,
}: MarketplaceViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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
      bundleName: sc.name,
    }))
  );

  const categories = [
    'All',
    ...Array.from(new Set(allProducts.map((p) => p.category))),
  ];

  const visibleProducts =
    selectedCategory === 'All'
      ? allProducts
      : allProducts.filter((p) => p.category === selectedCategory);

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
      {/* Left: Multi-Seller Storefront */}
      <div className="lg:col-span-8 space-y-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Shop Across Independent Sellers — Protected in One Checkout
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Add items from multiple stores or add your own items. Your PayPal hold only settles if every required seller confirms stock and price.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer transition"
          >
            <PackagePlus className="h-4 w-4 text-[#0070BA]" />
            Add Custom Seller Item
          </button>
        </div>

        {showCustomForm && (
          <form
            onSubmit={handleAddCustom}
            className="bg-white border border-blue-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end shadow-xs"
          >
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Product / Service Name
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., 27-inch 4K Reference Monitor"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:border-[#0070BA]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Seller Name
              </label>
              <input
                type="text"
                required
                value={customSeller}
                onChange={(e) => setCustomSeller(e.target.value)}
                placeholder="e.g., DisplayHub"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:border-[#0070BA]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Price (USD)
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
                className="px-3.5 py-1.5 rounded-lg bg-[#003087] hover:bg-[#002569] text-white text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* Quick Compatible Bundles */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Curated Multi-Seller Bundles
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((sc) => {
              const total = sc.items.reduce(
                (sum, i) => sum + i.unitPrice * i.quantity,
                0
              );
              return (
                <div
                  key={sc.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {sc.name}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{sc.tagline}</p>
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
                      Load Bundle →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Filter + Product Catalog */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {visibleProducts.map((product) => {
              const inCart = cartIds.has(product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Store className="h-3 w-3 text-slate-500" />
                        {product.sellerName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {product.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {product.dependencyReason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-base font-bold text-slate-900">
                      ${product.unitPrice.toFixed(2)}
                    </span>

                    {inCart ? (
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(product.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        In Cart
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0070BA] hover:bg-[#003087] text-white text-xs font-semibold transition cursor-pointer"
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
        </div>
      </div>

      {/* Right: Protected Multi-Seller Cart */}
      <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 sticky top-20">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-[#003087]" />
            Unified Cart
          </h2>
          <span className="text-xs text-slate-500">
            {cart.length} {cart.length === 1 ? 'item' : 'items'} ·{' '}
            {uniqueSellers} {uniqueSellers === 1 ? 'seller' : 'sellers'}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Your cart is empty. Add items from different sellers or load a bundle to start protected checkout.
          </div>
        ) : (
          <>
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Sold by {item.sellerName}
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

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Bundle rule:
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleCriticality(item.id)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border cursor-pointer ${
                        item.criticality === 'CRITICAL'
                          ? 'bg-blue-50 text-[#003087] border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.criticality === 'CRITICAL'
                        ? 'Required together'
                        : 'Optional add-on'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-[#003087] shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>All-or-Nothing Protection:</strong> PayPal places a hold first. If any required seller fails stock or spikes price, your entire hold is automatically voided ($0 charged).
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 border-t border-blue-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSubstitute}
                  onChange={(e) => onToggleAutoSubstitute(e.target.checked)}
                  className="rounded border-slate-300 text-[#003087]"
                />
                <span className="text-[11px] font-medium text-slate-700">
                  Auto-swap compatible seller if out of stock
                </span>
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">
                  Max Hold Amount
                </span>
                <span className="text-lg font-bold text-slate-900">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                disabled={isCheckingOut}
                onClick={onProceedToCheckout}
                className="w-full py-3 px-4 rounded-xl bg-[#003087] hover:bg-[#002569] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                {isCheckingOut
                  ? 'Preparing Protected Checkout...'
                  : 'Continue to PayPal Checkout'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

