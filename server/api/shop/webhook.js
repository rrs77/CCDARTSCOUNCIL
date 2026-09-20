/**
 * Stripe webhook — fulfill paid Checkout Sessions.
 * POST /api/shop/webhook
 */

import { jsonResponse, optionsResponse, createServiceClient } from '../../../api/_authShared.js';
import {
  fulfillPaidOrder,
  getStripeWebhookSecret,
  verifyStripeWebhookSignature,
} from '../../../api/_shopShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const secret = getStripeWebhookSecret();
    const sig = request.headers.get('stripe-signature') || '';

    if (secret) {
      const ok = await verifyStripeWebhookSignature(rawBody, sig, secret);
      if (!ok) return jsonResponse({ error: 'Invalid signature.' }, 400);
    } else if (process.env.NODE_ENV === 'production') {
      return jsonResponse({ error: 'STRIPE_WEBHOOK_SECRET not configured.' }, 503);
    }

    const event = JSON.parse(rawBody);
    const service = createServiceClient();
    if (!service) return jsonResponse({ error: 'Server not configured.' }, 503);

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data?.object || {};
      const orderId = session.client_reference_id || session.metadata?.ccd_order_id;
      if (!orderId) {
        return jsonResponse({ received: true, skipped: 'no order id' });
      }

      let resolvedId = orderId;
      if (!orderId.match(/^[0-9a-f-]{36}$/i) && session.id) {
        const { data: bySession } = await service
          .from('shop_orders')
          .select('id')
          .eq('stripe_checkout_session_id', session.id)
          .maybeSingle();
        if (bySession) resolvedId = bySession.id;
      }

      await fulfillPaidOrder(service, resolvedId, {
        status: 'paid',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id,
      });
    }

    return jsonResponse({ received: true });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Webhook failed.' }, 500);
  }
}
