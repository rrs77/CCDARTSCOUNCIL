/**
 * Buyer's purchases + entitlements.
 * GET /api/shop/mine
 */

import {
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import { requireServiceOr503 } from '../../../api/_shopShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const svc = requireServiceOr503();
    if (!svc.ok) return svc.response;

    const { data: orders, error } = await svc.service
      .from('shop_orders')
      .select(
        `
        id, status, total_pence, currency, payment_mode, paid_at, created_at,
        shop_order_items ( id, organisation_id, product_id, title_snapshot, price_pence, quantity, seed_product_id, pack_id )
      `,
      )
      .eq('buyer_user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      if (/shop_orders|does not exist/i.test(error.message)) {
        return jsonResponse({ orders: [], entitlements: [] });
      }
      return jsonResponse({ error: error.message }, 500);
    }

    const { data: entitlements } = await svc.service
      .from('shop_entitlements')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });

    return jsonResponse({
      orders: orders || [],
      entitlements: entitlements || [],
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to load purchases.' }, 500);
  }
}
