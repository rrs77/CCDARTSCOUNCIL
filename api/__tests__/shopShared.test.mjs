/**
 * Shop shared helper unit tests (no Stripe network).
 * Run: node --experimental-strip-types --test api/__tests__/shopShared.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isStripeConfigured,
  slugifyProduct,
  productToBasketShape,
} from '../_shopShared.js';

describe('shop shared', () => {
  it('slugifyProduct normalises titles', () => {
    assert.equal(slugifyProduct('KS3 Improvisation Course!'), 'ks3-improvisation-course');
    assert.ok(slugifyProduct('').length > 0);
  });

  it('productToBasketShape maps hub rows for the basket', () => {
    const shaped = productToBasketShape(
      {
        id: 'abc',
        organisation_id: 'ems',
        title: 'DJ Workshop',
        price_pence: 25000,
        meta_label: 'KS3',
        fulfillment_type: 'manual',
        pack_id: null,
        resource_id: null,
        seed_product_id: 'ems-dj',
      },
      'Essex Music Service',
    );
    assert.equal(shaped.partnerSlug, 'ems');
    assert.equal(shaped.partnerName, 'Essex Music Service');
    assert.equal(shaped.pricePence, 25000);
    assert.equal(shaped.seedProductId, 'ems-dj');
    assert.equal(shaped.source, 'hub_product');
  });

  it('isStripeConfigured reflects env', () => {
    const prev = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    assert.equal(isStripeConfigured(), false);
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    assert.equal(isStripeConfigured(), true);
    if (prev === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = prev;
  });
});
