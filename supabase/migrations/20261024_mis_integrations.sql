-- =============================================================================
-- School Systems & MIS Integration framework (org-scoped)
-- Additive only — new tables. No live provider credentials or pupil rows.
-- CCDesigner is limited to year_groups.read; pupil scopes never grant to it.
-- Do NOT run against a live DB from this agent run; apply via normal review.
-- =============================================================================

-- Internal Rhythmstix apps that may receive MIS data
CREATE TABLE IF NOT EXISTS public.mis_apps (
  id text PRIMARY KEY CHECK (id IN ('ccdesigner', 'assessify', 'perifeedback', 'periplanner')),
  display_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.mis_apps (id, display_name, description) VALUES
  ('ccdesigner', 'CCDesigner', 'Year groups and school structure for planning only. Never pupil records.'),
  ('assessify', 'Assessify', 'Pupils, year/teaching groups, class membership, teacher assignments.'),
  ('perifeedback', 'PeriFeedback', 'Pupils, year groups, instrumental/vocal lesson assignments, peri teachers, authorised parent contacts.'),
  ('periplanner', 'PeriPlanner', 'Pupil/teacher assignments, timetables, rooms, activities/clubs, conflict detection.')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- Scope catalogue (enforced in DB + application code)
CREATE TABLE IF NOT EXISTS public.mis_scopes (
  id text PRIMARY KEY,
  category text NOT NULL CHECK (category IN (
    'year_groups', 'pupils', 'classes', 'lesson_assignments',
    'parent_contacts', 'timetables', 'activities'
  )),
  description text NOT NULL DEFAULT '',
  -- When true, this scope must never be granted to CCDesigner
  excludes_ccdesigner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.mis_scopes (id, category, description, excludes_ccdesigner) VALUES
  ('year_groups.read', 'year_groups', 'Read year-group / phase structure (Nursery, Reception, Y1–13, custom names, EYFS/KS1–KS5).', false),
  ('pupils.read', 'pupils', 'Read pupil names and IDs.', true),
  ('classes.read', 'classes', 'Read teaching groups / class membership / teacher assignments.', true),
  ('lesson_assignments.read', 'lesson_assignments', 'Read instrumental/vocal lesson assignments and peri teachers.', true),
  ('parent_contacts.read', 'parent_contacts', 'Read parent contacts only where school-authorised (restricted).', true),
  ('timetables.read', 'timetables', 'Read timetables, scheduling and rooms.', true),
  ('activities.read', 'activities', 'Read co-curricular activities/clubs (possibly SOCS).', true)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  excludes_ccdesigner = EXCLUDED.excludes_ccdesigner;

-- Which scopes each app is allowed to request (hard allow-list)
CREATE TABLE IF NOT EXISTS public.mis_app_allowed_scopes (
  app_id text NOT NULL REFERENCES public.mis_apps (id) ON DELETE CASCADE,
  scope_id text NOT NULL REFERENCES public.mis_scopes (id) ON DELETE CASCADE,
  PRIMARY KEY (app_id, scope_id)
);

INSERT INTO public.mis_app_allowed_scopes (app_id, scope_id) VALUES
  ('ccdesigner', 'year_groups.read'),
  ('assessify', 'pupils.read'),
  ('assessify', 'classes.read'),
  ('assessify', 'year_groups.read'),
  ('perifeedback', 'pupils.read'),
  ('perifeedback', 'year_groups.read'),
  ('perifeedback', 'lesson_assignments.read'),
  ('perifeedback', 'parent_contacts.read'),
  ('periplanner', 'pupils.read'),
  ('periplanner', 'timetables.read'),
  ('periplanner', 'activities.read'),
  ('periplanner', 'year_groups.read')
ON CONFLICT (app_id, scope_id) DO NOTHING;

-- Fail closed: CCDesigner may never hold a pupil-excluding scope in allow-list
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.mis_app_allowed_scopes a
    JOIN public.mis_scopes s ON s.id = a.scope_id
    WHERE a.app_id = 'ccdesigner' AND s.excludes_ccdesigner = true
  ) THEN
    RAISE EXCEPTION 'CCDesigner must not be allow-listed for pupil or related scopes';
  END IF;
END $$;

-- Provider catalogue (all UNVERIFIED until official docs + commercial approval)
CREATE TABLE IF NOT EXISTS public.mis_providers (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  kind text NOT NULL DEFAULT 'mis' CHECK (kind IN ('mis', 'hub', 'co_curricular')),
  availability text NOT NULL DEFAULT 'catalogue'
    CHECK (availability IN ('catalogue', 'requestable', 'available', 'unavailable')),
  approval_status text NOT NULL DEFAULT 'unverified'
    CHECK (approval_status IN ('unverified', 'docs_reviewed', 'pending_approval', 'approved', 'declined')),
  notes text NOT NULL DEFAULT '',
  docs_url text,
  is_central_hub boolean NOT NULL DEFAULT false,
  requires_separate_integration boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.mis_providers (
  id, display_name, kind, availability, approval_status, notes, docs_url,
  is_central_hub, requires_separate_integration, sort_order
) VALUES
  (
    'wonde', 'Wonde', 'hub', 'requestable', 'unverified',
    'Central MIS/SIS hub (public docs: https://docs.wonde.com/docs/api/sync/). Year groups via GET /v1.0/schools/{school_id}/groups?type=YEAR. Live auth/sync pending external approval.',
    'https://docs.wonde.com/docs/api/sync/',
    true, false, 10
  ),
  (
    'isams', 'iSAMS', 'mis', 'catalogue', 'unverified',
    'Often reachable via Wonde. Direct integration unverified until official docs + approval.',
    NULL, false, false, 20
  ),
  (
    'sims', 'SIMS', 'mis', 'catalogue', 'unverified',
    'Often reachable via Wonde. Direct integration unverified until official docs + approval.',
    NULL, false, false, 30
  ),
  (
    'arbor', 'Arbor', 'mis', 'catalogue', 'unverified',
    'Often reachable via Wonde. Direct integration unverified until official docs + approval.',
    NULL, false, false, 40
  ),
  (
    'bromcom', 'Bromcom', 'mis', 'catalogue', 'unverified',
    'Often reachable via Wonde. Direct integration unverified until official docs + approval.',
    NULL, false, false, 50
  ),
  (
    'engage', 'Engage', 'mis', 'catalogue', 'unverified',
    'Often reachable via Wonde. Direct integration unverified until official docs + approval.',
    NULL, false, false, 60
  ),
  (
    'wcbs', 'WCBS', 'mis', 'catalogue', 'unverified',
    'Direct integration unverified until official docs + approval.',
    NULL, false, false, 70
  ),
  (
    'schoolbase', 'SchoolBase', 'mis', 'catalogue', 'unverified',
    'Direct integration unverified until official docs + approval.',
    NULL, false, false, 80
  ),
  (
    'socs', 'SOCS', 'co_curricular', 'catalogue', 'unverified',
    'Co-curricular / activities & clubs. May need a separate integration from MIS hubs. Unverified.',
    NULL, false, true, 90
  )
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  kind = EXCLUDED.kind,
  notes = EXCLUDED.notes,
  docs_url = EXCLUDED.docs_url,
  is_central_hub = EXCLUDED.is_central_hub,
  requires_separate_integration = EXCLUDED.requires_separate_integration,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Org-scoped connection (config placeholders only; never invent connected state)
CREATE TABLE IF NOT EXISTS public.mis_org_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id text NOT NULL,
  provider_id text NOT NULL REFERENCES public.mis_providers (id) ON DELETE RESTRICT,
  -- draft | requested | gates_incomplete | ready | connected | revoked | declined
  -- 'connected' requires ALL activation gates; application + trigger enforce this.
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'requested', 'gates_incomplete', 'ready', 'connected', 'revoked', 'declined'
  )),
  -- Secure config placeholders (encrypted secrets live outside this JSON in future vault).
  -- Never store live API tokens here in this phase.
  config_placeholder jsonb NOT NULL DEFAULT '{}'::jsonb,
  school_authorised boolean NOT NULL DEFAULT false,
  last_sync_at timestamptz, -- only set when genuinely connected + sync ran
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, provider_id)
);

CREATE INDEX IF NOT EXISTS mis_org_connections_org_idx
  ON public.mis_org_connections (organisation_id);
CREATE INDEX IF NOT EXISTS mis_org_connections_provider_idx
  ON public.mis_org_connections (provider_id);

-- Activation gates checklist (all must be true before status=connected)
CREATE TABLE IF NOT EXISTS public.mis_activation_gates (
  connection_id uuid NOT NULL REFERENCES public.mis_org_connections (id) ON DELETE CASCADE,
  gate_id text NOT NULL CHECK (gate_id IN (
    'docs_reviewed',
    'api_access_confirmed',
    'commercial_terms_confirmed',
    'provider_approval_confirmed',
    'school_authorised',
    'data_protection_addressed',
    'permitted_categories_configured',
    'app_access_configured',
    'tested_with_test_data'
  )),
  met boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  met_at timestamptz,
  met_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (connection_id, gate_id)
);

-- Per-app granted scopes for a connection (must be subset of mis_app_allowed_scopes)
CREATE TABLE IF NOT EXISTS public.mis_connection_app_scopes (
  connection_id uuid NOT NULL REFERENCES public.mis_org_connections (id) ON DELETE CASCADE,
  app_id text NOT NULL REFERENCES public.mis_apps (id) ON DELETE CASCADE,
  scope_id text NOT NULL REFERENCES public.mis_scopes (id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  PRIMARY KEY (connection_id, app_id, scope_id)
);

CREATE INDEX IF NOT EXISTS mis_connection_app_scopes_app_idx
  ON public.mis_connection_app_scopes (app_id, scope_id);

-- Integration requests (school asks Rhythmstix / provider for access)
CREATE TABLE IF NOT EXISTS public.mis_integration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id text NOT NULL,
  provider_id text NOT NULL REFERENCES public.mis_providers (id) ON DELETE RESTRICT,
  connection_id uuid REFERENCES public.mis_org_connections (id) ON DELETE SET NULL,
  requested_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  requester_name text NOT NULL DEFAULT '',
  requester_email text NOT NULL DEFAULT '',
  school_name text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  requested_apps text[] NOT NULL DEFAULT ARRAY['ccdesigner']::text[],
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'in_review', 'waiting_provider', 'approved', 'declined', 'withdrawn'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mis_integration_requests_org_idx
  ON public.mis_integration_requests (organisation_id, created_at DESC);

-- Org-level year-group mapping (structure only — never pupil IDs)
CREATE TABLE IF NOT EXISTS public.mis_year_group_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id text NOT NULL,
  connection_id uuid REFERENCES public.mis_org_connections (id) ON DELETE SET NULL,
  -- External identifier from provider (e.g. Wonde group id) — placeholder until live sync
  external_id text,
  external_name text NOT NULL DEFAULT '',
  external_code text,
  external_phase text, -- EYFS / KS1 / KS2 / KS3 / KS4 / KS5 / other
  -- Local CCDesigner year group id/name (manual config remains source of truth until accepted)
  local_year_group_id text,
  local_year_group_name text,
  mapping_status text NOT NULL DEFAULT 'suggested' CHECK (mapping_status IN (
    'suggested', 'accepted', 'rejected', 'manual_only', 'conflict'
  )),
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mis_year_group_mappings_org_idx
  ON public.mis_year_group_mappings (organisation_id);
CREATE INDEX IF NOT EXISTS mis_year_group_mappings_connection_idx
  ON public.mis_year_group_mappings (connection_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mis_user_can_manage_org(p_org_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p_org_id IS NOT NULL
    AND p_org_id <> ''
    AND (
      public.current_user_is_full_user_admin()
      OR (
        public.current_user_can_manage_users()
        AND p_org_id = ANY (public.current_user_org_ids())
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
          AND COALESCE(p.organisation_id, p.school_or_org, '') = p_org_id
          AND p.role IN ('admin', 'superuser', 'super_admin', 'organisation')
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.mis_user_in_org(p_org_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p_org_id IS NOT NULL
    AND p_org_id <> ''
    AND (
      public.current_user_is_full_user_admin()
      OR p_org_id = ANY (public.current_user_org_ids())
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND COALESCE(p.organisation_id, p.school_or_org, '') = p_org_id
      )
    );
$$;

-- All activation gates met for a connection?
CREATE OR REPLACE FUNCTION public.mis_connection_all_gates_met(p_connection_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    (
      SELECT COUNT(*) FROM (
        VALUES
          ('docs_reviewed'),
          ('api_access_confirmed'),
          ('commercial_terms_confirmed'),
          ('provider_approval_confirmed'),
          ('school_authorised'),
          ('data_protection_addressed'),
          ('permitted_categories_configured'),
          ('app_access_configured'),
          ('tested_with_test_data')
      ) AS g(gate_id)
    ) = (
      SELECT COUNT(*)
      FROM public.mis_activation_gates ag
      WHERE ag.connection_id = p_connection_id
        AND ag.met = true
    );
$$;

-- Block CCDesigner from receiving excluded scopes; validate allow-list
CREATE OR REPLACE FUNCTION public.mis_validate_connection_app_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  scope_excludes boolean;
  allowed boolean;
BEGIN
  SELECT excludes_ccdesigner INTO scope_excludes
  FROM public.mis_scopes WHERE id = NEW.scope_id;

  IF NEW.app_id = 'ccdesigner' AND COALESCE(scope_excludes, true) THEN
    RAISE EXCEPTION 'CCDesigner cannot be granted scope % (pupil/related data forbidden)', NEW.scope_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.mis_app_allowed_scopes a
    WHERE a.app_id = NEW.app_id AND a.scope_id = NEW.scope_id
  ) INTO allowed;

  IF NOT allowed THEN
    RAISE EXCEPTION 'Scope % is not allow-listed for app %', NEW.scope_id, NEW.app_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mis_connection_app_scopes_validate ON public.mis_connection_app_scopes;
CREATE TRIGGER mis_connection_app_scopes_validate
  BEFORE INSERT OR UPDATE ON public.mis_connection_app_scopes
  FOR EACH ROW EXECUTE FUNCTION public.mis_validate_connection_app_scope();

-- Never mark connected unless all gates met; clear last_sync_at unless connected
CREATE OR REPLACE FUNCTION public.mis_validate_connection_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'connected' AND NOT public.mis_connection_all_gates_met(NEW.id) THEN
    RAISE EXCEPTION 'Cannot set mis_org_connections.status=connected until all activation gates are met';
  END IF;

  IF NEW.status IS DISTINCT FROM 'connected' THEN
    NEW.last_sync_at := NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mis_org_connections_validate ON public.mis_org_connections;
CREATE TRIGGER mis_org_connections_validate
  BEFORE INSERT OR UPDATE ON public.mis_org_connections
  FOR EACH ROW EXECUTE FUNCTION public.mis_validate_connection_status();

-- Seed empty gate rows when a connection is created
CREATE OR REPLACE FUNCTION public.mis_seed_activation_gates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.mis_activation_gates (connection_id, gate_id, met)
  SELECT NEW.id, g.gate_id, false
  FROM (
    VALUES
      ('docs_reviewed'),
      ('api_access_confirmed'),
      ('commercial_terms_confirmed'),
      ('provider_approval_confirmed'),
      ('school_authorised'),
      ('data_protection_addressed'),
      ('permitted_categories_configured'),
      ('app_access_configured'),
      ('tested_with_test_data')
  ) AS g(gate_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mis_org_connections_seed_gates ON public.mis_org_connections;
CREATE TRIGGER mis_org_connections_seed_gates
  AFTER INSERT ON public.mis_org_connections
  FOR EACH ROW EXECUTE FUNCTION public.mis_seed_activation_gates();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.mis_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_app_allowed_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_org_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_activation_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_connection_app_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_integration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_year_group_mappings ENABLE ROW LEVEL SECURITY;

-- Catalogue tables: authenticated read
DROP POLICY IF EXISTS mis_apps_read ON public.mis_apps;
CREATE POLICY mis_apps_read ON public.mis_apps FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS mis_scopes_read ON public.mis_scopes;
CREATE POLICY mis_scopes_read ON public.mis_scopes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS mis_app_allowed_scopes_read ON public.mis_app_allowed_scopes;
CREATE POLICY mis_app_allowed_scopes_read ON public.mis_app_allowed_scopes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS mis_providers_read ON public.mis_providers;
CREATE POLICY mis_providers_read ON public.mis_providers FOR SELECT TO authenticated USING (true);

-- Providers writable only by full admins (catalogue curation)
DROP POLICY IF EXISTS mis_providers_admin_write ON public.mis_providers;
CREATE POLICY mis_providers_admin_write ON public.mis_providers
  FOR ALL TO authenticated
  USING (public.current_user_is_full_user_admin())
  WITH CHECK (public.current_user_is_full_user_admin());

-- Org connections: members can read; managers can write
DROP POLICY IF EXISTS mis_org_connections_select ON public.mis_org_connections;
CREATE POLICY mis_org_connections_select ON public.mis_org_connections
  FOR SELECT TO authenticated
  USING (public.mis_user_in_org(organisation_id));

DROP POLICY IF EXISTS mis_org_connections_insert ON public.mis_org_connections;
CREATE POLICY mis_org_connections_insert ON public.mis_org_connections
  FOR INSERT TO authenticated
  WITH CHECK (public.mis_user_can_manage_org(organisation_id));

DROP POLICY IF EXISTS mis_org_connections_update ON public.mis_org_connections;
CREATE POLICY mis_org_connections_update ON public.mis_org_connections
  FOR UPDATE TO authenticated
  USING (public.mis_user_can_manage_org(organisation_id))
  WITH CHECK (public.mis_user_can_manage_org(organisation_id));

DROP POLICY IF EXISTS mis_org_connections_delete ON public.mis_org_connections;
CREATE POLICY mis_org_connections_delete ON public.mis_org_connections
  FOR DELETE TO authenticated
  USING (public.mis_user_can_manage_org(organisation_id));

-- Gates follow connection org
DROP POLICY IF EXISTS mis_activation_gates_select ON public.mis_activation_gates;
CREATE POLICY mis_activation_gates_select ON public.mis_activation_gates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mis_org_connections c
      WHERE c.id = connection_id AND public.mis_user_in_org(c.organisation_id)
    )
  );

DROP POLICY IF EXISTS mis_activation_gates_write ON public.mis_activation_gates;
CREATE POLICY mis_activation_gates_write ON public.mis_activation_gates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mis_org_connections c
      WHERE c.id = connection_id AND public.mis_user_can_manage_org(c.organisation_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mis_org_connections c
      WHERE c.id = connection_id AND public.mis_user_can_manage_org(c.organisation_id)
    )
  );

-- App scopes follow connection org (+ trigger blocks CCDesigner pupil scopes)
DROP POLICY IF EXISTS mis_connection_app_scopes_select ON public.mis_connection_app_scopes;
CREATE POLICY mis_connection_app_scopes_select ON public.mis_connection_app_scopes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mis_org_connections c
      WHERE c.id = connection_id AND public.mis_user_in_org(c.organisation_id)
    )
  );

DROP POLICY IF EXISTS mis_connection_app_scopes_write ON public.mis_connection_app_scopes;
CREATE POLICY mis_connection_app_scopes_write ON public.mis_connection_app_scopes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mis_org_connections c
      WHERE c.id = connection_id AND public.mis_user_can_manage_org(c.organisation_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mis_org_connections c
      WHERE c.id = connection_id AND public.mis_user_can_manage_org(c.organisation_id)
    )
  );

-- Requests
DROP POLICY IF EXISTS mis_integration_requests_select ON public.mis_integration_requests;
CREATE POLICY mis_integration_requests_select ON public.mis_integration_requests
  FOR SELECT TO authenticated
  USING (public.mis_user_in_org(organisation_id));

DROP POLICY IF EXISTS mis_integration_requests_insert ON public.mis_integration_requests;
CREATE POLICY mis_integration_requests_insert ON public.mis_integration_requests
  FOR INSERT TO authenticated
  WITH CHECK (public.mis_user_can_manage_org(organisation_id));

DROP POLICY IF EXISTS mis_integration_requests_update ON public.mis_integration_requests;
CREATE POLICY mis_integration_requests_update ON public.mis_integration_requests
  FOR UPDATE TO authenticated
  USING (
    public.mis_user_can_manage_org(organisation_id)
    OR public.current_user_is_full_user_admin()
  )
  WITH CHECK (
    public.mis_user_can_manage_org(organisation_id)
    OR public.current_user_is_full_user_admin()
  );

-- Year-group mappings (structure only)
DROP POLICY IF EXISTS mis_year_group_mappings_select ON public.mis_year_group_mappings;
CREATE POLICY mis_year_group_mappings_select ON public.mis_year_group_mappings
  FOR SELECT TO authenticated
  USING (public.mis_user_in_org(organisation_id));

DROP POLICY IF EXISTS mis_year_group_mappings_write ON public.mis_year_group_mappings;
CREATE POLICY mis_year_group_mappings_write ON public.mis_year_group_mappings
  FOR ALL TO authenticated
  USING (public.mis_user_can_manage_org(organisation_id))
  WITH CHECK (public.mis_user_can_manage_org(organisation_id));

COMMENT ON TABLE public.mis_org_connections IS
  'Org-scoped MIS/hub connections. status=connected only when all activation gates are met. No live secrets in this phase.';
COMMENT ON TABLE public.mis_year_group_mappings IS
  'Year-group structure mapping only. Never stores pupil names, IDs, parents, attendance, medical or safeguarding data.';
COMMENT ON TABLE public.mis_connection_app_scopes IS
  'Per-app scopes. CCDesigner is restricted to year_groups.read by trigger + allow-list.';
