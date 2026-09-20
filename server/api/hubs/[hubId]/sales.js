/**
 * Per-hub sales tracking (independent of download analytics and other hubs).
 * GET /api/hubs/:hubId/sales?days=90
 */

import {
  jsonResponse,
  optionsResponse,
} from '../../../../api/_authShared.js';
import { requireHubAccess } from '../../../../api/_hubShared.js';
import { requireServiceOr503 } from '../../../../api/_shopShared.js';

function hubIdFrom(request, context) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const hubsIdx = parts.indexOf('hubs');
  return context?.params?.hubId || parts[hubsIdx + 1];
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request, context) {
  try {
    const hubId = hubIdFrom(request, context);
    const access = await requireHubAccess(request, {
      hubId,
      minRole: 'hub_administrator',
    });
    if (!access.ok) return access.response;

    const svc = requireServiceOr503();
    if (!svc.ok) return svc.response;

    const url = new URL(request.url);
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || 90)));
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: items, error } = await svc.service
      .from('shop_order_items')
      .select(
        `
        id, order_id, product_id, title_snapshot, price_pence, quantity, created_at,
        shop_orders!inner ( id, status, buyer_email, buyer_user_id, payment_mode, paid_at, total_pence, currency )
      `,
      )
      .eq('organisation_id', access.organisation.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) {
      if (/shop_order|does not exist/i.test(error.message)) {
        return jsonResponse({
          organisation_id: access.organisation.id,
          days,
          total_orders: 0,
          total_units: 0,
          gross_pence: 0,
          by_product: {},
          customers: [],
          lines: [],
          warning: 'Shop tables not migrated yet.',
        });
      }
      return jsonResponse({ error: error.message }, 500);
    }

    const paidStatuses = new Set(['paid', 'demo']);
    const lines = [];
    const byProduct = {};
    const customersMap = new Map();
    let gross = 0;
    let units = 0;
    const orderIds = new Set();

    for (const row of items || []) {
      const order = row.shop_orders;
      if (!order || !paidStatuses.has(order.status)) continue;
      orderIds.add(order.id);
      const lineTotal = (row.price_pence || 0) * (row.quantity || 1);
      gross += lineTotal;
      units += row.quantity || 1;
      byProduct[row.product_id || row.title_snapshot] = {
        product_id: row.product_id,
        title: row.title_snapshot,
        units: (byProduct[row.product_id || row.title_snapshot]?.units || 0) + (row.quantity || 1),
        gross_pence:
          (byProduct[row.product_id || row.title_snapshot]?.gross_pence || 0) + lineTotal,
      };
      const key = order.buyer_email || order.buyer_user_id || 'unknown';
      const prev = customersMap.get(key) || {
        buyer_email: order.buyer_email,
        buyer_user_id: order.buyer_user_id,
        orders: 0,
        spent_pence: 0,
        last_purchase_at: null,
      };
      prev.orders += 1;
      prev.spent_pence += lineTotal;
      const paidAt = order.paid_at || row.created_at;
      if (!prev.last_purchase_at || paidAt > prev.last_purchase_at) {
        prev.last_purchase_at = paidAt;
      }
      customersMap.set(key, prev);

      lines.push({
        id: row.id,
        order_id: row.order_id,
        product_id: row.product_id,
        title: row.title_snapshot,
        price_pence: row.price_pence,
        quantity: row.quantity,
        line_total_pence: lineTotal,
        buyer_email: order.buyer_email,
        payment_mode: order.payment_mode,
        status: order.status,
        paid_at: order.paid_at,
        created_at: row.created_at,
      });
    }

    return jsonResponse({
      organisation_id: access.organisation.id,
      days,
      total_orders: orderIds.size,
      total_units: units,
      gross_pence: gross,
      currency: 'gbp',
      by_product: byProduct,
      customers: [...customersMap.values()].sort(
        (a, b) => (b.last_purchase_at || '').localeCompare(a.last_purchase_at || ''),
      ),
      lines,
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to load hub sales.' }, 500);
  }
}
