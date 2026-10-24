-- 20261024240000_restore_cross_org_guards.sql
-- Before RESTORE_ENABLED is flipped on: cross-org id guards (42501), org-scoped
-- natural-key unique indexes + ON CONFLICT targets, in-org FK checks, GRANT.
-- Keep WHERE t.organisation_id = v_org on every DO UPDATE.


-- Cross-org restore guards (before re-enabling RESTORE_ENABLED).
-- Safe to re-run. Do not apply to live DB until the owner reviews.

-- (e) service_role full access to private snapshot table
DO $$
BEGIN
  IF to_regclass('public.curriculum_backups') IS NOT NULL THEN
    EXECUTE 'GRANT ALL ON TABLE public.curriculum_backups TO service_role';
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL; -- role missing on non-Supabase scratch DBs
  WHEN undefined_table THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- (b) Org-scoped unique indexes for natural keys
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  -- Drop non-org unique constraints that match the natural-key shapes we replace.
  FOR r IN
    SELECT c.conname, t.relname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname IN ('activities', 'lessons', 'eyfs_statements', 'activity_custom_objectives')
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) !~* 'organisation_id'
      AND (
        (t.relname = 'activities' AND pg_get_constraintdef(c.oid) ~* 'activity'
          AND pg_get_constraintdef(c.oid) ~* 'category'
          AND pg_get_constraintdef(c.oid) ~* 'lesson_number')
        OR (t.relname IN ('lessons', 'eyfs_statements')
          AND pg_get_constraintdef(c.oid) ~* 'sheet_name')
        OR (t.relname = 'activity_custom_objectives'
          AND pg_get_constraintdef(c.oid) ~* 'activity_id'
          AND pg_get_constraintdef(c.oid) ~* 'objective_id')
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.relname, r.conname);
  END LOOP;

  FOR r IN
    SELECT i.relname AS idxname, t.relname AS tbl
    FROM pg_index x
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_class t ON t.oid = x.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname IN ('activities', 'lessons', 'eyfs_statements', 'activity_custom_objectives')
      AND x.indisunique
      AND NOT x.indisprimary
      AND pg_get_indexdef(x.indexrelid) !~* 'organisation_id'
      AND (
        pg_get_indexdef(x.indexrelid) ~* '\(activity[, ]'
        OR pg_get_indexdef(x.indexrelid) ~* '\(sheet_name'
        OR pg_get_indexdef(x.indexrelid) ~* 'activity_id'
      )
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.idxname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_activities_org_natural
  ON public.activities (organisation_id, activity, category, lesson_number);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lessons_org_sheet
  ON public.lessons (organisation_id, sheet_name);

CREATE UNIQUE INDEX IF NOT EXISTS uq_eyfs_statements_org_sheet
  ON public.eyfs_statements (organisation_id, sheet_name);

DO $$
BEGIN
  IF to_regclass('public.activity_custom_objectives') IS NOT NULL THEN
    EXECUTE $i$
      CREATE UNIQUE INDEX IF NOT EXISTS uq_activity_custom_objectives_org_pair
        ON public.activity_custom_objectives (organisation_id, activity_id, objective_id)
    $i$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Guard helpers (SECURITY DEFINER, service_role via restore RPC only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._restore_assert_ids_in_org(
  p_payload jsonb,
  p_key text,
  p_table text,
  p_org text,
  p_uuid boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sql text;
  v_hit boolean := false;
BEGIN
  IF p_payload IS NULL OR NOT (p_payload ? p_key) OR jsonb_typeof(p_payload->p_key) <> 'array' THEN
    RETURN;
  END IF;
  IF p_uuid THEN
    v_sql := format(
      $q$
      SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements($1->%L) r
        JOIN public.%I t ON t.id = NULLIF(r->>'id', '')::uuid
        WHERE NULLIF(r->>'id', '') IS NOT NULL
          AND t.organisation_id IS DISTINCT FROM $2
      )
      $q$, p_key, p_table
    );
  ELSE
    v_sql := format(
      $q$
      SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements($1->%L) r
        JOIN public.%I t ON t.id::text = NULLIF(r->>'id', '')
        WHERE NULLIF(r->>'id', '') IS NOT NULL
          AND t.organisation_id IS DISTINCT FROM $2
      )
      $q$, p_key, p_table
    );
  END IF;
  EXECUTE v_sql INTO v_hit USING p_payload, p_org;
  IF v_hit THEN
    RAISE EXCEPTION 'cross-org id conflict in %', p_table USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._restore_assert_activity_natural_keys(
  p_payload jsonb,
  p_org text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_payload IS NULL OR NOT (p_payload ? 'activities')
     OR jsonb_typeof(p_payload->'activities') <> 'array' THEN
    RETURN;
  END IF;
  -- With org-scoped unique indexes, same natural key in another org is allowed.
  -- Still raise if a matching row would be updated only via a legacy global unique
  -- (organisation_id IS DISTINCT FROM p_org). Defence in depth: no-op when indexes are correct.
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_payload->'activities') r
    JOIN public.activities a
      ON a.activity = r->>'activity'
     AND a.category = r->>'category'
     AND a.lesson_number IS NOT DISTINCT FROM NULLIF(r->>'lesson_number', '')
    WHERE COALESCE(r->>'activity', '') <> ''
      AND COALESCE(r->>'category', '') <> ''
      AND a.organisation_id IS DISTINCT FROM p_org
      -- Only treat as conflict when there is NO org-scoped unique yet protecting us:
      -- if the row's org differs, restoring must not touch it; raise so callers notice
      -- payloads that collide on the old global key shape while a global unique still exists.
      AND NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = 'uq_activities_org_natural'
      )
  ) THEN
    RAISE EXCEPTION 'cross-org natural key conflict in activities' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._restore_assert_sheet_natural_keys(
  p_payload jsonb,
  p_key text,
  p_table text,
  p_org text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_idx text;
  v_sql text;
  v_hit boolean := false;
BEGIN
  IF p_payload IS NULL OR NOT (p_payload ? p_key) OR jsonb_typeof(p_payload->p_key) <> 'array' THEN
    RETURN;
  END IF;
  v_idx := CASE p_table
    WHEN 'lessons' THEN 'uq_lessons_org_sheet'
    WHEN 'eyfs_statements' THEN 'uq_eyfs_statements_org_sheet'
    ELSE NULL
  END;
  -- Only raise when org-scoped unique is missing (legacy global sheet_name unique).
  IF v_idx IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = v_idx
  ) THEN
    RETURN;
  END IF;
  v_sql := format(
    $q$
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements($1->%L) r
      JOIN public.%I t ON t.sheet_name = r->>'sheet_name'
      WHERE COALESCE(r->>'sheet_name', '') <> ''
        AND t.organisation_id IS DISTINCT FROM $2
    )
    $q$, p_key, p_table
  );
  EXECUTE v_sql INTO v_hit USING p_payload, p_org;
  IF v_hit THEN
    RAISE EXCEPTION 'cross-org natural key conflict in %', p_table USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._restore_assert_aco_natural_keys(
  p_payload jsonb,
  p_org text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_payload IS NULL OR NOT (p_payload ? 'activityCustomObjectives')
     OR jsonb_typeof(p_payload->'activityCustomObjectives') <> 'array' THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'uq_activity_custom_objectives_org_pair'
  ) THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_payload->'activityCustomObjectives') r
    JOIN public.activity_custom_objectives t
      ON t.activity_id = NULLIF(r->>'activity_id', '')::uuid
     AND t.objective_id = NULLIF(r->>'objective_id', '')::uuid
    WHERE NULLIF(r->>'activity_id', '') IS NOT NULL
      AND NULLIF(r->>'objective_id', '') IS NOT NULL
      AND t.organisation_id IS DISTINCT FROM p_org
  ) THEN
    RAISE EXCEPTION 'cross-org natural key conflict in activity_custom_objectives'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._restore_assert_area_year_groups_in_org(
  p_payload jsonb,
  p_org text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_payload IS NULL OR NOT (p_payload ? 'customObjectiveAreas')
     OR jsonb_typeof(p_payload->'customObjectiveAreas') <> 'array' THEN
    RETURN;
  END IF;
  -- Reject year_group_id owned by another org
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_payload->'customObjectiveAreas') r
    JOIN public.custom_objective_year_groups yg
      ON yg.id = NULLIF(r->>'year_group_id', '')::uuid
    WHERE NULLIF(r->>'year_group_id', '') IS NOT NULL
      AND yg.organisation_id IS DISTINCT FROM p_org
  ) THEN
    RAISE EXCEPTION 'custom_objective_areas.year_group_id not in organisation'
      USING ERRCODE = '42501';
  END IF;
  -- Reject unknown year_group_id (not in v_org and not in this payload's year groups)
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_payload->'customObjectiveAreas') r
    WHERE NULLIF(r->>'year_group_id', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.custom_objective_year_groups yg
        WHERE yg.id = NULLIF(r->>'year_group_id', '')::uuid
          AND yg.organisation_id = p_org
      )
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p_payload->'customObjectiveYearGroups', '[]'::jsonb)) y
        WHERE NULLIF(y->>'id', '') = r->>'year_group_id'
      )
  ) THEN
    RAISE EXCEPTION 'custom_objective_areas.year_group_id not in organisation'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._restore_assert_aco_refs_in_org(
  p_payload jsonb,
  p_org text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_payload IS NULL OR NOT (p_payload ? 'activityCustomObjectives')
     OR jsonb_typeof(p_payload->'activityCustomObjectives') <> 'array' THEN
    RETURN;
  END IF;

  -- objective_id must not belong to another org; must be in v_org or payload
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_payload->'activityCustomObjectives') r
    JOIN public.custom_objectives o ON o.id = NULLIF(r->>'objective_id', '')::uuid
    WHERE NULLIF(r->>'objective_id', '') IS NOT NULL
      AND o.organisation_id IS DISTINCT FROM p_org
  ) THEN
    RAISE EXCEPTION 'activity_custom_objectives.objective_id not in organisation'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_payload->'activityCustomObjectives') r
    WHERE NULLIF(r->>'objective_id', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.custom_objectives o
        WHERE o.id = NULLIF(r->>'objective_id', '')::uuid
          AND o.organisation_id = p_org
      )
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p_payload->'customObjectives', '[]'::jsonb)) o
        WHERE NULLIF(o->>'id', '') = r->>'objective_id'
      )
  ) THEN
    RAISE EXCEPTION 'activity_custom_objectives.objective_id not in organisation'
      USING ERRCODE = '42501';
  END IF;

  -- activity_id: if activities.id exists and row found, must be v_org; else allow payload ids
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'id'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_payload->'activityCustomObjectives') r
      JOIN public.activities a ON a.id::text = NULLIF(r->>'activity_id', '')
      WHERE NULLIF(r->>'activity_id', '') IS NOT NULL
        AND a.organisation_id IS DISTINCT FROM p_org
    ) THEN
      RAISE EXCEPTION 'activity_custom_objectives.activity_id not in organisation'
        USING ERRCODE = '42501';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_payload->'activityCustomObjectives') r
      WHERE NULLIF(r->>'activity_id', '') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.activities a
          WHERE a.id::text = NULLIF(r->>'activity_id', '')
            AND a.organisation_id = p_org
        )
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(p_payload->'activities', '[]'::jsonb)) a
          WHERE NULLIF(a->>'id', '') = r->>'activity_id'
        )
    ) THEN
      RAISE EXCEPTION 'activity_custom_objectives.activity_id not in organisation'
        USING ERRCODE = '42501';
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public._restore_assert_ids_in_org(jsonb, text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._restore_assert_activity_natural_keys(jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._restore_assert_sheet_natural_keys(jsonb, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._restore_assert_aco_natural_keys(jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._restore_assert_area_year_groups_in_org(jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._restore_assert_aco_refs_in_org(jsonb, text) FROM PUBLIC;


CREATE OR REPLACE FUNCTION public.restore_curriculum_backup(
  p_payload jsonb,
  p_organisation_id text DEFAULT NULL,
  p_dry_run boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_counts jsonb := '{}'::jsonb;
  v_n int;
  v_org text := NULLIF(trim(COALESCE(p_organisation_id, '')), '');
BEGIN
  IF v_org IS NULL OR v_org !~ '^[A-Za-z0-9_-]{1,64}$' THEN
    RAISE EXCEPTION 'organisation_id required' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = v_org) THEN
    RAISE EXCEPTION 'organisation_id not found' USING ERRCODE = '22023';
  END IF;

  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid payload' USING ERRCODE = '22023';
  END IF;


  -- (a) Cross-org id guards: payload id must not belong to another org
  PERFORM public._restore_assert_ids_in_org(p_payload, 'yearGroups', 'year_groups', v_org, false);
  PERFORM public._restore_assert_ids_in_org(p_payload, 'categoryGroups', 'category_groups', v_org, false);
  PERFORM public._restore_assert_ids_in_org(p_payload, 'customCategories', 'custom_categories', v_org, false);
  PERFORM public._restore_assert_ids_in_org(p_payload, 'halfTerms', 'half_terms', v_org, false);
  PERFORM public._restore_assert_ids_in_org(p_payload, 'lessonPlans', 'lesson_plans', v_org, false);
  PERFORM public._restore_assert_ids_in_org(p_payload, 'lessonStacks', 'lesson_stacks', v_org, false);
  PERFORM public._restore_assert_ids_in_org(p_payload, 'activityStacks', 'activity_stacks', v_org, false);
  IF to_regclass('public.custom_objective_year_groups') IS NOT NULL THEN
    PERFORM public._restore_assert_ids_in_org(p_payload, 'customObjectiveYearGroups', 'custom_objective_year_groups', v_org, true);
  END IF;
  IF to_regclass('public.custom_objective_areas') IS NOT NULL THEN
    PERFORM public._restore_assert_ids_in_org(p_payload, 'customObjectiveAreas', 'custom_objective_areas', v_org, true);
  END IF;
  IF to_regclass('public.custom_objectives') IS NOT NULL THEN
    PERFORM public._restore_assert_ids_in_org(p_payload, 'customObjectives', 'custom_objectives', v_org, true);
  END IF;

  -- (b) Natural-key cross-org guards (defence in depth alongside org-scoped unique indexes)
  PERFORM public._restore_assert_activity_natural_keys(p_payload, v_org);
  PERFORM public._restore_assert_sheet_natural_keys(p_payload, 'lessons', 'lessons', v_org);
  PERFORM public._restore_assert_sheet_natural_keys(p_payload, 'standards', 'eyfs_statements', v_org);
  IF to_regclass('public.activity_custom_objectives') IS NOT NULL THEN
    PERFORM public._restore_assert_aco_natural_keys(p_payload, v_org);
  END IF;

  -- (c) In-org FK-ish references
  IF to_regclass('public.custom_objective_areas') IS NOT NULL THEN
    PERFORM public._restore_assert_area_year_groups_in_org(p_payload, v_org);
  END IF;
  IF to_regclass('public.activity_custom_objectives') IS NOT NULL THEN
    PERFORM public._restore_assert_aco_refs_in_org(p_payload, v_org);
  END IF;


  -- year_groups
  IF p_payload ? 'yearGroups' AND jsonb_typeof(p_payload->'yearGroups') = 'array' THEN
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'yearGroups', jsonb_array_length(p_payload->'yearGroups')
      );
    ELSE
      DELETE FROM public.year_groups WHERE organisation_id = v_org;
      INSERT INTO public.year_groups AS t (id, name, sort_order, organisation_id)
      SELECT
        COALESCE(NULLIF(r->>'id', ''), gen_random_uuid()::text),
        r->>'name',
        NULLIF(r->>'sort_order', '')::int,
        v_org
      FROM jsonb_array_elements(p_payload->'yearGroups') r
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            sort_order = COALESCE(EXCLUDED.sort_order, t.sort_order),
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('yearGroups', v_n);
    END IF;
  END IF;

  IF p_payload ? 'categoryGroups' AND jsonb_typeof(p_payload->'categoryGroups') = 'array' THEN
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'categoryGroups', jsonb_array_length(p_payload->'categoryGroups')
      );
    ELSE
      DELETE FROM public.category_groups WHERE organisation_id = v_org;
      INSERT INTO public.category_groups AS t (id, name, sort_order, organisation_id)
      SELECT
        COALESCE(NULLIF(r->>'id', ''), gen_random_uuid()::text),
        r->>'name',
        NULLIF(r->>'sort_order', '')::int,
        v_org
      FROM jsonb_array_elements(p_payload->'categoryGroups') r
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            sort_order = COALESCE(EXCLUDED.sort_order, t.sort_order),
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('categoryGroups', v_n);
    END IF;
  END IF;

  IF p_payload ? 'customCategories' AND jsonb_typeof(p_payload->'customCategories') = 'array' THEN
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'customCategories', jsonb_array_length(p_payload->'customCategories')
      );
    ELSE
      DELETE FROM public.custom_categories WHERE organisation_id = v_org;
      INSERT INTO public.custom_categories AS t (id, name, color, sort_order, organisation_id)
      SELECT
        COALESCE(NULLIF(r->>'id', ''), gen_random_uuid()::text),
        r->>'name',
        r->>'color',
        NULLIF(r->>'sort_order', '')::int,
        v_org
      FROM jsonb_array_elements(p_payload->'customCategories') r
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            color = COALESCE(EXCLUDED.color, t.color),
            sort_order = COALESCE(EXCLUDED.sort_order, t.sort_order),
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('customCategories', v_n);
    END IF;
  END IF;

  IF p_payload ? 'activities' AND jsonb_typeof(p_payload->'activities') = 'array' THEN
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'activities', jsonb_array_length(p_payload->'activities')
      );
    ELSE
      DELETE FROM public.activities WHERE organisation_id = v_org;
      INSERT INTO public.activities AS t (
        activity, description, activity_text, time,
        video_link, music_link, backing_link, resource_link, link,
        vocals_link, image_link, canva_link,
        teaching_unit, category, level, unit_name, lesson_number, eyfs_standards,
        organisation_id
      )
      SELECT
        r->>'activity',
        r->>'description',
        r->>'activity_text',
        NULLIF(r->>'time', '')::numeric,
        r->>'video_link',
        r->>'music_link',
        r->>'backing_link',
        r->>'resource_link',
        r->>'link',
        r->>'vocals_link',
        r->>'image_link',
        COALESCE(r->>'canva_link', ''),
        r->>'teaching_unit',
        r->>'category',
        r->>'level',
        r->>'unit_name',
        r->>'lesson_number',
        CASE
          WHEN jsonb_typeof(r->'eyfs_standards') = 'array' THEN
            ARRAY(SELECT jsonb_array_elements_text(r->'eyfs_standards'))
          ELSE NULL
        END,
        v_org
      FROM jsonb_array_elements(p_payload->'activities') r
      WHERE COALESCE(r->>'activity', '') <> ''
        AND COALESCE(r->>'category', '') <> ''
      ON CONFLICT (organisation_id, activity, category, lesson_number) DO UPDATE
        SET description = EXCLUDED.description,
            activity_text = EXCLUDED.activity_text,
            time = EXCLUDED.time,
            video_link = EXCLUDED.video_link,
            music_link = EXCLUDED.music_link,
            backing_link = EXCLUDED.backing_link,
            resource_link = EXCLUDED.resource_link,
            link = EXCLUDED.link,
            vocals_link = EXCLUDED.vocals_link,
            image_link = EXCLUDED.image_link,
            canva_link = EXCLUDED.canva_link,
            teaching_unit = EXCLUDED.teaching_unit,
            level = EXCLUDED.level,
            unit_name = EXCLUDED.unit_name,
            eyfs_standards = EXCLUDED.eyfs_standards,
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('activities', v_n);
    END IF;
  END IF;

  IF p_payload ? 'lessons' AND jsonb_typeof(p_payload->'lessons') = 'array' THEN
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'lessons', jsonb_array_length(p_payload->'lessons')
      );
    ELSE
      DELETE FROM public.lessons WHERE organisation_id = v_org;
      INSERT INTO public.lessons AS t (sheet_name, data, lesson_numbers, teaching_units, organisation_id)
      SELECT
        r->>'sheet_name',
        COALESCE(r->'data', '{}'::jsonb),
        COALESCE(r->'lesson_numbers', '[]'::jsonb),
        COALESCE(r->'teaching_units', '[]'::jsonb),
        v_org
      FROM jsonb_array_elements(p_payload->'lessons') r
      WHERE COALESCE(r->>'sheet_name', '') <> ''
      ON CONFLICT (organisation_id, sheet_name) DO UPDATE
        SET data = EXCLUDED.data,
            lesson_numbers = EXCLUDED.lesson_numbers,
            teaching_units = EXCLUDED.teaching_units,
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('lessons', v_n);
    END IF;
  END IF;

  IF p_payload ? 'standards' AND jsonb_typeof(p_payload->'standards') = 'array' THEN
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'standards', jsonb_array_length(p_payload->'standards')
      );
    ELSE
      DELETE FROM public.eyfs_statements WHERE organisation_id = v_org;
      INSERT INTO public.eyfs_statements AS t (sheet_name, all_statements, structured_statements, organisation_id)
      SELECT
        r->>'sheet_name',
        COALESCE(r->'all_statements', '[]'::jsonb),
        COALESCE(r->'structured_statements', '{}'::jsonb),
        v_org
      FROM jsonb_array_elements(p_payload->'standards') r
      WHERE COALESCE(r->>'sheet_name', '') <> ''
      ON CONFLICT (organisation_id, sheet_name) DO UPDATE
        SET all_statements = EXCLUDED.all_statements,
            structured_statements = EXCLUDED.structured_statements,
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('standards', v_n);
    END IF;
  END IF;

  IF p_payload ? 'halfTerms' AND jsonb_typeof(p_payload->'halfTerms') = 'array' THEN
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'halfTerms', jsonb_array_length(p_payload->'halfTerms')
      );
    ELSE
      DELETE FROM public.half_terms WHERE organisation_id = v_org;
      INSERT INTO public.half_terms AS t (
        id, sheet_name, academic_year, name, lessons, is_complete, term_id, organisation_id
      )
      SELECT
        COALESCE(NULLIF(r->>'id', ''), gen_random_uuid()::text),
        r->>'sheet_name',
        r->>'academic_year',
        r->>'name',
        COALESCE(r->'lessons', '[]'::jsonb),
        COALESCE((r->>'is_complete')::boolean, false),
        r->>'term_id',
        v_org
      FROM jsonb_array_elements(p_payload->'halfTerms') r
      ON CONFLICT (id) DO UPDATE
        SET sheet_name = EXCLUDED.sheet_name,
            academic_year = EXCLUDED.academic_year,
            name = EXCLUDED.name,
            lessons = EXCLUDED.lessons,
            is_complete = EXCLUDED.is_complete,
            term_id = EXCLUDED.term_id,
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('halfTerms', v_n);
    END IF;
  END IF;

  IF p_payload ? 'lessonPlans' AND jsonb_typeof(p_payload->'lessonPlans') = 'array' THEN
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'lessonPlans', jsonb_array_length(p_payload->'lessonPlans')
      );
    ELSE
      DELETE FROM public.lesson_plans WHERE organisation_id = v_org;
      INSERT INTO public.lesson_plans AS t (
        id, date, week, class_name, activities, duration, notes, status,
        unit_id, unit_name, lesson_number, title, term, time, organisation_id
      )
      SELECT
        COALESCE(NULLIF(r->>'id', ''), gen_random_uuid()::text),
        NULLIF(r->>'date', '')::timestamptz,
        r->>'week',
        r->>'class_name',
        COALESCE(r->'activities', '[]'::jsonb),
        NULLIF(r->>'duration', '')::numeric,
        r->>'notes',
        r->>'status',
        r->>'unit_id',
        r->>'unit_name',
        r->>'lesson_number',
        r->>'title',
        r->>'term',
        r->>'time',
        v_org
      FROM jsonb_array_elements(p_payload->'lessonPlans') r
      ON CONFLICT (id) DO UPDATE
        SET date = EXCLUDED.date,
            week = EXCLUDED.week,
            class_name = EXCLUDED.class_name,
            activities = EXCLUDED.activities,
            duration = EXCLUDED.duration,
            notes = EXCLUDED.notes,
            status = EXCLUDED.status,
            unit_id = EXCLUDED.unit_id,
            unit_name = EXCLUDED.unit_name,
            lesson_number = EXCLUDED.lesson_number,
            title = EXCLUDED.title,
            term = EXCLUDED.term,
            time = EXCLUDED.time,
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('lessonPlans', v_n);
    END IF;
  END IF;

  -- Stacks: data must be a JSON object (no COALESCE to whole row)
  IF p_payload ? 'lessonStacks' AND jsonb_typeof(p_payload->'lessonStacks') = 'array' THEN
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'lessonStacks', jsonb_array_length(p_payload->'lessonStacks')
      );
    ELSE
      DELETE FROM public.lesson_stacks WHERE organisation_id = v_org;
      INSERT INTO public.lesson_stacks AS t (id, name, data, organisation_id)
      SELECT
        COALESCE(NULLIF(r->>'id', ''), gen_random_uuid()::text),
        r->>'name',
        r->'data',
        v_org
      FROM jsonb_array_elements(p_payload->'lessonStacks') r
      WHERE jsonb_typeof(r->'data') = 'object'
      ON CONFLICT (id) DO UPDATE
        SET name = COALESCE(EXCLUDED.name, t.name),
            data = EXCLUDED.data,
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('lessonStacks', v_n);
    END IF;
  END IF;

  IF p_payload ? 'activityStacks' AND jsonb_typeof(p_payload->'activityStacks') = 'array' THEN
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'activityStacks', jsonb_array_length(p_payload->'activityStacks')
      );
    ELSE
      DELETE FROM public.activity_stacks WHERE organisation_id = v_org;
      INSERT INTO public.activity_stacks AS t (id, name, data, organisation_id)
      SELECT
        COALESCE(NULLIF(r->>'id', ''), gen_random_uuid()::text),
        r->>'name',
        r->'data',
        v_org
      FROM jsonb_array_elements(p_payload->'activityStacks') r
      WHERE jsonb_typeof(r->'data') = 'object'
      ON CONFLICT (id) DO UPDATE
        SET name = COALESCE(EXCLUDED.name, t.name),
            data = EXCLUDED.data,
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('activityStacks', v_n);
    END IF;
  END IF;

  -- Custom objectives: restore when present; error if tables missing
  IF p_payload ? 'customObjectiveYearGroups'
     AND jsonb_typeof(p_payload->'customObjectiveYearGroups') = 'array' THEN
    IF to_regclass('public.custom_objective_year_groups') IS NULL THEN
      RAISE EXCEPTION 'custom_objective_year_groups missing' USING ERRCODE = '42P01';
    END IF;
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'customObjectiveYearGroups',
        jsonb_array_length(p_payload->'customObjectiveYearGroups')
      );
    ELSE
      EXECUTE 'DELETE FROM public.custom_objective_year_groups WHERE organisation_id = $1' USING v_org;
      INSERT INTO public.custom_objective_year_groups AS t (id, name, sort_order, organisation_id)
      SELECT
        COALESCE(NULLIF(r->>'id', '')::uuid, gen_random_uuid()),
        r->>'name',
        NULLIF(r->>'sort_order', '')::int,
        v_org
      FROM jsonb_array_elements(p_payload->'customObjectiveYearGroups') r
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            sort_order = COALESCE(EXCLUDED.sort_order, t.sort_order),
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('customObjectiveYearGroups', v_n);
    END IF;
  END IF;

  IF p_payload ? 'customObjectiveAreas'
     AND jsonb_typeof(p_payload->'customObjectiveAreas') = 'array' THEN
    IF to_regclass('public.custom_objective_areas') IS NULL THEN
      RAISE EXCEPTION 'custom_objective_areas missing' USING ERRCODE = '42P01';
    END IF;
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'customObjectiveAreas',
        jsonb_array_length(p_payload->'customObjectiveAreas')
      );
    ELSE
      EXECUTE 'DELETE FROM public.custom_objective_areas WHERE organisation_id = $1' USING v_org;
      INSERT INTO public.custom_objective_areas AS t (id, name, year_group_id, sort_order, organisation_id)
      SELECT
        COALESCE(NULLIF(r->>'id', '')::uuid, gen_random_uuid()),
        r->>'name',
        NULLIF(r->>'year_group_id', '')::uuid,
        NULLIF(r->>'sort_order', '')::int,
        v_org
      FROM jsonb_array_elements(p_payload->'customObjectiveAreas') r
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            year_group_id = EXCLUDED.year_group_id,
            sort_order = COALESCE(EXCLUDED.sort_order, t.sort_order),
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('customObjectiveAreas', v_n);
    END IF;
  END IF;

  IF p_payload ? 'customObjectives'
     AND jsonb_typeof(p_payload->'customObjectives') = 'array' THEN
    IF to_regclass('public.custom_objectives') IS NULL THEN
      RAISE EXCEPTION 'custom_objectives missing' USING ERRCODE = '42P01';
    END IF;
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'customObjectives', jsonb_array_length(p_payload->'customObjectives')
      );
    ELSE
      EXECUTE 'DELETE FROM public.custom_objectives WHERE organisation_id = $1' USING v_org;
      INSERT INTO public.custom_objectives AS t (id, text, area_id, sort_order, organisation_id)
      SELECT
        COALESCE(NULLIF(r->>'id', '')::uuid, gen_random_uuid()),
        COALESCE(r->>'text', r->>'name'),
        NULLIF(r->>'area_id', '')::uuid,
        NULLIF(r->>'sort_order', '')::int,
        v_org
      FROM jsonb_array_elements(p_payload->'customObjectives') r
      ON CONFLICT (id) DO UPDATE
        SET text = EXCLUDED.text,
            area_id = EXCLUDED.area_id,
            sort_order = COALESCE(EXCLUDED.sort_order, t.sort_order),
            organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('customObjectives', v_n);
    END IF;
  END IF;

  IF p_payload ? 'activityCustomObjectives'
     AND jsonb_typeof(p_payload->'activityCustomObjectives') = 'array' THEN
    IF to_regclass('public.activity_custom_objectives') IS NULL THEN
      RAISE EXCEPTION 'activity_custom_objectives missing' USING ERRCODE = '42P01';
    END IF;
    IF p_dry_run THEN
      v_counts := v_counts || jsonb_build_object(
        'activityCustomObjectives',
        jsonb_array_length(p_payload->'activityCustomObjectives')
      );
    ELSE
      EXECUTE 'DELETE FROM public.activity_custom_objectives WHERE organisation_id = $1' USING v_org;
      INSERT INTO public.activity_custom_objectives AS t (activity_id, objective_id, organisation_id)
      SELECT
        NULLIF(r->>'activity_id', '')::uuid,
        NULLIF(r->>'objective_id', '')::uuid,
        v_org
      FROM jsonb_array_elements(p_payload->'activityCustomObjectives') r
      WHERE NULLIF(r->>'activity_id', '') IS NOT NULL
        AND NULLIF(r->>'objective_id', '') IS NOT NULL
      ON CONFLICT (organisation_id, activity_id, objective_id) DO UPDATE
        SET organisation_id = v_org
      WHERE t.organisation_id = v_org;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_counts := v_counts || jsonb_build_object('activityCustomObjectives', v_n);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'dry_run', p_dry_run,
    'organisation_id', to_jsonb(v_org),
    'counts', v_counts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.restore_curriculum_backup(jsonb, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_curriculum_backup(jsonb, text, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_curriculum_backup(jsonb, text, boolean) TO service_role;

COMMENT ON FUNCTION public.restore_curriculum_backup(jsonb, text, boolean) IS
  'SECURITY DEFINER org-scoped restore with cross-org id/natural-key guards (42501). ON CONFLICT DO UPDATE WHERE t.organisation_id = v_org. search_path=public,pg_temp.';
