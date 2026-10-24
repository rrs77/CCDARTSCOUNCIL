-- Org-scoped curriculum RLS (20261024240500).
-- Run after scratch schema + 240000 + 240500 (never production).
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
  ('00000000-0000-4000-8000-0000000000a2', 'a2@test'),
  ('00000000-0000-4000-8000-0000000000b1', 'b@test'),
  ('00000000-0000-4000-8000-0000000000a5', 'super@test'),
  ('00000000-0000-4000-8000-0000000000a6', 'suspended@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id, anonymised_at)
VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'a@test', 'teacher', 'active', 'org_a', NULL),
  ('00000000-0000-4000-8000-0000000000a2', 'a2@test', 'teacher', 'active', 'org_a', NULL),
  ('00000000-0000-4000-8000-0000000000b1', 'b@test', 'teacher', 'active', 'org_b', NULL),
  ('00000000-0000-4000-8000-0000000000a5', 'super@test', 'super_admin', 'active', 'org_a', NULL),
  ('00000000-0000-4000-8000-0000000000a6', 'suspended@test', 'teacher', 'suspended', 'org_a', NULL)
ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      status = EXCLUDED.status,
      organisation_id = EXCLUDED.organisation_id,
      anonymised_at = EXCLUDED.anonymised_at;

DELETE FROM public.activities WHERE activity IN ('SysShared', 'OrgAOnly', 'OrgBOnly', 'AWrite', 'BHack');
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

-- L1: colleague cannot overwrite another teacher's lesson in the same org
DELETE FROM public.lessons
WHERE sheet_name = 'ColleagueSheet' AND organisation_id = 'org_a';
INSERT INTO public.lessons (sheet_name, academic_year, user_id, data, lesson_numbers, teaching_units, organisation_id)
VALUES (
  'ColleagueSheet', '2025-2026', '00000000-0000-4000-8000-0000000000a2',
  '{"owner":"a2"}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'org_a'
);

DO $$
DECLARE blocked boolean := false; still_a2 boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.lessons
    SET data = '{"owner":"hacked"}'::jsonb
    WHERE organisation_id = 'org_a'
      AND sheet_name = 'ColleagueSheet'
      AND user_id = '00000000-0000-4000-8000-0000000000a2';
    -- 0 rows updated under RLS still counts as success for UPDATE; treat as blocked if data unchanged
    blocked := true;
  EXCEPTION WHEN insufficient_privilege OR check_violation OR OTHERS THEN
    blocked := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  SELECT data->>'owner' = 'a2' INTO still_a2
  FROM public.lessons
  WHERE organisation_id = 'org_a'
    AND sheet_name = 'ColleagueSheet'
    AND user_id = '00000000-0000-4000-8000-0000000000a2';
  INSERT INTO rls_results VALUES ('colleague cannot overwrite other teacher lesson', blocked AND still_a2);
END $$;

-- Colleague cannot insert as another user_id
DO $$
DECLARE blocked boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.lessons (
      sheet_name, academic_year, user_id, data, lesson_numbers, teaching_units, organisation_id
    ) VALUES (
      'ColleagueSheet', '2026-2027', '00000000-0000-4000-8000-0000000000a2',
      '{"owner":"spoof"}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'org_a'
    );
    blocked := false;
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('colleague cannot insert lesson as other user_id', blocked);
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

-- half_terms: owner-scoped (planner leak) — colleague cannot read/write other user_id rows
DELETE FROM public.half_terms WHERE id IN ('ht_a1', 'ht_a2', 'ht_sys');
INSERT INTO public.half_terms (id, sheet_name, academic_year, name, organisation_id, user_id)
VALUES
  ('ht_sys', 'Shared', '2025-2026', 'System HT', NULL, NULL),
  ('ht_a1', 'Planner', '2025-2026', 'A1 HT', 'org_a', '00000000-0000-4000-8000-0000000000a1'),
  ('ht_a2', 'Planner', '2025-2026', 'A2 HT', 'org_a', '00000000-0000-4000-8000-0000000000a2');

DO $$
DECLARE n_sys int; n_own int; n_colleague int; wrote boolean := false; blocked boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n_sys FROM public.half_terms WHERE id = 'ht_sys';
  SELECT COUNT(*) INTO n_own FROM public.half_terms WHERE id = 'ht_a1';
  SELECT COUNT(*) INTO n_colleague FROM public.half_terms WHERE id = 'ht_a2';
  BEGIN
    INSERT INTO public.half_terms (id, sheet_name, academic_year, name, organisation_id, user_id)
    VALUES ('ht_a1_new', 'Planner', '2025-2026', 'mine', 'org_a', '00000000-0000-4000-8000-0000000000a1');
    wrote := true;
  EXCEPTION WHEN OTHERS THEN
    wrote := false;
  END;
  BEGIN
    INSERT INTO public.half_terms (id, sheet_name, academic_year, name, organisation_id, user_id)
    VALUES ('ht_spoof', 'Planner', '2025-2026', 'spoof', 'org_a', '00000000-0000-4000-8000-0000000000a2');
    blocked := false;
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('teacher reads system half_terms', n_sys = 1);
  INSERT INTO rls_results VALUES ('teacher reads own half_terms', n_own = 1);
  INSERT INTO rls_results VALUES ('teacher cannot read colleague half_terms', n_colleague = 0);
  INSERT INTO rls_results VALUES ('teacher can insert own half_terms', wrote);
  INSERT INTO rls_results VALUES ('teacher cannot insert half_terms as colleague', blocked);
END $$;

-- year_groups: org-scoped (no user_id owner)
DELETE FROM public.year_groups WHERE id IN ('yg_a', 'yg_b');
INSERT INTO public.year_groups (id, name, organisation_id)
VALUES ('yg_a', 'Year A', 'org_a'), ('yg_b', 'Year B', 'org_b');

DO $$
DECLARE n_a int; n_b int; wrote boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n_a FROM public.year_groups WHERE id = 'yg_a';
  SELECT COUNT(*) INTO n_b FROM public.year_groups WHERE id = 'yg_b';
  BEGIN
    INSERT INTO public.year_groups (id, name, organisation_id)
    VALUES ('yg_a_new', 'Year A2', 'org_a');
    wrote := true;
  EXCEPTION WHEN OTHERS THEN
    wrote := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('teacher reads own-org year_groups', n_a = 1);
  INSERT INTO rls_results VALUES ('teacher cannot read other-org year_groups', n_b = 0);
  INSERT INTO rls_results VALUES ('teacher can insert own-org year_groups', wrote);
END $$;

-- Anon cannot read lessons
DO $$
DECLARE blocked boolean := false;
BEGIN
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM 1 FROM public.lessons LIMIT 1;
    blocked := false;
  EXCEPTION WHEN insufficient_privilege OR OTHERS THEN
    blocked := true;
  END;
  RESET ROLE;
  INSERT INTO rls_results VALUES ('anon cannot read lessons', blocked);
END $$;

-- Suspended user cannot read own org
DO $$
DECLARE ok_denied boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a6', true);
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
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a5', true);
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
