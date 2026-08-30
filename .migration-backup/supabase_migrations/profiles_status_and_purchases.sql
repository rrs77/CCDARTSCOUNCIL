-- ============================================
-- PROFILES: Add status (Active / Invited / Suspended)
-- USER_PURCHASES: Table for View Purchases
-- Run in Supabase SQL Editor after profiles table exists.
-- ============================================

-- 1. Allow 'student' in profiles.role (if not already)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'teacher', 'viewer', 'student', 'superuser'));

-- 2. Add status to profiles (default 'active' for existing users)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active', 'invited', 'suspended'));

COMMENT ON COLUMN public.profiles.status IS 'User account status: active, invited (pending accept), suspended.';

-- 3. Create user_purchases table (optional - for View Purchases in Users & access)
-- Drop first so we get a clean table with user_id (in case an old version existed)
DROP TABLE IF EXISTS public.user_purchases CASCADE;
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'none')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON public.user_purchases(user_id);

ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Only admins/superusers can read all purchases; users can read own
DROP POLICY IF EXISTS "Users can read own purchases" ON public.user_purchases;
CREATE POLICY "Users can read own purchases"
  ON public.user_purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all purchases" ON public.user_purchases;
CREATE POLICY "Admins can read all purchases"
  ON public.user_purchases FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superuser'))
  );

-- Only service role / admin writes (e.g. from API or dashboard)
DROP POLICY IF EXISTS "Admins can insert purchases" ON public.user_purchases;
CREATE POLICY "Admins can insert purchases"
  ON public.user_purchases FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superuser'))
  );

COMMENT ON TABLE public.user_purchases IS 'Per-user purchases/subscriptions for View Purchases in Users & access.';
