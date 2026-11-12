import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  Store,
  XCircle,
} from 'lucide-react';
import type {
  BundleSession,
  HealthResponse,
  VendorFaultMode,
  VendorLeg,
} from '../types/atompay';

interface CheckoutAndTrackerViewProps {
  bundle: BundleSession;
  health: HealthResponse | null;
  autoSubstitute: boolean;
  isBusy: boolean;
  onBackToShop: () => void;
  onSetFault: (legId: string, mode: VendorFaultMode) => void;
  onSimAuthorize: () => void;
  onBackendCreateOrder: (bundleId: string) => Promise<string>;
  onBackendAuthorizeOrder: (bundleId: string, orderId: string) => Promise<void>;
  onExecuteSettlement: () => void;
  onError: (msg: string) => void;
}

function legBadge(status: VendorLeg['status']) {
  switch (status) {
    case 'CAPTURED':
      return {
        label: 'Settled',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'AUTHORIZED':
      return {
        label: 'Hold placed',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'SUBSTITUTED':
      return {
        label: 'Swapped',
        cls: 'bg-blue-50 text-[#003087] border-blue-200',
      };
    case 'FAILED':
      return {
        label: 'Failed',
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'VOIDED':
      return {
        label: 'Voided ($0)',
        cls: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    case 'SKIPPED':
      return {
        label: 'Dropped',
        cls: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    default:
      return {
        label: 'Pending',
        cls: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

export function CheckoutAndTrackerView({
  bundle,
  health,
  autoSubstitute,
  isBusy,
  onBackToShop,
  onSetFault,
  onSimAuthorize,
  onBackendCreateOrder,
  onBackendAuthorizeOrder,
  onExecuteSettlement,
  onError,
}: CheckoutAndTrackerViewProps) {
  const canAuthorize =
    bundle.phase === 'ANALYZED' || bundle.phase === 'ORDER_CREATED';
  const isAuthorized = bundle.phase === 'AUTHORIZED';
  const isSettled =
    bundle.phase === 'COMMITTED' ||
    bundle.phase === 'PARTIAL_COMMITTED' ||
    bundle.phase === 'ROLLED_BACK';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToShop}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </button>

        {bundle.paypalAuthorizationId && (
          <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
            Hold: {bundle.paypalAuthorizationId}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h1 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            {canAuthorize
              ? '1. Authorize PayPal Hold'
              : isAuthorized
                ? '2. Verify Sellers & Settle'
                : bundle.phase === 'ROLLED_BACK'
                  ? 'Order Canceled — Hold Voided'
                  : 'Order Settled'}
          </h1>

          <div className="space-y-2.5">
            {bundle.legs.map((leg) => {
              const badge = legBadge(leg.status);
              return (
                <div
                  key={leg.id}
                  className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          <Store className="h-3 w-3" />
                          {leg.sellerName}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            leg.criticality === 'CRITICAL'
                              ? 'bg-blue-50 text-[#003087] border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {leg.criticality === 'CRITICAL'
                            ? 'Required'
                            : 'Optional'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-slate-900">
                        {leg.title}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-slate-900">
                        ${(leg.currentLivePrice * leg.quantity).toFixed(2)}
                      </div>
                      {leg.currentLivePrice !== leg.unitPrice && (
                        <div className="text-[11px] text-slate-400 line-through">
                          ${leg.unitPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  {leg.substitutedFrom && (
                    <div className="text-xs text-[#003087] bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                      Swapped from <strong>{leg.substitutedFrom}</strong>
                    </div>
                  )}

                  {leg.failureReason && !leg.substitutedFrom && (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                      {leg.failureReason}
                    </div>
                  )}

                  {!isSettled && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        Seller stock
                      </span>
                      <select
                        value={leg.faultMode}
                        disabled={isBusy}
                        onChange={(e) =>
                          onSetFault(leg.id, e.target.value as VendorFaultMode)
                        }
                        className="text-[11px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 cursor-pointer focus:outline-none focus:border-[#0070BA]"
                      >
                        <option value="IN_STOCK">In Stock</option>
                        <option value="OUT_OF_STOCK">Out of Stock</option>
                        <option value="PRICE_SPIKE">Price Spike (+28%)</option>
                        <option value="DELAYED">Delayed (Timeout)</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 sticky top-20">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Summary
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Auto-swap</span>
              <span className="font-semibold text-slate-900">
                {autoSubstitute ? 'On' : 'Off (Strict Void)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Hold amount</span>
              <span className="font-semibold text-slate-900">
                ${bundle.authorizedTotal.toFixed(2)}
              </span>
            </div>

            {isSettled && (
              <>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                  <span>Charged</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    ${bundle.finalCapturedTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Voided / saved</span>
                  <span className="font-semibold text-slate-900">
                    ${bundle.savedOrVoidedAmount.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          {canAuthorize && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 flex items-center gap-2 text-xs text-slate-600">
                <Lock className="h-3.5 w-3.5 text-[#003087] shrink-0" />
                <span>Holds ${bundle.authorizedTotal.toFixed(2)} without charging yet.</span>
              </div>

              {health?.paypalConfigured && health.paypalClientId ? (
                <PayPalScriptProvider
                  options={{
                    clientId: health.paypalClientId,
                    intent: 'authorize',
                    currency: 'USD',
                  }}
                >
                  <PayPalButtons
                    style={{ layout: 'vertical', height: 42, tagline: false }}
                    createOrder={async () => onBackendCreateOrder(bundle.id)}
                    onApprove={async (data) =>
                      onBackendAuthorizeOrder(bundle.id, data.orderID)
                    }
                    onError={(err) =>
                      onError(
                        err instanceof Error
                          ? err.message
                          : 'PayPal Checkout failed'
                      )
                    }
                  />
                </PayPalScriptProvider>
              ) : (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onSimAuthorize}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0070BA] hover:bg-[#003087] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                >
                  {isBusy
                    ? 'Authorizing...'
                    : `Authorize $${bundle.authorizedTotal.toFixed(2)} Hold`}
                </button>
              )}
            </div>
          )}

          {isAuthorized && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 flex items-center gap-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Hold locked. Set seller stock on left, then settle.</span>
              </div>

              <button
                type="button"
                disabled={isBusy}
                onClick={onExecuteSettlement}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
              >
                {isBusy ? 'Settling...' : 'Verify Sellers & Complete Order'}
              </button>
            </div>
          )}

          {isSettled && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {bundle.phase === 'ROLLED_BACK' ? (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-xs text-rose-800">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Hold Voided</strong> — ${bundle.authorizedTotal.toFixed(2)} released ($0.00 charged).
                  </span>
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Settled</strong> — ${bundle.finalCapturedTotal.toFixed(2)} captured across verified sellers.
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={onBackToShop}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                New Order
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
