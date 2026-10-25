-- Scratch tests for 20261024235000 + 20261024235500 (never production).
-- Expects prior MIS + profiles helpers already applied.
BEGIN;

CREATE TEMP TABLE results (name TEXT, ok BOOLEAN);

INSERT INTO results
SELECT 'force insert trigger present',
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'mis_integration_requests_force_insert'
  );

-- Static: full_user_admin body
INSERT INTO results
SELECT 'full_user_admin omits role=admin',
  position('''admin''' in pg_get_functiondef('public.current_user_is_full_user_admin()'::regprocedure)) = 0
  AND position('super_admin' in pg_get_functiondef('public.current_user_is_full_user_admin()'::regprocedure)) > 0;

INSERT INTO results
SELECT 'gate delete policy is super-admin',
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'mis_activation_gates'
      AND policyname = 'mis_activation_gates_delete'
      AND qual ILIKE '%is_super_admin%'
  );

INSERT INTO results
SELECT 'connection org match trigger on requests',
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'mis_integration_requests_connection_org'
  );

INSERT INTO results
SELECT 'connection org match trigger on year_group_mappings',
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'mis_year_group_mappings_connection_org'
  );

INSERT INTO results
SELECT 'request update protect trigger',
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'mis_integration_requests_protect_update'
  );

INSERT INTO results
SELECT 'forum_is_moderator omits blanket admin role list',
  position('role IN (''admin''' in pg_get_functiondef('public.forum_is_moderator(uuid)'::regprocedure)) = 0;

DO $$
DECLARE r RECORD; failed int := 0;
BEGIN
  FOR r IN SELECT * FROM results ORDER BY name LOOP
    RAISE NOTICE '% => %', r.name, CASE WHEN r.ok THEN 'PASS' ELSE 'FAIL' END;
    IF NOT r.ok THEN failed := failed + 1; END IF;
  END LOOP;
  IF failed > 0 THEN RAISE EXCEPTION '% assertion(s) failed', failed; END IF;
END $$;

ROLLBACK;
