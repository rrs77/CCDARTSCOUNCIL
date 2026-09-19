/**
 * Client helpers for hub shop / Stripe checkout / sales tracking.
 */

import { supabase } from '../config/supabase';
import { getVercelApiUrl } from '../utils/apiUrl';
import type {
  AdminShopCustomersPayload,
  HubProduct,
  HubSalesSummary,
} from '../types/shop';

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(getVercelApiUrl(path), {
    ...init,
    headers: {
      ...(await authHeaders()),
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `Request failed (${res.status})`);
  }
  return json as T;
}

export async function listHubProducts(
  hubId: string,
  opts?: { all?: boolean },
): Promise<{ products: HubProduct[]; warning?: string }> {
  const qs = opts?.all ? '?all=1' : '';
  return apiFetch(`/api/hubs/${hubId}/products${qs}`);
}

export async function createHubProduct(
  hubId: string,
  body: Partial<HubProduct> & { title: string; price_pence: number },
): Promise<{ product: HubProduct }> {
  return apiFetch(`/api/hubs/${hubId}/products`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateHubProduct(
  hubId: string,
  productId: string,
  body: Record<string, unknown>,
): Promise<{ product: HubProduct }> {
  return apiFetch(`/api/hubs/${hubId}/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function loadHubSales(hubId: string, days = 90): Promise<HubSalesSummary> {
  return apiFetch(`/api/hubs/${hubId}/sales?days=${days}`);
}

export async function listPublicShopProducts(organisationId?: string) {
  const qs = organisationId
    ? `?organisation_id=${encodeURIComponent(organisationId)}`
    : '';
  return apiFetch<{ products: Array<Record<string, unknown>>; warning?: string }>(
    `/api/shop/products${qs}`,
  );
}

export type CheckoutResult =
  | {
      mode: 'stripe';
      order_id: string;
      checkout_url: string;
      session_id: string;
      total_pence: number;
    }
  | {
      mode: 'demo';
      order_id: string;
      status: string;
      total_pence: number;
      message: string;
      seed_product_ids?: string[];
    };

export async function startShopCheckout(body: {
  items: { productId: string; quantity?: number }[];
  successUrl?: string;
  cancelUrl?: string;
}): Promise<CheckoutResult> {
  return apiFetch('/api/shop/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function loadMyShopPurchases() {
  return apiFetch<{ orders: unknown[]; entitlements: unknown[] }>('/api/shop/mine');
}

export async function loadAdminShopCustomers(params?: {
  days?: number;
  q?: string;
  organisation_id?: string;
}): Promise<AdminShopCustomersPayload> {
  const qs = new URLSearchParams();
  if (params?.days) qs.set('days', String(params.days));
  if (params?.q) qs.set('q', params.q);
  if (params?.organisation_id) qs.set('organisation_id', params.organisation_id);
  const q = qs.toString();
  return apiFetch(`/api/shop/admin/customers${q ? `?${q}` : ''}`);
}
