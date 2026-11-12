import crypto from 'node:crypto';
import { env, getPayPalBaseUrl, isPayPalConfigured } from '../config/env.js';
import type { PayPalWireEvent, VendorLeg } from '../types/atompay.js';

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

let cachedToken: CachedToken | null = null;

function makeEventId(): string {
  return `wire_${crypto.randomBytes(4).toString('hex')}`;
}

function formatUsd(amount: number): string {
  return amount.toFixed(2);
}

export interface PayPalOrderResult {
  orderId: string;
  status: string;
  approveLink?: string;
  wireEvent: PayPalWireEvent;
}

export interface PayPalAuthorizeResult {
  authorizationId: string;
  status: string;
  wireEvent: PayPalWireEvent;
}

export interface PayPalCaptureResult {
  captureId: string;
  status: string;
  wireEvent: PayPalWireEvent;
}

export interface PayPalVoidResult {
  status: string;
  wireEvent: PayPalWireEvent;
}

export interface PayPalInvoiceResult {
  invoiceId: string;
  status: string;
  wireEvent: PayPalWireEvent;
}

export async function getAccessToken(
  phase: string
): Promise<{ token: string; wireEvent?: PayPalWireEvent }> {
  if (!isPayPalConfigured()) {
    return { token: 'SIMULATED_OAUTH_TOKEN' };
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs > now + 60_000) {
    return { token: cachedToken.accessToken };
  }

  const started = Date.now();
  const credentials = Buffer.from(
    `${env.paypalClientId}:${env.paypalClientSecret}`
  ).toString('base64');

  const endpoint = '/v1/oauth2/token';
  const res = await fetch(`${getPayPalBaseUrl()}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      `PayPal OAuth2 failed (${res.status}): ${data.error_description || JSON.stringify(data)}`
    );
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAtMs: now + (data.expires_in ?? 32000) * 1000,
  };

  return {
    token: data.access_token,
    wireEvent: {
      id: makeEventId(),
      timestamp: new Date().toISOString(),
      phase,
      method: 'POST',
      endpoint,
      status: res.status,
      latencyMs: Date.now() - started,
      mode: 'LIVE_SANDBOX',
      summary: 'Acquired PayPal Sandbox OAuth2 Bearer Token',
      requestBody: { grant_type: 'client_credentials' },
      responseBody: {
        token_type: data.token_type,
        expires_in: data.expires_in,
        scope: data.scope,
      },
    },
  };
}

export async function createAuthorizeOrder(
  bundleId: string,
  title: string,
  legs: VendorLeg[]
): Promise<{ result: PayPalOrderResult; authWireEvent?: PayPalWireEvent }> {
  const totalValue = legs.reduce(
    (sum, leg) => sum + leg.unitPrice * leg.quantity,
    0
  );

  const requestBody = {
    intent: 'AUTHORIZE',
    purchase_units: [
      {
        reference_id: bundleId,
        custom_id: bundleId,
        description: `AtomPay 2PC Atomic Bundle: ${title}`.slice(0, 127),
        amount: {
          currency_code: 'USD',
          value: formatUsd(totalValue),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: formatUsd(totalValue),
            },
          },
        },
        items: legs.map((leg) => ({
          name: `${leg.title} (${leg.sellerName})`.slice(0, 127),
          sku: leg.sku.slice(0, 127),
          quantity: String(leg.quantity),
          category: 'PHYSICAL_GOODS',
          unit_amount: {
            currency_code: 'USD',
            value: formatUsd(leg.unitPrice),
          },
        })),
      },
    ],
    application_context: {
      brand_name: 'AtomPay 2PC Engine',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',
    },
  };

  const endpoint = '/v2/checkout/orders';
  const started = Date.now();

  if (!isPayPalConfigured()) {
    const simOrderId = `SIM_ORD_${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    return {
      result: {
        orderId: simOrderId,
        status: 'CREATED',
        wireEvent: {
          id: makeEventId(),
          timestamp: new Date().toISOString(),
          phase: 'PREPARE_ORDER',
          method: 'POST',
          endpoint,
          status: 201,
          latencyMs: Date.now() - started + 18,
          mode: 'SIMULATED_FALLBACK',
          summary: `Created simulated AUTHORIZE order ${simOrderId} ($${formatUsd(totalValue)})`,
          requestBody,
          responseBody: { id: simOrderId, status: 'CREATED', intent: 'AUTHORIZE' },
        },
      },
    };
  }

  const { token, wireEvent: authWireEvent } = await getAccessToken('PREPARE_ORDER');
  const res = await fetch(`${getPayPalBaseUrl()}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `${bundleId}_order_${Date.now()}`,
    },
    body: JSON.stringify(requestBody),
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    links?: Array<{ rel: string; href: string }>;
    message?: string;
  };

  if (!res.ok || !data.id) {
    throw new Error(
      `PayPal Create Order failed (${res.status}): ${data.message || JSON.stringify(data)}`
    );
  }

  const approveLink = data.links?.find((l) => l.rel === 'approve')?.href;

  return {
    authWireEvent,
    result: {
      orderId: data.id,
      status: data.status || 'CREATED',
      approveLink,
      wireEvent: {
        id: makeEventId(),
        timestamp: new Date().toISOString(),
        phase: 'PREPARE_ORDER',
        method: 'POST',
        endpoint,
        status: res.status,
        latencyMs: Date.now() - started,
        mode: 'LIVE_SANDBOX',
        summary: `Created PayPal Sandbox AUTHORIZE order ${data.id} ($${formatUsd(totalValue)})`,
        requestBody,
        responseBody: data,
      },
    },
  };
}

export async function authorizeOrder(
  orderId: string
): Promise<PayPalAuthorizeResult> {
  const endpoint = `/v2/checkout/orders/${orderId}/authorize`;
  const started = Date.now();

  if (!isPayPalConfigured() || orderId.startsWith('SIM_ORD_')) {
    const simAuthId = `SIM_AUTH_${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    return {
      authorizationId: simAuthId,
      status: 'CREATED',
      wireEvent: {
        id: makeEventId(),
        timestamp: new Date().toISOString(),
        phase: 'PHASE_1_AUTHORIZE',
        method: 'POST',
        endpoint,
        status: 201,
        latencyMs: Date.now() - started + 24,
        mode: 'SIMULATED_FALLBACK',
        summary: `Placed simulated PayPal Authorization Hold ${simAuthId}`,
        requestBody: {},
        responseBody: {
          id: orderId,
          status: 'COMPLETED',
          authorization_id: simAuthId,
        },
      },
    };
  }

  const { token } = await getAccessToken('PHASE_1_AUTHORIZE');
  const res = await fetch(`${getPayPalBaseUrl()}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `auth_${orderId}_${Date.now()}`,
    },
    body: '{}',
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    message?: string;
    purchase_units?: Array<{
      payments?: {
        authorizations?: Array<{ id: string; status: string }>;
      };
    }>;
  };

  const authObj = data.purchase_units?.[0]?.payments?.authorizations?.[0];
  if (!res.ok || !authObj?.id) {
    throw new Error(
      `PayPal Authorize Order failed (${res.status}): ${data.message || JSON.stringify(data)}`
    );
  }

  return {
    authorizationId: authObj.id,
    status: authObj.status,
    wireEvent: {
      id: makeEventId(),
      timestamp: new Date().toISOString(),
      phase: 'PHASE_1_AUTHORIZE',
      method: 'POST',
      endpoint,
      status: res.status,
      latencyMs: Date.now() - started,
      mode: 'LIVE_SANDBOX',
      summary: `Locked real PayPal Sandbox Authorization Hold ${authObj.id}`,
      requestBody: {},
      responseBody: data,
    },
  };
}

export async function captureAuthorizationTranche(params: {
  authorizationId: string;
  amountUsd: number;
  finalCapture: boolean;
  invoiceRef: string;
  noteToPayer: string;
}): Promise<PayPalCaptureResult> {
  const { authorizationId, amountUsd, finalCapture, invoiceRef, noteToPayer } =
    params;
  const endpoint = `/v2/payments/authorizations/${authorizationId}/capture`;
  const started = Date.now();

  const requestBody = {
    amount: {
      currency_code: 'USD',
      value: formatUsd(amountUsd),
    },
    final_capture: finalCapture,
    invoice_id: invoiceRef.slice(0, 127),
    note_to_payer: noteToPayer.slice(0, 255),
  };

  if (!isPayPalConfigured() || authorizationId.startsWith('SIM_AUTH_')) {
    const simCapId = `SIM_CAP_${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    return {
      captureId: simCapId,
      status: 'COMPLETED',
      wireEvent: {
        id: makeEventId(),
        timestamp: new Date().toISOString(),
        phase: 'PHASE_3_COMMIT_CAPTURE',
        method: 'POST',
        endpoint,
        status: 201,
        latencyMs: Date.now() - started + 22,
        mode: 'SIMULATED_FALLBACK',
        summary: `Simulated tranche capture ${simCapId} ($${formatUsd(amountUsd)}, final=${finalCapture})`,
        requestBody,
        responseBody: { id: simCapId, status: 'COMPLETED', final_capture: finalCapture },
      },
    };
  }

  const { token } = await getAccessToken('PHASE_3_COMMIT_CAPTURE');
  const res = await fetch(`${getPayPalBaseUrl()}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `cap_${invoiceRef}_${Date.now()}`,
    },
    body: JSON.stringify(requestBody),
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    message?: string;
  };

  if (!res.ok || !data.id) {
    throw new Error(
      `PayPal Capture Tranche failed (${res.status}): ${data.message || JSON.stringify(data)}`
    );
  }

  return {
    captureId: data.id,
    status: data.status || 'COMPLETED',
    wireEvent: {
      id: makeEventId(),
      timestamp: new Date().toISOString(),
      phase: 'PHASE_3_COMMIT_CAPTURE',
      method: 'POST',
      endpoint,
      status: res.status,
      latencyMs: Date.now() - started,
      mode: 'LIVE_SANDBOX',
      summary: `Captured tranche ${data.id} ($${formatUsd(amountUsd)}, final_capture=${finalCapture})`,
      requestBody,
      responseBody: data,
    },
  };
}

export async function voidAuthorizationHold(
  authorizationId: string
): Promise<PayPalVoidResult> {
  const endpoint = `/v2/payments/authorizations/${authorizationId}/void`;
  const started = Date.now();

  if (!isPayPalConfigured() || authorizationId.startsWith('SIM_AUTH_')) {
    return {
      status: 'VOIDED',
      wireEvent: {
        id: makeEventId(),
        timestamp: new Date().toISOString(),
        phase: 'PHASE_3_ROLLBACK_VOID',
        method: 'POST',
        endpoint,
        status: 204,
        latencyMs: Date.now() - started + 19,
        mode: 'SIMULATED_FALLBACK',
        summary: `Simulated atomic VOID of authorization ${authorizationId} (100% hold released)`,
        requestBody: {},
        responseBody: { status: 'VOIDED' },
      },
    };
  }

  const { token } = await getAccessToken('PHASE_3_ROLLBACK_VOID');
  const res = await fetch(`${getPayPalBaseUrl()}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  let responseBody: unknown = { status: 'VOIDED' };
  if (res.status !== 204) {
    const text = await res.text();
    try {
      responseBody = text ? JSON.parse(text) : { status: 'VOIDED' };
    } catch {
      responseBody = { raw: text };
    }
  }

  if (!res.ok) {
    throw new Error(
      `PayPal Void Authorization failed (${res.status}): ${JSON.stringify(responseBody)}`
    );
  }

  return {
    status: 'VOIDED',
    wireEvent: {
      id: makeEventId(),
      timestamp: new Date().toISOString(),
      phase: 'PHASE_3_ROLLBACK_VOID',
      method: 'POST',
      endpoint,
      status: res.status,
      latencyMs: Date.now() - started,
      mode: 'LIVE_SANDBOX',
      summary: `Executed real PayPal Sandbox VOID on ${authorizationId} (100% funds released)`,
      requestBody: {},
      responseBody,
    },
  };
}

export async function createSettlementInvoice(
  bundleId: string,
  title: string,
  settledLegs: VendorLeg[]
): Promise<PayPalInvoiceResult> {
  const endpoint = '/v2/invoicing/invoices';
  const started = Date.now();

  const requestBody = {
    detail: {
      invoice_number: `ATM-${bundleId.slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      currency_code: 'USD',
      note: `AtomPay 2PC Atomic Settlement Receipt for ${title}`,
      memo: 'Settled atomically after multi-vendor pre-commit verification.',
    },
    items: settledLegs.map((leg) => ({
      name: `${leg.title} [${leg.sellerName}]`.slice(0, 200),
      description: `SKU: ${leg.sku} | Capture: ${leg.captureId || 'SETTLED'}`,
      quantity: String(leg.quantity),
      unit_amount: {
        currency_code: 'USD',
        value: formatUsd(leg.currentLivePrice),
      },
    })),
  };

  if (!isPayPalConfigured()) {
    const simInvId = `SIM_INV_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    return {
      invoiceId: simInvId,
      status: 'DRAFT',
      wireEvent: {
        id: makeEventId(),
        timestamp: new Date().toISOString(),
        phase: 'INVOICE_RECEIPT',
        method: 'POST',
        endpoint,
        status: 201,
        latencyMs: Date.now() - started + 15,
        mode: 'SIMULATED_FALLBACK',
        summary: `Generated simulated PayPal Invoicing v2 receipt ${simInvId}`,
        requestBody,
        responseBody: { id: simInvId, status: 'DRAFT' },
      },
    };
  }

  const { token } = await getAccessToken('INVOICE_RECEIPT');
  const res = await fetch(`${getPayPalBaseUrl()}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = (await res.json()) as { id?: string; status?: string; message?: string };
  if (!res.ok || !data.id) {
    // Non-fatal if sandbox app doesn't have Invoicing toggle enabled
    return {
      invoiceId: `UNAVAILABLE_${res.status}`,
      status: 'SKIPPED',
      wireEvent: {
        id: makeEventId(),
        timestamp: new Date().toISOString(),
        phase: 'INVOICE_RECEIPT',
        method: 'POST',
        endpoint,
        status: res.status,
        latencyMs: Date.now() - started,
        mode: 'LIVE_SANDBOX',
        summary: `Invoicing v2 returned ${res.status} (enable Invoicing toggle in Sandbox App Settings if needed)`,
        requestBody,
        responseBody: data,
      },
    };
  }

  return {
    invoiceId: data.id,
    status: data.status || 'DRAFT',
    wireEvent: {
      id: makeEventId(),
      timestamp: new Date().toISOString(),
      phase: 'INVOICE_RECEIPT',
      method: 'POST',
      endpoint,
      status: res.status,
      latencyMs: Date.now() - started,
      mode: 'LIVE_SANDBOX',
      summary: `Created itemized PayPal Invoice ${data.id} via Invoicing v2`,
      requestBody,
      responseBody: data,
    },
  };
}

