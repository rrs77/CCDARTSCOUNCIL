-- =============================================================================
-- Platform admin scope: full_user_admin = super_admin/superuser only
-- School role=admin is org-scoped via current_user_is_org_scoped_admin() /
-- current_user_manages_organisation(). Forward-fixes legacy helpers & policies.
-- Safe to re-run. Do not apply to live DB from this agent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Redefine full-user-admin (matches 20261019120100 intent; lock it in)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_is_full_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status IS DISTINCT FROM 'suspended'
      AND anonymised_at IS NULL
      AND role IN ('super_admin', 'superuser')
  );
$$;

-- Legacy name used by older policies — must NOT treat school role=admin as global
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_user_is_full_user_admin();
$$;

-- School / hub managers (role=admin or can_manage_users) with a real organisation_id
CREATE OR REPLACE FUNCTION public.current_user_is_org_scoped_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status IS DISTINCT FROM 'suspended'
      AND p.anonymised_at IS NULL
      AND p.organisation_id IS NOT NULL
      AND btrim(p.organisation_id) <> ''
      AND (
        p.role IN ('admin', 'organisation')
        OR COALESCE(p.can_manage_users, false) = true
      )
  );
$$;

-- True when the caller may manage the given organisation (own org or super)
CREATE OR REPLACE FUNCTION public.current_user_manages_organisation(p_org_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p_org_id IS NOT NULL
    AND btrim(p_org_id) <> ''
    AND (
      public.current_user_is_full_user_admin()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
          AND p.organisation_id IS NOT NULL
          AND btrim(p.organisation_id) <> ''
          AND p.organisation_id = p_org_id
          AND (
            p.role IN ('admin', 'organisation')
            OR COALESCE(p.can_manage_users, false) = true
          )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_full_user_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_full_user_admin() FROM anon;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM anon;
REVOKE ALL ON FUNCTION public.current_user_is_org_scoped_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_org_scoped_admin() FROM anon;
REVOKE ALL ON FUNCTION public.current_user_manages_organisation(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_manages_organisation(text) FROM anon;

GRANT EXECUTE ON FUNCTION public.current_user_is_full_user_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_org_scoped_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_manages_organisation(text) TO authenticated, service_role;

-- Profiles: reinforce global read = super only; org managers = own org
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.current_user_is_full_user_admin());

DROP POLICY IF EXISTS "User managers read org-scoped profiles" ON public.profiles;
CREATE POLICY "User managers read org-scoped profiles"
  ON public.profiles FOR SELECT
  USING (
    public.current_user_can_manage_users()
    AND NOT public.current_user_is_full_user_admin()
    AND (
      id = auth.uid()
      OR organisation_id = ANY (public.current_user_org_ids())
      OR id IN (
        SELECT hm.user_id
        FROM public.hub_memberships hm
        WHERE hm.organisation_id = ANY (public.current_user_org_ids())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Download events: replace legacy role IN ('admin','superuser') with
--    is_super_admin() for global read; school admin only via matching org.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read all downloads" ON public.download_events;
CREATE POLICY "Admins read all downloads"
  ON public.download_events FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Org analytics read org downloads" ON public.download_events;
CREATE POLICY "Org analytics read org downloads"
  ON public.download_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organisation_id IS NOT NULL
        AND btrim(p.organisation_id) <> ''
        AND p.organisation_id = download_events.organisation_id
        AND COALESCE(p.status, 'active') <> 'suspended'
        AND p.anonymised_at IS NULL
        AND (
          p.role IN ('admin', 'organisation')
          OR COALESCE(p.can_view_download_analytics, false) = true
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 3) Forum moderators: do not auto-promote every school role=admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.forum_is_moderator(uid UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid
      AND COALESCE(p.status, 'active') = 'active'
      AND p.anonymised_at IS NULL
      AND (
        public.is_super_admin(uid)
        OR p.forum_can_moderate IS TRUE
        OR EXISTS (
          SELECT 1 FROM public.forum_user_status s
          WHERE s.user_id = uid AND s.is_moderator = true
            AND s.is_suspended = false
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- 4) System categories / branding: super-admin only (reinforce 20261024160000)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage branding" ON public.branding_settings;
CREATE POLICY "Admins can manage branding"
  ON public.branding_settings FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

COMMENT ON POLICY "Admins can manage branding" ON public.branding_settings IS
  'System-wide branding and system:categories: is_super_admin() only.';

-- ---------------------------------------------------------------------------
-- 5) Interactive lessons editor grant: no blanket school admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_edit_interactive_lessons(uid UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid
      AND COALESCE(p.status, 'active') <> 'suspended'
      AND p.anonymised_at IS NULL
      AND (
        public.is_super_admin(uid)
        OR p.role = 'organisation'
        OR (
          p.role = 'admin'
          AND p.organisation_id IS NOT NULL
          AND btrim(p.organisation_id) <> ''
        )
        OR EXISTS (
          SELECT 1 FROM public.hub_memberships hm
          WHERE hm.user_id = uid
            AND hm.role IN ('admin', 'owner')
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- 6) Organisations registry: global read for super only; members read own
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read organisations" ON public.organisations;
CREATE POLICY "Admins read organisations"
  ON public.organisations FOR SELECT
  USING (public.is_super_admin());

COMMENT ON FUNCTION public.current_user_is_full_user_admin() IS
  'Platform full admin: role IN (super_admin, superuser) only. School role=admin is NOT included.';
COMMENT ON FUNCTION public.current_user_is_org_scoped_admin() IS
  'School/hub manager with a non-blank organisation_id (role=admin|organisation or can_manage_users).';
COMMENT ON FUNCTION public.current_user_manages_organisation(text) IS
  'Super admins manage any org; school managers only their own organisation_id.';
