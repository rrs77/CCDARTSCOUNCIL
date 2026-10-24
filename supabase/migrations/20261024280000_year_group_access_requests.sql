-- Year-group access requests: teachers with NULL/empty allowed_year_groups can
-- ask org admins for assignment. Never grants or mutates allowed_year_groups.
--
-- Rate limit is atomic via year_group_access_last + claim_year_group_access_slot()
-- (SECURITY DEFINER, service_role only): INSERT ... ON CONFLICT DO UPDATE … WHERE
-- last_at < now() - interval '24 hours' RETURNING last_at; no row ⇒ still cooling.
-- Audit/request history stays in year_group_access_requests; in-app rows go to
-- app_notifications.

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  organisation_id text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_notifications_user_created
  ON public.app_notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_notifications_org_created
  ON public.app_notifications (organisation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.year_group_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  organisation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_year_group_access_requests_requester_created
  ON public.year_group_access_requests (requester_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_year_group_access_requests_org_created
  ON public.year_group_access_requests (organisation_id, created_at DESC);

-- Atomic 24h cooldown slot (service_role writes only).
CREATE TABLE IF NOT EXISTS public.year_group_access_last (
  requester_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  last_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.year_group_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.year_group_access_last ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_notifications_select_own ON public.app_notifications;
CREATE POLICY app_notifications_select_own
  ON public.app_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS app_notifications_update_own_is_read ON public.app_notifications;
CREATE POLICY app_notifications_update_own_is_read
  ON public.app_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS year_group_access_requests_select_own ON public.year_group_access_requests;
CREATE POLICY year_group_access_requests_select_own
  ON public.year_group_access_requests
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid());

-- Org admins (active, not suspended/anonymised) can read requests for their org.
DROP POLICY IF EXISTS year_group_access_requests_select_org_admin ON public.year_group_access_requests;
CREATE POLICY year_group_access_requests_select_org_admin
  ON public.year_group_access_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
        AND NULLIF(trim(p.organisation_id), '') IS NOT NULL
        AND trim(p.organisation_id) = trim(year_group_access_requests.organisation_id)
        AND (
          p.role IN ('admin', 'superuser', 'super_admin')
          OR p.can_manage_users IS TRUE
        )
    )
  );

-- No client policies on year_group_access_last (service_role only).
DROP POLICY IF EXISTS year_group_access_last_deny_all ON public.year_group_access_last;
CREATE POLICY year_group_access_last_deny_all
  ON public.year_group_access_last
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON public.app_notifications FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.year_group_access_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.year_group_access_last FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.app_notifications TO authenticated;
GRANT UPDATE (is_read) ON public.app_notifications TO authenticated;
GRANT SELECT ON public.year_group_access_requests TO authenticated;

GRANT ALL ON public.app_notifications TO service_role;
GRANT ALL ON public.year_group_access_requests TO service_role;
GRANT ALL ON public.year_group_access_last TO service_role;

CREATE OR REPLACE FUNCTION public.claim_year_group_access_slot(p_requester_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_last timestamptz;
BEGIN
  IF p_requester_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.year_group_access_last AS t (requester_id, last_at)
  VALUES (p_requester_id, now())
  ON CONFLICT (requester_id) DO UPDATE
    SET last_at = now()
    WHERE t.last_at < now() - interval '24 hours'
  RETURNING t.last_at INTO v_last;

  RETURN v_last;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_year_group_access_slot(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_year_group_access_slot(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_year_group_access_slot(uuid) TO service_role;

-- Claim the 24h slot and insert the request row in one transaction so a failed
-- insert cannot leave the user locked out with no audit/request row.
CREATE OR REPLACE FUNCTION public.claim_and_record_year_group_access(
  p_requester_id uuid,
  p_organisation_id text
)
RETURNS TABLE (request_id uuid, claimed_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_last timestamptz;
  v_org text;
  v_req_id uuid;
BEGIN
  IF p_requester_id IS NULL THEN
    RETURN;
  END IF;
  v_org := NULLIF(trim(p_organisation_id), '');
  IF v_org IS NULL THEN
    RETURN;
  END IF;

  -- The requester must be an active (not anonymised, not suspended) member of
  -- the organisation they are asking about.
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_requester_id
      AND p.organisation_id::text = v_org
      AND p.anonymised_at IS NULL
      AND p.status IS DISTINCT FROM 'suspended'
  ) THEN
    RAISE EXCEPTION 'requester is not an active member of this organisation' USING ERRCODE = '42501';
  END IF;

  v_last := public.claim_year_group_access_slot(p_requester_id);
  IF v_last IS NULL THEN
    RETURN; -- still cooling down
  END IF;

  INSERT INTO public.year_group_access_requests (requester_id, organisation_id)
  VALUES (p_requester_id, v_org)
  RETURNING id INTO v_req_id;

  request_id := v_req_id;
  claimed_at := v_last;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_and_record_year_group_access(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_and_record_year_group_access(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_and_record_year_group_access(uuid, text) TO service_role;
