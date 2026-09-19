/**
 * Platform admin — global customer / purchase tracking across all hubs.
 * GET /api/shop/admin/customers?days=90&q=
 */

import {
  GLOBAL_ANALYTICS_ROLES,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
  isSuspended,
} from '../../../api/_authShared.js';
import { requireServiceOr503 } from '../../../api/_shopShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const profile = await loadProfile(auth.user.id);
    if (!profile || isSuspended(profile) || !GLOBAL_ANALYTICS_ROLES.has(profile.role)) {
      return jsonResponse({ error: 'Admin access required.' }, 403);
    }

    const svc = requireServiceOr503();
    if (!svc.ok) return svc.response;

    const url = new URL(request.url);
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || 90)));
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const orgFilter = url.searchParams.get('organisation_id');
    const since = new Date(Date.now() - days * 86400000).toISOString();

    let query = svc.service
      .from('shop_order_items')
      .select(
        `
        id, organisation_id, product_id, title_snapshot, price_pence, quantity, created_at,
        shop_orders!inner ( id, status, buyer_email, buyer_user_id, payment_mode, paid_at, total_pence, currency )
      `,
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(3000);

    if (orgFilter) query = query.eq('organisation_id', orgFilter);

    const { data: items, error } = await query;
    if (error) {
      if (/shop_order|does not exist/i.test(error.message)) {
        return jsonResponse({
          days,
          customers: [],
          hubs: {},
          gross_pence: 0,
          total_orders: 0,
          warning: 'Shop tables not migrated yet.',
        });
      }
      return jsonResponse({ error: error.message }, 500);
    }

    const paid = new Set(['paid', 'demo']);
    const customers = new Map();
    const hubs = {};
    let gross = 0;
    const orderIds = new Set();

    for (const row of items || []) {
      const order = row.shop_orders;
      if (!order || !paid.has(order.status)) continue;
      if (q) {
        const hay = `${order.buyer_email || ''} ${row.title_snapshot || ''} ${row.organisation_id}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      orderIds.add(order.id);
      const lineTotal = (row.price_pence || 0) * (row.quantity || 1);
      gross += lineTotal;

      hubs[row.organisation_id] = hubs[row.organisation_id] || {
        organisation_id: row.organisation_id,
        gross_pence: 0,
        units: 0,
        orders: new Set(),
      };
      hubs[row.organisation_id].gross_pence += lineTotal;
      hubs[row.organisation_id].units += row.quantity || 1;
      hubs[row.organisation_id].orders.add(order.id);

      const key = order.buyer_email || order.buyer_user_id || row.id;
      const prev = customers.get(key) || {
        buyer_email: order.buyer_email,
        buyer_user_id: order.buyer_user_id,
        spent_pence: 0,
        orders: 0,
        hubs: new Set(),
        products: [],
        last_purchase_at: null,
      };
      prev.spent_pence += lineTotal;
      prev.orders += 1;
      prev.hubs.add(row.organisation_id);
      prev.products.push({
        title: row.title_snapshot,
        organisation_id: row.organisation_id,
        price_pence: row.price_pence,
        paid_at: order.paid_at || row.created_at,
      });
      const paidAt = order.paid_at || row.created_at;
      if (!prev.last_purchase_at || paidAt > prev.last_purchase_at) {
        prev.last_purchase_at = paidAt;
      }
      customers.set(key, prev);
    }

    return jsonResponse({
      days,
      total_orders: orderIds.size,
      gross_pence: gross,
      currency: 'gbp',
      customers: [...customers.values()]
        .map((c) => ({
          ...c,
          hubs: [...c.hubs],
          products: c.products.slice(0, 20),
        }))
        .sort((a, b) => (b.last_purchase_at || '').localeCompare(a.last_purchase_at || '')),
      hubs: Object.fromEntries(
        Object.entries(hubs).map(([id, h]) => [
          id,
          {
            organisation_id: id,
            gross_pence: h.gross_pence,
            units: h.units,
            order_count: h.orders.size,
          },
        ]),
      ),
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to load customers.' }, 500);
  }
}
