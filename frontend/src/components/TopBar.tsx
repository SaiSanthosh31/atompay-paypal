import { Code2, Receipt, ShieldCheck, ShoppingBag } from 'lucide-react';

export type AppTab = 'shop' | 'orders' | 'logs';

interface TopBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  cartCount: number;
  ledgerCount: number;
  wireCount: number;
}

export function TopBar({
  activeTab,
  onTabChange,
  cartCount,
  ledgerCount,
  wireCount,
}: TopBarProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onTabChange('shop')}
          className="flex items-center gap-2 text-left cursor-pointer"
        >
          <div className="h-8 w-8 rounded-lg bg-[#003087] flex items-center justify-center text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            AtomPay
          </span>
        </button>

        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onTabChange('shop')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'shop'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Shop
            {cartCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#0070BA] text-white text-[10px] font-semibold">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('orders')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            Orders
            {ledgerCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
                {ledgerCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('logs')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            API Logs
            {wireCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
                {wireCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
