-- Security checks for 20261024_mis_integrations.sql
-- Run against a scratch Postgres with Supabase stand-ins (never production):
--   psql -v ON_ERROR_STOP=1 -d <scratch> \
--     -f supabase/migrations/20261019_profiles_admin_read_scope.sql \
--     -f supabase/migrations/20261024_mis_integrations.sql \
--     -f supabase/tests/mis_integrations_security.sql
-- Everything runs inside a transaction that is rolled back.
BEGIN;

-- Stand-ins if auth helpers are missing on scratch
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'authenticated');
$$;

CREATE TEMP TABLE results (name TEXT, ok BOOLEAN);
GRANT ALL ON results TO authenticated;

CREATE OR REPLACE FUNCTION pg_temp.as_user(uid TEXT, role TEXT DEFAULT 'authenticated')
RETURNS void LANGUAGE sql AS $$
  SELECT
    set_config('request.jwt.claim.sub', uid, true),
    set_config('request.jwt.claim.role', role, true);
$$;

-- Profiles: org A teacher, org B attacker (tries school_or_org spoof), suspended, super-admin
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'org-a-admin@test'),
  ('22222222-2222-2222-2222-222222222222', 'spoof@test'),
  ('33333333-3333-3333-3333-333333333333', 'suspended@test'),
  ('44444444-4444-4444-4444-444444444444', 'super@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id, school_or_org)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'org-a-admin@test', 'admin', 'active', 'org-a', 'org-a'),
  -- Attacker: organisation_id = org-b, but school_or_org forged to org-a
  ('22222222-2222-2222-2222-222222222222', 'spoof@test', 'teacher', 'active', 'org-b', 'org-a'),
  ('33333333-3333-3333-3333-333333333333', 'suspended@test', 'admin', 'suspended', 'org-a', 'org-a'),
  ('44444444-4444-4444-4444-444444444444', 'super@test', 'super_admin', 'active', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  organisation_id = EXCLUDED.organisation_id,
  school_or_org = EXCLUDED.school_or_org,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

INSERT INTO public.mis_org_connections (id, organisation_id, provider_id, status, created_by)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'org-a',
  'wonde',
  'draft',
  '11111111-1111-1111-1111-111111111111'
) ON CONFLICT (organisation_id, provider_id) DO NOTHING;

INSERT INTO public.mis_org_connection_secrets (connection_id, config_placeholder)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '{"token_placeholder":"never-expose"}'::jsonb
) ON CONFLICT (connection_id) DO UPDATE SET config_placeholder = EXCLUDED.config_placeholder;

-- Static: helpers must not reference school_or_org
INSERT INTO results
SELECT 'helper mis_user_in_org omits school_or_org',
  position('school_or_org' in pg_get_functiondef('public.mis_user_in_org(text)'::regprocedure)) = 0;

INSERT INTO results
SELECT 'helper mis_user_can_manage_org omits school_or_org',
  position('school_or_org' in pg_get_functiondef('public.mis_user_can_manage_org(text)'::regprocedure)) = 0;

-- Spoof via school_or_org must fail
SELECT pg_temp.as_user('22222222-2222-2222-2222-222222222222');
INSERT INTO results
SELECT 'spoof school_or_org cannot pass mis_user_in_org(org-a)',
  NOT public.mis_user_in_org('org-a');
INSERT INTO results
SELECT 'spoof school_or_org cannot manage org-a',
  NOT public.mis_user_can_manage_org('org-a');

SET LOCAL ROLE authenticated;
SELECT pg_temp.as_user('22222222-2222-2222-2222-222222222222');
INSERT INTO results
SELECT 'spoof cannot SELECT org-a connections',
  (SELECT COUNT(*) FROM public.mis_org_connections WHERE organisation_id = 'org-a') = 0;

-- Suspended denied
SELECT pg_temp.as_user('33333333-3333-3333-3333-333333333333');
INSERT INTO results
SELECT 'suspended user denied mis_user_in_org',
  NOT public.mis_user_in_org('org-a');

-- Genuine org-a admin can see connection metadata
SELECT pg_temp.as_user('11111111-1111-1111-1111-111111111111');
INSERT INTO results
SELECT 'org-a admin can see own connection',
  (SELECT COUNT(*) FROM public.mis_org_connections WHERE organisation_id = 'org-a') = 1;
INSERT INTO results
SELECT 'org-a admin cannot read connection secrets',
  (SELECT COUNT(*) FROM public.mis_org_connection_secrets) = 0;

-- Org manager cannot mark protected gates
DO $$
BEGIN
  UPDATE public.mis_activation_gates
  SET met = true
  WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    AND gate_id = 'commercial_terms_confirmed';
  INSERT INTO results VALUES ('org manager blocked from commercial_terms gate', false);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO results VALUES ('org manager blocked from commercial_terms gate', true);
END $$;

DO $$
BEGIN
  UPDATE public.mis_activation_gates
  SET met = true
  WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    AND gate_id = 'provider_approval_confirmed';
  INSERT INTO results VALUES ('org manager blocked from provider_approval gate', false);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO results VALUES ('org manager blocked from provider_approval gate', true);
END $$;

-- Org manager CAN mark non-protected gates
UPDATE public.mis_activation_gates
SET met = true
WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND gate_id = 'docs_reviewed';
INSERT INTO results
SELECT 'org manager can set docs_reviewed',
  met FROM public.mis_activation_gates
  WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    AND gate_id = 'docs_reviewed';

-- Super-admin can set protected gates and read secrets
SELECT pg_temp.as_user('44444444-4444-4444-4444-444444444444');
UPDATE public.mis_activation_gates
SET met = true
WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND gate_id = 'commercial_terms_confirmed';
INSERT INTO results
SELECT 'super-admin can set commercial_terms gate',
  met FROM public.mis_activation_gates
  WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    AND gate_id = 'commercial_terms_confirmed';

INSERT INTO results
SELECT 'super-admin can read connection secrets',
  (SELECT COUNT(*) FROM public.mis_org_connection_secrets
   WHERE config_placeholder ? 'token_placeholder') = 1;

-- Report
DO $$
DECLARE
  r RECORD;
  failed int := 0;
BEGIN
  RAISE NOTICE '--- mis_integrations_security results ---';
  FOR r IN SELECT * FROM results ORDER BY name LOOP
    RAISE NOTICE '% => %', r.name, CASE WHEN r.ok THEN 'PASS' ELSE 'FAIL' END;
    IF NOT r.ok THEN failed := failed + 1; END IF;
  END LOOP;
  IF failed > 0 THEN
    RAISE EXCEPTION '% security assertion(s) failed', failed;
  END IF;
END $$;

ROLLBACK;
