/**
 * Create Stripe Checkout Session (or demo paid order when Stripe unset).
 * POST /api/shop/checkout
 * Body: { items: [{ productId, quantity? }], successUrl?, cancelUrl? }
 */

import {
  jsonResponse,
  optionsResponse,
  requireAuth,
  loadProfile,
} from '../../../api/_authShared.js';
import {
  fulfillPaidOrder,
  getAppOrigin,
  isStripeConfigured,
  productToBasketShape,
  requireServiceOr503,
  stripeRequest,
} from '../../../api/_shopShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const profile = await loadProfile(auth.user.id);
    const body = await request.json().catch(() => ({}));
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length) {
      return jsonResponse({ error: 'Basket is empty.' }, 400);
    }

    const qtyById = new Map();
    for (const line of rawItems) {
      const id = String(line.productId || line.product_id || '').trim();
      if (!id) continue;
      const q = Math.max(1, Math.min(20, Number(line.quantity) || 1));
      qtyById.set(id, (qtyById.get(id) || 0) + q);
    }
    if (!qtyById.size) return jsonResponse({ error: 'No valid products.' }, 400);

    const svc = requireServiceOr503();
    if (!svc.ok) return svc.response;

    const ids = [...qtyById.keys()];
    const { data: products, error } = await svc.service
      .from('hub_products')
      .select('*')
      .in('id', ids)
      .eq('status', 'published');

    if (error) {
      if (/hub_products|does not exist/i.test(error.message)) {
        return jsonResponse(
          {
            error:
              'Shop not ready — apply migration 20260919_hub_shop_stripe.sql, or use demo catalogue checkout in the app.',
            code: 'SHOP_NOT_MIGRATED',
          },
          503,
        );
      }
      return jsonResponse({ error: error.message }, 500);
    }

    if (!products?.length) {
      return jsonResponse({ error: 'No published products matched the basket.' }, 400);
    }

    const orgIds = [...new Set(products.map((p) => p.organisation_id))];
    const { data: orgs } = await svc.service
      .from('organisations')
      .select('id, display_name, name')
      .in('id', orgIds);
    const orgName = Object.fromEntries(
      (orgs || []).map((o) => [o.id, o.display_name || o.name || o.id]),
    );

    let total = 0;
    const lineRows = [];
    for (const p of products) {
      const quantity = qtyById.get(p.id) || 1;
      total += (p.price_pence || 0) * quantity;
      lineRows.push({
        organisation_id: p.organisation_id,
        product_id: p.id,
        title_snapshot: p.title,
        price_pence: p.price_pence,
        quantity,
        fulfillment_type: p.fulfillment_type,
        pack_id: p.pack_id,
        resource_id: p.resource_id,
        seed_product_id: p.seed_product_id,
      });
    }

    const { data: order, error: orderErr } = await svc.service
      .from('shop_orders')
      .insert({
        buyer_user_id: auth.user.id,
        buyer_email: profile?.email || auth.user.email || null,
        status: 'pending',
        total_pence: total,
        currency: 'gbp',
        payment_mode: isStripeConfigured() ? 'stripe' : 'demo',
        metadata: {
          product_ids: products.map((p) => p.id),
          organisation_ids: orgIds,
        },
      })
      .select('*')
      .single();

    if (orderErr) return jsonResponse({ error: orderErr.message }, 500);

    const itemsPayload = lineRows.map((row) => ({ ...row, order_id: order.id }));
    const { error: itemsErr } = await svc.service.from('shop_order_items').insert(itemsPayload);
    if (itemsErr) return jsonResponse({ error: itemsErr.message }, 500);

    const origin = getAppOrigin(request);
    const successUrl =
      body.successUrl ||
      `${origin}/?shop=success&order=${order.id}`;
    const cancelUrl = body.cancelUrl || `${origin}/?shop=cancel&order=${order.id}`;

    // --- Demo path (no Stripe keys) ---
    if (!isStripeConfigured()) {
      const fulfilled = await fulfillPaidOrder(svc.service, order.id, { status: 'demo' });
      return jsonResponse({
        mode: 'demo',
        order_id: order.id,
        status: 'demo',
        total_pence: total,
        currency: 'gbp',
        message:
          'Demo checkout — no Stripe keys configured. Order marked paid for hub sales tracking.',
        products: products.map((p) => productToBasketShape(p, orgName[p.organisation_id])),
        seed_product_ids: lineRows.map((l) => l.seed_product_id).filter(Boolean),
        already: fulfilled.already,
      });
    }

    // --- Stripe Checkout ---
    const line_items = products.map((p) => ({
      quantity: qtyById.get(p.id) || 1,
      price_data: {
        currency: (p.currency || 'gbp').toLowerCase(),
        unit_amount: p.price_pence,
        product_data: {
          name: p.title.slice(0, 120),
          metadata: {
            hub_product_id: p.id,
            organisation_id: p.organisation_id,
          },
        },
      },
    }));

    const session = await stripeRequest('checkout/sessions', {
      method: 'POST',
      idempotencyKey: `ccd-order-${order.id}`,
      body: {
        mode: 'payment',
        success_url: successUrl.includes('{CHECKOUT_SESSION_ID}')
          ? successUrl
          : `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        client_reference_id: order.id,
        customer_email: profile?.email || auth.user.email || undefined,
        metadata: {
          ccd_order_id: order.id,
          organisation_ids: orgIds.join(','),
        },
        line_items,
      },
    });

    if (!session.ok) {
      await svc.service.from('shop_orders').update({ status: 'failed' }).eq('id', order.id);
      return jsonResponse({ error: session.error }, session.status || 502);
    }

    await svc.service
      .from('shop_orders')
      .update({ stripe_checkout_session_id: session.data.id })
      .eq('id', order.id);

    return jsonResponse({
      mode: 'stripe',
      order_id: order.id,
      checkout_url: session.data.url,
      session_id: session.data.id,
      total_pence: total,
      currency: 'gbp',
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Checkout failed.' }, 500);
  }
}
