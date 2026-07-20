-- ============================================
-- Allow each authenticated user to read/write their own branding_settings keys.
-- Required for:
--   - branding:            key = user:{auth.uid}
--   - category year groups: key = user:{auth.uid}:custom_categories
-- Run in Supabase SQL Editor.
-- ============================================

-- Users can SELECT their own scoped rows (in addition to any existing public-read policy)
DROP POLICY IF EXISTS "Users can read own branding keys" ON public.branding_settings;
CREATE POLICY "Users can read own branding keys"
  ON public.branding_settings FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      key = 'user:' || auth.uid()::text
      OR key LIKE 'user:' || auth.uid()::text || ':%'
    )
  );

-- Users can INSERT/UPDATE/DELETE only their own scoped keys
DROP POLICY IF EXISTS "Users can manage own branding keys" ON public.branding_settings;
CREATE POLICY "Users can manage own branding keys"
  ON public.branding_settings FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND (
      key = 'user:' || auth.uid()::text
      OR key LIKE 'user:' || auth.uid()::text || ':%'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      key = 'user:' || auth.uid()::text
      OR key LIKE 'user:' || auth.uid()::text || ':%'
    )
  );

COMMENT ON TABLE public.branding_settings IS
  'Key/value JSON settings. Per-user keys: user:{uuid} (branding), user:{uuid}:custom_categories (category year-group links).';
