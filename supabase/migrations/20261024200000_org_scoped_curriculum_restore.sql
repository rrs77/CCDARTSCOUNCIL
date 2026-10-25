-- Org-scoped curriculum restore (replaces 20261024170000 behaviour).
-- Requires p_organisation_id; sets organisation_id on every row.
-- Counts = rows actually written (INSERT ROW_COUNT), not payload length.
-- Private curriculum_backups store for pre-restore snapshots.
-- Safe to re-run. Do not apply to live DB until the owner reviews.

CREATE TABLE IF NOT EXISTS public.curriculum_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  organisation_id TEXT,
  storage_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  row_counts JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_curriculum_backups_org_created
  ON public.curriculum_backups (organisation_id, created_at DESC);

ALTER TABLE public.curriculum_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.curriculum_backups FROM PUBLIC;
REVOKE ALL ON TABLE public.curriculum_backups FROM anon, authenticated;

COMMENT ON TABLE public.curriculum_backups IS
  'Service-role-only pre-restore snapshots (storage_key backups/<ts>-<userId>.json).';

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS organisation_id TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS organisation_id TEXT;
ALTER TABLE public.eyfs_statements ADD COLUMN IF NOT EXISTS organisation_id TEXT;
ALTER TABLE public.half_terms ADD COLUMN IF NOT EXISTS organisation_id TEXT;
ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS organisation_id TEXT;
ALTER TABLE public.custom_categories ADD COLUMN IF NOT EXISTS organisation_id TEXT;
ALTER TABLE public.category_groups ADD COLUMN IF NOT EXISTS organisation_id TEXT;
ALTER TABLE public.year_groups ADD COLUMN IF NOT EXISTS organisation_id TEXT;
ALTER TABLE public.lesson_stacks ADD COLUMN IF NOT EXISTS organisation_id TEXT;
ALTER TABLE public.activity_stacks ADD COLUMN IF NOT EXISTS organisation_id TEXT;

DO $$
BEGIN
  IF to_regclass('public.custom_objective_year_groups') IS NOT NULL THEN
    ALTER TABLE public.custom_objective_year_groups ADD COLUMN IF NOT EXISTS organisation_id TEXT;
  END IF;
  IF to_regclass('public.custom_objective_areas') IS NOT NULL THEN
    ALTER TABLE public.custom_objective_areas ADD COLUMN IF NOT EXISTS organisation_id TEXT;
  END IF;
  IF to_regclass('public.custom_objectives') IS NOT NULL THEN
    ALTER TABLE public.custom_objectives ADD COLUMN IF NOT EXISTS organisation_id TEXT;
  END IF;
  IF to_regclass('public.activity_custom_objectives') IS NOT NULL THEN
    ALTER TABLE public.activity_custom_objectives ADD COLUMN IF NOT EXISTS organisation_id TEXT;
  END IF;
END $$;

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
            organisation_id = v_org;
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
            organisation_id = v_org;
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
            organisation_id = v_org;
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
      ON CONFLICT (activity, category, lesson_number) DO UPDATE
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
            organisation_id = v_org;
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
      ON CONFLICT (sheet_name) DO UPDATE
        SET data = EXCLUDED.data,
            lesson_numbers = EXCLUDED.lesson_numbers,
            teaching_units = EXCLUDED.teaching_units,
            organisation_id = v_org;
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
      ON CONFLICT (sheet_name) DO UPDATE
        SET all_statements = EXCLUDED.all_statements,
            structured_statements = EXCLUDED.structured_statements,
            organisation_id = v_org;
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
            organisation_id = v_org;
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
            organisation_id = v_org;
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
            organisation_id = v_org;
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
            organisation_id = v_org;
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
            organisation_id = v_org;
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
            organisation_id = v_org;
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
            organisation_id = v_org;
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
      ON CONFLICT (activity_id, objective_id) DO UPDATE
        SET organisation_id = v_org;
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
  'SECURITY DEFINER org-scoped curriculum restore. search_path=public,pg_temp. Counts=ROW_COUNT written. service_role EXECUTE only.';
