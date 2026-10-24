-- branding_settings is system-wide: only super_admin / superuser may write.
-- Replaces broader admin / can_manage_users policy from 20261024140000.
-- Safe to re-run. Do not apply to live DB until the owner reviews.

DROP POLICY IF EXISTS "Admins can manage branding" ON public.branding_settings;
CREATE POLICY "Admins can manage branding"
  ON public.branding_settings FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

COMMENT ON POLICY "Admins can manage branding" ON public.branding_settings IS
  'System-wide branding/catalog writes: is_super_admin() only (no org admin, no JWT email).';
