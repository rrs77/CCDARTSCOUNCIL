-- Personal planner curriculum RLS (20261024330000).
-- Run after scratch + 240000..330000 (never production).

BEGIN;

CREATE TEMP TABLE rls_results (name TEXT, ok BOOLEAN);

INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES
  ('org_a', 'Org A', 'org_a', 'org_a', 'Org A', 'Org A', 'active'),
  ('org_b', 'Org B', 'org_b', 'org_b', 'Org B', 'Org B', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'teacher_a@test'),
  ('00000000-0000-4000-8000-0000000000a2', 'admin_a@test'),
  ('00000000-0000-4000-8000-0000000000a3', 'teacher_a2@test'),
  ('00000000-0000-4000-8000-0000000000b1', 'teacher_b@test'),
  ('00000000-0000-4000-8000-0000000000a5', 'super@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id, anonymised_at, can_manage_users)
VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'teacher_a@test', 'teacher', 'active', 'org_a', NULL, false),
  ('00000000-0000-4000-8000-0000000000a2', 'admin_a@test', 'admin', 'active', 'org_a', NULL, true),
  ('00000000-0000-4000-8000-0000000000a3', 'teacher_a2@test', 'teacher', 'active', 'org_a', NULL, false),
  ('00000000-0000-4000-8000-0000000000b1', 'teacher_b@test', 'teacher', 'active', 'org_b', NULL, false),
  ('00000000-0000-4000-8000-0000000000a5', 'super@test', 'super_admin', 'active', 'org_a', NULL, true)
ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      status = EXCLUDED.status,
      organisation_id = EXCLUDED.organisation_id,
      anonymised_at = EXCLUDED.anonymised_at,
      can_manage_users = EXCLUDED.can_manage_users;

DELETE FROM public.planner_curriculum_user
WHERE organisation_id IN ('org_a', 'org_b');

-- Owner (teacher A) can insert + read + update own row
DO $$
DECLARE wrote boolean := false; n int; stamped boolean := false; updated boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.planner_curriculum_user (user_id, organisation_id, data)
    VALUES (
      '00000000-0000-4000-8000-0000000000a1',
      'org_a',
      '{"statements":[{"id":"p1","strandId":"s1","text":"Mine"}],"overrides":{},"hiddenIds":[],"frameworks":[],"strands":[]}'::jsonb
    );
    wrote := true;
  EXCEPTION WHEN OTHERS THEN
    wrote := false;
  END;
  SELECT COUNT(*) INTO n FROM public.planner_curriculum_user
  WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
  SELECT updated_by = '00000000-0000-4000-8000-0000000000a1'::uuid INTO stamped
  FROM public.planner_curriculum_user
  WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
  BEGIN
    UPDATE public.planner_curriculum_user
    SET data = '{"statements":[],"overrides":{},"hiddenIds":["school-1"],"frameworks":[],"strands":[]}'::jsonb
    WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
    updated := true;
  EXCEPTION WHEN OTHERS THEN
    updated := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('owner can insert personal curriculum', wrote AND n = 1);
  INSERT INTO rls_results VALUES ('owner stamp sets updated_by', COALESCE(stamped, false));
  INSERT INTO rls_results VALUES ('owner can update personal curriculum', updated);
END $$;

-- Same-org colleague (teacher A2) cannot read or write owner's row
DO $$
DECLARE n int; hacked boolean := false; stole_owner boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a3', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.planner_curriculum_user
  WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
  BEGIN
    UPDATE public.planner_curriculum_user
    SET data = '{"hacked":true}'::jsonb
    WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
    hacked := EXISTS (
      SELECT 1 FROM public.planner_curriculum_user
      WHERE user_id = '00000000-0000-4000-8000-0000000000a1'
        AND data = '{"hacked":true}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    hacked := false;
  END;
  BEGIN
    -- Stamp rewrites user_id to caller; must never create/overwrite a1's row.
    INSERT INTO public.planner_curriculum_user (user_id, organisation_id, data)
    VALUES (
      '00000000-0000-4000-8000-0000000000a1',
      'org_a',
      '{"stolen":true}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  stole_owner := EXISTS (
    SELECT 1 FROM public.planner_curriculum_user
    WHERE user_id = '00000000-0000-4000-8000-0000000000a1'
      AND data ? 'stolen'
  );
  -- Clean up any accidental own-row created for a3 by the stamp rewrite.
  DELETE FROM public.planner_curriculum_user
  WHERE user_id = '00000000-0000-4000-8000-0000000000a3';
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('same-org colleague cannot read personal curriculum', n = 0);
  INSERT INTO rls_results VALUES ('same-org colleague cannot update personal curriculum', NOT hacked);
  INSERT INTO rls_results VALUES ('same-org colleague cannot insert as other user', NOT stole_owner);
END $$;

-- Different org cannot read
DO $$
DECLARE n int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b1', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.planner_curriculum_user
  WHERE organisation_id = 'org_a';
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('other-org teacher cannot read personal curriculum', n = 0);
END $$;

-- Anon cannot read or write
DO $$
DECLARE n int; wrote boolean := false;
BEGIN
  SET LOCAL ROLE anon;
  BEGIN
    SELECT COUNT(*) INTO n FROM public.planner_curriculum_user;
  EXCEPTION WHEN OTHERS THEN
    n := -1; -- privilege failure counts as blocked
  END;
  BEGIN
    INSERT INTO public.planner_curriculum_user (user_id, organisation_id, data)
    VALUES ('00000000-0000-4000-8000-0000000000a1', 'org_a', '{}'::jsonb);
    wrote := true;
  EXCEPTION WHEN OTHERS THEN
    wrote := false;
  END;
  RESET ROLE;
  INSERT INTO rls_results VALUES (
    'anon cannot read personal curriculum',
    n = 0 OR n = -1
  );
  INSERT INTO rls_results VALUES ('anon cannot write personal curriculum', NOT wrote);
END $$;

-- Org admin can READ but cannot WRITE owner's personal row
DO $$
DECLARE n int; hacked boolean := false; deleted boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a2', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.planner_curriculum_user
  WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
  BEGIN
    UPDATE public.planner_curriculum_user
    SET data = '{"admin_write":true}'::jsonb
    WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
    hacked := EXISTS (
      SELECT 1 FROM public.planner_curriculum_user
      WHERE user_id = '00000000-0000-4000-8000-0000000000a1'
        AND data = '{"admin_write":true}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    hacked := false;
  END;
  BEGIN
    DELETE FROM public.planner_curriculum_user
    WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
    deleted := NOT EXISTS (
      SELECT 1 FROM public.planner_curriculum_user
      WHERE user_id = '00000000-0000-4000-8000-0000000000a1'
    );
  EXCEPTION WHEN OTHERS THEN
    deleted := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('org admin can read personal curriculum', n = 1);
  INSERT INTO rls_results VALUES ('org admin cannot update personal curriculum', NOT hacked);
  INSERT INTO rls_results VALUES ('org admin cannot delete personal curriculum', NOT deleted);
END $$;

-- Super admin can READ but cannot WRITE another's personal row
DO $$
DECLARE n int; hacked boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a5', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.planner_curriculum_user
  WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
  BEGIN
    UPDATE public.planner_curriculum_user
    SET data = '{"super_write":true}'::jsonb
    WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
    hacked := EXISTS (
      SELECT 1 FROM public.planner_curriculum_user
      WHERE user_id = '00000000-0000-4000-8000-0000000000a1'
        AND data = '{"super_write":true}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    hacked := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('super admin can read personal curriculum', n = 1);
  INSERT INTO rls_results VALUES ('super admin cannot update others personal curriculum', NOT hacked);
END $$;

-- Owner can still delete own row
DO $$
DECLARE ok boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    DELETE FROM public.planner_curriculum_user
    WHERE user_id = '00000000-0000-4000-8000-0000000000a1';
    ok := NOT EXISTS (
      SELECT 1 FROM public.planner_curriculum_user
      WHERE user_id = '00000000-0000-4000-8000-0000000000a1'
    );
  EXCEPTION WHEN OTHERS THEN
    ok := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO rls_results VALUES ('owner can delete personal curriculum', ok);
END $$;

DO $$
DECLARE failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM rls_results WHERE NOT ok;
  RAISE NOTICE 'planner_curriculum_user_rls: % passed, % failed',
    (SELECT COUNT(*) FROM rls_results WHERE ok), failed;
  IF failed > 0 THEN
    RAISE EXCEPTION 'planner_curriculum_user_rls failures: %',
      (SELECT string_agg(name, ', ') FROM rls_results WHERE NOT ok);
  END IF;
END $$;

SELECT * FROM rls_results ORDER BY name;

ROLLBACK;
