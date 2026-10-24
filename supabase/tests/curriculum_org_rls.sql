-- Org-scoped curriculum RLS (20261024235800).
-- Run after scratch schema + 240000 + 235800 (never production).
--   Included from run_restore_cross_org_guards.sh

BEGIN;

CREATE TEMP TABLE rls_results (name TEXT, ok BOOLEAN);

-- Seed orgs / users if missing
INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES
  ('org_a', 'Org A', 'org_a', 'org_a', 'Org A', 'Org A', 'active'),
  ('org_b', 'Org B', 'org_b', 'org_b', 'Org B', 'Org B', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'a@test'),
  ('00000000-0000-4000-8000-0000000000b1', 'b@test'),
  ('00000000-0000-4000-8000-0000000000s1', 'super@test'),
  ('00000000-0000-4000-8000-0000000000x1', 'suspended@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id, anonymised_at)
VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'a@test', 'teacher', 'active', 'org_a', NULL),
  ('00000000-0000-4000-8000-0000000000b1', 'b@test', 'teacher', 'active', 'org_b', NULL),
  ('00000000-0000-4000-8000-0000000000s1', 'super@test', 'super_admin', 'active', 'org_a', NULL),
  ('00000000-0000-4000-8000-0000000000x1', 'suspended@test', 'teacher', 'suspended', 'org_a', NULL)
ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      status = EXCLUDED.status,
      organisation_id = EXCLUDED.organisation_id,
      anonymised_at = EXCLUDED.anonymised_at;

DELETE FROM public.activities WHERE activity IN ('SysShared', 'OrgAOnly', 'OrgBOnly');
INSERT INTO public.activities (activity, category, lesson_number, description, organisation_id)
VALUES
  ('SysShared', 'Warm-up', '1', 'system', NULL),
  ('OrgAOnly', 'Warm-up', '1', 'a', 'org_a'),
  ('OrgBOnly', 'Warm-up', '1', 'b', 'org_b');

-- Teacher A: sees system + org_a, not org_b; can write org_a; cannot write org_b
DO $$
DECLARE
  n_sys int; n_a int; n_b int; wrote boolean := false; blocked boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;

  SELECT COUNT(*) INTO n_sys FROM public.activities WHERE activity = 'SysShared';
  SELECT COUNT(*) INTO n_a FROM public.activities WHERE activity = 'OrgAOnly';
  SELECT COUNT(*) INTO n_b FROM public.activities WHERE activity = 'OrgBOnly';

  BEGIN
    INSERT INTO public.activities (activity, category, lesson_number, description, organisation_id)
    VALUES ('AWrite', 'Warm-up', '9', 'ok', 'org_a');
    wrote := true;
  EXCEPTION WHEN OTHERS THEN
    wrote := false;
  END;

  BEGIN
    INSERT INTO public.activities (activity, category, lesson_number, description, organisation_id)
    VALUES ('BHack', 'Warm-up', '9', 'nope', 'org_b');
    blocked := false;
  EXCEPTION WHEN insufficient_privilege OR check_violation OR OTHERS THEN
    blocked := true;
  END;

  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  INSERT INTO rls_results VALUES ('teacher reads system activities', n_sys = 1);
  INSERT INTO rls_results VALUES ('teacher reads own-org activities', n_a = 1);
  INSERT INTO rls_results VALUES ('teacher cannot read other-org activities', n_b = 0);
  INSERT INTO rls_results VALUES ('teacher can insert own-org activity', wrote);
  INSERT INTO rls_results VALUES ('teacher cannot insert other-org activity', blocked);
END $$;

-- Lessons: teacher A can upsert own 4-col key; cannot touch org_b
DELETE FROM public.lessons WHERE sheet_name = 'RlsSheet';
INSERT INTO public.lessons (sheet_name, academic_year, user_id, data, lesson_numbers, teaching_units, organisation_id)
VALUES (
  'RlsSheet', '2025-2026', '00000000-0000-4000-8000-0000000000b1',
  '{"owner":"b"}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'org_b'
);

DO $$
DECLARE wrote boolean := false; n_b int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.lessons AS t (
      sheet_name, academic_year, user_id, data, lesson_numbers, teaching_units, organisation_id
    ) VALUES (
      'RlsSheet', '2025-2026', '00000000-0000-4000-8000-0000000000a1',
      '{"owner":"a"}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'org_a'
    )
    ON CONFLICT (organisation_id, sheet_name, academic_year, user_id) DO UPDATE
      SET data = EXCLUDED.data
    WHERE t.organisation_id = 'org_a';
    wrote := true;
  EXCEPTION WHEN OTHERS THEN
    wrote := false;
  END;
  SELECT COUNT(*) INTO n_b FROM public.lessons WHERE organisation_id = 'org_b' AND sheet_name = 'RlsSheet';
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('teacher can upsert own-org lesson', wrote);
  INSERT INTO rls_results VALUES ('teacher cannot see other-org lesson', n_b = 0);
END $$;

-- EYFS: org-scoped write
DELETE FROM public.eyfs_statements WHERE sheet_name = 'RlsEyfs';
DO $$
DECLARE wrote boolean := false; blocked boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.eyfs_statements AS t (sheet_name, all_statements, structured_statements, organisation_id)
    VALUES ('RlsEyfs', '["a"]'::jsonb, '{}'::jsonb, 'org_a')
    ON CONFLICT (organisation_id, sheet_name) DO UPDATE
      SET all_statements = EXCLUDED.all_statements
    WHERE t.organisation_id = 'org_a';
    wrote := true;
  EXCEPTION WHEN OTHERS THEN
    wrote := false;
  END;
  BEGIN
    INSERT INTO public.eyfs_statements (sheet_name, all_statements, structured_statements, organisation_id)
    VALUES ('RlsEyfs', '["hack"]'::jsonb, '{}'::jsonb, 'org_b');
    blocked := false;
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('teacher can upsert own-org eyfs', wrote);
  INSERT INTO rls_results VALUES ('teacher cannot upsert other-org eyfs', blocked);
END $$;

-- Suspended user cannot read own org
DO $$
DECLARE ok_denied boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000x1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM 1 FROM public.organisations WHERE id = 'org_a';
    ok_denied := NOT FOUND;
  EXCEPTION WHEN OTHERS THEN
    ok_denied := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('suspended user cannot read own organisation', ok_denied);
END $$;

-- Super-admin can read other-org activities
DO $$
DECLARE n_b int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000s1', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n_b FROM public.activities WHERE activity = 'OrgBOnly';
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('super_admin can read other-org activities', n_b = 1);
END $$;

DO $$
DECLARE failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM rls_results WHERE NOT ok;
  RAISE NOTICE 'curriculum_org_rls: % passed, % failed',
    (SELECT COUNT(*) FROM rls_results WHERE ok), failed;
  IF failed > 0 THEN
    RAISE EXCEPTION 'curriculum_org_rls failures: %',
      (SELECT string_agg(name, ', ') FROM rls_results WHERE NOT ok);
  END IF;
END $$;

SELECT * FROM rls_results ORDER BY name;

ROLLBACK;
