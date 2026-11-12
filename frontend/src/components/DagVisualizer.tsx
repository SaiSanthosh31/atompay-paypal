import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Lock,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { BundleSession, HealthResponse, VendorLeg } from '../types/atompay';

interface DagVisualizerProps {
  bundle: BundleSession | null;
  health: HealthResponse | null;
  autoSubstitute: boolean;
  isBusy: boolean;
  onCreateOrderAndSimAuth: () => void;
  onBackendCreateOrder: (bundleId: string) => Promise<string>;
  onBackendAuthorizeOrder: (bundleId: string, orderId: string) => Promise<void>;
  onExecute2PC: () => void;
  onError: (msg: string) => void;
}

function statusStyle(status: VendorLeg['status']): string {
  switch (status) {
    case 'CAPTURED':
      return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40';
    case 'AUTHORIZED':
    case 'VERIFIED':
      return 'text-amber-300 bg-amber-500/15 border-amber-500/40';
    case 'SUBSTITUTED':
      return 'text-indigo-300 bg-indigo-500/15 border-indigo-500/40';
    case 'FAILED':
    case 'VOIDED':
      return 'text-rose-300 bg-rose-500/15 border-rose-500/40';
    case 'SKIPPED':
      return 'text-slate-300 bg-slate-700/40 border-slate-600';
    default:
      return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
  }
}

export function DagVisualizer({
  bundle,
  health,
  autoSubstitute,
  isBusy,
  onCreateOrderAndSimAuth,
  onBackendCreateOrder,
  onBackendAuthorizeOrder,
  onExecute2PC,
  onError,
}: DagVisualizerProps) {
  if (!bundle) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-[#0D1424] p-8 flex flex-col items-center justify-center text-center min-h-[540px]">
        <GitBranch className="h-10 w-10 text-cyan-400 mb-3" />
        <h3 className="text-base font-semibold text-white">
          Compile a Multi-Seller Dependency Graph
        </h3>
        <p className="text-xs text-slate-400 max-w-md mt-1">
          Select a bundle on the left and click Compile AI Dependency Graph to inspect vendor dependencies before authorizing PayPal funds.
        </p>
      </section>
    );
  }

  const isAuthorized = bundle.phase === 'AUTHORIZED';
  const isSettled =
    bundle.phase === 'COMMITTED' ||
    bundle.phase === 'PARTIAL_COMMITTED' ||
    bundle.phase === 'ROLLED_BACK';
  const canAuthorize =
    bundle.phase === 'ANALYZED' || bundle.phase === 'ORDER_CREATED';

  const phases = [
    { label: '1. AI DAG', done: true },
    {
      label: '2. PayPal AUTHORIZE',
      done: Boolean(bundle.paypalAuthorizationId),
    },
    { label: '3. Probe Sellers', done: isSettled },
    {
      label:
        bundle.phase === 'ROLLED_BACK'
          ? '4. Atomic VOID'
          : '4. Multi-Capture',
      done: isSettled,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0D1424] p-5 space-y-5">
      {/* Header & Stepper */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-white">{bundle.title}</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-cyan-300">
              {bundle.id}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                bundle.aiEngine === 'gemini'
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {bundle.aiEngine === 'gemini'
                ? 'Gemini AI Compiled'
                : 'Heuristic Compiled'}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {bundle.aiSummary}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">
            Authorized Hold Cap
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${bundle.authorizedTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 4-Step Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {phases.map((p) => (
          <div
            key={p.label}
            className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              p.done
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                : 'bg-slate-900/70 border-slate-800 text-slate-500'
            }`}
          >
            <CheckCircle2
              className={`h-3.5 w-3.5 shrink-0 ${
                p.done ? 'text-cyan-400' : 'text-slate-600'
              }`}
            />
            <span className="truncate">{p.label}</span>
          </div>
        ))}
      </div>

      {/* Dependency Graph Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider">
            Vendor Dependency Nodes ({bundle.legs.length})
          </span>
          <span>
            Mode:{' '}
            <strong className="text-slate-200">{bundle.executionMode}</strong>
          </span>
        </div>

        <div className="grid gap-3">
          {bundle.legs.map((leg, idx) => (
            <div
              key={leg.id}
              className="rounded-xl border border-slate-800 bg-slate-900/75 p-3.5 space-y-2 relative"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      LEG {idx + 1} · {leg.sellerName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        leg.criticality === 'CRITICAL'
                          ? 'text-rose-300 bg-rose-500/10 border-rose-500/30'
                          : 'text-sky-300 bg-sky-500/10 border-sky-500/30'
                      }`}
                    >
                      {leg.criticality}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle(
                        leg.status
                      )}`}
                    >
                      {leg.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-white pt-1">
                    {leg.title}
                  </h4>

                  {leg.dependsOn.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 pt-0.5">
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span>
                        Depends on{' '}
                        <code className="font-mono text-cyan-200">
                          {leg.dependsOn.join(', ')}
                        </code>{' '}
                        — {leg.dependencyReason}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold font-mono text-white">
                    ${(leg.currentLivePrice * leg.quantity).toFixed(2)}
                  </div>
                  {leg.currentLivePrice !== leg.unitPrice && (
                    <div className="text-[11px] font-mono text-amber-300 line-through">
                      ${leg.unitPrice.toFixed(2)}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 font-mono">
                    {leg.sku}
                  </div>
                </div>
              </div>

              {leg.substitutedFrom && (
                <div className="text-[11px] text-indigo-200 bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-300" />
                  <span>
                    <strong>AI Swapped:</strong> Replaced{' '}
                    {leg.substitutedFrom} inside authorized cap.
                  </span>
                </div>
              )}

              {leg.failureReason && (
                <div className="text-[11px] text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-lg px-2.5 py-1.5">
                  {leg.failureReason}
                </div>
              )}

              {leg.captureId && (
                <div className="text-[11px] font-mono text-emerald-300">
                  Capture ID: {leg.captureId}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Phase 1 & Phase 2/3 Action Box */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
        {canAuthorize && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  Phase 1: Place PayPal Authorization Hold (No Funds Charged Yet)
                </span>
                <p className="text-slate-400 mt-0.5">
                  Creates a single PayPal Orders v2 (`intent=AUTHORIZE`) hold covering all {bundle.legs.length} sellers.
                </p>
              </div>
            </div>

            {health?.paypalConfigured && health.paypalClientId ? (
              <div className="max-w-sm">
                <PayPalScriptProvider
                  options={{
                    clientId: health.paypalClientId,
                    intent: 'authorize',
                    currency: 'USD',
                  }}
                >
                  <PayPalButtons
                    style={{ layout: 'horizontal', height: 42, tagline: false }}
                    createOrder={async () => {
                      return onBackendCreateOrder(bundle.id);
                    }}
                    onApprove={async (data) => {
                      await onBackendAuthorizeOrder(bundle.id, data.orderID);
                    }}
                    onError={(err) => {
                      onError(
                        err instanceof Error
                          ? err.message
                          : 'PayPal Checkout failed'
                      );
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-[11px] text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                  Add <code className="font-mono">PAYPAL_CLIENT_ID</code> &amp;{' '}
                  <code className="font-mono">PAYPAL_CLIENT_SECRET</code> in{' '}
                  <code className="font-mono">.env</code> to render the live PayPal Sandbox button. You can still run the full 2PC lifecycle in Simulator mode right now:
                </div>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onCreateOrderAndSimAuth}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {isBusy
                    ? 'Locking Authorization Hold...'
                    : `Authorize $${bundle.authorizedTotal.toFixed(2)} Hold (Phase 1)`}
                </button>
              </div>
            )}
          </div>
        )}

        {isAuthorized && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Hold Locked · Auth ID:{' '}
                <code className="font-mono">{bundle.paypalAuthorizationId}</code>
              </div>
              <p className="text-slate-400 mt-0.5">
                Ready to probe all sellers concurrently and execute{' '}
                {autoSubstitute ? 'AI Recovery + Partial Capture' : 'All-or-Nothing 2PC'}.
              </p>
            </div>
            <button
              type="button"
              disabled={isBusy}
              onClick={onExecute2PC}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs inline-flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Play className="h-3.5 w-3.5" />
              {isBusy ? 'Probing & Settling...' : 'Run Phase 2 & 3 Atomic Settlement'}
            </button>
          </div>
        )}

        {isSettled && (
          <div
            className={`rounded-xl p-3.5 border flex flex-wrap items-center justify-between gap-3 ${
              bundle.phase === 'ROLLED_BACK'
                ? 'bg-rose-500/10 border-rose-500/40'
                : 'bg-emerald-500/10 border-emerald-500/40'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {bundle.phase === 'ROLLED_BACK' ? (
                <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-white">
                  {bundle.phase === 'ROLLED_BACK'
                    ? 'ATOMIC ROLLBACK EXECUTED — 100% PayPal Hold Voided'
                    : bundle.phase === 'PARTIAL_COMMITTED'
                      ? 'PARTIAL ATOMIC COMMIT — Optional Item Dropped & Remaining Voided'
                      : 'ATOMIC COMMIT COMPLETE — All Tranches Captured'}
                </div>
                <div className="text-slate-300 font-mono text-[11px]">
                  Captured: ${bundle.finalCapturedTotal.toFixed(2)} | Voided/Saved: $
                  {bundle.savedOrVoidedAmount.toFixed(2)}
                  {bundle.paypalInvoiceId ? ` | Invoice: ${bundle.paypalInvoiceId}` : ''}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onCreateOrderAndSimAuth}
              disabled={isBusy}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Compile New Run (Left Panel)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

