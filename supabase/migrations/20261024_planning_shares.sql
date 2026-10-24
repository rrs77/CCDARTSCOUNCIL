-- =============================================================================
-- Planning shares (lessons, units, schemes / year overviews)
-- Additive only — new tables; does not alter LessonPrintModal PDF share links.
-- Hierarchy: hub/arts organisation → school → year groups / groups → person.
-- =============================================================================

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
  -- Audience: person | group | school | year_group | hub_org
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

ALTER TABLE public.planning_share_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_shares ENABLE ROW LEVEL SECURITY;

-- Owners manage their resources
DROP POLICY IF EXISTS planning_share_resources_owner_all ON public.planning_share_resources;
CREATE POLICY planning_share_resources_owner_all
  ON public.planning_share_resources
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Recipients can read resources shared with them (person / school / year_group / hub / group)
DROP POLICY IF EXISTS planning_share_resources_shared_read ON public.planning_share_resources;
CREATE POLICY planning_share_resources_shared_read
  ON public.planning_share_resources
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.planning_shares s
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE s.resource_id = planning_share_resources.id
        AND (
          (s.audience_type = 'person' AND s.audience_id = auth.uid()::text)
          OR (s.audience_type = 'school' AND s.audience_id = COALESCE(p.organisation_id, p.school_or_org, ''))
          OR (
            s.audience_type = 'hub_org'
            AND s.audience_id = COALESCE(p.organisation_id, '')
          )
          OR (
            -- Year-group audience: visible to same-school colleagues (finer ACL later)
            s.audience_type = 'year_group'
            AND COALESCE(p.organisation_id, p.school_or_org, '') <> ''
            AND COALESCE(p.organisation_id, p.school_or_org, '') = COALESCE(
              planning_share_resources.organisation_id,
              ''
            )
          )
          OR (
            s.audience_type = 'group'
            AND s.audience_id = COALESCE(p.organisation_id, '')
          )
        )
    )
  );

DROP POLICY IF EXISTS planning_shares_owner_all ON public.planning_shares;
CREATE POLICY planning_shares_owner_all
  ON public.planning_shares
  FOR ALL
  USING (
    shared_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.planning_share_resources r
      WHERE r.id = planning_shares.resource_id AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (shared_by = auth.uid());

DROP POLICY IF EXISTS planning_shares_recipient_read ON public.planning_shares;
CREATE POLICY planning_shares_recipient_read
  ON public.planning_shares
  FOR SELECT
  USING (
    shared_by = auth.uid()
    OR (
      audience_type = 'person' AND audience_id = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          (audience_type = 'school' AND audience_id = COALESCE(p.organisation_id, p.school_or_org, ''))
          OR (audience_type = 'hub_org' AND audience_id = COALESCE(p.organisation_id, ''))
          OR (audience_type = 'year_group')
          OR (audience_type = 'group' AND audience_id = COALESCE(p.organisation_id, ''))
        )
    )
  );

COMMENT ON TABLE public.planning_share_resources IS
  'Shareable planning artefacts (lesson / unit / scheme / year overview). Separate from LessonPrintModal public PDF links.';
COMMENT ON TABLE public.planning_shares IS
  'Audience grants for planning resources: person, group, school, year_group, hub_org with view|copy|edit.';
