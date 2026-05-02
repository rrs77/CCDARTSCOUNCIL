-- ============================================
-- BRANDING SETTINGS TABLE
-- Stores footer and app customizations so they persist across devices/browsers.
-- Run in Supabase SQL Editor after create_profiles_table and fix_profiles_rls_recursion.
-- ============================================

-- 1. Create branding_settings table (single row for org-wide branding)
CREATE TABLE IF NOT EXISTS public.branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.branding_settings IS 'Org-wide branding (footer, login page). Single row keyed by key=default.';

-- 2. Enable RLS
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- 3. Anon and authenticated can read (login page needs branding before user logs in)
DROP POLICY IF EXISTS "Anyone can read branding" ON public.branding_settings;
CREATE POLICY "Anyone can read branding"
  ON public.branding_settings FOR SELECT
  USING (true);

-- 4. Only admins can insert/update/delete
DROP POLICY IF EXISTS "Admins can manage branding" ON public.branding_settings;
CREATE POLICY "Admins can manage branding"
  ON public.branding_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR can_manage_users = true))
    OR auth.jwt() ->> 'email' = 'rob.reichstorer@gmail.com'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR can_manage_users = true))
    OR auth.jwt() ->> 'email' = 'rob.reichstorer@gmail.com'
  );

-- Note: Anyone can read branding (login page shows before user logs in). Only admins can write.
