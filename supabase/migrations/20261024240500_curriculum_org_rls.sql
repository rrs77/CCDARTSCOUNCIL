-- Org-scoped RLS for curriculum tables (after 20261024240000).
-- Timestamp 20261024240500 — after 240000; avoids MIS 235000/235500 clashes.
-- Own-org organisations SELECT lives only in 240000 (not duplicated here).
-- P2: leftover NULL-org reads only when user_id IS NULL OR user_id = auth.uid().
-- P3 HOLD: half_terms/lesson_plans — owner + org-admin + super_admin (no same-org colleague read yet).
-- Safety net: BEFORE INSERT/UPDATE fills organisation_id from caller's profile when NULL.
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

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- F1: do NOT redefine public.current_user_manages_organisation(text) — that is
-- owned by MIS 235500 (super-admin on any org + 'organisation' role). Use a
-- CCD-local helper for planner curriculum policies instead.
CREATE OR REPLACE FUNCTION public.ccd_current_user_manages_own_org(p_org text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.organisation_id IS NOT DISTINCT FROM p_org
      AND p.status IS DISTINCT FROM 'suspended'
      AND p.anonymised_at IS NULL
      AND (
        lower(COALESCE(p.role, '')) IN ('admin', 'super_admin', 'superuser')
        OR p.can_manage_users IS TRUE
      )
  );
$$;

REVOKE ALL ON FUNCTION public.ccd_current_user_manages_own_org(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ccd_current_user_manages_own_org(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.ccd_current_user_manages_own_org(text) TO authenticated, service_role;

-- Hook for future planning_shares (always false until table exists).
CREATE OR REPLACE FUNCTION private._ccd_planning_share_allows(
  p_org text,
  p_owner uuid,
  p_viewer uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT false;
$$;

REVOKE ALL ON FUNCTION private._ccd_planning_share_allows(text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private._ccd_planning_share_allows(text, uuid, uuid) TO authenticated, service_role;

-- Safety net: fill organisation_id from caller's profile when NULL on write.
-- Skip for super_admin so they can intentionally create shared (NULL-org) rows.
CREATE OR REPLACE FUNCTION private._ccd_fill_organisation_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org text;
BEGIN
  IF NEW.organisation_id IS NULL
     AND auth.uid() IS NOT NULL
     AND NOT public.is_super_admin() THEN
    SELECT p.organisation_id INTO v_org
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status IS DISTINCT FROM 'suspended'
      AND p.anonymised_at IS NULL
      AND p.organisation_id IS NOT NULL;
    IF v_org IS NOT NULL THEN
      NEW.organisation_id := v_org;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_fill_organisation_id() FROM PUBLIC;

CREATE OR REPLACE FUNCTION private._ccd_attach_org_fill_trigger(p_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF to_regclass(format('public.%I', p_table)) IS NULL THEN
    RETURN;
  END IF;
  EXECUTE format(
    'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organisation_id TEXT',
    p_table
  );
  EXECUTE format('DROP TRIGGER IF EXISTS trg_ccd_fill_organisation_id ON public.%I', p_table);
  EXECUTE format(
    'CREATE TRIGGER trg_ccd_fill_organisation_id
       BEFORE INSERT OR UPDATE ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION private._ccd_fill_organisation_id()',
    p_table
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- P2: backfill organisation_id from owner profile (same pattern as 240000)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'activities', 'lessons', 'eyfs_statements', 'half_terms', 'lesson_plans',
    'year_groups', 'category_groups', 'custom_categories',
    'lesson_stacks', 'activity_stacks',
    'custom_objective_year_groups', 'custom_objective_areas', 'custom_objectives',
    'activity_custom_objectives'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organisation_id TEXT', t
    );
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'user_id'
    ) THEN
      EXECUTE format(
        $q$
        UPDATE public.%I AS r
        SET organisation_id = p.organisation_id
        FROM public.profiles p
        WHERE r.organisation_id IS NULL
          AND r.user_id IS NOT NULL
          AND p.id = r.user_id
          AND p.organisation_id IS NOT NULL
        $q$, t
      );
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'created_by'
    ) THEN
      EXECUTE format(
        $q$
        UPDATE public.%I AS r
        SET organisation_id = p.organisation_id
        FROM public.profiles p
        WHERE r.organisation_id IS NULL
          AND r.created_by IS NOT NULL
          AND p.id = r.created_by
          AND p.organisation_id IS NOT NULL
        $q$, t
      );
    END IF;
  END LOOP;

  -- activity_custom_objectives via objective's org when present
  IF to_regclass('public.activity_custom_objectives') IS NOT NULL
     AND to_regclass('public.custom_objectives') IS NOT NULL THEN
    UPDATE public.activity_custom_objectives aco
    SET organisation_id = o.organisation_id
    FROM public.custom_objectives o
    WHERE aco.organisation_id IS NULL
      AND o.id = aco.objective_id
      AND o.organisation_id IS NOT NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Org-scoped unique keys for global name catalogs
-- ---------------------------------------------------------------------------
DO $$
DECLARE n int;
BEGIN
  -- year_groups (organisation_id, name)
  IF to_regclass('public.year_groups') IS NOT NULL THEN
    ALTER TABLE public.year_groups ADD COLUMN IF NOT EXISTS organisation_id TEXT;
    -- Drop legacy global unique on name if present
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.year_groups'::regclass
        AND contype = 'u'
        AND pg_get_constraintdef(oid) ILIKE '%(name)%'
        AND pg_get_constraintdef(oid) NOT ILIKE '%organisation_id%'
    ) THEN
      EXECUTE (
        SELECT format('ALTER TABLE public.year_groups DROP CONSTRAINT %I', conname)
        FROM pg_constraint
        WHERE conrelid = 'public.year_groups'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) ILIKE '%(name)%'
          AND pg_get_constraintdef(oid) NOT ILIKE '%organisation_id%'
        LIMIT 1
      );
    END IF;
    DROP INDEX IF EXISTS public.year_groups_name_key;
    DROP INDEX IF EXISTS public.uq_year_groups_name;
    SELECT COUNT(*) INTO n FROM (
      SELECT organisation_id, name FROM public.year_groups
      GROUP BY organisation_id, name HAVING COUNT(*) > 1
    ) d;
    IF n > 0 THEN
      RAISE EXCEPTION
        'Cannot create uq_year_groups_org_name: % duplicate (organisation_id, name) groups.', n;
    END IF;
    CREATE UNIQUE INDEX IF NOT EXISTS uq_year_groups_org_name
      ON public.year_groups (organisation_id, name) NULLS NOT DISTINCT;
  END IF;

  -- category_groups (organisation_id, name)
  IF to_regclass('public.category_groups') IS NOT NULL THEN
    ALTER TABLE public.category_groups ADD COLUMN IF NOT EXISTS organisation_id TEXT;
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.category_groups'::regclass
        AND contype = 'u'
        AND pg_get_constraintdef(oid) ILIKE '%(name)%'
        AND pg_get_constraintdef(oid) NOT ILIKE '%organisation_id%'
    ) THEN
      EXECUTE (
        SELECT format('ALTER TABLE public.category_groups DROP CONSTRAINT %I', conname)
        FROM pg_constraint
        WHERE conrelid = 'public.category_groups'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) ILIKE '%(name)%'
          AND pg_get_constraintdef(oid) NOT ILIKE '%organisation_id%'
        LIMIT 1
      );
    END IF;
    DROP INDEX IF EXISTS public.category_groups_name_key;
    DROP INDEX IF EXISTS public.uq_category_groups_name;
    SELECT COUNT(*) INTO n FROM (
      SELECT organisation_id, name FROM public.category_groups
      GROUP BY organisation_id, name HAVING COUNT(*) > 1
    ) d;
    IF n > 0 THEN
      RAISE EXCEPTION
        'Cannot create uq_category_groups_org_name: % duplicate (organisation_id, name) groups.', n;
    END IF;
    CREATE UNIQUE INDEX IF NOT EXISTS uq_category_groups_org_name
      ON public.category_groups (organisation_id, name) NULLS NOT DISTINCT;
  END IF;

  -- custom_categories (organisation_id, name)
  IF to_regclass('public.custom_categories') IS NOT NULL THEN
    ALTER TABLE public.custom_categories ADD COLUMN IF NOT EXISTS organisation_id TEXT;
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.custom_categories'::regclass
        AND contype = 'u'
        AND pg_get_constraintdef(oid) ILIKE '%(name)%'
        AND pg_get_constraintdef(oid) NOT ILIKE '%organisation_id%'
    ) THEN
      EXECUTE (
        SELECT format('ALTER TABLE public.custom_categories DROP CONSTRAINT %I', conname)
        FROM pg_constraint
        WHERE conrelid = 'public.custom_categories'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) ILIKE '%(name)%'
          AND pg_get_constraintdef(oid) NOT ILIKE '%organisation_id%'
        LIMIT 1
      );
    END IF;
    DROP INDEX IF EXISTS public.custom_categories_name_key;
    DROP INDEX IF EXISTS public.uq_custom_categories_name;
    SELECT COUNT(*) INTO n FROM (
      SELECT organisation_id, name FROM public.custom_categories
      GROUP BY organisation_id, name HAVING COUNT(*) > 1
    ) d;
    IF n > 0 THEN
      RAISE EXCEPTION
        'Cannot create uq_custom_categories_org_name: % duplicate (organisation_id, name) groups.', n;
    END IF;
    CREATE UNIQUE INDEX IF NOT EXISTS uq_custom_categories_org_name
      ON public.custom_categories (organisation_id, name) NULLS NOT DISTINCT;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Legacy NULL-org SELECT fragment (P2): system rows + own leftovers only
-- ---------------------------------------------------------------------------
--   (organisation_id IS NULL AND (user_id IS NULL OR user_id = auth.uid()))
-- Tables without user_id: system shared = organisation_id IS NULL only.

-- ---------------------------------------------------------------------------
-- activities (P2 tighten NULL-org when user_id present)
-- ---------------------------------------------------------------------------
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccd_activities_select_org_or_system_202610242405" ON public.activities;
CREATE POLICY "ccd_activities_select_org_or_system_202610242405"
  ON public.activities FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      organisation_id IS NULL
      AND (user_id IS NULL OR user_id = auth.uid())
    )
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
-- lessons — org SELECT; owner-only writes (no org-admin overwrite)
-- ---------------------------------------------------------------------------
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccd_lessons_select_org_or_system_202610242405" ON public.lessons;
CREATE POLICY "ccd_lessons_select_org_or_system_202610242405"
  ON public.lessons FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      organisation_id IS NULL
      AND (user_id IS NULL OR user_id = auth.uid())
    )
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
    OR (
      organisation_id IS NULL
      AND (user_id IS NULL OR user_id = auth.uid())
    )
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
-- Helper: apply org RLS. p_mode: 'org' | 'owner_admin'
--   owner_admin = half_terms / lesson_plans (P3 HOLD colleague read)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private._ccd_apply_org_rls(
  p_table text,
  p_mode text DEFAULT 'org'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
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
  has_user boolean;
  null_org_read text;
  write_ok text;
  select_ok text;
BEGIN
  IF to_regclass(format('public.%I', p_table)) IS NULL THEN
    RETURN;
  END IF;
  EXECUTE format(
    'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organisation_id TEXT',
    p_table
  );
  has_user := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = 'user_id'
  );
  IF p_mode = 'owner_admin' AND NOT has_user THEN
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS user_id UUID',
      p_table
    );
    has_user := true;
  END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);

  IF has_user THEN
    null_org_read :=
      '(organisation_id IS NULL AND (user_id IS NULL OR user_id = auth.uid()))';
  ELSE
    null_org_read := '(organisation_id IS NULL)';
  END IF;

  IF p_mode = 'owner_admin' THEN
    -- P3: owner + org admin + super_admin. Same-org colleague READ is HOLD.
    -- To enable same-org colleague read later, add after the owner/admin clause:
    --   OR (organisation_id = caller_org)   -- Rob confirmation required
    -- planning_shares hook already OR'd below (always false until wired).
    select_ok := format(
      $q$
      public.is_super_admin()
      OR %s
      OR (
        (%s)
        AND (
          user_id IS NULL
          OR user_id = auth.uid()
          OR public.ccd_current_user_manages_own_org(organisation_id)
          OR private._ccd_planning_share_allows(organisation_id, user_id, auth.uid())
        )
      )
      $q$, null_org_read, org_eq
    );
    write_ok := format(
      $q$
      public.is_super_admin()
      OR (
        (%s)
        AND (
          user_id IS NULL
          OR user_id = auth.uid()
          OR public.ccd_current_user_manages_own_org(organisation_id)
        )
      )
      $q$, org_eq
    );
  ELSE
    select_ok := format(
      'public.is_super_admin() OR %s OR (%s)',
      null_org_read, org_eq
    );
    write_ok := format(
      'public.is_super_admin() OR (%s)',
      org_eq
    );
  END IF;

  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', sel, p_table);
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)',
    sel, p_table, select_ok
  );

  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', ins, p_table);
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',
    ins, p_table, write_ok
  );

  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', upd, p_table);
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
    upd, p_table, write_ok, write_ok
  );

  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', del, p_table);
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)',
    del, p_table, write_ok
  );
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_apply_org_rls(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_apply_org_rls(text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_apply_org_rls(text, text) TO service_role;

-- Drop old boolean overload from earlier 240500 drafts
DROP FUNCTION IF EXISTS private._ccd_apply_org_rls(text, boolean);

SELECT private._ccd_apply_org_rls('half_terms', 'owner_admin');
SELECT private._ccd_apply_org_rls('lesson_plans', 'owner_admin');
SELECT private._ccd_apply_org_rls('year_groups', 'org');
SELECT private._ccd_apply_org_rls('category_groups', 'org');
SELECT private._ccd_apply_org_rls('custom_categories', 'org');
SELECT private._ccd_apply_org_rls('lesson_stacks', 'org');
SELECT private._ccd_apply_org_rls('activity_stacks', 'org');
SELECT private._ccd_apply_org_rls('custom_objective_year_groups', 'org');
SELECT private._ccd_apply_org_rls('custom_objective_areas', 'org');
SELECT private._ccd_apply_org_rls('custom_objectives', 'org');
SELECT private._ccd_apply_org_rls('activity_custom_objectives', 'org');

-- Attach fill-org trigger to every curriculum table (incl. activities/lessons/eyfs)
SELECT private._ccd_attach_org_fill_trigger('activities');
SELECT private._ccd_attach_org_fill_trigger('lessons');
SELECT private._ccd_attach_org_fill_trigger('eyfs_statements');
SELECT private._ccd_attach_org_fill_trigger('half_terms');
SELECT private._ccd_attach_org_fill_trigger('lesson_plans');
SELECT private._ccd_attach_org_fill_trigger('year_groups');
SELECT private._ccd_attach_org_fill_trigger('category_groups');
SELECT private._ccd_attach_org_fill_trigger('custom_categories');
SELECT private._ccd_attach_org_fill_trigger('lesson_stacks');
SELECT private._ccd_attach_org_fill_trigger('activity_stacks');
SELECT private._ccd_attach_org_fill_trigger('custom_objective_year_groups');
SELECT private._ccd_attach_org_fill_trigger('custom_objective_areas');
SELECT private._ccd_attach_org_fill_trigger('custom_objectives');
SELECT private._ccd_attach_org_fill_trigger('activity_custom_objectives');

-- No anon policies on curriculum tables — public pages must not read curriculum unsigned.
REVOKE ALL ON TABLE public.activities FROM anon;
REVOKE ALL ON TABLE public.lessons FROM anon;
REVOKE ALL ON TABLE public.eyfs_statements FROM anon;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'half_terms', 'lesson_plans', 'year_groups', 'category_groups', 'custom_categories',
    'lesson_stacks', 'activity_stacks',
    'custom_objective_year_groups', 'custom_objective_areas', 'custom_objectives',
    'activity_custom_objectives'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    END IF;
  END LOOP;
END $$;

-- P2b: drop leftover non-ccd_* policies on all 14 curriculum tables (literal underscore).
DO $$
DECLARE
  r record;
  t text;
  tables text[] := ARRAY[
    'activities', 'lessons', 'eyfs_statements',
    'half_terms', 'lesson_plans',
    'year_groups', 'category_groups', 'custom_categories',
    'lesson_stacks', 'activity_stacks',
    'custom_objective_year_groups', 'custom_objective_areas',
    'custom_objectives', 'activity_custom_objectives'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      CONTINUE;
    END IF;
    FOR r IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
        AND policyname NOT LIKE 'ccd\_%' ESCAPE '\'
    LOOP
      RAISE NOTICE 'dropping non-ccd policy %.%', t, r.policyname;
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- For later migrations: fail if any curriculum policy is not named ccd_*.
-- SECURITY INVOKER: callers (migrations / CI as postgres|service_role) use own rights.
CREATE OR REPLACE FUNCTION public.ccd_assert_curriculum_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  bad text;
BEGIN
  SELECT string_agg(format('%I.%I', tablename, policyname), ', ' ORDER BY tablename, policyname)
  INTO bad
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = ANY (ARRAY[
      'activities', 'lessons', 'eyfs_statements',
      'half_terms', 'lesson_plans',
      'year_groups', 'category_groups', 'custom_categories',
      'lesson_stacks', 'activity_stacks',
      'custom_objective_year_groups', 'custom_objective_areas',
      'custom_objectives', 'activity_custom_objectives'
    ])
    AND policyname NOT LIKE 'ccd\_%' ESCAPE '\';
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'non-ccd curriculum policies present: %', bad;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.ccd_assert_curriculum_policies() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ccd_assert_curriculum_policies() TO service_role;

SELECT public.ccd_assert_curriculum_policies();

COMMENT ON POLICY "ccd_lessons_insert_org_owner_202610242405" ON public.lessons IS
  'Own-org insert; user_id must be NULL or auth.uid(). No org-admin edit of colleagues.';
COMMENT ON FUNCTION public.ccd_current_user_manages_own_org(text) IS
  'CCD planner helper: caller is admin/superuser/can_manage_users in the given org. Does not replace MIS current_user_manages_organisation.';
COMMENT ON FUNCTION public.ccd_assert_curriculum_policies() IS
  'Raises if any policy on the 14 curriculum tables is not named ccd_*. Call from later migrations.';
COMMENT ON FUNCTION private._ccd_planning_share_allows(text, uuid, uuid) IS
  'Hook for planning_shares; returns false until shares table is wired.';
