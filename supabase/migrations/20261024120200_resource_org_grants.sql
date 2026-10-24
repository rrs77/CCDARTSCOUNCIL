-- Push to whole school: org-scoped grants for licensed/purchased resources.
-- Written only by server/service role (API route). Clients cannot mutate.
--
-- Licensed file reads then allow: purchaser / licence holders / members of an
-- organisation with an active (non-revoked) grant for that resource_id.
-- Never cross-org; null organisation_id denied.
--
-- Do NOT apply automatically to live DB from this agent — owner reviews first.
-- Idempotent / safe to re-run.
-- Depends on: stored_files, file_licences, viewer_may_access_stored_file
--             from 20261024_stored_files_visibility.sql

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.resource_org_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ NULL,
  CONSTRAINT resource_org_grants_resource_nonempty
    CHECK (length(trim(resource_id)) > 0),
  CONSTRAINT resource_org_grants_org_nonempty
    CHECK (length(trim(organisation_id)) > 0),
  CONSTRAINT resource_org_grants_revoke_pair
    CHECK (
      (revoked_at IS NULL AND revoked_by IS NULL)
      OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
    )
);

-- At most one active grant per resource + organisation.
CREATE UNIQUE INDEX IF NOT EXISTS uq_resource_org_grants_active
  ON public.resource_org_grants (resource_id, organisation_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resource_org_grants_org
  ON public.resource_org_grants (organisation_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resource_org_grants_resource
  ON public.resource_org_grants (resource_id)
  WHERE revoked_at IS NULL;

COMMENT ON TABLE public.resource_org_grants IS
  'School-wide push grants for licensed resources. Service-role writes only; audit via audit_log.';

-- ---------------------------------------------------------------------------
-- Active-grant helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.org_has_active_resource_grant(
  p_resource_id TEXT,
  p_organisation_id TEXT
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p_resource_id IS NOT NULL
    AND length(trim(p_resource_id)) > 0
    AND p_organisation_id IS NOT NULL
    AND length(trim(p_organisation_id)) > 0
    AND EXISTS (
      SELECT 1
      FROM public.resource_org_grants g
      WHERE g.resource_id = trim(p_resource_id)
        AND g.organisation_id = trim(p_organisation_id)
        AND g.revoked_at IS NULL
    );
$$;

COMMENT ON FUNCTION public.org_has_active_resource_grant(TEXT, TEXT) IS
  'True when organisation has a non-revoked push grant for the resource.';

-- Callable only from SECURITY DEFINER helpers / service role (not clients).
REVOKE ALL ON FUNCTION public.org_has_active_resource_grant(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.org_has_active_resource_grant(TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.org_has_active_resource_grant(TEXT, TEXT) FROM authenticated;

-- ---------------------------------------------------------------------------
-- Extend licensed access: licence holder OR active org grant
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.viewer_may_access_stored_file(
  p_path TEXT,
  p_viewer UUID DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  f public.stored_files%ROWTYPE;
  viewer_org TEXT;
  owner_org TEXT;
BEGIN
  IF p_viewer IS NULL OR p_path IS NULL OR length(trim(p_path)) = 0 THEN
    RETURN false;
  END IF;

  SELECT * INTO f FROM public.stored_files WHERE storage_path = p_path;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF f.owner_id = p_viewer THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_viewer
      AND (
        COALESCE(p.status, 'active') = 'suspended'
        OR p.anonymised_at IS NOT NULL
      )
  ) THEN
    RETURN false;
  END IF;

  -- Licensed / purchased: personal licence OR active school push grant.
  IF f.is_purchased_resource OR f.visibility = 'licensed' THEN
    IF EXISTS (
      SELECT 1 FROM public.file_licences l
      WHERE l.storage_path = p_path AND l.user_id = p_viewer
    ) THEN
      RETURN true;
    END IF;

    IF f.resource_id IS NULL OR length(trim(f.resource_id)) = 0 THEN
      RETURN false;
    END IF;

    SELECT p.organisation_id INTO viewer_org
    FROM public.profiles p WHERE p.id = p_viewer;

    IF viewer_org IS NULL OR length(trim(viewer_org)) = 0 THEN
      RETURN false;
    END IF;

    RETURN public.org_has_active_resource_grant(f.resource_id, viewer_org);
  END IF;

  IF f.visibility = 'private' OR f.visibility IS NULL
     OR f.visibility NOT IN ('org', 'private', 'licensed') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.file_shares s
      WHERE s.storage_path = p_path AND s.shared_with = p_viewer
    );
  END IF;

  -- org visibility
  SELECT p.organisation_id INTO viewer_org
  FROM public.profiles p WHERE p.id = p_viewer;
  SELECT p.organisation_id INTO owner_org
  FROM public.profiles p WHERE p.id = f.owner_id;

  IF viewer_org IS NULL OR owner_org IS NULL THEN
    RETURN false;
  END IF;
  IF length(trim(viewer_org)) = 0 OR length(trim(owner_org)) = 0 THEN
    RETURN false;
  END IF;
  RETURN trim(viewer_org) = trim(owner_org);
END;
$$;

COMMENT ON FUNCTION public.viewer_may_access_stored_file(TEXT, UUID) IS
  'RLS helper: org / private / licensed (+ school push grant) file access; fail-closed.';

-- ---------------------------------------------------------------------------
-- RLS — clients read; service role writes (no INSERT/UPDATE/DELETE policies)
-- ---------------------------------------------------------------------------

ALTER TABLE public.resource_org_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resource_org_grants_select ON public.resource_org_grants;
CREATE POLICY resource_org_grants_select ON public.resource_org_grants
  FOR SELECT TO authenticated
  USING (
    -- Members of the granted org may see grants for their org
    (
      organisation_id IS NOT NULL
      AND length(trim(organisation_id)) > 0
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.organisation_id IS NOT NULL
          AND length(trim(p.organisation_id)) > 0
          AND trim(p.organisation_id) = trim(resource_org_grants.organisation_id)
      )
    )
    OR granted_by = auth.uid()
    OR public.current_user_can_manage_users()
  );

-- No INSERT / UPDATE / DELETE policies for authenticated or anon.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.resource_org_grants FROM authenticated;
REVOKE ALL ON TABLE public.resource_org_grants FROM anon;
GRANT SELECT ON TABLE public.resource_org_grants TO authenticated;
