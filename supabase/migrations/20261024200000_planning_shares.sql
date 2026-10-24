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

-- Explicit group membership (audience_type = 'group' / audience_id = group_id).
-- Replaces the previous org_id-as-group shortcut which granted org-wide access.
CREATE TABLE IF NOT EXISTS public.planning_group_members (
  group_id text NOT NULL,
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
ALTER TABLE public.planning_group_members ENABLE ROW LEVEL SECURITY;

-- Members can see their own membership rows; owners of a group (same org, later)
-- are out of scope — insert/update via service role or a follow-up admin path.
DROP POLICY IF EXISTS planning_group_members_self_read ON public.planning_group_members;
CREATE POLICY planning_group_members_self_read
  ON public.planning_group_members
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS planning_group_members_self_all ON public.planning_group_members;
CREATE POLICY planning_group_members_self_all
  ON public.planning_group_members
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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
          OR (
            s.audience_type = 'school'
            AND COALESCE(p.organisation_id, p.school_or_org, '') <> ''
            AND s.audience_id = COALESCE(p.organisation_id, p.school_or_org, '')
          )
          OR (
            s.audience_type = 'hub_org'
            AND COALESCE(p.organisation_id, '') <> ''
            AND s.audience_id = p.organisation_id
          )
          OR (
            -- Year-group: only same-organisation users (resource.organisation_id must be set)
            s.audience_type = 'year_group'
            AND COALESCE(planning_share_resources.organisation_id, '') <> ''
            AND COALESCE(p.organisation_id, p.school_or_org, '') <> ''
            AND COALESCE(p.organisation_id, p.school_or_org, '')
              = planning_share_resources.organisation_id
          )
          OR (
            s.audience_type = 'group'
            AND EXISTS (
              SELECT 1
              FROM public.planning_group_members m
              WHERE m.group_id = s.audience_id
                AND m.user_id = auth.uid()
            )
          )
        )
    )
  );

-- Only resource owners may manage share grants (USING + WITH CHECK both require ownership)
DROP POLICY IF EXISTS planning_shares_owner_all ON public.planning_shares;
CREATE POLICY planning_shares_owner_all
  ON public.planning_shares
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.planning_share_resources r
      WHERE r.id = planning_shares.resource_id AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.planning_share_resources r
      WHERE r.id = resource_id AND r.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS planning_shares_recipient_read ON public.planning_shares;
CREATE POLICY planning_shares_recipient_read
  ON public.planning_shares
  FOR SELECT
  USING (
    (
      audience_type = 'person' AND audience_id = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          (
            audience_type = 'school'
            AND COALESCE(p.organisation_id, p.school_or_org, '') <> ''
            AND audience_id = COALESCE(p.organisation_id, p.school_or_org, '')
          )
          OR (
            audience_type = 'hub_org'
            AND COALESCE(p.organisation_id, '') <> ''
            AND audience_id = p.organisation_id
          )
          OR (
            -- Year-group shares: require matching organisation on the resource
            audience_type = 'year_group'
            AND EXISTS (
              SELECT 1
              FROM public.planning_share_resources r
              WHERE r.id = planning_shares.resource_id
                AND COALESCE(r.organisation_id, '') <> ''
                AND COALESCE(p.organisation_id, p.school_or_org, '') <> ''
                AND COALESCE(p.organisation_id, p.school_or_org, '') = r.organisation_id
            )
          )
          OR (
            audience_type = 'group'
            AND EXISTS (
              SELECT 1
              FROM public.planning_group_members m
              WHERE m.group_id = audience_id
                AND m.user_id = auth.uid()
            )
          )
        )
    )
  );

COMMENT ON TABLE public.planning_share_resources IS
  'Shareable planning artefacts (lesson / unit / scheme / year overview). Separate from LessonPrintModal public PDF links.';
COMMENT ON TABLE public.planning_shares IS
  'Audience grants for planning resources: person, group, school, year_group, hub_org with view|copy|edit.';
COMMENT ON TABLE public.planning_group_members IS
  'Membership for planning share audience_type=group; RLS: users see/manage only their own rows.';
