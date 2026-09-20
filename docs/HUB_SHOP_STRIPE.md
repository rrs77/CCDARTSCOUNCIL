# Hub shop + Stripe

Sell courses and resources on partner / music hubs, track customers at platform level, and keep **per-hub sales** independent of other hubs (and separate from download analytics).

## Login test (required for full product)

**Do not use the working prototype Preview visitor** for hub admin download / purchase tracking. That path uses a synthetic teacher with no `hub_memberships`.

1. **Sign in** with an organisation, hub administrator, or platform admin account (Supabase email/password).
2. Open **Settings → Admin → Hub admin**.
3. Confirm sections: **Shop**, **Sales**, **Downloads** (analytics), plus page/resources/members as your role allows.
4. Platform admins also open **Settings → Shop customers** and **Download analytics**.
5. As a teacher account, buy a published hub product via the basket; as hub admin, refresh **Sales** to see the order (and **Shop customers** at platform level).

Hub memberships load after Sign in via `GET /api/hubs` and are attached to the session profile so Settings gates match API roles (`hub_editor`, `hub_administrator`, …).

## What hubs get

| Surface | Who | Purpose |
|---------|-----|---------|
| **Hub admin → Shop** | Hub editor+ | Create / publish products (title, GBP price, label) |
| **Hub admin → Sales** | Hub administrator | Orders, units, gross, customers **for this hub only** |
| **Hub admin → Downloads** | Hub administrator | Tracked free-resource download analytics for this hub |
| **Basket checkout** | Teachers (signed in) | Stripe Checkout when keys set; otherwise demo checkout that still writes sales |

## What platform admins get

| Surface | Purpose |
|---------|---------|
| **Settings → Shop customers** | Cross-hub customers, spend, last purchase, breakdown by hub |
| **Settings → Download analytics** | Cross-org download usage |

Download analytics = usage of free/tracked files. Shop sales = purchase revenue.

## Env vars (Vercel)

```bash
STRIPE_SECRET_KEY=sk_live_…          # or sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…        # required in production for /api/shop/webhook
APP_ORIGIN=https://your-domain.com   # success/cancel URLs
SUPABASE_SERVICE_ROLE_KEY=…          # already used by hub APIs
```

Without `STRIPE_SECRET_KEY`, signed-in checkout completes in **demo** mode: order marked `demo`, entitlements granted, hub Sales populated. Switch on Stripe for live card payments.

## Deploy steps

1. Apply migration: `supabase/migrations/20260919_hub_shop_stripe.sql`
2. Deploy (shop routes are behind `api/router.js` — no extra Hobby function)
3. Stripe Dashboard → Webhooks → endpoint `https://<host>/api/shop/webhook`  
   Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
4. Optional: set `organisations.stripe_account_id` later for Connect splits (column reserved)

## API map

| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/api/hubs/:hubId/products` | Catalogue CRUD |
| PATCH | `/api/hubs/:hubId/products/:id` | Update / publish / archive |
| GET | `/api/hubs/:hubId/sales` | Hub-isolated sales |
| GET | `/api/shop/products` | Public published catalogue |
| POST | `/api/shop/checkout` | Stripe session or demo fulfil |
| POST | `/api/shop/webhook` | Stripe signature verify + fulfil |
| GET | `/api/shop/mine` | Buyer orders + entitlements |
| GET | `/api/shop/admin/customers` | Super/admin global customers |

## Offline fallback

If shop tables are not migrated, the UI may fall back to `localStorage` so editors can still sketch products. Treat that as a temporary fallback — the **login test** with migration applied is the product path.
