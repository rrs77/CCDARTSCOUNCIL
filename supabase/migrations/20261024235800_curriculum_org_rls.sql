-- Org-scoped RLS for activities / lessons / eyfs_statements.
-- Timestamp 20261024235800 (after 240000; avoids MIS 235500 clashes).
-- App reads system/shared rows with organisation_id IS NULL (activitiesApi.getAll
-- historically loads shared curriculum). Writes require caller's org.
-- Safe to re-run. Do not apply to live DB until the owner reviews.
-- RESTORE_ENABLED stays false in app until review.

-- Ensure anonymised_at exists for profile gates
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anonymised_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Own-org SELECT: also exclude suspended / anonymised (reinforces 240000)
-- Unique policy name — do not reuse MIS 235500 names.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Org members read own organisation" ON public.organisations;
DROP POLICY IF EXISTS "ccd_org_members_read_own_organisation_202610242400" ON public.organisations;
DROP POLICY IF EXISTS "ccd_org_members_read_own_organisation_202610242358" ON public.organisations;
CREATE POLICY "ccd_org_members_read_own_organisation_202610242358"
  ON public.organisations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organisation_id = organisations.id
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

-- ---------------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------------
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccd_activities_select_org_or_system_202610242358" ON public.activities;
CREATE POLICY "ccd_activities_select_org_or_system_202610242358"
  ON public.activities FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR organisation_id IS NULL
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_activities_write_org_202610242358" ON public.activities;
CREATE POLICY "ccd_activities_write_org_202610242358"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_activities_update_org_202610242358" ON public.activities;
CREATE POLICY "ccd_activities_update_org_202610242358"
  ON public.activities FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_activities_delete_org_202610242358" ON public.activities;
CREATE POLICY "ccd_activities_delete_org_202610242358"
  ON public.activities FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

-- ---------------------------------------------------------------------------
-- lessons
-- ---------------------------------------------------------------------------
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccd_lessons_select_org_or_system_202610242358" ON public.lessons;
CREATE POLICY "ccd_lessons_select_org_or_system_202610242358"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR organisation_id IS NULL
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_lessons_insert_org_202610242358" ON public.lessons;
CREATE POLICY "ccd_lessons_insert_org_202610242358"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_lessons_update_org_202610242358" ON public.lessons;
CREATE POLICY "ccd_lessons_update_org_202610242358"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_lessons_delete_org_202610242358" ON public.lessons;
CREATE POLICY "ccd_lessons_delete_org_202610242358"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

-- ---------------------------------------------------------------------------
-- eyfs_statements (app upserts org+sheet only; shared NULL-org rows readable)
-- ---------------------------------------------------------------------------
ALTER TABLE public.eyfs_statements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccd_eyfs_select_org_or_system_202610242358" ON public.eyfs_statements;
CREATE POLICY "ccd_eyfs_select_org_or_system_202610242358"
  ON public.eyfs_statements FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR organisation_id IS NULL
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_eyfs_insert_org_202610242358" ON public.eyfs_statements;
CREATE POLICY "ccd_eyfs_insert_org_202610242358"
  ON public.eyfs_statements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_eyfs_update_org_202610242358" ON public.eyfs_statements;
CREATE POLICY "ccd_eyfs_update_org_202610242358"
  ON public.eyfs_statements FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_eyfs_delete_org_202610242358" ON public.eyfs_statements;
CREATE POLICY "ccd_eyfs_delete_org_202610242358"
  ON public.eyfs_statements FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

COMMENT ON POLICY "ccd_activities_select_org_or_system_202610242358" ON public.activities IS
  'Read own org + system (NULL org) + super_admin. Name unique vs MIS 235500.';
COMMENT ON POLICY "ccd_lessons_select_org_or_system_202610242358" ON public.lessons IS
  'Read own org + system (NULL org) + super_admin. Name unique vs MIS 235500.';
COMMENT ON POLICY "ccd_eyfs_select_org_or_system_202610242358" ON public.eyfs_statements IS
  'Read own org + system (NULL org) + super_admin. Name unique vs MIS 235500.';
