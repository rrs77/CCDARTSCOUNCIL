-- ============================================
-- System category catalog + admin write roles
-- Additive only. Does NOT drop tables or delete rows.
--
-- Enables:
--   - key `system:categories` readable by everyone (existing SELECT true)
--   - INSERT/UPDATE by admin, super_admin, superuser, or can_manage_users
-- Teachers continue to write only user:{uid}:custom_categories (existing policy).
--
-- STOP: Review before running in production.
-- ============================================

-- Broaden admin manage policy so super_admin / superuser can maintain system:categories
-- and other non-user-scoped branding keys (e.g. default branding).
DROP POLICY IF EXISTS "Admins can manage branding" ON public.branding_settings;
CREATE POLICY "Admins can manage branding"
  ON public.branding_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('admin', 'super_admin', 'superuser')
          OR p.can_manage_users = true
        )
    )
    OR auth.jwt() ->> 'email' = 'rob.reichstorer@gmail.com'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('admin', 'super_admin', 'superuser')
          OR p.can_manage_users = true
        )
    )
    OR auth.jwt() ->> 'email' = 'rob.reichstorer@gmail.com'
  );

COMMENT ON TABLE public.branding_settings IS
  'Key/value JSON settings. Per-user: user:{uuid}:custom_categories. Global catalog: system:categories. Default branding: default / user-scoped branding keys.';
