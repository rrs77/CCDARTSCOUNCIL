-- Per-file / per-resource visibility: org | private | licensed
-- Enforced in /api/files proxy (api/_dreamhost.js) and mirrored here via RLS.
--
-- - org (default): owner + same non-null organisation_id
-- - private: owner + explicit file_shares grants
-- - licensed: purchaser / licence holders only (never org-wide)
--
-- Licence / purchase rows are written only by service role (e.g. payment webhook).
-- Authenticated clients cannot INSERT/UPDATE/DELETE file_licences.
-- Users cannot self-upgrade visibility to licensed.
-- Purchased resources are forced to licensed (never org).
--
-- Do NOT apply automatically to live DB from this agent — owner reviews first.
-- Idempotent / safe to re-run.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stored_files (
  storage_path TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'org'
    CHECK (visibility IN ('org', 'private', 'licensed')),
  is_purchased_resource BOOLEAN NOT NULL DEFAULT false,
  resource_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stored_files_purchased_must_be_licensed
    CHECK (NOT is_purchased_resource OR visibility = 'licensed')
);

CREATE INDEX IF NOT EXISTS idx_stored_files_owner
  ON public.stored_files (owner_id);

CREATE INDEX IF NOT EXISTS idx_stored_files_visibility
  ON public.stored_files (visibility);

CREATE INDEX IF NOT EXISTS idx_stored_files_resource
  ON public.stored_files (resource_id)
  WHERE resource_id IS NOT NULL;

COMMENT ON TABLE public.stored_files IS
  'DreamHost / proxy file metadata. visibility: org | private | licensed.';

CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL REFERENCES public.stored_files(storage_path) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (storage_path, shared_with)
);

CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with
  ON public.file_shares (shared_with);

CREATE INDEX IF NOT EXISTS idx_file_shares_path
  ON public.file_shares (storage_path);

COMMENT ON TABLE public.file_shares IS
  'Explicit private-file grants. Share-link tokens are undecided and out of scope.';

CREATE TABLE IF NOT EXISTS public.file_licences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL REFERENCES public.stored_files(storage_path) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'purchase',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (storage_path, user_id)
);

CREATE INDEX IF NOT EXISTS idx_file_licences_user
  ON public.file_licences (user_id);

CREATE INDEX IF NOT EXISTS idx_file_licences_path
  ON public.file_licences (storage_path);

COMMENT ON TABLE public.file_licences IS
  'Purchase / licence holders. Written only by service role (webhook); clients read-only.';

-- ---------------------------------------------------------------------------
-- Access helpers (SECURITY DEFINER — used by RLS)
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
  -- Missing metadata fails closed (private / deny for non-owners).
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF f.owner_id = p_viewer THEN
    RETURN true;
  END IF;

  -- Suspended / anonymised viewers denied.
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

  -- Purchased always licensed semantics.
  IF f.is_purchased_resource OR f.visibility = 'licensed' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.file_licences l
      WHERE l.storage_path = p_path AND l.user_id = p_viewer
    );
  END IF;

  IF f.visibility = 'private' OR f.visibility IS NULL
     OR f.visibility NOT IN ('org', 'private', 'licensed') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.file_shares s
      WHERE s.storage_path = p_path AND s.shared_with = p_viewer
    );
  END IF;

  -- org: same non-null organisation_id only (deny null=null).
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
  'RLS helper: org / private / licensed file access; fail-closed on unknown visibility.';

-- ---------------------------------------------------------------------------
-- Visibility change guard (owner only; never self-upgrade to licensed)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_stored_file_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / SQL as postgres: auth.uid() is null — allow (webhooks, admin).
  IF auth.uid() IS NULL THEN
    -- Still enforce purchased ⇒ licensed even for service writers that slip.
    IF NEW.is_purchased_resource THEN
      NEW.visibility := 'licensed';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- Ownership cannot be transferred by clients.
  IF TG_OP = 'UPDATE' AND NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'stored_files.owner_id cannot be changed by this user'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'only the file owner may update stored_files'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'stored_files.owner_id must be the inserting user'
      USING ERRCODE = '42501';
  END IF;

  -- Clients cannot mark purchased / force licensed.
  IF NEW.is_purchased_resource IS TRUE
     AND (TG_OP = 'INSERT' OR OLD.is_purchased_resource IS DISTINCT FROM TRUE) THEN
    RAISE EXCEPTION 'is_purchased_resource can only be set by service role'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.visibility = 'licensed'
     AND (TG_OP = 'INSERT' OR COALESCE(OLD.visibility, '') IS DISTINCT FROM 'licensed') THEN
    RAISE EXCEPTION 'visibility cannot be set to licensed by clients'
      USING ERRCODE = '42501';
  END IF;

  -- Purchased / already-licensed must never become org-wide.
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_purchased_resource OR OLD.visibility = 'licensed' THEN
      IF NEW.visibility = 'org' THEN
        RAISE EXCEPTION 'licensed/purchased files cannot be set to org visibility'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF NEW.is_purchased_resource THEN
    NEW.visibility := 'licensed';
  END IF;

  -- Unknown visibility fails closed to private.
  IF NEW.visibility IS NULL OR NEW.visibility NOT IN ('org', 'private', 'licensed') THEN
    NEW.visibility := 'private';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_stored_file_visibility ON public.stored_files;
CREATE TRIGGER trg_protect_stored_file_visibility
  BEFORE INSERT OR UPDATE ON public.stored_files
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_stored_file_visibility();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.stored_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_licences ENABLE ROW LEVEL SECURITY;

-- stored_files
DROP POLICY IF EXISTS stored_files_select ON public.stored_files;
CREATE POLICY stored_files_select ON public.stored_files
  FOR SELECT TO authenticated
  USING (public.viewer_may_access_stored_file(storage_path, auth.uid()));

DROP POLICY IF EXISTS stored_files_insert ON public.stored_files;
CREATE POLICY stored_files_insert ON public.stored_files
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND visibility IN ('org', 'private')
    AND is_purchased_resource = false
  );

DROP POLICY IF EXISTS stored_files_update ON public.stored_files;
CREATE POLICY stored_files_update ON public.stored_files
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (
    owner_id = auth.uid()
    AND visibility IN ('org', 'private', 'licensed')
  );

DROP POLICY IF EXISTS stored_files_delete ON public.stored_files;
CREATE POLICY stored_files_delete ON public.stored_files
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- file_shares: owner manages; grantee can read own grant
DROP POLICY IF EXISTS file_shares_select ON public.file_shares;
CREATE POLICY file_shares_select ON public.file_shares
  FOR SELECT TO authenticated
  USING (
    shared_with = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.stored_files f
      WHERE f.storage_path = file_shares.storage_path
        AND f.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS file_shares_insert ON public.file_shares;
CREATE POLICY file_shares_insert ON public.file_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    shared_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.stored_files f
      WHERE f.storage_path = file_shares.storage_path
        AND f.owner_id = auth.uid()
        AND f.visibility = 'private'
        AND NOT f.is_purchased_resource
    )
  );

DROP POLICY IF EXISTS file_shares_delete ON public.file_shares;
CREATE POLICY file_shares_delete ON public.file_shares
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stored_files f
      WHERE f.storage_path = file_shares.storage_path
        AND f.owner_id = auth.uid()
    )
  );

-- No client UPDATE on shares (delete + re-insert).
DROP POLICY IF EXISTS file_shares_update ON public.file_shares;
-- intentionally no UPDATE policy for authenticated

-- file_licences: holders/owners may SELECT; deny all client writes
DROP POLICY IF EXISTS file_licences_select ON public.file_licences;
CREATE POLICY file_licences_select ON public.file_licences
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.stored_files f
      WHERE f.storage_path = file_licences.storage_path
        AND f.owner_id = auth.uid()
    )
  );

-- Explicit deny of client mutation (no INSERT/UPDATE/DELETE policies).
-- Service role bypasses RLS for payment webhooks.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.file_licences FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.file_licences FROM anon;
REVOKE ALL ON TABLE public.file_licences FROM anon;

GRANT SELECT ON TABLE public.stored_files TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.stored_files TO authenticated;

GRANT SELECT, INSERT, DELETE ON TABLE public.file_shares TO authenticated;

GRANT SELECT ON TABLE public.file_licences TO authenticated;
