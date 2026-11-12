export type LegCriticality = 'CRITICAL' | 'OPTIONAL';

export type VendorFaultMode =
  | 'IN_STOCK'
  | 'OUT_OF_STOCK'
  | 'PRICE_SPIKE'
  | 'TIMEOUT';

export type LegStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PROBING'
  | 'VERIFIED'
  | 'FAILED'
  | 'SUBSTITUTED'
  | 'CAPTURED'
  | 'VOIDED'
  | 'SKIPPED';

export type BundlePhase =
  | 'DRAFT'
  | 'ANALYZED'
  | 'ORDER_CREATED'
  | 'AUTHORIZED'
  | 'PROBING'
  | 'COMMITTED'
  | 'PARTIAL_COMMITTED'
  | 'ROLLED_BACK';

export interface SubstituteOption {
  sku: string;
  title: string;
  sellerName: string;
  sellerId: string;
  price: number;
  compatibilityNote: string;
}

export interface VendorLeg {
  id: string;
  sku: string;
  title: string;
  sellerId: string;
  sellerName: string;
  category: string;
  unitPrice: number;
  currentLivePrice: number;
  quantity: number;
  criticality: LegCriticality;
  dependsOn: string[];
  dependencyReason: string;
  maxTolerancePct: number;
  faultMode: VendorFaultMode;
  status: LegStatus;
  captureId?: string;
  invoiceId?: string;
  failureReason?: string;
  substitutedFrom?: string;
  substitutes: SubstituteOption[];
}

export interface DependencyEdge {
  from: string;
  to: string;
  reason: string;
  strict: boolean;
}

export interface PayPalWireEvent {
  id: string;
  timestamp: string;
  phase: string;
  method: 'GET' | 'POST';
  endpoint: string;
  status: number;
  latencyMs: number;
  mode: 'LIVE_SANDBOX' | 'SIMULATED_FALLBACK';
  summary: string;
  requestBody?: unknown;
  responseBody?: unknown;
}

export interface BundleSession {
  id: string;
  scenarioId: string;
  title: string;
  goalPrompt: string;
  currency: 'USD';
  authorizedTotal: number;
  finalCapturedTotal: number;
  savedOrVoidedAmount: number;
  phase: BundlePhase;
  executionMode: 'LIVE_SANDBOX' | 'SIMULATED_FALLBACK';
  aiEngine: 'gemini' | 'heuristic_fallback';
  aiSummary: string;
  autoSubstitute: boolean;
  paypalOrderId?: string;
  paypalAuthorizationId?: string;
  paypalInvoiceId?: string;
  legs: VendorLeg[];
  edges: DependencyEdge[];
  wireEvents: PayPalWireEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  bundleId: string;
  bundleTitle: string;
  legId: string;
  itemTitle: string;
  sellerName: string;
  criticality: LegCriticality;
  authorizedAmount: number;
  settledAmount: number;
  finalStatus: LegStatus;
  bundlePhase: BundlePhase;
  paypalOrderId: string;
  paypalAuthorizationId: string;
  paypalCaptureId: string;
  executionMode: 'LIVE_SANDBOX' | 'SIMULATED_FALLBACK';
  decisionNote: string;
  timestamp: string;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  tagline: string;
  goalPrompt: string;
  items: Array<{
    id: string;
    sku: string;
    title: string;
    sellerId: string;
    sellerName: string;
    category: string;
    unitPrice: number;
    quantity: number;
    criticality: LegCriticality;
    dependsOn: string[];
    dependencyReason: string;
    maxTolerancePct: number;
    faultMode: VendorFaultMode;
    substitutes: SubstituteOption[];
  }>;
}

export interface HealthResponse {
  ok: boolean;
  service: string;
  paypalConfigured: boolean;
  paypalMode: string;
  paypalClientId: string | null;
  geminiConfigured: boolean;
  geminiModel: string;
  timestamp: string;
}

