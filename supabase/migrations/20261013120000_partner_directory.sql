-- =============================================================================
-- Partner Hubs directory (Stage 2)
--
-- Additive only: new tables, new columns with safe defaults, new functions and
-- policies on NEW tables. No existing table, column, row or policy is dropped,
-- altered or deleted. Idempotent: safe to run more than once.
--
--   music_hubs                     ACE Music Hub areas (England) — one row per hub
--   music_hub_services             constituent / lead delivery services of a hub
--   music_hub_areas                ONS local authority districts (all UK nations)
--   music_hub_directory_drafts     editor proposals awaiting publisher approval
--   music_hub_directory_revisions  approved change history (before/after)
--   resource_scopes                tag one resource to many hubs/areas/regions
--   resource_private_locations     locked file locations (service role only)
--   organisation_access_codes      hashed organisation access codes
--   organisation_access_grants     who has been granted access to an organisation
--   resource_engagement_events     viewed / added / placed / assigned / taught
--
-- Seed rows live in 20261013120100_partner_directory_seed.sql (generated).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Directory: hubs, services, areas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.music_hubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  ace_area_name TEXT,
  nation_code TEXT NOT NULL DEFAULT 'E92000001',
  region_code TEXT,
  region_codes TEXT[] NOT NULL DEFAULT '{}',
  region_note TEXT,
  lead_organisation_name TEXT,
  lead_body TEXT,
  organisation_id TEXT REFERENCES public.organisations(id) ON DELETE SET NULL,
  site_url TEXT,
  about TEXT,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  source_url TEXT,
  relationship_status TEXT NOT NULL DEFAULT 'directory_listing'
    CHECK (relationship_status IN ('directory_listing', 'demonstration', 'confirmed_contributor')),
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived')),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_hubs_region ON public.music_hubs (region_code);
CREATE INDEX IF NOT EXISTS idx_music_hubs_org ON public.music_hubs (organisation_id);

CREATE TABLE IF NOT EXISTS public.music_hub_services (
  id TEXT PRIMARY KEY,
  hub_id TEXT NOT NULL REFERENCES public.music_hubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('lead', 'partner')),
  organisation_id TEXT REFERENCES public.organisations(id) ON DELETE SET NULL,
  site_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_hub_services_hub ON public.music_hub_services (hub_id);

CREATE TABLE IF NOT EXISTS public.music_hub_areas (
  code TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  nation_code TEXT NOT NULL,
  region_code TEXT,
  county TEXT,
  hub_id TEXT REFERENCES public.music_hubs(id) ON DELETE SET NULL,
  service_id TEXT REFERENCES public.music_hub_services(id) ON DELETE SET NULL,
  about TEXT,
  site_url TEXT,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  boundary_source TEXT NOT NULL DEFAULT 'ONS LAD December 2024',
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_hub_areas_hub ON public.music_hub_areas (hub_id);
CREATE INDEX IF NOT EXISTS idx_music_hub_areas_slug ON public.music_hub_areas (slug);

-- Effective hub role: super admins administer every hub; otherwise the user's
-- membership of the hub's lead organisation (existing hub_memberships model).
CREATE OR REPLACE FUNCTION public.music_hub_role(p_hub TEXT)
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT CASE
    WHEN public.is_super_admin() THEN 'hub_administrator'
    ELSE (
      SELECT public.user_hub_role(h.organisation_id)
      FROM public.music_hubs h
      WHERE h.id = p_hub AND h.organisation_id IS NOT NULL
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.music_hub_has_role(p_hub TEXT, p_min_role TEXT)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT public.hub_role_rank(public.music_hub_role(p_hub)) >= public.hub_role_rank(p_min_role);
$$;

ALTER TABLE public.music_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_hub_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_hub_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read published music hubs" ON public.music_hubs;
CREATE POLICY "Read published music hubs"
  ON public.music_hubs FOR SELECT
  USING (status = 'published' OR public.music_hub_has_role(id, 'hub_viewer'));

DROP POLICY IF EXISTS "Super admins manage music hubs" ON public.music_hubs;
CREATE POLICY "Super admins manage music hubs"
  ON public.music_hubs FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Read music hub services" ON public.music_hub_services;
CREATE POLICY "Read music hub services"
  ON public.music_hub_services FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super admins manage music hub services" ON public.music_hub_services;
CREATE POLICY "Super admins manage music hub services"
  ON public.music_hub_services FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Read music hub areas" ON public.music_hub_areas;
CREATE POLICY "Read music hub areas"
  ON public.music_hub_areas FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super admins manage music hub areas" ON public.music_hub_areas;
CREATE POLICY "Super admins manage music hub areas"
  ON public.music_hub_areas FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- 2. Governance: drafts → publisher approval → revision history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.music_hub_directory_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id TEXT NOT NULL REFERENCES public.music_hubs(id) ON DELETE CASCADE,
  area_code TEXT REFERENCES public.music_hub_areas(code) ON DELETE CASCADE,
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'withdrawn')),
  proposed_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  review_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_hub_drafts_hub ON public.music_hub_directory_drafts (hub_id, status);

CREATE TABLE IF NOT EXISTS public.music_hub_directory_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id TEXT NOT NULL REFERENCES public.music_hubs(id) ON DELETE CASCADE,
  area_code TEXT REFERENCES public.music_hub_areas(code) ON DELETE CASCADE,
  draft_id UUID REFERENCES public.music_hub_directory_drafts(id) ON DELETE SET NULL,
  before JSONB NOT NULL,
  after JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_hub_revisions_hub ON public.music_hub_directory_revisions (hub_id, created_at DESC);

ALTER TABLE public.music_hub_directory_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_hub_directory_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own or reviewable hub drafts" ON public.music_hub_directory_drafts;
CREATE POLICY "Read own or reviewable hub drafts"
  ON public.music_hub_directory_drafts FOR SELECT
  USING (proposed_by = auth.uid() OR public.music_hub_has_role(hub_id, 'hub_publisher'));

DROP POLICY IF EXISTS "Hub editors create drafts" ON public.music_hub_directory_drafts;
CREATE POLICY "Hub editors create drafts"
  ON public.music_hub_directory_drafts FOR INSERT
  WITH CHECK (
    proposed_by = auth.uid()
    AND status IN ('draft', 'pending')
    AND public.music_hub_has_role(hub_id, 'hub_editor')
  );

DROP POLICY IF EXISTS "Hub editors update own open drafts" ON public.music_hub_directory_drafts;
CREATE POLICY "Hub editors update own open drafts"
  ON public.music_hub_directory_drafts FOR UPDATE
  USING (
    proposed_by = auth.uid()
    AND status IN ('draft', 'pending')
    AND public.music_hub_has_role(hub_id, 'hub_editor')
  )
  WITH CHECK (
    proposed_by = auth.uid()
    AND status IN ('draft', 'pending', 'withdrawn')
    AND reviewed_by IS NULL
    AND public.music_hub_has_role(hub_id, 'hub_editor')
  );

DROP POLICY IF EXISTS "Hub editors read revisions" ON public.music_hub_directory_revisions;
CREATE POLICY "Hub editors read revisions"
  ON public.music_hub_directory_revisions FOR SELECT
  USING (public.music_hub_has_role(hub_id, 'hub_editor'));

-- Publishers (or super admins) approve/reject. Editors can only change the
-- presentation fields below; ACE-sourced names and leads stay super-admin only.
CREATE OR REPLACE FUNCTION public.review_music_hub_draft(
  p_draft UUID, p_decision TEXT, p_note TEXT DEFAULT NULL
)
RETURNS public.music_hub_directory_drafts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d public.music_hub_directory_drafts;
  c JSONB;
  before_row JSONB;
  after_row JSONB;
  org TEXT;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  SELECT * INTO d FROM public.music_hub_directory_drafts WHERE id = p_draft FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft not found';
  END IF;
  IF d.status <> 'pending' THEN
    RAISE EXCEPTION 'Only drafts submitted for review can be approved or rejected';
  END IF;
  IF NOT public.music_hub_has_role(d.hub_id, 'hub_publisher') THEN
    RAISE EXCEPTION 'Approving hub changes requires a hub publisher' USING ERRCODE = '42501';
  END IF;
  IF d.proposed_by = auth.uid() AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Another publisher must approve your own change' USING ERRCODE = '42501';
  END IF;

  c := COALESCE(d.changes, '{}'::jsonb);
  IF c ? 'site_url' AND COALESCE(c->>'site_url', '') <> '' AND c->>'site_url' NOT LIKE 'https://%' THEN
    RAISE EXCEPTION 'Website must be an https:// address';
  END IF;

  IF p_decision = 'approved' THEN
    IF d.area_code IS NULL THEN
      SELECT to_jsonb(h) INTO before_row FROM public.music_hubs h WHERE h.id = d.hub_id;
      UPDATE public.music_hubs SET
        short_name = CASE WHEN c ? 'short_name' THEN NULLIF(btrim(c->>'short_name'), '') ELSE short_name END,
        site_url = CASE WHEN c ? 'site_url' THEN NULLIF(btrim(c->>'site_url'), '') ELSE site_url END,
        about = CASE WHEN c ? 'about' THEN NULLIF(btrim(c->>'about'), '') ELSE about END,
        contact = CASE WHEN c ? 'contact' AND jsonb_typeof(c->'contact') = 'object' THEN c->'contact' ELSE contact END,
        updated_by = auth.uid(),
        updated_at = NOW()
      WHERE id = d.hub_id;
      SELECT to_jsonb(h) INTO after_row FROM public.music_hubs h WHERE h.id = d.hub_id;
    ELSE
      SELECT to_jsonb(a) INTO before_row FROM public.music_hub_areas a
        WHERE a.code = d.area_code AND a.hub_id = d.hub_id;
      IF before_row IS NULL THEN
        RAISE EXCEPTION 'Area is not part of this hub';
      END IF;
      UPDATE public.music_hub_areas SET
        site_url = CASE WHEN c ? 'site_url' THEN NULLIF(btrim(c->>'site_url'), '') ELSE site_url END,
        about = CASE WHEN c ? 'about' THEN NULLIF(btrim(c->>'about'), '') ELSE about END,
        contact = CASE WHEN c ? 'contact' AND jsonb_typeof(c->'contact') = 'object' THEN c->'contact' ELSE contact END,
        updated_by = auth.uid(),
        updated_at = NOW()
      WHERE code = d.area_code;
      SELECT to_jsonb(a) INTO after_row FROM public.music_hub_areas a WHERE a.code = d.area_code;
    END IF;

    INSERT INTO public.music_hub_directory_revisions
      (hub_id, area_code, draft_id, before, after, changed_by, approved_by)
    VALUES
      (d.hub_id, d.area_code, d.id, before_row, after_row, d.proposed_by, auth.uid());
  END IF;

  UPDATE public.music_hub_directory_drafts SET
    status = p_decision,
    review_note = p_note,
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = d.id
  RETURNING * INTO d;

  SELECT organisation_id INTO org FROM public.music_hubs WHERE id = d.hub_id;
  INSERT INTO public.audit_log (actor_id, action, target_type, target_id, meta, organisation_id)
  VALUES (
    auth.uid(),
    'music_hub_draft_' || p_decision,
    'music_hub',
    d.hub_id,
    jsonb_build_object('draft_id', d.id, 'area_code', d.area_code, 'note', p_note),
    org
  );

  RETURN d;
END;
$$;

REVOKE ALL ON FUNCTION public.review_music_hub_draft(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_music_hub_draft(UUID, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Resources: access level, attribution, scope (new columns, safe defaults)
-- ---------------------------------------------------------------------------
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS access_level TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS contributor_name TEXT,
  ADD COLUMN IF NOT EXISTS licence TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS resource_version INT NOT NULL DEFAULT 1;

DO $$
BEGIN
  ALTER TABLE public.resources
    ADD CONSTRAINT resources_access_level_check
    CHECK (access_level IN ('free', 'access_code', 'subscription', 'external_link'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.resource_scopes (
  resource_id TEXT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('national', 'nation', 'region', 'hub', 'area')),
  scope_id TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (resource_id, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_scopes_scope ON public.resource_scopes (scope_type, scope_id);

ALTER TABLE public.resource_scopes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read resource scopes" ON public.resource_scopes;
CREATE POLICY "Read resource scopes"
  ON public.resource_scopes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Hub editors manage resource scopes" ON public.resource_scopes;
CREATE POLICY "Hub editors manage resource scopes"
  ON public.resource_scopes FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.id = resource_id
        AND r.organisation_id IS NOT NULL
        AND public.user_has_hub_role(r.organisation_id, 'hub_editor')
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.id = resource_id
        AND r.organisation_id IS NOT NULL
        AND public.user_has_hub_role(r.organisation_id, 'hub_editor')
    )
  );

-- Locked files are never stored in resources.download_url (readable by any
-- signed-in user). They live here, readable only by the service role, and are
-- released by /api/music-hubs/resource-access after a server-side check.
CREATE TABLE IF NOT EXISTS public.resource_private_locations (
  resource_id TEXT PRIMARY KEY REFERENCES public.resources(id) ON DELETE CASCADE,
  url TEXT,
  storage_bucket TEXT,
  storage_path TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (url IS NOT NULL OR (storage_bucket IS NOT NULL AND storage_path IS NOT NULL))
);

ALTER TABLE public.resource_private_locations ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: service role only.

-- ---------------------------------------------------------------------------
-- 4. Organisation access codes and grants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organisation_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Access code',
  code_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  max_redemptions INT,
  redemption_count INT NOT NULL DEFAULT 0,
  grant_days INT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_access_codes_org ON public.organisation_access_codes (organisation_id);

CREATE TABLE IF NOT EXISTS public.organisation_access_grants (
  organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'access_code' CHECK (source IN ('access_code', 'subscription', 'admin')),
  code_id UUID REFERENCES public.organisation_access_codes(id) ON DELETE SET NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  PRIMARY KEY (organisation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_access_grants_user ON public.organisation_access_grants (user_id);

ALTER TABLE public.organisation_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_access_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hub admins read access codes" ON public.organisation_access_codes;
CREATE POLICY "Hub admins read access codes"
  ON public.organisation_access_codes FOR SELECT
  USING (public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_administrator'));

DROP POLICY IF EXISTS "Hub admins update access codes" ON public.organisation_access_codes;
CREATE POLICY "Hub admins update access codes"
  ON public.organisation_access_codes FOR UPDATE
  USING (public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_administrator'))
  WITH CHECK (public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_administrator'));

DROP POLICY IF EXISTS "Read own or administered grants" ON public.organisation_access_grants;
CREATE POLICY "Read own or administered grants"
  ON public.organisation_access_grants FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR public.user_has_hub_role(organisation_id, 'hub_administrator')
  );

DROP POLICY IF EXISTS "Hub admins revoke grants" ON public.organisation_access_grants;
CREATE POLICY "Hub admins revoke grants"
  ON public.organisation_access_grants FOR UPDATE
  USING (public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_administrator'))
  WITH CHECK (public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_administrator'));
-- Codes are created and redeemed only through the server API (service role).

-- ---------------------------------------------------------------------------
-- 5. Engagement: distinguish viewed / added / placed / assigned / taught
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resource_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  organisation_id TEXT REFERENCES public.organisations(id) ON DELETE SET NULL,
  hub_id TEXT REFERENCES public.music_hubs(id) ON DELETE SET NULL,
  area_code TEXT REFERENCES public.music_hub_areas(code) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'viewed', 'added_to_library', 'placed_in_lesson', 'assigned_to_planner', 'taught_reflected'
  )),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_day DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, resource_id, event_type, event_day)
);

CREATE INDEX IF NOT EXISTS idx_engagement_org ON public.resource_engagement_events (organisation_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.resource_engagement_set_owner()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.organisation_id := (SELECT r.organisation_id FROM public.resources r WHERE r.id = NEW.resource_id);
  NEW.event_day := CURRENT_DATE;
  NEW.created_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resource_engagement_owner ON public.resource_engagement_events;
CREATE TRIGGER trg_resource_engagement_owner
  BEFORE INSERT ON public.resource_engagement_events
  FOR EACH ROW EXECUTE FUNCTION public.resource_engagement_set_owner();

ALTER TABLE public.resource_engagement_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users log own engagement" ON public.resource_engagement_events;
CREATE POLICY "Users log own engagement"
  ON public.resource_engagement_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own engagement" ON public.resource_engagement_events;
CREATE POLICY "Users read own engagement"
  ON public.resource_engagement_events FOR SELECT
  USING (user_id = auth.uid());

-- Contributors see aggregates only; groups of fewer than 3 teachers are suppressed.
CREATE OR REPLACE FUNCTION public.resource_engagement_summary(p_org TEXT, p_days INT DEFAULT 365)
RETURNS TABLE (resource_id TEXT, event_type TEXT, events BIGINT, teachers BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
BEGIN
  IF NOT (public.is_super_admin() OR public.user_has_hub_role(p_org, 'hub_administrator')) THEN
    RAISE EXCEPTION 'Not authorised for this organisation' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT
      e.resource_id,
      e.event_type,
      CASE WHEN COUNT(DISTINCT e.user_id) < 3 THEN NULL ELSE COUNT(*) END::BIGINT,
      CASE WHEN COUNT(DISTINCT e.user_id) < 3 THEN NULL ELSE COUNT(DISTINCT e.user_id) END::BIGINT
    FROM public.resource_engagement_events e
    WHERE e.organisation_id = p_org
      AND e.created_at >= NOW() - make_interval(days => GREATEST(1, LEAST(COALESCE(p_days, 365), 730)))
    GROUP BY e.resource_id, e.event_type;
END;
$$;

REVOKE ALL ON FUNCTION public.resource_engagement_summary(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resource_engagement_summary(TEXT, INT) TO authenticated;
