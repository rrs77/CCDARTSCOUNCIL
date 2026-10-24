-- Cross-org restore guards (20261024240000).
-- Run against a scratch Postgres with migrations applied (never production):
--   psql -v ON_ERROR_STOP=1 -d <scratch> -f supabase/tests/restore_cross_org_guards.sql
-- Everything runs inside a transaction that is rolled back.

BEGIN;

CREATE TEMP TABLE results (name TEXT, ok BOOLEAN);

-- Seed two organisations (ignore if already present).
INSERT INTO public.organisations (id)
SELECT x FROM (VALUES ('org_a'), ('org_b')) v(x)
WHERE NOT EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = v.x)
ON CONFLICT DO NOTHING;

-- Fallback if organisations has no usable insert shape: require rows exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organisations WHERE id = 'org_a')
     OR NOT EXISTS (SELECT 1 FROM public.organisations WHERE id = 'org_b') THEN
    RAISE EXCEPTION 'test requires organisations org_a and org_b';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- (a) Cross-org id: restoring org_a must not claim org_b's year_groups.id
-- ---------------------------------------------------------------------------
DELETE FROM public.year_groups WHERE id IN ('yg-b-1', 'yg-a-new');
INSERT INTO public.year_groups (id, name, organisation_id)
VALUES ('yg-b-1', 'Year B', 'org_b');

DO $$
DECLARE
  err text;
BEGIN
  BEGIN
    PERFORM public.restore_curriculum_backup(
      jsonb_build_object(
        'yearGroups', jsonb_build_array(
          jsonb_build_object('id', 'yg-b-1', 'name', 'Stolen')
        )
      ),
      'org_a',
      true  -- dry_run still runs guards
    );
    INSERT INTO results VALUES ('cross-org year_groups id raises 42501', false);
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    INSERT INTO results VALUES (
      'cross-org year_groups id raises 42501',
      err ILIKE '%cross-org%' OR SQLSTATE = '42501'
    );
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    INSERT INTO results VALUES (
      'cross-org year_groups id raises 42501',
      SQLSTATE = '42501' OR err ILIKE '%cross-org%'
    );
  END;
END $$;

INSERT INTO results
SELECT 'org_b year_groups row untouched',
       name = 'Year B' AND organisation_id = 'org_b'
FROM public.year_groups WHERE id = 'yg-b-1';

-- ---------------------------------------------------------------------------
-- (b) Natural keys: org_a restore with same sheet_name must not move org_b row
-- ---------------------------------------------------------------------------
DELETE FROM public.lessons
WHERE sheet_name = 'SharedSheet' AND organisation_id IN ('org_a', 'org_b');

INSERT INTO public.lessons (sheet_name, data, lesson_numbers, teaching_units, organisation_id)
VALUES (
  'SharedSheet',
  '{"owner":"b"}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'org_b'
);

DO $$
DECLARE
  res jsonb;
BEGIN
  res := public.restore_curriculum_backup(
    jsonb_build_object(
      'lessons', jsonb_build_array(
        jsonb_build_object(
          'sheet_name', 'SharedSheet',
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

-- Activities natural key isolation
DELETE FROM public.activities
WHERE activity = 'Clap' AND category = 'Warm-up' AND lesson_number = '1'
  AND organisation_id IN ('org_a', 'org_b');

INSERT INTO public.activities (activity, category, lesson_number, description, organisation_id)
VALUES ('Clap', 'Warm-up', '1', 'belongs to B', 'org_b');

DO $$
DECLARE
  res jsonb;
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
       description = 'belongs to B' AND organisation_id = 'org_b'
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
-- Report
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  failed int;
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
