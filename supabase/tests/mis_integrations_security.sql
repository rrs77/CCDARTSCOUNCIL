-- Security checks for MIS integrations (super_admin vs school admin).
-- Run against a scratch Postgres with Supabase stand-ins (never production):
--   psql -v ON_ERROR_STOP=1 -d <scratch> \
--     -f supabase/migrations/20260903_hub_administration.sql \
--     -f supabase/migrations/20261019120100_profiles_admin_read_scope.sql \
--     -f supabase/migrations/20261024205000_mis_integrations.sql \
--     -f supabase/migrations/20261024210000_mis_integrations_super_admin_scope.sql \
--     -f supabase/tests/mis_integrations_security.sql
-- Everything runs inside a transaction that is rolled back.
BEGIN;

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

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'org-a-admin@test'),
  ('22222222-2222-2222-2222-222222222222', 'spoof@test'),
  ('33333333-3333-3333-3333-333333333333', 'suspended@test'),
  ('44444444-4444-4444-4444-444444444444', 'super@test'),
  ('55555555-5555-5555-5555-555555555555', 'org-b-admin@test')
ON CONFLICT (id) DO NOTHING;

-- School managers: role=admin (current_user_is_full_user_admin() is TRUE for these)
INSERT INTO public.profiles (id, email, role, status, organisation_id, school_or_org)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'org-a-admin@test', 'admin', 'active', 'org-a', 'org-a'),
  ('22222222-2222-2222-2222-222222222222', 'spoof@test', 'teacher', 'active', 'org-b', 'org-a'),
  ('33333333-3333-3333-3333-333333333333', 'suspended@test', 'admin', 'suspended', 'org-a', 'org-a'),
  ('44444444-4444-4444-4444-444444444444', 'super@test', 'super_admin', 'active', NULL, NULL),
  ('55555555-5555-5555-5555-555555555555', 'org-b-admin@test', 'admin', 'active', 'org-b', 'org-b')
ON CONFLICT (id) DO UPDATE SET
  organisation_id = EXCLUDED.organisation_id,
  school_or_org = EXCLUDED.school_or_org,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

INSERT INTO public.mis_org_connections (id, organisation_id, provider_id, status, created_by)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'org-a',
    'wonde',
    'draft',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'org-b',
    'wonde',
    'draft',
    '55555555-5555-5555-5555-555555555555'
  )
ON CONFLICT (organisation_id, provider_id) DO NOTHING;

INSERT INTO public.mis_org_connection_secrets (connection_id, config_placeholder)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"token_placeholder":"org-a-secret"}'::jsonb),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"token_placeholder":"org-b-secret"}'::jsonb)
ON CONFLICT (connection_id) DO UPDATE SET config_placeholder = EXCLUDED.config_placeholder;

-- Static: helpers must not use school_or_org or current_user_is_full_user_admin
INSERT INTO results
SELECT 'helper mis_user_in_org omits school_or_org',
  position('school_or_org' in pg_get_functiondef('public.mis_user_in_org(text)'::regprocedure)) = 0;

INSERT INTO results
SELECT 'helper mis_user_can_manage_org omits school_or_org',
  position('school_or_org' in pg_get_functiondef('public.mis_user_can_manage_org(text)'::regprocedure)) = 0;

INSERT INTO results
SELECT 'helper mis_user_in_org omits full_user_admin',
  position('current_user_is_full_user_admin' in pg_get_functiondef('public.mis_user_in_org(text)'::regprocedure)) = 0;

INSERT INTO results
SELECT 'helper mis_user_can_manage_org omits full_user_admin',
  position('current_user_is_full_user_admin' in pg_get_functiondef('public.mis_user_can_manage_org(text)'::regprocedure)) = 0;

INSERT INTO results
SELECT 'gate trigger uses is_super_admin not full_user_admin',
  position('is_super_admin' in pg_get_functiondef('public.mis_protect_provider_gates()'::regprocedure)) > 0
  AND position('current_user_is_full_user_admin' in pg_get_functiondef('public.mis_protect_provider_gates()'::regprocedure)) = 0;

-- Baseline: school admin IS a "full user admin" in the legacy helper (the bug class)
SELECT pg_temp.as_user('11111111-1111-1111-1111-111111111111');
INSERT INTO results
SELECT 'repro: school admin is full_user_admin (legacy)',
  public.current_user_is_full_user_admin() = true;
INSERT INTO results
SELECT 'repro: school admin is NOT is_super_admin',
  public.is_super_admin() = false;

-- Spoof via school_or_org must fail
SELECT pg_temp.as_user('22222222-2222-2222-2222-222222222222');
INSERT INTO results
SELECT 'spoof school_or_org cannot pass mis_user_in_org(org-a)',
  NOT public.mis_user_in_org('org-a');
INSERT INTO results
SELECT 'spoof school_or_org cannot manage org-a',
  NOT public.mis_user_can_manage_org('org-a');

SET LOCAL ROLE authenticated;

-- School admin org-a: own org only — cannot manage or read org-b
SELECT pg_temp.as_user('11111111-1111-1111-1111-111111111111');
INSERT INTO results
SELECT 'school admin can manage own org-a',
  public.mis_user_can_manage_org('org-a');
INSERT INTO results
SELECT 'school admin cannot manage other org-b',
  NOT public.mis_user_can_manage_org('org-b');
INSERT INTO results
SELECT 'school admin cannot in_org other org-b',
  NOT public.mis_user_in_org('org-b');
INSERT INTO results
SELECT 'school admin sees only own connections',
  (SELECT COUNT(*) FROM public.mis_org_connections) = 1
  AND (SELECT organisation_id FROM public.mis_org_connections LIMIT 1) = 'org-a';
INSERT INTO results
SELECT 'school admin cannot read any connection secrets',
  (SELECT COUNT(*) FROM public.mis_org_connection_secrets) = 0;

-- School admin cannot mark protected gates (even on own org)
DO $$
BEGIN
  UPDATE public.mis_activation_gates
  SET met = true
  WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    AND gate_id = 'provider_approval_confirmed';
  INSERT INTO results VALUES ('school admin blocked from provider_approval gate', false);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO results VALUES ('school admin blocked from provider_approval gate', true);
END $$;

DO $$
BEGIN
  UPDATE public.mis_activation_gates
  SET met = true
  WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    AND gate_id = 'commercial_terms_confirmed';
  INSERT INTO results VALUES ('school admin blocked from commercial_terms gate', false);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO results VALUES ('school admin blocked from commercial_terms gate', true);
END $$;

-- School admin CAN mark non-protected gates on own org
UPDATE public.mis_activation_gates
SET met = true
WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND gate_id = 'docs_reviewed';
INSERT INTO results
SELECT 'school admin can set docs_reviewed on own org',
  met FROM public.mis_activation_gates
  WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    AND gate_id = 'docs_reviewed';

-- Suspended denied
SELECT pg_temp.as_user('33333333-3333-3333-3333-333333333333');
INSERT INTO results
SELECT 'suspended user denied mis_user_in_org',
  NOT public.mis_user_in_org('org-a');

-- Super-admin can set protected gates, read all secrets, manage any org
SELECT pg_temp.as_user('44444444-4444-4444-4444-444444444444');
INSERT INTO results
SELECT 'super-admin can manage org-a and org-b',
  public.mis_user_can_manage_org('org-a') AND public.mis_user_can_manage_org('org-b');

UPDATE public.mis_activation_gates
SET met = true
WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND gate_id = 'provider_approval_confirmed';
INSERT INTO results
SELECT 'super-admin can set provider_approval gate',
  met FROM public.mis_activation_gates
  WHERE connection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    AND gate_id = 'provider_approval_confirmed';

INSERT INTO results
SELECT 'super-admin can read all connection secrets',
  (SELECT COUNT(*) FROM public.mis_org_connection_secrets) = 2;

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
