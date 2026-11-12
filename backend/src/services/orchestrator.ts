import crypto from 'node:crypto';
import { isPayPalConfigured } from '../config/env.js';
import type {
  BundleSession,
  LedgerEntry,
  VendorLeg,
} from '../types/atompay.js';
import {
  analyzeBundleDependencies,
  evaluateSubstituteRecovery,
} from './gemini.js';
import {
  authorizeOrder,
  captureAuthorizationTranche,
  createAuthorizeOrder,
  createSettlementInvoice,
  voidAuthorizationHold,
} from './paypal.js';
import {
  getFaultMode,
  instantiateScenarioLegs,
  probeSellerLeg,
  SCENARIO_PRESETS,
} from './vendors.js';
import { loadPersistedStore, savePersistedStore } from './store.js';

const persisted = loadPersistedStore();
const bundles = new Map<string, BundleSession>(
  persisted.bundles.map((b) => [b.id, b])
);
const ledgerEntries: LedgerEntry[] = [...persisted.ledgerEntries];

function persist(): void {
  savePersistedStore({
    bundles: Array.from(bundles.values()).slice(-50),
    ledgerEntries: ledgerEntries.slice(-200),
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

export function getLedgerEntries(): LedgerEntry[] {
  return [...ledgerEntries].reverse();
}

export function getBundleById(id: string): BundleSession | undefined {
  return bundles.get(id);
}

export function listBundles(): BundleSession[] {
  return Array.from(bundles.values()).reverse();
}

export async function createAndAnalyzeBundle(input: {
  scenarioId?: string;
  customTitle?: string;
  goalPrompt?: string;
  autoSubstitute?: boolean;
  customLegs?: Array<{
    id?: string;
    title: string;
    sellerName: string;
    category?: string;
    unitPrice: number;
    quantity?: number;
    criticality?: 'CRITICAL' | 'OPTIONAL';
  }>;
}): Promise<BundleSession> {
  const bundleId = `bnd_${crypto.randomBytes(4).toString('hex')}`;
  const preset =
    SCENARIO_PRESETS.find((s) => s.id === input.scenarioId) ||
    SCENARIO_PRESETS[0];

  const catalogById = new Map(
    SCENARIO_PRESETS.flatMap((s) => s.items.map((it) => [it.id, it]))
  );

  let legs: VendorLeg[];
  let title: string;
  let goalPrompt: string;

  if (input.customLegs && input.customLegs.length > 0) {
    title = input.customTitle || 'Custom Multi-Seller Bundle';
    goalPrompt =
      input.goalPrompt ||
      `Purchase compatible items together: ${input.customLegs.map((l) => l.title).join(', ')}`;
    legs = input.customLegs.map((item, idx) => {
      const known = item.id ? catalogById.get(item.id) : undefined;
      const legId = item.id || `custom-${idx + 1}`;
      return {
        id: legId,
        sku:
          known?.sku ||
          `CUSTOM-${idx + 1}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        title: item.title,
        sellerId: known?.sellerId || `seller_custom_${idx + 1}`,
        sellerName: item.sellerName,
        category: item.category || known?.category || 'General',
        unitPrice: Number(item.unitPrice),
        currentLivePrice: Number(item.unitPrice),
        quantity: item.quantity || 1,
        criticality: item.criticality || known?.criticality || 'CRITICAL',
        dependsOn: known?.dependsOn || [],
        dependencyReason:
          known?.dependencyReason || 'Linked to multi-seller checkout bundle',
        maxTolerancePct: known?.maxTolerancePct ?? 10,
        faultMode: getFaultMode(legId),
        status: 'PENDING',
        substitutes: known?.substitutes.map((s) => ({ ...s })) || [],
      };
    });
  } else {
    title = preset.name;
    goalPrompt = input.goalPrompt || preset.goalPrompt;
    legs = instantiateScenarioLegs(preset);
  }

  const aiResult = await analyzeBundleDependencies(goalPrompt, legs);
  legs = legs.map((leg) => {
    const ov = aiResult.legOverrides.find((x) => x.legId === leg.id);
    if (!ov) return leg;
    return {
      ...leg,
      criticality: ov.criticality,
      dependsOn: ov.dependsOn,
      dependencyReason: ov.dependencyReason,
      maxTolerancePct: ov.maxTolerancePct,
    };
  });

  const authorizedTotal = Number(
    legs.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0).toFixed(2)
  );

  const session: BundleSession = {
    id: bundleId,
    scenarioId: preset.id,
    title,
    goalPrompt,
    currency: 'USD',
    authorizedTotal,
    finalCapturedTotal: 0,
    savedOrVoidedAmount: 0,
    phase: 'ANALYZED',
    executionMode: isPayPalConfigured() ? 'LIVE_SANDBOX' : 'SIMULATED_FALLBACK',
    aiEngine: aiResult.aiEngine,
    aiSummary: aiResult.aiSummary,
    autoSubstitute: input.autoSubstitute ?? true,
    legs,
    edges: aiResult.edges,
    wireEvents: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  bundles.set(bundleId, session);
  persist();
  return session;
}

export async function createPayPalOrderForBundle(
  bundleId: string
): Promise<BundleSession> {
  const bundle = bundles.get(bundleId);
  if (!bundle) throw new Error(`Bundle ${bundleId} not found`);

  const { result, authWireEvent } = await createAuthorizeOrder(
    bundle.id,
    bundle.title,
    bundle.legs
  );

  if (authWireEvent) bundle.wireEvents.push(authWireEvent);
  bundle.wireEvents.push(result.wireEvent);
  bundle.paypalOrderId = result.orderId;
  bundle.phase = 'ORDER_CREATED';
  bundle.executionMode = result.wireEvent.mode;
  bundle.updatedAt = nowIso();
  persist();
  return bundle;
}

export async function authorizeBundleHold(
  bundleId: string,
  orderIdOverride?: string
): Promise<BundleSession> {
  const bundle = bundles.get(bundleId);
  if (!bundle) throw new Error(`Bundle ${bundleId} not found`);

  const orderId = orderIdOverride || bundle.paypalOrderId;
  if (!orderId) {
    throw new Error('No PayPal orderId exists for this bundle yet.');
  }

  const authRes = await authorizeOrder(orderId);
  bundle.paypalOrderId = orderId;
  bundle.paypalAuthorizationId = authRes.authorizationId;
  bundle.phase = 'AUTHORIZED';
  bundle.executionMode = authRes.wireEvent.mode;
  bundle.wireEvents.push(authRes.wireEvent);
  bundle.legs = bundle.legs.map((l) => ({
    ...l,
    faultMode: getFaultMode(l.id),
    status: 'AUTHORIZED',
  }));
  bundle.updatedAt = nowIso();
  persist();
  return bundle;
}

export async function executeTwoPhaseCommit(
  bundleId: string,
  options?: { autoSubstitute?: boolean }
): Promise<BundleSession> {
  const bundle = bundles.get(bundleId);
  if (!bundle) throw new Error(`Bundle ${bundleId} not found`);
  if (!bundle.paypalAuthorizationId) {
    throw new Error('PayPal Authorization Hold must be locked before running 2PC.');
  }

  if (typeof options?.autoSubstitute === 'boolean') {
    bundle.autoSubstitute = options.autoSubstitute;
  }

  bundle.phase = 'PROBING';
  bundle.updatedAt = nowIso();

  // Phase 2: Concurrently probe every seller leg
  const probeResults = await Promise.all(
    bundle.legs.map((leg) => probeSellerLeg(leg))
  );

  let remainingHeadroom = 0;
  let criticalFailureDetected = false;

  // First pass: mark verified vs failed & check optional drops
  for (const leg of bundle.legs) {
    const probe = probeResults.find((p) => p.legId === leg.id)!;
    leg.faultMode = probe.faultMode;
    leg.currentLivePrice = probe.liveUnitPrice;

    if (probe.available) {
      leg.status = 'VERIFIED';
      if (probe.liveUnitPrice < leg.unitPrice) {
        remainingHeadroom += (leg.unitPrice - probe.liveUnitPrice) * leg.quantity;
      }
    } else if (leg.criticality === 'OPTIONAL') {
      leg.status = 'SKIPPED';
      leg.failureReason = probe.reason || 'Optional leg dropped cleanly';
      remainingHeadroom += leg.unitPrice * leg.quantity;
    } else {
      leg.status = 'FAILED';
      leg.failureReason = probe.reason || 'Critical seller verification failed';
    }
  }

  // Second pass: AI Substitution Recovery on failed CRITICAL legs (if enabled)
  for (const leg of bundle.legs) {
    if (leg.status !== 'FAILED') continue;

    if (!bundle.autoSubstitute) {
      criticalFailureDetected = true;
      continue;
    }

    const decision = await evaluateSubstituteRecovery({
      failedLeg: leg,
      remainingBudgetHeadroom: remainingHeadroom,
      goalPrompt: bundle.goalPrompt,
    });

    if (decision.action === 'SUBSTITUTE' && decision.chosenSubstitute) {
      const sub = decision.chosenSubstitute;
      const previousTitle = leg.title;
      const previousPrice = leg.unitPrice;
      leg.substitutedFrom = `${previousTitle} (${leg.sellerName})`;
      leg.sku = sub.sku;
      leg.title = sub.title;
      leg.sellerId = sub.sellerId;
      leg.sellerName = sub.sellerName;
      leg.currentLivePrice = sub.price;
      leg.status = 'SUBSTITUTED';
      leg.failureReason = decision.reasoning;
      remainingHeadroom += (previousPrice - sub.price) * leg.quantity;
    } else {
      leg.failureReason = decision.reasoning;
      criticalFailureDetected = true;
    }
  }

  // Phase 3A: Atomic Rollback (VOID entire PayPal Authorization Hold)
  if (criticalFailureDetected) {
    const voidRes = await voidAuthorizationHold(bundle.paypalAuthorizationId);
    bundle.wireEvents.push(voidRes.wireEvent);

    bundle.legs = bundle.legs.map((leg) => ({
      ...leg,
      status: leg.status === 'FAILED' ? 'FAILED' : 'VOIDED',
    }));

    bundle.phase = 'ROLLED_BACK';
    bundle.finalCapturedTotal = 0;
    bundle.savedOrVoidedAmount = bundle.authorizedTotal;
    bundle.updatedAt = nowIso();

    recordLedgerEntries(bundle);
    return bundle;
  }

  // Phase 3B: Atomic Multi-Tranche Capture (settled legs sequentially with final_capture=true on last)
  const settleableLegs = bundle.legs.filter(
    (l) => l.status === 'VERIFIED' || l.status === 'SUBSTITUTED'
  );

  let capturedSum = 0;
  for (let i = 0; i < settleableLegs.length; i++) {
    const leg = settleableLegs[i];
    const isFinal = i === settleableLegs.length - 1;
    const rawTranche = Number((leg.currentLivePrice * leg.quantity).toFixed(2));
    const maxRemaining = Number(Math.max(0, bundle.authorizedTotal - capturedSum).toFixed(2));
    const trancheUsd = Math.min(rawTranche, maxRemaining);

    const capRes = await captureAuthorizationTranche({
      authorizationId: bundle.paypalAuthorizationId,
      amountUsd: trancheUsd,
      finalCapture: isFinal,
      invoiceRef: `${bundle.id}_${leg.id}`,
      noteToPayer: `AtomPay Tranche ${i + 1}/${settleableLegs.length}: ${leg.title} (${leg.sellerName})`,
    });

    bundle.wireEvents.push(capRes.wireEvent);
    leg.captureId = capRes.captureId;
    leg.status = 'CAPTURED';
    capturedSum += trancheUsd;
  }

  // Generate PayPal Invoicing v2 itemized receipt
  const invRes = await createSettlementInvoice(
    bundle.id,
    bundle.title,
    settleableLegs
  );
  bundle.wireEvents.push(invRes.wireEvent);
  bundle.paypalInvoiceId = invRes.invoiceId;

  const hasSkippedOptional = bundle.legs.some((l) => l.status === 'SKIPPED');
  bundle.phase = hasSkippedOptional ? 'PARTIAL_COMMITTED' : 'COMMITTED';
  bundle.finalCapturedTotal = Number(capturedSum.toFixed(2));
  bundle.savedOrVoidedAmount = Number(
    Math.max(0, bundle.authorizedTotal - bundle.finalCapturedTotal).toFixed(2)
  );
  bundle.updatedAt = nowIso();

  recordLedgerEntries(bundle);
  persist();
  return bundle;
}

function recordLedgerEntries(bundle: BundleSession): void {
  const ts = nowIso();
  for (const leg of bundle.legs) {
    const settled =
      leg.status === 'CAPTURED'
        ? Number((leg.currentLivePrice * leg.quantity).toFixed(2))
        : 0;
    ledgerEntries.push({
      id: `ldg_${bundle.id}_${leg.id}_${crypto.randomBytes(2).toString('hex')}`,
      bundleId: bundle.id,
      bundleTitle: bundle.title,
      legId: leg.id,
      itemTitle: leg.title,
      sellerName: leg.sellerName,
      criticality: leg.criticality,
      authorizedAmount: Number((leg.unitPrice * leg.quantity).toFixed(2)),
      settledAmount: settled,
      finalStatus: leg.status,
      bundlePhase: bundle.phase,
      paypalOrderId: bundle.paypalOrderId || 'N/A',
      paypalAuthorizationId: bundle.paypalAuthorizationId || 'N/A',
      paypalCaptureId: leg.captureId || (bundle.phase === 'ROLLED_BACK' ? 'VOIDED' : 'SKIPPED'),
      executionMode: bundle.executionMode,
      decisionNote:
        leg.substitutedFrom
          ? `AI Swapped from ${leg.substitutedFrom}`
          : leg.failureReason || leg.dependencyReason,
      timestamp: ts,
    });
  }
  persist();
}

