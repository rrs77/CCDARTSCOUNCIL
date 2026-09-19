/**
 * Hub shop + Stripe helpers (Checkout Sessions via REST — no stripe SDK).
 * Demo mode when STRIPE_SECRET_KEY is unset: records paid demo orders so
 * hub sales tracking and admin customer views still work in prototype.
 */

import {
  createServiceClient,
  jsonResponse,
  writeAuditLog,
} from './_authShared.js';

export const SHOP_CURRENCY = 'gbp';

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || '';
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || '';
}

export function getAppOrigin(request) {
  const env =
    process.env.APP_ORIGIN ||
    process.env.VITE_APP_ORIGIN ||
    process.env.PUBLIC_APP_URL ||
    '';
  if (env) return env.replace(/\/$/, '');
  try {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'http://localhost:5173';
  }
}

/**
 * Stripe REST helper (form-urlencoded).
 * @returns {Promise<{ ok: true, data: object } | { ok: false, error: string, status: number }>}
 */
export async function stripeRequest(path, { method = 'POST', body = null, idempotencyKey } = {}) {
  const key = getStripeSecretKey();
  if (!key) {
    return { ok: false, error: 'Stripe is not configured.', status: 503 };
  }
  const headers = {
    Authorization: `Bearer ${key}`,
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let payload;
  if (body && typeof body === 'object') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams();
    flattenStripeParams(body, payload);
  }

  const res = await fetch(`https://api.stripe.com/v1/${path.replace(/^\//, '')}`, {
    method,
    headers,
    body: payload,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error?.message || `Stripe error (${res.status})`,
      status: res.status,
      data,
    };
  }
  return { ok: true, data };
}

function flattenStripeParams(obj, params, prefix = '') {
  for (const [key, value] of Object.entries(obj)) {
    const k = prefix ? `${prefix}[${key}]` : key;
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === 'object') {
          flattenStripeParams(item, params, `${k}[${i}]`);
        } else {
          params.append(`${k}[${i}]`, String(item));
        }
      });
    } else if (typeof value === 'object') {
      flattenStripeParams(value, params, k);
    } else {
      params.append(k, String(value));
    }
  }
}

/** Verify Stripe-Signature header (HMAC SHA-256). */
export async function verifyStripeWebhookSignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader || !rawBody) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k.trim(), v];
    }),
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (Number.isFinite(age) && age > 60 * 5) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${timestamp}.${rawBody}`),
  );
  const digest = [...new Uint8Array(signed)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return timingSafeEqual(digest, v1);
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function slugifyProduct(title) {
  return String(title || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'product';
}

/**
 * Mark order paid and grant entitlements (idempotent).
 */
export async function fulfillPaidOrder(service, orderId, extra = {}) {
  const { data: order, error } = await service
    .from('shop_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error('Order not found');
  if (order.status === 'paid' || order.status === 'demo') {
    return { order, already: true };
  }

  const patch = {
    status: extra.status || 'paid',
    paid_at: new Date().toISOString(),
    ...(extra.stripe_payment_intent_id
      ? { stripe_payment_intent_id: extra.stripe_payment_intent_id }
      : {}),
    ...(extra.stripe_checkout_session_id
      ? { stripe_checkout_session_id: extra.stripe_checkout_session_id }
      : {}),
  };

  const { error: upErr } = await service.from('shop_orders').update(patch).eq('id', orderId);
  if (upErr) throw new Error(upErr.message);

  const { data: items } = await service
    .from('shop_order_items')
    .select('*')
    .eq('order_id', orderId);

  if (order.buyer_user_id && items?.length) {
    for (const item of items) {
      if (!item.product_id) continue;
      await service.from('shop_entitlements').upsert(
        {
          user_id: order.buyer_user_id,
          organisation_id: item.organisation_id,
          product_id: item.product_id,
          order_id: orderId,
          pack_id: item.pack_id || null,
          resource_id: item.resource_id || null,
          seed_product_id: item.seed_product_id || null,
        },
        { onConflict: 'user_id,product_id' },
      );

      if (item.pack_id && order.buyer_email) {
        await service.from('user_purchases').upsert(
          {
            user_email: order.buyer_email,
            pack_id: item.pack_id,
            amount: (item.price_pence || 0) / 100,
            status: 'completed',
            purchase_date: new Date().toISOString(),
            paypal_transaction_id: order.stripe_checkout_session_id || `demo-${orderId}`,
          },
          { onConflict: 'user_email,pack_id' },
        ).catch(() => {
          /* user_purchases schema may vary — entitlements are source of truth */
        });
      }
    }
  }

  if (order.buyer_user_id) {
    await writeAuditLog({
      actorUserId: order.buyer_user_id,
      action: 'shop.order_paid',
      targetType: 'shop_orders',
      targetId: orderId,
      organisationId: items?.[0]?.organisation_id || null,
      meta: { payment_mode: order.payment_mode, item_count: items?.length || 0 },
    });
  }

  const { data: refreshed } = await service.from('shop_orders').select('*').eq('id', orderId).maybeSingle();
  return { order: refreshed || { ...order, ...patch }, already: false, items: items || [] };
}

export async function loadPublishedProducts(service, { organisationId, ids } = {}) {
  let q = service.from('hub_products').select('*').eq('status', 'published').order('sort_order');
  if (organisationId) q = q.eq('organisation_id', organisationId);
  if (ids?.length) q = q.in('id', ids);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

export function productToBasketShape(row, orgName) {
  return {
    id: row.id,
    partnerSlug: row.organisation_id,
    partnerName: orgName || row.organisation_id,
    title: row.title,
    pricePence: row.price_pence,
    meta: row.meta_label || undefined,
    organisationId: row.organisation_id,
    fulfillmentType: row.fulfillment_type,
    packId: row.pack_id || undefined,
    resourceId: row.resource_id || undefined,
    seedProductId: row.seed_product_id || undefined,
    source: 'hub_product',
  };
}

export function requireServiceOr503() {
  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Server not configured (missing service role).' }, 503),
    };
  }
  return { ok: true, service };
}
