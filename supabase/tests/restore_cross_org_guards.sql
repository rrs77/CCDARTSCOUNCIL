-- Cross-org restore guards (20261024240000).
-- Scratch Postgres (never production):
--   psql -v ON_ERROR_STOP=1 -d scratch \
--     -f supabase/tests/restore_cross_org_guards_scratch_schema.sql \
--     -f supabase/migrations/20261024240000_restore_cross_org_guards.sql \
--     -f supabase/tests/restore_cross_org_guards.sql

BEGIN;

CREATE TEMP TABLE results (name TEXT, ok BOOLEAN);

INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES
  ('org_a', 'Org A', 'org_a', 'org_a', 'Org A', 'Org A', 'active'),
  ('org_b', 'Org B', 'org_b', 'org_b', 'Org B', 'Org B', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'a@test'),
  ('00000000-0000-4000-8000-0000000000b1', 'b@test'),
  ('00000000-0000-4000-8000-0000000000c1', 'admin@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id)
VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'a@test', 'teacher', 'active', 'org_a'),
  ('00000000-0000-4000-8000-0000000000b1', 'b@test', 'teacher', 'active', 'org_b'),
  ('00000000-0000-4000-8000-0000000000c1', 'admin@test', 'admin', 'active', 'org_a')
ON CONFLICT (id) DO UPDATE
  SET organisation_id = EXCLUDED.organisation_id, role = EXCLUDED.role;

-- ---------------------------------------------------------------------------
-- B2: NULL-org backfill from owner profile + NULL lesson_number normalize
-- ---------------------------------------------------------------------------
DELETE FROM public.activities WHERE activity = 'NullOrgClap';
INSERT INTO public.activities (activity, category, lesson_number, description, user_id, organisation_id)
VALUES ('NullOrgClap', 'Warm-up', NULL, 'needs backfill', '00000000-0000-4000-8000-0000000000a1', NULL);

-- Re-run the backfill/normalize statements from the migration shape
UPDATE public.activities a
SET organisation_id = p.organisation_id
FROM public.profiles p
WHERE a.organisation_id IS NULL
  AND a.user_id IS NOT NULL
  AND p.id = a.user_id
  AND p.organisation_id IS NOT NULL;

UPDATE public.activities SET lesson_number = '' WHERE lesson_number IS NULL;

INSERT INTO results
SELECT 'NULL-org activity backfilled from profile',
       organisation_id = 'org_a' AND lesson_number = ''
FROM public.activities
WHERE activity = 'NullOrgClap' AND category = 'Warm-up';

-- ---------------------------------------------------------------------------
-- (a) Cross-org id raises 42501
-- ---------------------------------------------------------------------------
DELETE FROM public.year_groups
WHERE id::text IN (
  'aaaaaaaa-bbbb-4ccc-8ddd-0000000000b1',
  'aaaaaaaa-bbbb-4ccc-8ddd-0000000000a1'
);

INSERT INTO public.year_groups (id, name, organisation_id)
VALUES ('aaaaaaaa-bbbb-4ccc-8ddd-0000000000b1', 'Year B', 'org_b');

DO $$
DECLARE
  err text;
  state text;
BEGIN
  BEGIN
    PERFORM public.restore_curriculum_backup(
      jsonb_build_object(
        'yearGroups', jsonb_build_array(
          jsonb_build_object(
            'id', 'aaaaaaaa-bbbb-4ccc-8ddd-0000000000b1',
            'name', 'Stolen'
          )
        )
      ),
      'org_a',
      true
    );
    INSERT INTO results VALUES ('cross-org year_groups id raises 42501', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, state = RETURNED_SQLSTATE;
    INSERT INTO results VALUES (
      'cross-org year_groups id raises 42501',
      state = '42501' OR err ILIKE '%cross-org%'
    );
  END;
END $$;

INSERT INTO results
SELECT 'org_b year_groups row untouched',
       name = 'Year B' AND organisation_id = 'org_b'
FROM public.year_groups
WHERE id::text = 'aaaaaaaa-bbbb-4ccc-8ddd-0000000000b1';

-- ---------------------------------------------------------------------------
-- (b) Natural keys: org_a restore must not move org_b rows
-- ---------------------------------------------------------------------------
DELETE FROM public.lessons
WHERE sheet_name = 'SharedSheet' AND organisation_id IN ('org_a', 'org_b');

INSERT INTO public.lessons (sheet_name, academic_year, user_id, data, lesson_numbers, teaching_units, organisation_id)
VALUES (
  'SharedSheet', '2025-2026', '00000000-0000-4000-8000-0000000000b1',
  '{"owner":"b"}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'org_b'
);

DO $$
DECLARE res jsonb;
BEGIN
  res := public.restore_curriculum_backup(
    jsonb_build_object(
      'lessons', jsonb_build_array(
        jsonb_build_object(
          'sheet_name', 'SharedSheet',
          'academic_year', '2025-2026',
          'user_id', '00000000-0000-4000-8000-0000000000a1',
          'data', '{"owner":"a"}'::jsonb,
          'lesson_numbers', '[]'::jsonb,
          'teaching_units', '[]'::jsonb
        )
      )
    ),
    'org_a',
    false
  );
  INSERT INTO results VALUES ('org_a lessons restore ok', COALESCE((res->>'ok')::boolean, false));
END $$;

INSERT INTO results
SELECT 'org_b lesson natural key untouched',
       data->>'owner' = 'b' AND organisation_id = 'org_b'
FROM public.lessons
WHERE sheet_name = 'SharedSheet' AND organisation_id = 'org_b';

INSERT INTO results
SELECT 'org_a lesson natural key written separately',
       COUNT(*) = 1 AND bool_and(data->>'owner' = 'a')
FROM public.lessons
WHERE sheet_name = 'SharedSheet' AND organisation_id = 'org_a';

-- Two academic years same teacher/org/sheet must both exist (4-col unique)
DELETE FROM public.lessons
WHERE sheet_name = 'YearSheet' AND organisation_id = 'org_a';

INSERT INTO public.lessons AS t (
  sheet_name, academic_year, user_id, data, lesson_numbers, teaching_units, organisation_id
) VALUES
  ('YearSheet', '2025-2026', '00000000-0000-4000-8000-0000000000a1', '{"y":"2526"}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'org_a'),
  ('YearSheet', '2026-2027', '00000000-0000-4000-8000-0000000000a1', '{"y":"2627"}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'org_a')
ON CONFLICT (organisation_id, sheet_name, academic_year, user_id) DO UPDATE
  SET data = EXCLUDED.data
WHERE t.organisation_id = 'org_a';

INSERT INTO results
SELECT 'two academic years same sheet/teacher allowed',
       COUNT(*) = 2
FROM public.lessons
WHERE organisation_id = 'org_a' AND sheet_name = 'YearSheet';

-- Two teachers same org/sheet/year must both exist
INSERT INTO public.lessons AS t (
  sheet_name, academic_year, user_id, data, lesson_numbers, teaching_units, organisation_id
) VALUES
  ('YearSheet', '2025-2026', '00000000-0000-4000-8000-0000000000c1', '{"teacher":"c"}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'org_a')
ON CONFLICT (organisation_id, sheet_name, academic_year, user_id) DO UPDATE
  SET data = EXCLUDED.data
WHERE t.organisation_id = 'org_a';

INSERT INTO results
SELECT 'two teachers same org/sheet/year allowed',
       COUNT(*) = 2
FROM public.lessons
WHERE organisation_id = 'org_a'
  AND sheet_name = 'YearSheet'
  AND academic_year = '2025-2026';

-- R3: restore 2 users × 2 years on the same sheet → 4 rows
DELETE FROM public.lessons
WHERE sheet_name = 'GridSheet' AND organisation_id = 'org_a';

DO $$
DECLARE res jsonb; n int;
BEGIN
  res := public.restore_curriculum_backup(
    jsonb_build_object(
      'lessons', jsonb_build_array(
        jsonb_build_object(
          'sheet_name', 'GridSheet',
          'academic_year', '2025-2026',
          'user_id', '00000000-0000-4000-8000-0000000000a1',
          'data', '{"u":"a1","y":"2526"}'::jsonb,
          'lesson_numbers', '[]'::jsonb,
          'teaching_units', '[]'::jsonb
        ),
        jsonb_build_object(
          'sheet_name', 'GridSheet',
          'academic_year', '2026-2027',
          'user_id', '00000000-0000-4000-8000-0000000000a1',
          'data', '{"u":"a1","y":"2627"}'::jsonb,
          'lesson_numbers', '[]'::jsonb,
          'teaching_units', '[]'::jsonb
        ),
        jsonb_build_object(
          'sheet_name', 'GridSheet',
          'academic_year', '2025-2026',
          'user_id', '00000000-0000-4000-8000-0000000000c1',
          'data', '{"u":"c1","y":"2526"}'::jsonb,
          'lesson_numbers', '[]'::jsonb,
          'teaching_units', '[]'::jsonb
        ),
        jsonb_build_object(
          'sheet_name', 'GridSheet',
          'academic_year', '2026-2027',
          'user_id', '00000000-0000-4000-8000-0000000000c1',
          'data', '{"u":"c1","y":"2627"}'::jsonb,
          'lesson_numbers', '[]'::jsonb,
          'teaching_units', '[]'::jsonb
        )
      )
    ),
    'org_a',
    false
  );
  SELECT COUNT(*) INTO n
  FROM public.lessons
  WHERE organisation_id = 'org_a' AND sheet_name = 'GridSheet';
  INSERT INTO results VALUES (
    'restore 2 users x 2 years same sheet writes 4 rows',
    COALESCE((res->>'ok')::boolean, false) AND n = 4
  );
END $$;

-- R2: lesson user_id from another org raises 42501 (via RPC)
DO $$
DECLARE err text; state text;
BEGIN
  BEGIN
    PERFORM public.restore_curriculum_backup(
      jsonb_build_object(
        'lessons', jsonb_build_array(
          jsonb_build_object(
            'sheet_name', 'ForeignOwner',
            'academic_year', '2025-2026',
            'user_id', '00000000-0000-4000-8000-0000000000b1',
            'data', '{}'::jsonb,
            'lesson_numbers', '[]'::jsonb,
            'teaching_units', '[]'::jsonb
          )
        )
      ),
      'org_a',
      true
    );
    INSERT INTO results VALUES ('foreign lesson user_id raises 42501', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, state = RETURNED_SQLSTATE;
    INSERT INTO results VALUES (
      'foreign lesson user_id raises 42501',
      state = '42501' OR err ILIKE '%user_id%'
    );
  END;
END $$;

-- Direct unit test of private._restore_assert_lesson_user_ids_in_org
DO $$
DECLARE err text; state text; ok_null boolean := false; ok_own boolean := false;
BEGIN
  -- NULL user_id allowed
  BEGIN
    PERFORM private._restore_assert_lesson_user_ids_in_org(
      jsonb_build_object(
        'lessons', jsonb_build_array(
          jsonb_build_object('sheet_name', 'X', 'user_id', NULL)
        )
      ),
      'org_a'
    );
    ok_null := true;
  EXCEPTION WHEN OTHERS THEN
    ok_null := false;
  END;
  -- Own-org user_id allowed
  BEGIN
    PERFORM private._restore_assert_lesson_user_ids_in_org(
      jsonb_build_object(
        'lessons', jsonb_build_array(
          jsonb_build_object(
            'sheet_name', 'X',
            'user_id', '00000000-0000-4000-8000-0000000000a1'
          )
        )
      ),
      'org_a'
    );
    ok_own := true;
  EXCEPTION WHEN OTHERS THEN
    ok_own := false;
  END;
  INSERT INTO results VALUES ('_restore_assert_lesson_user_ids_in_org allows NULL', ok_null);
  INSERT INTO results VALUES ('_restore_assert_lesson_user_ids_in_org allows own-org', ok_own);

  BEGIN
    PERFORM private._restore_assert_lesson_user_ids_in_org(
      jsonb_build_object(
        'lessons', jsonb_build_array(
          jsonb_build_object(
            'sheet_name', 'X',
            'user_id', '00000000-0000-4000-8000-0000000000b1'
          )
        )
      ),
      'org_a'
    );
    INSERT INTO results VALUES ('_restore_assert_lesson_user_ids_in_org rejects foreign', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, state = RETURNED_SQLSTATE;
    INSERT INTO results VALUES (
      '_restore_assert_lesson_user_ids_in_org rejects foreign',
      state = '42501' OR err ILIKE '%user_id%'
    );
  END;
END $$;

DELETE FROM public.activities
WHERE activity = 'Clap' AND category = 'Warm-up'
  AND lesson_number IN ('1', '')
  AND organisation_id IN ('org_a', 'org_b');

INSERT INTO public.activities (activity, category, lesson_number, description, organisation_id)
VALUES ('Clap', 'Warm-up', '1', 'belongs to B', 'org_b');

DO $$
DECLARE res jsonb;
BEGIN
  res := public.restore_curriculum_backup(
    jsonb_build_object(
      'activities', jsonb_build_array(
        jsonb_build_object(
          'activity', 'Clap',
          'category', 'Warm-up',
          'lesson_number', '1',
          'description', 'belongs to A'
        )
      )
    ),
    'org_a',
    false
  );
  INSERT INTO results VALUES ('org_a activities restore ok', COALESCE((res->>'ok')::boolean, false));
END $$;

INSERT INTO results
SELECT 'org_b activity natural key untouched',
       description = 'belongs to B'
FROM public.activities
WHERE activity = 'Clap' AND category = 'Warm-up' AND lesson_number = '1'
  AND organisation_id = 'org_b';

INSERT INTO results
SELECT 'org_a activity natural key written separately',
       COUNT(*) = 1 AND bool_and(description = 'belongs to A')
FROM public.activities
WHERE activity = 'Clap' AND category = 'Warm-up' AND lesson_number = '1'
  AND organisation_id = 'org_a';

-- ---------------------------------------------------------------------------
-- (c) reference checks: year_group_id / objective_id / activity_id
-- ---------------------------------------------------------------------------
DELETE FROM public.custom_objective_year_groups WHERE organisation_id IN ('org_a', 'org_b');
DELETE FROM public.custom_objective_areas WHERE organisation_id IN ('org_a', 'org_b');
DELETE FROM public.custom_objectives WHERE organisation_id IN ('org_b');

INSERT INTO public.custom_objective_year_groups (id, name, organisation_id)
VALUES ('bbbbbbbb-bbbb-4ccc-8ddd-0000000000b1', 'B Year', 'org_b');

DO $$
DECLARE err text; state text;
BEGIN
  BEGIN
    PERFORM public.restore_curriculum_backup(
      jsonb_build_object(
        'customObjectiveAreas', jsonb_build_array(
          jsonb_build_object(
            'id', 'cccccccc-bbbb-4ccc-8ddd-0000000000a1',
            'name', 'Area',
            'year_group_id', 'bbbbbbbb-bbbb-4ccc-8ddd-0000000000b1'
          )
        )
      ),
      'org_a',
      true
    );
    INSERT INTO results VALUES ('(c) foreign year_group_id raises 42501', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, state = RETURNED_SQLSTATE;
    INSERT INTO results VALUES (
      '(c) foreign year_group_id raises 42501',
      state = '42501' OR err ILIKE '%year_group_id%'
    );
  END;
END $$;

INSERT INTO public.custom_objectives (id, text, organisation_id)
VALUES ('dddddddd-bbbb-4ccc-8ddd-0000000000b1', 'B objective', 'org_b');

DO $$
DECLARE err text; state text;
BEGIN
  BEGIN
    PERFORM public.restore_curriculum_backup(
      jsonb_build_object(
        'activityCustomObjectives', jsonb_build_array(
          jsonb_build_object(
            'activity_id', 'eeeeeeee-aaaa-4ccc-8ddd-0000000000a1',
            'objective_id', 'dddddddd-bbbb-4ccc-8ddd-0000000000b1'
          )
        )
      ),
      'org_a',
      true
    );
    INSERT INTO results VALUES ('(c) foreign objective_id raises 42501', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, state = RETURNED_SQLSTATE;
    INSERT INTO results VALUES (
      '(c) foreign objective_id raises 42501',
      state = '42501' OR err ILIKE '%objective_id%'
    );
  END;
END $$;

-- activity_custom_objectives natural-key isolation via org-scoped upsert
DELETE FROM public.activity_custom_objectives
WHERE organisation_id IN ('org_a', 'org_b');

INSERT INTO public.activities (id, activity, category, lesson_number, organisation_id)
VALUES
  ('eeeeeeee-aaaa-4ccc-8ddd-0000000000a1', 'A Act', 'Cat', '1', 'org_a'),
  ('eeeeeeee-bbbb-4ccc-8ddd-0000000000b1', 'B Act', 'Cat', '1', 'org_b')
ON CONFLICT (id) DO UPDATE SET organisation_id = EXCLUDED.organisation_id;

INSERT INTO public.custom_objectives (id, text, organisation_id)
VALUES
  ('ffffffff-aaaa-4ccc-8ddd-0000000000a1', 'A objective', 'org_a'),
  ('ffffffff-bbbb-4ccc-8ddd-0000000000b1', 'B objective 2', 'org_b')
ON CONFLICT (id) DO UPDATE SET organisation_id = EXCLUDED.organisation_id;

INSERT INTO public.activity_custom_objectives (activity_id, objective_id, organisation_id)
VALUES ('eeeeeeee-bbbb-4ccc-8ddd-0000000000b1', 'ffffffff-bbbb-4ccc-8ddd-0000000000b1', 'org_b');

DO $$
DECLARE res jsonb;
BEGIN
  res := public.restore_curriculum_backup(
    jsonb_build_object(
      'customObjectives', jsonb_build_array(
        jsonb_build_object('id', 'ffffffff-aaaa-4ccc-8ddd-0000000000a1', 'text', 'A objective')
      ),
      'activityCustomObjectives', jsonb_build_array(
        jsonb_build_object(
          'activity_id', 'eeeeeeee-aaaa-4ccc-8ddd-0000000000a1',
          'objective_id', 'ffffffff-aaaa-4ccc-8ddd-0000000000a1'
        )
      ),
      'activities', jsonb_build_array(
        jsonb_build_object(
          'id', 'eeeeeeee-aaaa-4ccc-8ddd-0000000000a1',
          'activity', 'A Act',
          'category', 'Cat',
          'lesson_number', '1'
        )
      )
    ),
    'org_a',
    false
  );
  INSERT INTO results VALUES ('ACO restore for org_a ok', COALESCE((res->>'ok')::boolean, false));
END $$;

INSERT INTO results
SELECT 'org_b ACO row untouched',
       COUNT(*) = 1
FROM public.activity_custom_objectives
WHERE organisation_id = 'org_b'
  AND activity_id = 'eeeeeeee-bbbb-4ccc-8ddd-0000000000b1';

INSERT INTO results
SELECT 'org_a ACO row written',
       COUNT(*) = 1
FROM public.activity_custom_objectives
WHERE organisation_id = 'org_a'
  AND activity_id = 'eeeeeeee-aaaa-4ccc-8ddd-0000000000a1';

-- ---------------------------------------------------------------------------
-- B4: anon / authenticated cannot EXECUTE private helpers
-- ---------------------------------------------------------------------------
DO $$
DECLARE err text; state text; denied boolean := false;
BEGIN
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM private._restore_assert_ids_in_org('{}'::jsonb, 'yearGroups', 'year_groups', 'org_a', false);
    denied := false;
  EXCEPTION WHEN insufficient_privilege OR OTHERS THEN
    denied := true;
  END;
  RESET ROLE;
  INSERT INTO results VALUES ('anon cannot execute private helper', denied);
END $$;

DO $$
DECLARE denied boolean := false;
BEGIN
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM private._restore_assert_activity_natural_keys('{}'::jsonb, 'org_a');
    denied := false;
  EXCEPTION WHEN insufficient_privilege OR OTHERS THEN
    denied := true;
  END;
  RESET ROLE;
  INSERT INTO results VALUES ('authenticated cannot execute private helper', denied);
END $$;

-- ---------------------------------------------------------------------------
-- App-style upsert after migration (org-scoped onConflict keys)
-- ---------------------------------------------------------------------------
INSERT INTO public.activities AS t (
  activity, category, lesson_number, description, organisation_id
) VALUES ('AppUpsert', 'Warm-up', '2', 'v1', 'org_a')
ON CONFLICT (organisation_id, activity, category, lesson_number) DO UPDATE
  SET description = EXCLUDED.description
WHERE t.organisation_id = 'org_a';

INSERT INTO public.activities AS t (
  activity, category, lesson_number, description, organisation_id
) VALUES ('AppUpsert', 'Warm-up', '2', 'v2', 'org_a')
ON CONFLICT (organisation_id, activity, category, lesson_number) DO UPDATE
  SET description = EXCLUDED.description
WHERE t.organisation_id = 'org_a';

INSERT INTO results
SELECT 'app-style activities upsert updates same org',
       COUNT(*) = 1 AND bool_and(description = 'v2')
FROM public.activities
WHERE organisation_id = 'org_a' AND activity = 'AppUpsert' AND lesson_number = '2';

INSERT INTO public.eyfs_statements AS t (sheet_name, all_statements, structured_statements, organisation_id)
VALUES ('AppSheet', '["a"]'::jsonb, '{}'::jsonb, 'org_a')
ON CONFLICT (organisation_id, sheet_name) DO UPDATE
  SET all_statements = EXCLUDED.all_statements
WHERE t.organisation_id = 'org_a';

INSERT INTO public.eyfs_statements AS t (sheet_name, all_statements, structured_statements, organisation_id)
VALUES ('AppSheet', '["b"]'::jsonb, '{}'::jsonb, 'org_a')
ON CONFLICT (organisation_id, sheet_name) DO UPDATE
  SET all_statements = EXCLUDED.all_statements
WHERE t.organisation_id = 'org_a';

INSERT INTO results
SELECT 'app-style eyfs upsert updates same org',
       COUNT(*) = 1 AND bool_and(all_statements = '["b"]'::jsonb)
FROM public.eyfs_statements
WHERE organisation_id = 'org_a' AND sheet_name = 'AppSheet';

-- Same natural key in org_b must not collide
INSERT INTO public.eyfs_statements (sheet_name, all_statements, structured_statements, organisation_id)
VALUES ('AppSheet', '["b-org"]'::jsonb, '{}'::jsonb, 'org_b');

INSERT INTO results
SELECT 'app-style eyfs natural key is org-scoped',
       COUNT(*) = 2
FROM public.eyfs_statements WHERE sheet_name = 'AppSheet';

-- ---------------------------------------------------------------------------
-- Owner branding policy: own key ok; another user's key denied
-- ---------------------------------------------------------------------------
DO $$
DECLARE ok_write boolean := false; denied_other boolean := false; ok_read boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.branding_settings (key, data)
    VALUES ('user:00000000-0000-4000-8000-0000000000a1:custom_categories', '{"categories":[]}'::jsonb)
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
    ok_write := true;
  EXCEPTION WHEN insufficient_privilege OR OTHERS THEN
    ok_write := false;
  END;

  BEGIN
    INSERT INTO public.branding_settings (key, data)
    VALUES ('user:00000000-0000-4000-8000-0000000000b1:custom_categories', '{"categories":["hack"]}'::jsonb)
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
    denied_other := false;
  EXCEPTION WHEN insufficient_privilege OR check_violation OR OTHERS THEN
    denied_other := true;
  END;

  BEGIN
    PERFORM 1 FROM public.organisations WHERE id = 'org_a';
    ok_read := FOUND;
  EXCEPTION WHEN insufficient_privilege OR OTHERS THEN
    ok_read := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO results VALUES ('user can write own custom_categories branding key', ok_write);
  INSERT INTO results VALUES ('user cannot write another users custom_categories key', denied_other);
  INSERT INTO results VALUES ('school member can read own organisation', ok_read);
END $$;

-- School admin (role=admin) can read own org even when inactive
UPDATE public.organisations SET status = 'archived' WHERE id = 'org_a';

DO $$
DECLARE ok_read boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM 1 FROM public.organisations WHERE id = 'org_a';
    ok_read := FOUND;
  EXCEPTION WHEN OTHERS THEN
    ok_read := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO results VALUES ('school admin can read own inactive organisation', ok_read);
END $$;

UPDATE public.organisations SET status = 'active' WHERE id = 'org_a';

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------
DO $$
DECLARE failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM results WHERE NOT ok;
  RAISE NOTICE 'restore_cross_org_guards: % passed, % failed',
    (SELECT COUNT(*) FROM results WHERE ok), failed;
  IF failed > 0 THEN
    RAISE EXCEPTION 'restore_cross_org_guards failures: %',
      (SELECT string_agg(name, ', ') FROM results WHERE NOT ok);
  END IF;
END $$;

SELECT * FROM results ORDER BY name;

ROLLBACK;
