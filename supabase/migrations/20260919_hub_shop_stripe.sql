-- =============================================================================
-- Hub shop + Stripe purchases (per-hub product catalogue and sales tracking)
-- Idempotent. Hubs own products; orders are scoped by organisation_id so each
-- hub has independent sales analytics. Platform admins can still query globally.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Hub products (courses / resources / packs for sale on a hub)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hub_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  meta_label TEXT,
  price_pence INTEGER NOT NULL DEFAULT 0 CHECK (price_pence >= 0),
  currency TEXT NOT NULL DEFAULT 'gbp',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  fulfillment_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (fulfillment_type IN ('pack', 'resource', 'external', 'manual', 'seed')),
  pack_id TEXT,
  resource_id UUID,
  external_url TEXT,
  seed_product_id TEXT,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_hub_products_org_status
  ON public.hub_products (organisation_id, status);
CREATE INDEX IF NOT EXISTS idx_hub_products_published
  ON public.hub_products (status) WHERE status = 'published';

-- ---------------------------------------------------------------------------
-- 2. Shop orders (one checkout; may span multiple hubs' products)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'demo')),
  total_pence INTEGER NOT NULL DEFAULT 0 CHECK (total_pence >= 0),
  currency TEXT NOT NULL DEFAULT 'gbp',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  payment_mode TEXT NOT NULL DEFAULT 'demo'
    CHECK (payment_mode IN ('stripe', 'demo')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_buyer
  ON public.shop_orders (buyer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status
  ON public.shop_orders (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Line items — denormalised organisation_id for hub-isolated sales queries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.hub_products(id) ON DELETE SET NULL,
  title_snapshot TEXT NOT NULL,
  price_pence INTEGER NOT NULL CHECK (price_pence >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  fulfillment_type TEXT,
  pack_id TEXT,
  resource_id UUID,
  seed_product_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_org
  ON public.shop_order_items (organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order
  ON public.shop_order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_product
  ON public.shop_order_items (product_id);

-- ---------------------------------------------------------------------------
-- 4. Buyer entitlements (unlock packs after paid / demo checkout)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.hub_products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.shop_orders(id) ON DELETE SET NULL,
  pack_id TEXT,
  resource_id UUID,
  seed_product_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_entitlements_user
  ON public.shop_entitlements (user_id);

-- ---------------------------------------------------------------------------
-- 5. Optional Stripe Connect account id on organisation
-- ---------------------------------------------------------------------------
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS shop_enabled BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- 6. Seed organisations that sell via the demo catalogue (if missing)
-- ---------------------------------------------------------------------------
INSERT INTO public.organisations (
  id, name, partner_slug, slug, display_name, short_name, paid, interactive, status, shop_enabled
) VALUES
  ('weteachdrama', 'We Teach Drama', 'weteachdrama', 'weteachdrama', 'We Teach Drama', 'WTD', true, true, 'active', true),
  ('icompose', 'iCompose', 'icompose', 'icompose', 'iCompose', 'iCompose', true, true, 'active', true),
  ('dramaresource', 'Drama Resource', 'dramaresource', 'dramaresource', 'Drama Resource', 'Drama Resource', true, true, 'active', true),
  ('ems', 'Essex Music Service', 'ems', 'ems', 'Essex Music Service', 'EMS', true, true, 'active', true),
  ('triborough', 'Tri-Borough Music Hub', 'triborough', 'triborough', 'Tri-Borough Music Hub', 'TBMH', true, true, 'active', true)
ON CONFLICT (id) DO UPDATE SET
  shop_enabled = true,
  paid = COALESCE(public.organisations.paid, EXCLUDED.paid),
  updated_at = NOW();

UPDATE public.organisations
SET shop_enabled = true, updated_at = NOW()
WHERE id IN ('jazznorth', 'weteachdrama', 'icompose', 'dramaresource', 'ems', 'triborough');

-- ---------------------------------------------------------------------------
-- 7. RLS (service role bypasses; anon/authenticated use policies)
-- ---------------------------------------------------------------------------
ALTER TABLE public.hub_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hub_products_public_read ON public.hub_products;
CREATE POLICY hub_products_public_read ON public.hub_products
  FOR SELECT USING (status = 'published' OR public.current_user_is_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS shop_orders_own_read ON public.shop_orders;
CREATE POLICY shop_orders_own_read ON public.shop_orders
  FOR SELECT USING (
    buyer_user_id = auth.uid()
    OR public.current_user_is_admin()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS shop_entitlements_own_read ON public.shop_entitlements;
CREATE POLICY shop_entitlements_own_read ON public.shop_entitlements
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.current_user_is_admin()
    OR public.is_super_admin()
  );
