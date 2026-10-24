-- Org-scoped RLS for curriculum tables (after 20261024240000).
-- Timestamp 20261024240500 — after 240000; avoids MIS 235000/235500 clashes.
-- Own-org organisations SELECT lives only in 240000 (not duplicated here).
-- App reads system/shared rows with organisation_id IS NULL where needed.
-- Lessons writes also require user_id IS NULL OR user_id = auth.uid() (no org-admin edit).
-- Safe to re-run. Do not apply to live DB until the owner reviews.
-- RESTORE_ENABLED stays false in app until review.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anonymised_at TIMESTAMPTZ;

-- Drop any draft 235800 policy names if a prior apply left them.
DROP POLICY IF EXISTS "ccd_org_members_read_own_organisation_202610242358" ON public.organisations;
DROP POLICY IF EXISTS "ccd_activities_select_org_or_system_202610242358" ON public.activities;
DROP POLICY IF EXISTS "ccd_activities_write_org_202610242358" ON public.activities;
DROP POLICY IF EXISTS "ccd_activities_update_org_202610242358" ON public.activities;
DROP POLICY IF EXISTS "ccd_activities_delete_org_202610242358" ON public.activities;
DROP POLICY IF EXISTS "ccd_lessons_select_org_or_system_202610242358" ON public.lessons;
DROP POLICY IF EXISTS "ccd_lessons_insert_org_202610242358" ON public.lessons;
DROP POLICY IF EXISTS "ccd_lessons_update_org_202610242358" ON public.lessons;
DROP POLICY IF EXISTS "ccd_lessons_delete_org_202610242358" ON public.lessons;
DROP POLICY IF EXISTS "ccd_eyfs_select_org_or_system_202610242358" ON public.eyfs_statements;
DROP POLICY IF EXISTS "ccd_eyfs_insert_org_202610242358" ON public.eyfs_statements;
DROP POLICY IF EXISTS "ccd_eyfs_update_org_202610242358" ON public.eyfs_statements;
DROP POLICY IF EXISTS "ccd_eyfs_delete_org_202610242358" ON public.eyfs_statements;

-- Caller org helper expression (inlined in policies for clarity / planner stability):
--   (SELECT p.organisation_id FROM public.profiles p
--    WHERE p.id = auth.uid()
--      AND p.status IS DISTINCT FROM 'suspended'
--      AND p.anonymised_at IS NULL)

-- ---------------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------------
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccd_activities_select_org_or_system_202610242405" ON public.activities;
CREATE POLICY "ccd_activities_select_org_or_system_202610242405"
  ON public.activities FOR SELECT TO authenticated
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

DROP POLICY IF EXISTS "ccd_activities_insert_org_202610242405" ON public.activities;
CREATE POLICY "ccd_activities_insert_org_202610242405"
  ON public.activities FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_activities_update_org_202610242405" ON public.activities;
CREATE POLICY "ccd_activities_update_org_202610242405"
  ON public.activities FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS "ccd_activities_delete_org_202610242405" ON public.activities;
CREATE POLICY "ccd_activities_delete_org_202610242405"
  ON public.activities FOR DELETE TO authenticated
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
-- lessons — org-scoped + owner user_id (colleagues cannot overwrite)
-- ---------------------------------------------------------------------------
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccd_lessons_select_org_or_system_202610242405" ON public.lessons;
CREATE POLICY "ccd_lessons_select_org_or_system_202610242405"
  ON public.lessons FOR SELECT TO authenticated
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

DROP POLICY IF EXISTS "ccd_lessons_insert_org_owner_202610242405" ON public.lessons;
CREATE POLICY "ccd_lessons_insert_org_owner_202610242405"
  ON public.lessons FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
      AND (user_id IS NULL OR user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "ccd_lessons_update_org_owner_202610242405" ON public.lessons;
CREATE POLICY "ccd_lessons_update_org_owner_202610242405"
  ON public.lessons FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
      AND (user_id IS NULL OR user_id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
      AND (user_id IS NULL OR user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "ccd_lessons_delete_org_owner_202610242405" ON public.lessons;
CREATE POLICY "ccd_lessons_delete_org_owner_202610242405"
  ON public.lessons FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
      AND (user_id IS NULL OR user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- eyfs_statements
-- ---------------------------------------------------------------------------
ALTER TABLE public.eyfs_statements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccd_eyfs_select_org_or_system_202610242405" ON public.eyfs_statements;
CREATE POLICY "ccd_eyfs_select_org_or_system_202610242405"
  ON public.eyfs_statements FOR SELECT TO authenticated
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

DROP POLICY IF EXISTS "ccd_eyfs_insert_org_202610242405" ON public.eyfs_statements;
CREATE POLICY "ccd_eyfs_insert_org_202610242405"
  ON public.eyfs_statements FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ccd_eyfs_update_org_202610242405" ON public.eyfs_statements;
CREATE POLICY "ccd_eyfs_update_org_202610242405"
  ON public.eyfs_statements FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS "ccd_eyfs_delete_org_202610242405" ON public.eyfs_statements;
CREATE POLICY "ccd_eyfs_delete_org_202610242405"
  ON public.eyfs_statements FOR DELETE TO authenticated
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
-- Helper: apply standard org (+ optional user_id owner) RLS to a table
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private._ccd_apply_org_rls(
  p_table text,
  p_owner_user boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  -- Short stamp (_2405) keeps policy names under PG's 63-char identifier limit.
  sel text := format('ccd_%s_select_org_or_system_2405', p_table);
  ins text := format('ccd_%s_insert_org_2405', p_table);
  upd text := format('ccd_%s_update_org_2405', p_table);
  del text := format('ccd_%s_delete_org_2405', p_table);
  org_eq text := $q$
    organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  $q$;
  owner_and text := CASE WHEN p_owner_user THEN
    ' AND (user_id IS NULL OR user_id = auth.uid())'
  ELSE '' END;
BEGIN
  IF to_regclass(format('public.%I', p_table)) IS NULL THEN
    RETURN;
  END IF;
  EXECUTE format(
    'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organisation_id TEXT',
    p_table
  );
  IF p_owner_user THEN
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS user_id UUID',
      p_table
    );
  END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);

  -- SELECT: org or system. When owner-scoped (half_terms/lesson_plans), also
  -- require user_id IS NULL OR user_id = auth.uid() so colleagues cannot read
  -- each other's rows (planner half_terms leak).
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', sel, p_table);
  IF p_owner_user THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (
         public.is_super_admin()
         OR organisation_id IS NULL
         OR ((%s) AND (user_id IS NULL OR user_id = auth.uid()))
       )',
      sel, p_table, org_eq
    );
  ELSE
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (
         public.is_super_admin() OR organisation_id IS NULL OR (%s)
       )',
      sel, p_table, org_eq
    );
  END IF;

  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', ins, p_table);
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (
       public.is_super_admin() OR ((%s)%s)
     )',
    ins, p_table, org_eq, owner_and
  );

  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', upd, p_table);
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (
       public.is_super_admin() OR ((%s)%s)
     ) WITH CHECK (
       public.is_super_admin() OR ((%s)%s)
     )',
    upd, p_table, org_eq, owner_and, org_eq, owner_and
  );

  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', del, p_table);
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (
       public.is_super_admin() OR ((%s)%s)
     )',
    del, p_table, org_eq, owner_and
  );
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_apply_org_rls(text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_apply_org_rls(text, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_apply_org_rls(text, boolean) TO service_role;

-- half_terms: org + owner user_id (planner leak fix — no cross-user read/write within org via RLS;
-- SELECT still org-wide for shared planning unless user_id filters in app; write is owner-scoped)
SELECT private._ccd_apply_org_rls('half_terms', true);
SELECT private._ccd_apply_org_rls('lesson_plans', true);
SELECT private._ccd_apply_org_rls('year_groups', false);
SELECT private._ccd_apply_org_rls('category_groups', false);
SELECT private._ccd_apply_org_rls('custom_categories', false);
SELECT private._ccd_apply_org_rls('lesson_stacks', false);
SELECT private._ccd_apply_org_rls('activity_stacks', false);
SELECT private._ccd_apply_org_rls('custom_objective_year_groups', false);
SELECT private._ccd_apply_org_rls('custom_objective_areas', false);
SELECT private._ccd_apply_org_rls('custom_objectives', false);
SELECT private._ccd_apply_org_rls('activity_custom_objectives', false);

-- No anon policies on curriculum tables — app fail-closed without auth for lesson/half-term reads.
REVOKE ALL ON TABLE public.activities FROM anon;
REVOKE ALL ON TABLE public.lessons FROM anon;
REVOKE ALL ON TABLE public.eyfs_statements FROM anon;
DO $$
BEGIN
  IF to_regclass('public.half_terms') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON TABLE public.half_terms FROM anon';
  END IF;
END $$;

COMMENT ON POLICY "ccd_lessons_insert_org_owner_202610242405" ON public.lessons IS
  'Own-org insert; user_id must be NULL or auth.uid(). No org-admin edit of colleagues. Unique vs MIS 235000/235500.';
