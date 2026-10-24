-- Admin / org-admin profile read policies for Settings → Users.
-- Full user admin = super_admin / superuser only (not role=admin).
-- Org managers (can_manage_users / role=admin) read/update only their orgs.
-- Does NOT grant super_admin by email — use scripts/grant-super-admin.mjs offline.
-- Safe to re-run.

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
      AND role IN ('superuser', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_manage_users()
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
      AND (
        role IN ('admin', 'superuser', 'super_admin')
        OR can_manage_users = true
      )
  );
$$;

-- organisation_id is TEXT on profiles and hub_memberships (not uuid).
CREATE OR REPLACE FUNCTION public.current_user_org_ids()
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT org_id FROM (
        SELECT p.organisation_id AS org_id
        FROM public.profiles p
        WHERE p.id = auth.uid() AND p.organisation_id IS NOT NULL
        UNION
        SELECT hm.organisation_id AS org_id
        FROM public.hub_memberships hm
        WHERE hm.user_id = auth.uid()
          AND hm.role = 'hub_administrator'
          AND hm.organisation_id IS NOT NULL
      ) s
    ),
    ARRAY[]::text[]
  );
$$;

-- Keep legacy admin helper working for older policies
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_user_is_full_user_admin();
$$;

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

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    public.current_user_can_manage_users()
    AND (
      public.current_user_is_full_user_admin()
      OR organisation_id = ANY (public.current_user_org_ids())
    )
  )
  WITH CHECK (
    public.current_user_can_manage_users()
    AND (
      public.current_user_is_full_user_admin()
      OR organisation_id = ANY (public.current_user_org_ids())
    )
  );

-- No email-based super_admin grant in this migration (avoids squatting).
-- One-off: node scripts/grant-super-admin.mjs <auth.users.id> (see script header).
