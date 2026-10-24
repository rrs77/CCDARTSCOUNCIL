-- =============================================================================
-- Planning shares (lessons, units, schemes / year overviews)
-- Additive — new tables; does not alter LessonPrintModal PDF share links.
-- Hierarchy: hub/arts organisation → school → year groups / groups → person.
-- Compatible with cursor/security-fixes profiles lock: use p.organisation_id
-- only (never school_or_org). Do NOT apply to live DB from this agent.
-- =============================================================================

-- Year-group scoping column (also present on security-fixes / live profiles).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allowed_year_groups text[];

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.planning_share_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('lesson', 'unit', 'scheme', 'year_overview')),
  resource_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  organisation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS planning_share_resources_owner_idx
  ON public.planning_share_resources (owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS planning_share_resources_org_idx
  ON public.planning_share_resources (organisation_id);

CREATE TABLE IF NOT EXISTS public.planning_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.planning_share_resources (id) ON DELETE CASCADE,
  shared_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  audience_type text NOT NULL CHECK (
    audience_type IN ('person', 'group', 'school', 'year_group', 'hub_org')
  ),
  audience_id text NOT NULL,
  audience_label text NOT NULL DEFAULT '',
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'copy', 'edit')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_id, audience_type, audience_id)
);

CREATE INDEX IF NOT EXISTS planning_shares_audience_idx
  ON public.planning_shares (audience_type, audience_id);
CREATE INDEX IF NOT EXISTS planning_shares_shared_by_idx
  ON public.planning_shares (shared_by);

-- Explicit teaching groups (audience_type = group → audience_id = planning_groups.id)
CREATE TABLE IF NOT EXISTS public.planning_groups (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  organisation_id text NOT NULL,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT planning_groups_org_nonblank CHECK (length(trim(organisation_id)) > 0)
);

CREATE INDEX IF NOT EXISTS planning_groups_owner_idx
  ON public.planning_groups (owner_id);
CREATE INDEX IF NOT EXISTS planning_groups_org_idx
  ON public.planning_groups (organisation_id);

CREATE TABLE IF NOT EXISTS public.planning_group_members (
  group_id text NOT NULL REFERENCES public.planning_groups (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  organisation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS planning_group_members_user_idx
  ON public.planning_group_members (user_id);
CREATE INDEX IF NOT EXISTS planning_group_members_org_idx
  ON public.planning_group_members (organisation_id);

ALTER TABLE public.planning_share_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_group_members ENABLE ROW LEVEL SECURITY;

-- Members: clients may SELECT own rows only. Writes go through service-role API.
REVOKE INSERT, UPDATE, DELETE ON public.planning_group_members FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.planning_group_members FROM anon;
REVOKE ALL ON public.planning_group_members FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER — break RLS cross-table recursion)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.planning_viewer_is_active()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND COALESCE(p.status, 'active') IS DISTINCT FROM 'suspended'
      AND p.anonymised_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_planning_resource(p_resource uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND public.planning_viewer_is_active()
    AND EXISTS (
      SELECT 1
      FROM public.planning_share_resources r
      WHERE r.id = p_resource
        AND r.owner_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.can_read_planning_resource(p_resource uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_org text;
  v_year_groups text[];
  v_res_org text;
  v_owner uuid;
BEGIN
  IF v_uid IS NULL OR p_resource IS NULL THEN
    RETURN false;
  END IF;

  -- Deny suspended / anonymised viewers.
  IF NOT public.planning_viewer_is_active() THEN
    RETURN false;
  END IF;

  SELECT r.owner_id, r.organisation_id
  INTO v_owner, v_res_org
  FROM public.planning_share_resources r
  WHERE r.id = p_resource;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_owner = v_uid THEN
    RETURN true;
  END IF;

  SELECT
    NULLIF(trim(p.organisation_id), ''),
    COALESCE(p.allowed_year_groups, ARRAY[]::text[])
  INTO v_org, v_year_groups
  FROM public.profiles p
  WHERE p.id = v_uid;

  RETURN EXISTS (
    SELECT 1
    FROM public.planning_shares s
    WHERE s.resource_id = p_resource
      AND (
        (s.audience_type = 'person' AND s.audience_id = v_uid::text)
        OR (
          s.audience_type = 'school'
          AND v_org IS NOT NULL
          AND s.audience_id = v_org
        )
        OR (
          s.audience_type = 'hub_org'
          AND v_org IS NOT NULL
          AND s.audience_id = v_org
        )
        OR (
          -- Year group: same non-blank org; if viewer has year-group data,
          -- audience_id must be in allowed_year_groups; otherwise whole-school
          -- within org (UI labels this "Whole school").
          s.audience_type = 'year_group'
          AND v_org IS NOT NULL
          AND v_res_org IS NOT NULL
          AND length(trim(v_res_org)) > 0
          AND v_org = trim(v_res_org)
          AND (
            cardinality(v_year_groups) = 0
            OR s.audience_id = ANY (v_year_groups)
          )
        )
        OR (
          s.audience_type = 'group'
          AND EXISTS (
            SELECT 1
            FROM public.planning_group_members m
            WHERE m.group_id = s.audience_id
              AND m.user_id = v_uid
          )
        )
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_planning_group(p_group_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND public.planning_viewer_is_active()
    AND (
      EXISTS (
        SELECT 1
        FROM public.planning_groups g
        WHERE g.id = p_group_id
          AND g.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.planning_groups g
        JOIN public.profiles me ON me.id = auth.uid()
        WHERE g.id = p_group_id
          AND NULLIF(trim(me.organisation_id), '') IS NOT NULL
          AND NULLIF(trim(g.organisation_id), '') IS NOT NULL
          AND trim(me.organisation_id) = trim(g.organisation_id)
          AND (
            me.role IN ('admin', 'superuser', 'super_admin')
            OR me.can_manage_users = true
          )
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.planning_viewer_is_active() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.planning_viewer_is_active() FROM anon;
GRANT EXECUTE ON FUNCTION public.planning_viewer_is_active() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.owns_planning_resource(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owns_planning_resource(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.owns_planning_resource(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_read_planning_resource(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_read_planning_resource(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_read_planning_resource(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_manage_planning_group(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_planning_group(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_manage_planning_group(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Trigger: organisation_id always from owner's profile (ignore client value)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_planning_resource_organisation_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_org text;
BEGIN
  SELECT NULLIF(trim(p.organisation_id), '')
  INTO owner_org
  FROM public.profiles p
  WHERE p.id = NEW.owner_id;

  NEW.organisation_id := owner_org;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_planning_resource_organisation_id
  ON public.planning_share_resources;
CREATE TRIGGER trg_set_planning_resource_organisation_id
  BEFORE INSERT OR UPDATE ON public.planning_share_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.set_planning_resource_organisation_id();

REVOKE EXECUTE ON FUNCTION public.set_planning_resource_organisation_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_planning_resource_organisation_id() FROM anon;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

-- planning_groups: owner + same-org managers
DROP POLICY IF EXISTS planning_groups_owner_all ON public.planning_groups;
CREATE POLICY planning_groups_owner_all
  ON public.planning_groups
  FOR ALL
  USING (
    public.planning_viewer_is_active()
    AND owner_id = auth.uid()
  )
  WITH CHECK (
    public.planning_viewer_is_active()
    AND owner_id = auth.uid()
    AND length(trim(organisation_id)) > 0
    AND organisation_id = (
      SELECT NULLIF(trim(p.organisation_id), '')
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS planning_groups_manager_all ON public.planning_groups;
CREATE POLICY planning_groups_manager_all
  ON public.planning_groups
  FOR ALL
  USING (public.can_manage_planning_group(id))
  WITH CHECK (
    public.can_manage_planning_group(id)
    AND organisation_id = (
      SELECT NULLIF(trim(organisation_id), '')
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS planning_groups_member_read ON public.planning_groups;
CREATE POLICY planning_groups_member_read
  ON public.planning_groups
  FOR SELECT
  USING (
    public.planning_viewer_is_active()
    AND EXISTS (
      SELECT 1
      FROM public.planning_group_members m
      WHERE m.group_id = planning_groups.id
        AND m.user_id = auth.uid()
    )
  );

-- planning_group_members: SELECT own rows only (no client writes)
DROP POLICY IF EXISTS planning_group_members_self_all ON public.planning_group_members;
DROP POLICY IF EXISTS planning_group_members_self_read ON public.planning_group_members;
CREATE POLICY planning_group_members_self_read
  ON public.planning_group_members
  FOR SELECT
  USING (
    public.planning_viewer_is_active()
    AND user_id = auth.uid()
  );

-- planning_share_resources
DROP POLICY IF EXISTS planning_share_resources_owner_all ON public.planning_share_resources;
CREATE POLICY planning_share_resources_owner_all
  ON public.planning_share_resources
  FOR ALL
  USING (
    public.planning_viewer_is_active()
    AND owner_id = auth.uid()
  )
  WITH CHECK (
    public.planning_viewer_is_active()
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS planning_share_resources_shared_read ON public.planning_share_resources;
CREATE POLICY planning_share_resources_shared_read
  ON public.planning_share_resources
  FOR SELECT
  USING (public.can_read_planning_resource(id));

-- planning_shares
DROP POLICY IF EXISTS planning_shares_owner_all ON public.planning_shares;
CREATE POLICY planning_shares_owner_all
  ON public.planning_shares
  FOR ALL
  USING (public.owns_planning_resource(resource_id))
  WITH CHECK (
    public.owns_planning_resource(resource_id)
    AND shared_by = auth.uid()
    AND (
      audience_type NOT IN ('school', 'hub_org')
      OR (
        -- school: audience_id must be the sharer's organisation_id
        audience_type = 'school'
        AND audience_id = (
          SELECT NULLIF(trim(p.organisation_id), '')
          FROM public.profiles p
          WHERE p.id = auth.uid()
        )
      )
      OR (
        -- hub_org: audience_id is the org, and the sharer must be a hub member of that org
        audience_type = 'hub_org'
        AND audience_id = (
          SELECT NULLIF(trim(p.organisation_id), '')
          FROM public.profiles p
          WHERE p.id = auth.uid()
        )
        AND EXISTS (
          SELECT 1
          FROM public.hub_memberships hm
          WHERE hm.user_id = auth.uid()
            AND NULLIF(trim(hm.organisation_id), '') IS NOT NULL
            AND trim(hm.organisation_id) = audience_id
        )
      )
    )
  );

DROP POLICY IF EXISTS planning_shares_recipient_read ON public.planning_shares;
CREATE POLICY planning_shares_recipient_read
  ON public.planning_shares
  FOR SELECT
  USING (
    public.planning_viewer_is_active()
    AND public.can_read_planning_resource(resource_id)
  );

COMMENT ON TABLE public.planning_share_resources IS
  'Shareable planning artefacts (lesson / unit / scheme / year overview). Separate from LessonPrintModal public PDF links.';
COMMENT ON TABLE public.planning_shares IS
  'Audience grants for planning resources: person, group, school, year_group, hub_org with view|copy|edit.';
COMMENT ON TABLE public.planning_groups IS
  'Teaching / team groups for planning share audience_type=group. Members written only via server route.';
COMMENT ON TABLE public.planning_group_members IS
  'Membership for planning_groups. Clients SELECT own rows only; INSERT/UPDATE/DELETE revoked — service-role API after owner/same-org-admin check.';
COMMENT ON FUNCTION public.can_read_planning_resource(uuid) IS
  'RLS helper: owner or matching grant; organisation_id only; denies suspended/anonymised; no cross-policy recursion.';
COMMENT ON FUNCTION public.owns_planning_resource(uuid) IS
  'RLS helper: resource owned by auth.uid() and viewer active.';
