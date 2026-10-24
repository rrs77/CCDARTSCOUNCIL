-- Replace email-based privilege checks with role helpers.
-- Does NOT rewrite already-applied 20260903_hub_administration.sql (its one-shot
-- email super_admin DO block already ran). There is no trigger/function that
-- re-grants super_admin on email match to drop.
--
-- Going forward: grant super_admin ONLY via scripts/grant-super-admin.mjs
-- (auth.users.id + email_confirmed_at IS NOT NULL). Never by email in SQL.
--
-- Safe to re-run. Do not apply to live DB until the owner reviews.

-- ---------------------------------------------------------------------------
-- branding_settings: drop email OR clauses from 20260917 (:27 / :38)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage branding" ON public.branding_settings;
CREATE POLICY "Admins can manage branding"
  ON public.branding_settings FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('admin', 'super_admin', 'superuser')
          OR p.can_manage_users = true
        )
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role IN ('admin', 'super_admin', 'superuser')
          OR p.can_manage_users = true
        )
    )
  );

COMMENT ON POLICY "Admins can manage branding" ON public.branding_settings IS
  'Admin / super_admin / superuser / can_manage_users, or is_super_admin(). No JWT email checks.';
