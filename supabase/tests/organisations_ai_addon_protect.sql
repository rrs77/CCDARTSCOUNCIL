-- Scratch-Postgres checks for protect_organisations_ai_addon.
-- Ordinary user, org admin, super admin, service_role JWT, and postgres SQL editor.
-- Everything runs inside a transaction that is rolled back.
BEGIN;

CREATE TEMP TABLE results (name TEXT, ok BOOLEAN);
GRANT ALL ON results TO authenticated, service_role;

CREATE OR REPLACE FUNCTION pg_temp.as_user(uid TEXT, jwt_role TEXT DEFAULT 'authenticated')
RETURNS void LANGUAGE sql AS $$
  SELECT
    set_config('request.jwt.claim.sub', uid, true),
    set_config('request.jwt.claim.role', jwt_role, true);
$$;

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'teacher@test'),
  ('22222222-2222-2222-2222-222222222222', 'org-admin@test'),
  ('33333333-3333-3333-3333-333333333333', 'super@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'teacher@test', 'teacher', 'active', 'school-a'),
  ('22222222-2222-2222-2222-222222222222', 'org-admin@test', 'admin', 'active', 'school-a'),
  ('33333333-3333-3333-3333-333333333333', 'super@test', 'super_admin', 'active', NULL)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  organisation_id = EXCLUDED.organisation_id;

-- Seed as postgres (SQL editor / migration role)
INSERT INTO public.organisations (id, name, status, ai_addon)
VALUES ('school-a', 'School A', 'active', false)
ON CONFLICT (id) DO UPDATE SET ai_addon = false, name = EXCLUDED.name;

-- Ordinary teacher cannot flip ai_addon (session role = authenticated)
SET LOCAL ROLE authenticated;
SELECT pg_temp.as_user('11111111-1111-1111-1111-111111111111', 'authenticated');
DO $$
BEGIN
  UPDATE public.organisations SET ai_addon = true WHERE id = 'school-a';
  INSERT INTO results VALUES ('ordinary user cannot set ai_addon', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO results VALUES ('ordinary user cannot set ai_addon', true);
END $$;

INSERT INTO results
SELECT 'ordinary user leave unchanged still false', ai_addon = false
FROM public.organisations WHERE id = 'school-a';

-- Org admin (school role=admin) also blocked — not platform super
SELECT pg_temp.as_user('22222222-2222-2222-2222-222222222222', 'authenticated');
DO $$
BEGIN
  UPDATE public.organisations SET ai_addon = true WHERE id = 'school-a';
  INSERT INTO results VALUES ('org admin cannot set ai_addon', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO results VALUES ('org admin cannot set ai_addon', true);
END $$;

-- Super admin can set ai_addon while still SET ROLE authenticated
SELECT pg_temp.as_user('33333333-3333-3333-3333-333333333333', 'authenticated');
DO $$
BEGIN
  UPDATE public.organisations SET ai_addon = true WHERE id = 'school-a';
  INSERT INTO results VALUES ('super admin can set ai_addon', true);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO results VALUES ('super admin can set ai_addon', false);
END $$;

INSERT INTO results
SELECT 'super admin flip persisted', ai_addon = true
FROM public.organisations WHERE id = 'school-a';

-- INSERT with ai_addon=true blocked for ordinary user
SELECT pg_temp.as_user('11111111-1111-1111-1111-111111111111', 'authenticated');
DO $$
BEGIN
  INSERT INTO public.organisations (id, name, ai_addon)
  VALUES ('school-b', 'School B', true);
  INSERT INTO results VALUES ('ordinary user cannot insert ai_addon true', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO results VALUES ('ordinary user cannot insert ai_addon true', true);
END $$;

RESET ROLE;

-- service_role session (current_user = service_role) can clear
SET LOCAL ROLE service_role;
SELECT pg_temp.as_user('11111111-1111-1111-1111-111111111111', 'service_role');
DO $$
BEGIN
  UPDATE public.organisations SET ai_addon = false WHERE id = 'school-a';
  INSERT INTO results VALUES ('service_role can clear ai_addon', true);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO results VALUES ('service_role can clear ai_addon', false);
END $$;
RESET ROLE;

-- SQL editor: auth.role() empty/null but current_user is postgres — must be allowed
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claim.role', '', true);
DO $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    INSERT INTO results VALUES ('postgres current_user can set ai_addon', false);
  ELSE
    BEGIN
      UPDATE public.organisations SET ai_addon = true WHERE id = 'school-a';
      INSERT INTO results VALUES ('postgres current_user can set ai_addon', true);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO results VALUES ('postgres current_user can set ai_addon', false);
    END;
  END IF;
END $$;

DO $$
DECLARE
  failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM results WHERE ok IS NOT TRUE;
  IF failed > 0 THEN
    RAISE EXCEPTION 'organisations_ai_addon_protect failures: %',
      (SELECT string_agg(name, ', ') FROM results WHERE ok IS NOT TRUE);
  END IF;
  RAISE NOTICE 'organisations_ai_addon_protect: all % checks passed', (SELECT COUNT(*) FROM results);
END $$;

ROLLBACK;
