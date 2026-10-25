-- Year-group / category NULL-org defaults + seed (20261024310000)
-- and planner_curriculum RLS (20261024320000).
-- Run after scratch + 240000 + 240500 + 310000 + 320000 (never production).

BEGIN;

CREATE TEMP TABLE rls_results (name TEXT, ok BOOLEAN);

-- Shared NULL-org defaults BEFORE org inserts so seed-on-create / seeded-once
-- marker captures the rows this test expects.
DELETE FROM public.year_groups WHERE id IN ('yg_shared_rec', 'yg_shared_y1');
INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES
  ('yg_shared_rec', 'Reception Music', 1, NULL),
  ('yg_shared_y1', 'Year 1 Music', 2, NULL);

DELETE FROM public.category_groups WHERE id IN ('cg_shared');
INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
VALUES ('cg_shared', 'Warm-ups', 1, NULL);

DELETE FROM public.custom_categories WHERE id IN ('cc_shared');
INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
VALUES ('cc_shared', 'Vocal Warmups', '#14B8A6', 1, NULL);

INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES
  ('org_a', 'Org A', 'org_a', 'org_a', 'Org A', 'Org A', 'active'),
  ('org_b', 'Org B', 'org_b', 'org_b', 'Org B', 'Org B', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'a@test'),
  ('00000000-0000-4000-8000-0000000000a2', 'admin_a@test'),
  ('00000000-0000-4000-8000-0000000000b1', 'b@test'),
  ('00000000-0000-4000-8000-0000000000a5', 'super@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id, anonymised_at, can_manage_users)
VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'a@test', 'teacher', 'active', 'org_a', NULL, false),
  ('00000000-0000-4000-8000-0000000000a2', 'admin_a@test', 'admin', 'active', 'org_a', NULL, true),
  ('00000000-0000-4000-8000-0000000000b1', 'b@test', 'teacher', 'active', 'org_b', NULL, false),
  ('00000000-0000-4000-8000-0000000000a5', 'super@test', 'super_admin', 'active', 'org_a', NULL, true)
ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      status = EXCLUDED.status,
      organisation_id = EXCLUDED.organisation_id,
      anonymised_at = EXCLUDED.anonymised_at,
      can_manage_users = EXCLUDED.can_manage_users;

-- Teacher can READ NULL-org defaults
DO $$
DECLARE n int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.year_groups WHERE organisation_id IS NULL;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('teacher reads NULL-org year_groups', n >= 2);
END $$;

-- Teacher cannot UPDATE NULL-org defaults
DO $$
DECLARE still_shared boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.year_groups SET name = 'Hacked' WHERE id = 'yg_shared_rec';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  SELECT name = 'Reception Music' AND organisation_id IS NULL INTO still_shared
  FROM public.year_groups WHERE id = 'yg_shared_rec';
  INSERT INTO rls_results VALUES ('teacher cannot change NULL-org defaults', still_shared);
END $$;

-- School admin cannot UPDATE NULL-org defaults
DO $$
DECLARE still_shared boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a2', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.year_groups SET name = 'HackedByAdmin' WHERE id = 'yg_shared_rec';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  SELECT name = 'Reception Music' AND organisation_id IS NULL INTO still_shared
  FROM public.year_groups WHERE id = 'yg_shared_rec';
  INSERT INTO rls_results VALUES ('school admin cannot change NULL-org defaults', still_shared);
END $$;

-- Super admin CAN update NULL-org defaults
DO $$
DECLARE ok boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a5', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.year_groups SET sort_order = 99 WHERE id = 'yg_shared_rec';
    ok := true;
  EXCEPTION WHEN OTHERS THEN
    ok := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('super admin can update NULL-org defaults', ok);
  -- restore
  UPDATE public.year_groups SET sort_order = 1 WHERE id = 'yg_shared_rec';
END $$;

-- School admin can edit own-org year group copy
DO $$
DECLARE wrote boolean := false; n int;
BEGIN
  -- ensure an org copy exists (postgres / service_role only — not via PostgREST)
  PERFORM private._ccd_seed_org_catalog_defaults('org_a');

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a2', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.year_groups
    SET name = 'Reception Music (School A)'
    WHERE organisation_id = 'org_a' AND name = 'Reception Music';
    wrote := true;
  EXCEPTION WHEN OTHERS THEN
    wrote := false;
  END;
  SELECT COUNT(*) INTO n FROM public.year_groups
  WHERE organisation_id = 'org_a' AND name = 'Reception Music (School A)';
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('school admin can edit own-org year_groups', wrote AND n = 1);
END $$;

-- New organisation is seeded from NULL-org defaults
DO $$
DECLARE n_yg int; n_cg int; n_cc int;
BEGIN
  INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
  VALUES ('org_seed', 'Seed Org', 'org_seed', 'org_seed', 'Seed Org', 'Seed', 'active')
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO n_yg FROM public.year_groups WHERE organisation_id = 'org_seed';
  SELECT COUNT(*) INTO n_cg FROM public.category_groups WHERE organisation_id = 'org_seed';
  SELECT COUNT(*) INTO n_cc FROM public.custom_categories WHERE organisation_id = 'org_seed';

  INSERT INTO rls_results VALUES ('new org seeded with year_groups copies', n_yg >= 2);
  INSERT INTO rls_results VALUES ('new org seeded with category_groups copies', n_cg >= 1);
  INSERT INTO rls_results VALUES ('new org seeded with custom_categories copies', n_cc >= 1);

  -- Idempotent: second seed does not duplicate
  PERFORM private._ccd_seed_org_catalog_defaults('org_seed');
  SELECT COUNT(*) INTO n_yg FROM public.year_groups WHERE organisation_id = 'org_seed';
  INSERT INTO rls_results VALUES ('seed is idempotent by name', n_yg >= 2 AND n_yg <= 10);
END $$;

-- ---------------------------------------------------------------------------
-- HIGH security: seed helper must not be callable by anon / authenticated
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  blocked_auth boolean := false;
  blocked_anon boolean := false;
  before_b int;
  after_b int;
  public_exists boolean;
BEGIN
  SELECT to_regprocedure('public.ccd_seed_org_catalog_defaults(text)') IS NOT NULL
    INTO public_exists;

  SELECT COUNT(*) INTO before_b
  FROM public.year_groups WHERE organisation_id = 'org_b';

  -- authenticated: public function gone, or EXECUTE denied (42501)
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    EXECUTE 'SELECT public.ccd_seed_org_catalog_defaults($1)' USING 'org_b';
    blocked_auth := false;
  EXCEPTION
    WHEN undefined_function THEN blocked_auth := true;      -- 42883
    WHEN insufficient_privilege THEN blocked_auth := true;  -- 42501
    WHEN OTHERS THEN blocked_auth := true;                  -- must not succeed
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  -- anon: same
  SET LOCAL ROLE anon;
  BEGIN
    EXECUTE 'SELECT public.ccd_seed_org_catalog_defaults($1)' USING 'org_b';
    blocked_anon := false;
  EXCEPTION
    WHEN undefined_function THEN blocked_anon := true;
    WHEN insufficient_privilege THEN blocked_anon := true;
    WHEN OTHERS THEN
      blocked_anon := true;
  END;
  RESET ROLE;

  SELECT COUNT(*) INTO after_b
  FROM public.year_groups WHERE organisation_id = 'org_b';

  INSERT INTO rls_results VALUES (
    'public.ccd_seed_org_catalog_defaults does not exist',
    NOT public_exists
  );
  INSERT INTO rls_results VALUES (
    'authenticated cannot call public seed helper',
    blocked_auth
  );
  INSERT INTO rls_results VALUES (
    'anon cannot call public seed helper',
    blocked_anon
  );
  INSERT INTO rls_results VALUES (
    'failed seed calls do not write into other org',
    after_b = before_b
  );

  -- authenticated also cannot EXECUTE the private helper directly
  blocked_auth := false;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM private._ccd_seed_org_catalog_defaults('org_b');
    blocked_auth := false;
  EXCEPTION
    WHEN insufficient_privilege THEN blocked_auth := true;
    WHEN OTHERS THEN blocked_auth := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  SELECT COUNT(*) INTO after_b
  FROM public.year_groups WHERE organisation_id = 'org_b';

  INSERT INTO rls_results VALUES (
    'authenticated cannot call private._ccd_seed_org_catalog_defaults',
    blocked_auth
  );
  INSERT INTO rls_results VALUES (
    'private seed denial does not write into other org',
    after_b = before_b
  );
END $$;

-- Shared defaults still exist after seed
INSERT INTO rls_results
SELECT 'NULL-org defaults retained after seed',
       COUNT(*) >= 2
FROM public.year_groups WHERE organisation_id IS NULL;

-- ---------------------------------------------------------------------------
-- planner_curriculum RLS
-- ---------------------------------------------------------------------------
DELETE FROM public.planner_curriculum WHERE organisation_id IN ('org_a', 'org_b');

-- Org admin can write (stamp trigger sets updated_by = auth.uid())
DO $$
DECLARE wrote boolean := false; n int; stamped boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a2', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.planner_curriculum (organisation_id, data)
    VALUES ('org_a', '{"frameworks":[{"id":"fw1","name":"NC"}]}'::jsonb);
    wrote := true;
  EXCEPTION WHEN OTHERS THEN
    wrote := false;
  END;
  SELECT COUNT(*) INTO n FROM public.planner_curriculum WHERE organisation_id = 'org_a';
  SELECT updated_by = '00000000-0000-4000-8000-0000000000a2'::uuid
    INTO stamped
  FROM public.planner_curriculum WHERE organisation_id = 'org_a';
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('org admin can write planner_curriculum', wrote AND n = 1);
  INSERT INTO rls_results VALUES ('planner_curriculum stamps updated_by', COALESCE(stamped, false));
END $$;

-- Teacher can read own org
DO $$
DECLARE n int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.planner_curriculum WHERE organisation_id = 'org_a';
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('teacher can read own-org planner_curriculum', n = 1);
END $$;

-- Teacher cannot write
DO $$
DECLARE blocked boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.planner_curriculum
    SET data = '{"frameworks":[]}'::jsonb
    WHERE organisation_id = 'org_a';
    -- 0-row update under RLS counts as blocked if data unchanged
    blocked := NOT EXISTS (
      SELECT 1 FROM public.planner_curriculum
      WHERE organisation_id = 'org_a' AND data = '{"frameworks":[]}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('teacher cannot write planner_curriculum', blocked);
END $$;

-- Teacher cannot read other org
DO $$
DECLARE n int;
BEGIN
  INSERT INTO public.planner_curriculum (organisation_id, data)
  VALUES ('org_b', '{"frameworks":[{"id":"b","name":"B"}]}'::jsonb)
  ON CONFLICT (organisation_id) DO UPDATE SET data = EXCLUDED.data;

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.planner_curriculum WHERE organisation_id = 'org_b';
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('teacher cannot read other-org planner_curriculum', n = 0);
END $$;

DO $$
DECLARE failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM rls_results WHERE NOT ok;
  RAISE NOTICE 'year_group_defaults_seed: % passed, % failed',
    (SELECT COUNT(*) FROM rls_results WHERE ok), failed;
  IF failed > 0 THEN
    RAISE EXCEPTION 'year_group_defaults_seed failures: %',
      (SELECT string_agg(name, ', ') FROM rls_results WHERE NOT ok);
  END IF;
END $$;

SELECT * FROM rls_results ORDER BY name;

ROLLBACK;
