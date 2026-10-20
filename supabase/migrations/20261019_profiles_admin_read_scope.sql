-- Admin / org-admin profile read policies for Settings → Users.
-- Extends historical "Admins can read all profiles" to super_admin / can_manage_users
-- and adds org-scoped SELECT for hub/school admins (organisation_id peers).
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
      AND role IN ('admin', 'superuser', 'super_admin')
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

CREATE OR REPLACE FUNCTION public.current_user_org_ids()
RETURNS uuid[]
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
    ARRAY[]::uuid[]
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
    AND (
      public.current_user_is_full_user_admin()
      OR id = auth.uid()
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
  USING (public.current_user_can_manage_users())
  WITH CHECK (public.current_user_can_manage_users());

-- Idempotent: ensure Rob is super_admin when the account exists (also in 20260903).
DO $$
DECLARE
  normalised TEXT := lower(trim('rob.reichstorer@gmail.com'));
  -- also match common typo "gmaill"
  alt TEXT := lower(trim('rob.reichstorer@gmaill.com'));
  target_id UUID;
BEGIN
  SELECT id INTO target_id
  FROM public.profiles
  WHERE lower(trim(email)) IN (normalised, alt)
  LIMIT 1;

  IF target_id IS NULL THEN
    RAISE NOTICE 'profiles_admin_read_scope: no profile for Rob — skip super_admin grant';
  ELSE
    UPDATE public.profiles
    SET
      role = 'super_admin',
      can_manage_users = true,
      status = COALESCE(NULLIF(status, 'suspended'), 'active'),
      updated_at = now()
    WHERE id = target_id;
    RAISE NOTICE 'profiles_admin_read_scope: super_admin ensured for %', target_id;
  END IF;
END $$;
