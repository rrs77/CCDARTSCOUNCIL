-- V3: viewer_may_access_stored_file must not accept a caller-supplied viewer id.
-- Use auth.uid() inside only. Drop the (TEXT, UUID) overload that allowed
-- spoofing p_viewer. REVOKE EXECUTE from PUBLIC/anon; GRANT to authenticated
-- so RLS policies can still evaluate the helper.
--
-- Do NOT apply automatically to live DB — owner reviews first.
-- Idempotent / safe to re-run.
-- Depends on: resource_org_grants / stored_files visibility migrations.

-- Drop spoofable two-arg overload (and one-arg if already present).
DROP FUNCTION IF EXISTS public.viewer_may_access_stored_file(TEXT, UUID);
DROP FUNCTION IF EXISTS public.viewer_may_access_stored_file(TEXT);

CREATE OR REPLACE FUNCTION public.viewer_may_access_stored_file(p_path TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_viewer UUID := auth.uid();
  f public.stored_files%ROWTYPE;
  viewer_org TEXT;
  owner_org TEXT;
BEGIN
  IF v_viewer IS NULL OR p_path IS NULL OR length(trim(p_path)) = 0 THEN
    RETURN false;
  END IF;

  SELECT * INTO f FROM public.stored_files WHERE storage_path = p_path;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF f.owner_id = v_viewer THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_viewer
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
      WHERE l.storage_path = p_path AND l.user_id = v_viewer
    ) THEN
      RETURN true;
    END IF;

    IF f.resource_id IS NULL OR length(trim(f.resource_id)) = 0 THEN
      RETURN false;
    END IF;

    SELECT p.organisation_id INTO viewer_org
    FROM public.profiles p WHERE p.id = v_viewer;

    IF viewer_org IS NULL OR length(trim(viewer_org)) = 0 THEN
      RETURN false;
    END IF;

    RETURN public.org_has_active_resource_grant(f.resource_id, viewer_org);
  END IF;

  IF f.visibility = 'private' OR f.visibility IS NULL
     OR f.visibility NOT IN ('org', 'private', 'licensed') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.file_shares s
      WHERE s.storage_path = p_path AND s.shared_with = v_viewer
    );
  END IF;

  -- org visibility
  SELECT p.organisation_id INTO viewer_org
  FROM public.profiles p WHERE p.id = v_viewer;
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

COMMENT ON FUNCTION public.viewer_may_access_stored_file(TEXT) IS
  'RLS helper using auth.uid() only (V3 — no caller-supplied viewer id).';

-- RLS policy: single-arg call (auth.uid() inside the function).
DROP POLICY IF EXISTS stored_files_select ON public.stored_files;
CREATE POLICY stored_files_select ON public.stored_files
  FOR SELECT TO authenticated
  USING (public.viewer_may_access_stored_file(storage_path));

REVOKE ALL ON FUNCTION public.viewer_may_access_stored_file(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.viewer_may_access_stored_file(TEXT) FROM anon;
-- Authenticated needs EXECUTE so RLS USING expressions can call it.
GRANT EXECUTE ON FUNCTION public.viewer_may_access_stored_file(TEXT) TO authenticated;
-- Service role / postgres retain execute via ownership.
