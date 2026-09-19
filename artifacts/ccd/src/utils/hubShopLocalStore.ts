/**
 * Prototype-local hub shop store — used when Supabase shop tables / Stripe
 * are not yet configured so Preview still demonstrates hub selling + tracking.
 */

import {
  PAID_PARTNER_PRODUCTS,
  type PaidPartnerProduct,
} from '../config/paidPartnerProducts';
import type { HubProduct, HubSalesSummary, ShopCustomerRow } from '../types/shop';

const PRODUCTS_KEY = 'ccd-hub-shop-products-v1';
const ORDERS_KEY = 'ccd-hub-shop-orders-v1';

export interface LocalShopOrder {
  id: string;
  organisation_id: string;
  buyer_email: string;
  status: 'demo' | 'paid';
  total_pence: number;
  payment_mode: 'demo';
  paid_at: string;
  items: {
    product_id: string;
    title: string;
    price_pence: number;
    quantity: number;
    seed_product_id?: string;
  }[];
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function ensureSeeded(): HubProduct[] {
  const existing = readJson<HubProduct[]>(PRODUCTS_KEY, []);
  if (existing.length) return existing;

  const seeded: HubProduct[] = PAID_PARTNER_PRODUCTS.map((p, i) => ({
    id: `local-${p.id}`,
    organisation_id: p.partnerSlug,
    slug: p.id,
    title: p.title,
    description: null,
    meta_label: p.meta || null,
    price_pence: p.pricePence,
    currency: 'gbp',
    status: 'published',
    fulfillment_type: 'seed',
    seed_product_id: p.id,
    sort_order: i,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  writeJson(PRODUCTS_KEY, seeded);
  return seeded;
}

export function listLocalHubProducts(organisationId: string, all = false): HubProduct[] {
  const allProducts = ensureSeeded();
  return allProducts.filter(
    (p) =>
      p.organisation_id === organisationId &&
      (all ? p.status !== 'archived' : p.status === 'published'),
  );
}

export function createLocalHubProduct(
  organisationId: string,
  input: { title: string; price_pence: number; description?: string; meta_label?: string },
): HubProduct {
  const all = ensureSeeded();
  const product: HubProduct = {
    id: `local-${crypto.randomUUID()}`,
    organisation_id: organisationId,
    slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
    title: input.title,
    description: input.description || null,
    meta_label: input.meta_label || null,
    price_pence: Math.max(0, Math.round(input.price_pence)),
    currency: 'gbp',
    status: 'published',
    fulfillment_type: 'manual',
    sort_order: all.length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  writeJson(PRODUCTS_KEY, [...all, product]);
  return product;
}

export function updateLocalHubProduct(
  organisationId: string,
  productId: string,
  patch: Partial<HubProduct> & { action?: string },
): HubProduct | null {
  const all = ensureSeeded();
  const idx = all.findIndex(
    (p) => p.id === productId && p.organisation_id === organisationId,
  );
  if (idx < 0) return null;
  const next = { ...all[idx], ...patch, updated_at: new Date().toISOString() };
  if (patch.action === 'publish') next.status = 'published';
  if (patch.action === 'unpublish') next.status = 'draft';
  if (patch.action === 'archive') next.status = 'archived';
  delete (next as { action?: string }).action;
  all[idx] = next;
  writeJson(PRODUCTS_KEY, all);
  return next;
}

export function recordLocalDemoCheckout(args: {
  buyerEmail: string;
  lines: { product: PaidPartnerProduct | HubProduct; quantity: number }[];
}): LocalShopOrder[] {
  const orders = readJson<LocalShopOrder[]>(ORDERS_KEY, []);
  const byOrg = new Map<string, LocalShopOrder>();
  const now = new Date().toISOString();

  for (const line of args.lines) {
    const p = line.product;
    const organisationId =
      'organisation_id' in p && p.organisation_id
        ? p.organisation_id
        : 'partnerSlug' in p
          ? p.partnerSlug
          : 'unknown';
    const title = p.title;
    const price =
      'price_pence' in p ? p.price_pence : 'pricePence' in p ? p.pricePence : 0;
    const productId = p.id;
    const seedId =
      'seed_product_id' in p
        ? p.seed_product_id || undefined
        : 'partnerSlug' in p
          ? p.id
          : undefined;

    let order = byOrg.get(organisationId);
    if (!order) {
      order = {
        id: `local-order-${crypto.randomUUID()}`,
        organisation_id: organisationId,
        buyer_email: args.buyerEmail,
        status: 'demo',
        total_pence: 0,
        payment_mode: 'demo',
        paid_at: now,
        items: [],
      };
      byOrg.set(organisationId, order);
    }
    order.items.push({
      product_id: productId,
      title,
      price_pence: price,
      quantity: line.quantity,
      seed_product_id: seedId,
    });
    order.total_pence += price * line.quantity;
  }

  const created = [...byOrg.values()];
  writeJson(ORDERS_KEY, [...created, ...orders]);
  return created;
}

export function loadLocalHubSales(organisationId: string, days = 90): HubSalesSummary {
  const since = Date.now() - days * 86400000;
  const orders = readJson<LocalShopOrder[]>(ORDERS_KEY, []).filter(
    (o) => o.organisation_id === organisationId && new Date(o.paid_at).getTime() >= since,
  );

  const byProduct: HubSalesSummary['by_product'] = {};
  const customersMap = new Map<string, ShopCustomerRow>();
  const lines: HubSalesSummary['lines'] = [];
  let units = 0;
  let gross = 0;

  for (const order of orders) {
    for (const item of order.items) {
      const lineTotal = item.price_pence * item.quantity;
      units += item.quantity;
      gross += lineTotal;
      const key = item.product_id;
      byProduct[key] = {
        product_id: item.product_id,
        title: item.title,
        units: (byProduct[key]?.units || 0) + item.quantity,
        gross_pence: (byProduct[key]?.gross_pence || 0) + lineTotal,
      };
      const ck = order.buyer_email;
      const prev = customersMap.get(ck) || {
        buyer_email: order.buyer_email,
        orders: 0,
        spent_pence: 0,
        last_purchase_at: null,
      };
      prev.orders += 1;
      prev.spent_pence += lineTotal;
      prev.last_purchase_at = order.paid_at;
      customersMap.set(ck, prev);
      lines.push({
        id: `${order.id}-${item.product_id}`,
        order_id: order.id,
        product_id: item.product_id,
        title: item.title,
        price_pence: item.price_pence,
        quantity: item.quantity,
        line_total_pence: lineTotal,
        buyer_email: order.buyer_email,
        payment_mode: 'demo',
        status: order.status,
        paid_at: order.paid_at,
        created_at: order.paid_at,
      });
    }
  }

  return {
    organisation_id: organisationId,
    days,
    total_orders: orders.length,
    total_units: units,
    gross_pence: gross,
    currency: 'gbp',
    by_product: byProduct,
    customers: [...customersMap.values()],
    lines,
  };
}

export function formatShopPence(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format((pence || 0) / 100);
}
