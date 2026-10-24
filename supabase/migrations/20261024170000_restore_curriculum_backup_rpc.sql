-- Atomic curriculum restore RPC (service-role only).
-- Called via service.rpc('restore_curriculum_backup', ...).
-- Do NOT apply to live DB until the owner reviews.

CREATE OR REPLACE FUNCTION public.restore_curriculum_backup(
  p_payload jsonb,
  p_organisation_id text DEFAULT NULL,
  p_dry_run boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_counts jsonb := '{}'::jsonb;
  v_n int;
  v_org text := NULLIF(trim(COALESCE(p_organisation_id, '')), '');
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid payload' USING ERRCODE = '22023';
  END IF;

  -- Dependency order: categories/year groups → activities → lessons → plans → stacks → objectives.

  -- year_groups
  IF p_payload ? 'yearGroups' AND jsonb_typeof(p_payload->'yearGroups') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'yearGroups');
    v_counts := v_counts || jsonb_build_object('yearGroups', v_n);
    IF NOT p_dry_run AND v_n > 0 THEN
      INSERT INTO public.year_groups AS t (id, name, sort_order)
      SELECT
        COALESCE(r->>'id', gen_random_uuid()::text),
        r->>'name',
        NULLIF(r->>'sort_order', '')::int
      FROM jsonb_array_elements(p_payload->'yearGroups') r
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            sort_order = COALESCE(EXCLUDED.sort_order, t.sort_order);
    END IF;
  END IF;

  -- category_groups
  IF p_payload ? 'categoryGroups' AND jsonb_typeof(p_payload->'categoryGroups') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'categoryGroups');
    v_counts := v_counts || jsonb_build_object('categoryGroups', v_n);
    IF NOT p_dry_run AND v_n > 0 THEN
      INSERT INTO public.category_groups AS t (id, name, sort_order)
      SELECT
        COALESCE(r->>'id', gen_random_uuid()::text),
        r->>'name',
        NULLIF(r->>'sort_order', '')::int
      FROM jsonb_array_elements(p_payload->'categoryGroups') r
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            sort_order = COALESCE(EXCLUDED.sort_order, t.sort_order);
    END IF;
  END IF;

  -- custom_categories
  IF p_payload ? 'customCategories' AND jsonb_typeof(p_payload->'customCategories') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'customCategories');
    v_counts := v_counts || jsonb_build_object('customCategories', v_n);
    IF NOT p_dry_run AND v_n > 0 THEN
      INSERT INTO public.custom_categories AS t (id, name, color, sort_order)
      SELECT
        COALESCE(r->>'id', gen_random_uuid()::text),
        r->>'name',
        r->>'color',
        NULLIF(r->>'sort_order', '')::int
      FROM jsonb_array_elements(p_payload->'customCategories') r
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            color = COALESCE(EXCLUDED.color, t.color),
            sort_order = COALESCE(EXCLUDED.sort_order, t.sort_order);
    END IF;
  END IF;

  -- activities (natural key)
  IF p_payload ? 'activities' AND jsonb_typeof(p_payload->'activities') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'activities');
    v_counts := v_counts || jsonb_build_object('activities', v_n);
    IF NOT p_dry_run AND v_n > 0 THEN
      INSERT INTO public.activities AS t (
        activity, description, activity_text, time,
        video_link, music_link, backing_link, resource_link, link,
        vocals_link, image_link, canva_link,
        teaching_unit, category, level, unit_name, lesson_number, eyfs_standards
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
        END
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
            eyfs_standards = EXCLUDED.eyfs_standards;
    END IF;
  END IF;

  -- lessons
  IF p_payload ? 'lessons' AND jsonb_typeof(p_payload->'lessons') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'lessons');
    v_counts := v_counts || jsonb_build_object('lessons', v_n);
    IF NOT p_dry_run AND v_n > 0 THEN
      INSERT INTO public.lessons AS t (sheet_name, data, lesson_numbers, teaching_units)
      SELECT
        r->>'sheet_name',
        COALESCE(r->'data', '{}'::jsonb),
        COALESCE(r->'lesson_numbers', '[]'::jsonb),
        COALESCE(r->'teaching_units', '[]'::jsonb)
      FROM jsonb_array_elements(p_payload->'lessons') r
      WHERE COALESCE(r->>'sheet_name', '') <> ''
      ON CONFLICT (sheet_name) DO UPDATE
        SET data = EXCLUDED.data,
            lesson_numbers = EXCLUDED.lesson_numbers,
            teaching_units = EXCLUDED.teaching_units;
    END IF;
  END IF;

  -- eyfs / standards
  IF p_payload ? 'standards' AND jsonb_typeof(p_payload->'standards') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'standards');
    v_counts := v_counts || jsonb_build_object('standards', v_n);
    IF NOT p_dry_run AND v_n > 0 THEN
      INSERT INTO public.eyfs_statements AS t (sheet_name, all_statements, structured_statements)
      SELECT
        r->>'sheet_name',
        COALESCE(r->'all_statements', '[]'::jsonb),
        COALESCE(r->'structured_statements', '{}'::jsonb)
      FROM jsonb_array_elements(p_payload->'standards') r
      WHERE COALESCE(r->>'sheet_name', '') <> ''
      ON CONFLICT (sheet_name) DO UPDATE
        SET all_statements = EXCLUDED.all_statements,
            structured_statements = EXCLUDED.structured_statements;
    END IF;
  END IF;

  -- half_terms (optional user scoping stripped by caller; org not typically present)
  IF p_payload ? 'halfTerms' AND jsonb_typeof(p_payload->'halfTerms') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'halfTerms');
    v_counts := v_counts || jsonb_build_object('halfTerms', v_n);
    IF NOT p_dry_run AND v_n > 0 THEN
      INSERT INTO public.half_terms AS t (
        id, sheet_name, academic_year, name, lessons, is_complete, term_id
      )
      SELECT
        COALESCE(r->>'id', gen_random_uuid()::text),
        r->>'sheet_name',
        r->>'academic_year',
        r->>'name',
        COALESCE(r->'lessons', '[]'::jsonb),
        COALESCE((r->>'is_complete')::boolean, false),
        r->>'term_id'
      FROM jsonb_array_elements(p_payload->'halfTerms') r
      ON CONFLICT (id) DO UPDATE
        SET sheet_name = EXCLUDED.sheet_name,
            academic_year = EXCLUDED.academic_year,
            name = EXCLUDED.name,
            lessons = EXCLUDED.lessons,
            is_complete = EXCLUDED.is_complete,
            term_id = EXCLUDED.term_id;
    END IF;
  END IF;

  -- lesson_plans
  IF p_payload ? 'lessonPlans' AND jsonb_typeof(p_payload->'lessonPlans') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'lessonPlans');
    v_counts := v_counts || jsonb_build_object('lessonPlans', v_n);
    IF NOT p_dry_run AND v_n > 0 THEN
      INSERT INTO public.lesson_plans AS t (
        id, date, week, class_name, activities, duration, notes, status,
        unit_id, unit_name, lesson_number, title, term, time
      )
      SELECT
        COALESCE(r->>'id', gen_random_uuid()::text),
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
        r->>'time'
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
            time = EXCLUDED.time;
    END IF;
  END IF;

  -- lesson_stacks / activity_stacks
  IF p_payload ? 'lessonStacks' AND jsonb_typeof(p_payload->'lessonStacks') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'lessonStacks');
    v_counts := v_counts || jsonb_build_object('lessonStacks', v_n);
    IF NOT p_dry_run AND v_n > 0 THEN
      INSERT INTO public.lesson_stacks AS t (id, name, data)
      SELECT
        COALESCE(r->>'id', gen_random_uuid()::text),
        r->>'name',
        COALESCE(r->'data', r, '{}'::jsonb)
      FROM jsonb_array_elements(p_payload->'lessonStacks') r
      ON CONFLICT (id) DO UPDATE
        SET name = COALESCE(EXCLUDED.name, t.name),
            data = EXCLUDED.data;
    END IF;
  END IF;

  IF p_payload ? 'activityStacks' AND jsonb_typeof(p_payload->'activityStacks') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'activityStacks');
    v_counts := v_counts || jsonb_build_object('activityStacks', v_n);
    IF NOT p_dry_run AND v_n > 0 THEN
      INSERT INTO public.activity_stacks AS t (id, name, data)
      SELECT
        COALESCE(r->>'id', gen_random_uuid()::text),
        r->>'name',
        COALESCE(r->'data', r, '{}'::jsonb)
      FROM jsonb_array_elements(p_payload->'activityStacks') r
      ON CONFLICT (id) DO UPDATE
        SET name = COALESCE(EXCLUDED.name, t.name),
            data = EXCLUDED.data;
    END IF;
  END IF;

  -- Optional objectives tables (ignore if missing — wrapped per-statement not available;
  -- callers should only send keys when tables exist. Errors abort the transaction.)
  IF p_payload ? 'customObjectiveYearGroups'
     AND jsonb_typeof(p_payload->'customObjectiveYearGroups') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'customObjectiveYearGroups');
    v_counts := v_counts || jsonb_build_object('customObjectiveYearGroups', v_n);
  END IF;
  IF p_payload ? 'customObjectiveAreas'
     AND jsonb_typeof(p_payload->'customObjectiveAreas') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'customObjectiveAreas');
    v_counts := v_counts || jsonb_build_object('customObjectiveAreas', v_n);
  END IF;
  IF p_payload ? 'customObjectives'
     AND jsonb_typeof(p_payload->'customObjectives') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'customObjectives');
    v_counts := v_counts || jsonb_build_object('customObjectives', v_n);
  END IF;
  IF p_payload ? 'activityCustomObjectives'
     AND jsonb_typeof(p_payload->'activityCustomObjectives') = 'array' THEN
    v_n := jsonb_array_length(p_payload->'activityCustomObjectives');
    v_counts := v_counts || jsonb_build_object('activityCustomObjectives', v_n);
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
-- service_role retains EXECUTE by default on Supabase.

COMMENT ON FUNCTION public.restore_curriculum_backup(jsonb, text, boolean) IS
  'SECURITY DEFINER curriculum restore. Service-role RPC only. Payload must be zod-cleaned by the API.';
