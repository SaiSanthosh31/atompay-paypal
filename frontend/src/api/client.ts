import type {
  BundleSession,
  HealthResponse,
  LedgerEntry,
  ScenarioPreset,
  VendorFaultMode,
} from '../types/atompay';

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const atomApi = {
  getHealth: () => apiJson<HealthResponse>('/api/health'),

  getScenarios: () =>
    apiJson<{ scenarios: ScenarioPreset[] }>('/api/vendors/scenarios'),

  setVendorFault: (legId: string, faultMode: VendorFaultMode) =>
    apiJson<{ ok: boolean; legId: string; faultMode: VendorFaultMode }>(
      `/api/vendors/${encodeURIComponent(legId)}/fault`,
      {
        method: 'POST',
        body: JSON.stringify({ faultMode }),
      }
    ),

  resetAllFaults: () =>
    apiJson<{ ok: boolean }>('/api/vendors/reset', { method: 'POST' }),

  analyzeBundle: (payload: {
    scenarioId?: string;
    customTitle?: string;
    goalPrompt?: string;
    autoSubstitute?: boolean;
    customLegs?: Array<{
      title: string;
      sellerName: string;
      category?: string;
      unitPrice: number;
      quantity?: number;
      criticality?: 'CRITICAL' | 'OPTIONAL';
    }>;
  }) =>
    apiJson<{ bundle: BundleSession }>('/api/bundles/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createPayPalOrder: (bundleId: string) =>
    apiJson<{ bundle: BundleSession; orderId: string }>(
      `/api/bundles/${encodeURIComponent(bundleId)}/paypal-order`,
      { method: 'POST' }
    ),

  authorizeOrderHold: (bundleId: string, orderId?: string) =>
    apiJson<{ bundle: BundleSession }>(
      `/api/bundles/${encodeURIComponent(bundleId)}/authorize`,
      {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      }
    ),

  executeTwoPhaseCommit: (bundleId: string, autoSubstitute: boolean) =>
    apiJson<{ bundle: BundleSession }>(
      `/api/bundles/${encodeURIComponent(bundleId)}/execute-2pc`,
      {
        method: 'POST',
        body: JSON.stringify({ autoSubstitute }),
      }
    ),

  getLedger: () => apiJson<{ entries: LedgerEntry[] }>('/api/bundles/ledger'),
};

