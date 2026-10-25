-- Local RLS checks for 20261024180000_planning_shares.sql.
-- Run against a scratch Postgres with Supabase stand-ins (never production):
--   psql -v ON_ERROR_STOP=1 -d <scratch> -f supabase/migrations/20261024180000_planning_shares.sql
--   psql -v ON_ERROR_STOP=1 -d <scratch> -f supabase/tests/planning_shares_rls.sql
-- Everything runs inside a transaction that is rolled back.
BEGIN;

-- Ensure allowed_year_groups exists (live schemas / security-fixes have it).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allowed_year_groups text[];

INSERT INTO auth.users (id, email) VALUES
  ('10000000-0000-0000-0000-000000000001', 'owner@test'),
  ('10000000-0000-0000-0000-000000000002', 'colleague@test'),
  ('10000000-0000-0000-0000-000000000003', 'outsider@test'),
  ('10000000-0000-0000-0000-000000000004', 'admin@test'),
  ('10000000-0000-0000-0000-000000000005', 'suspended@test'),
  ('10000000-0000-0000-0000-000000000006', 'anonuser@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id, allowed_year_groups, anonymised_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'owner@test', 'teacher', 'active', 'org-a', ARRAY['yg-1']::text[], NULL),
  ('10000000-0000-0000-0000-000000000002', 'colleague@test', 'teacher', 'active', 'org-a', ARRAY['yg-1', 'yg-2']::text[], NULL),
  ('10000000-0000-0000-0000-000000000003', 'outsider@test', 'teacher', 'active', 'org-b', ARRAY['yg-1']::text[], NULL),
  ('10000000-0000-0000-0000-000000000004', 'admin@test', 'admin', 'active', 'org-a', NULL, NULL),
  ('10000000-0000-0000-0000-000000000005', 'suspended@test', 'teacher', 'suspended', 'org-a', ARRAY['yg-1']::text[], NULL),
  ('10000000-0000-0000-0000-000000000006', 'anonuser@test', 'teacher', 'active', 'org-a', ARRAY['yg-1']::text[], now())
ON CONFLICT (id) DO UPDATE SET
  organisation_id = EXCLUDED.organisation_id,
  status = EXCLUDED.status,
  allowed_year_groups = EXCLUDED.allowed_year_groups,
  anonymised_at = EXCLUDED.anonymised_at,
  role = EXCLUDED.role;

CREATE TEMP TABLE results (name TEXT, ok BOOLEAN);
GRANT ALL ON results TO authenticated;

CREATE OR REPLACE FUNCTION pg_temp.as_user(uid TEXT) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', uid, true),
         set_config('request.jwt.claim.role', 'authenticated', true),
         set_config('role', 'authenticated', true);
$$;

-- Seed as service / postgres (bypass RLS)
RESET ROLE;
SET LOCAL ROLE postgres;

INSERT INTO public.planning_share_resources (id, owner_id, resource_type, resource_id, title, organisation_id)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'lesson',
  'lesson-1',
  'Seed lesson',
  'CLIENT-FORGED-ORG'
);

INSERT INTO results
SELECT 'trigger: organisation_id from owner profile (ignore client)',
  organisation_id = 'org-a'
FROM public.planning_share_resources
WHERE id = '20000000-0000-0000-0000-000000000001';

INSERT INTO public.planning_groups (id, owner_id, organisation_id, label)
VALUES ('team-a', '10000000-0000-0000-0000-000000000001', 'org-a', 'Team A');

INSERT INTO public.planning_group_members (group_id, user_id, organisation_id)
VALUES
  ('team-a', '10000000-0000-0000-0000-000000000001', 'org-a'),
  ('team-a', '10000000-0000-0000-0000-000000000002', 'org-a');

INSERT INTO public.planning_shares (id, resource_id, shared_by, audience_type, audience_id, audience_label, permission)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'school',
    'org-a',
    'School A',
    'view'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'year_group',
    'yg-1',
    'Year 1',
    'view'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'group',
    'team-a',
    'Team A',
    'view'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'person',
    '10000000-0000-0000-0000-000000000002',
    'colleague',
    'view'
  );

-- (1) CRITICAL: members cannot INSERT as authenticated
SET LOCAL ROLE authenticated;
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000002');
DO $$ BEGIN
  INSERT INTO public.planning_group_members (group_id, user_id, organisation_id)
  VALUES ('team-a', '10000000-0000-0000-0000-000000000003', 'org-a');
  INSERT INTO results VALUES ('members: authenticated cannot INSERT', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  INSERT INTO results VALUES ('members: authenticated cannot INSERT', true);
END $$;

DO $$ BEGIN
  UPDATE public.planning_group_members SET organisation_id = 'hacked' WHERE user_id = auth.uid();
  INSERT INTO results VALUES ('members: authenticated cannot UPDATE', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  INSERT INTO results VALUES ('members: authenticated cannot UPDATE', true);
END $$;

DO $$ BEGIN
  DELETE FROM public.planning_group_members WHERE user_id = auth.uid();
  INSERT INTO results VALUES ('members: authenticated cannot DELETE', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  INSERT INTO results VALUES ('members: authenticated cannot DELETE', true);
END $$;

INSERT INTO results
SELECT 'members: self_read works', COUNT(*) = 1
FROM public.planning_group_members WHERE user_id = auth.uid();

-- self_all policy must be gone
INSERT INTO results
SELECT 'members: no self_all policy', COUNT(*) = 0
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'planning_group_members'
  AND policyname = 'planning_group_members_self_all';

-- (2) Helpers exist, SECURITY DEFINER, grants
INSERT INTO results
SELECT 'helper: can_read_planning_resource exists',
  COUNT(*) = 1
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'can_read_planning_resource';

INSERT INTO results
SELECT 'helper: owns_planning_resource exists',
  COUNT(*) = 1
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'owns_planning_resource';

INSERT INTO results
SELECT 'helper: EXECUTE revoked from anon',
  NOT has_function_privilege('anon', 'public.can_read_planning_resource(uuid)', 'EXECUTE');

INSERT INTO results
SELECT 'helper: EXECUTE granted to authenticated',
  has_function_privilege('authenticated', 'public.can_read_planning_resource(uuid)', 'EXECUTE');

-- Colleague (same org) can read via school grant — no recursion blow-up
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000002');
INSERT INTO results
SELECT 'read: colleague can_read school share',
  public.can_read_planning_resource('20000000-0000-0000-0000-000000000001');

INSERT INTO results
SELECT 'read: colleague sees resource row',
  COUNT(*) = 1
FROM public.planning_share_resources
WHERE id = '20000000-0000-0000-0000-000000000001';

INSERT INTO results
SELECT 'read: colleague sees share grants',
  COUNT(*) >= 1
FROM public.planning_shares
WHERE resource_id = '20000000-0000-0000-0000-000000000001';

-- Outsider different org denied
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000003');
INSERT INTO results
SELECT 'read: outsider denied (organisation_id only)',
  NOT public.can_read_planning_resource('20000000-0000-0000-0000-000000000001');

-- (3) WITH CHECK shared_by = auth.uid()
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000001');
DO $$ BEGIN
  INSERT INTO public.planning_shares (resource_id, shared_by, audience_type, audience_id, permission)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'person',
    '10000000-0000-0000-0000-000000000003',
    'view'
  );
  INSERT INTO results VALUES ('with check: shared_by must be auth.uid()', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  INSERT INTO results VALUES ('with check: shared_by must be auth.uid()', true);
END $$;

-- school: audience_id must equal owner's organisation_id
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000001');
DO $$ BEGIN
  INSERT INTO public.planning_shares (resource_id, shared_by, audience_type, audience_id, permission)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'school',
    'org-other',
    'view'
  );
  INSERT INTO results VALUES ('with check: school audience_id must be owner org', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  INSERT INTO results VALUES ('with check: school audience_id must be owner org', true);
END $$;

-- hub_org: requires hub_memberships for that org (owner has none → denied)
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000001');
DO $$ BEGIN
  INSERT INTO public.planning_shares (resource_id, shared_by, audience_type, audience_id, permission)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'hub_org',
    'org-a',
    'view'
  );
  INSERT INTO results VALUES ('with check: hub_org requires hub membership', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  INSERT INTO results VALUES ('with check: hub_org requires hub membership', true);
END $$;

-- (4) organisation_id only — school_or_org must not grant access
RESET ROLE;
UPDATE public.profiles
SET organisation_id = NULL, school_or_org = 'org-a'
WHERE id = '10000000-0000-0000-0000-000000000003';

SET LOCAL ROLE authenticated;
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000003');
INSERT INTO results
SELECT 'org: school_or_org alone does not grant access',
  NOT public.can_read_planning_resource('20000000-0000-0000-0000-000000000001');

-- Restore outsider org for later clarity
RESET ROLE;
UPDATE public.profiles
SET organisation_id = 'org-b', school_or_org = NULL
WHERE id = '10000000-0000-0000-0000-000000000003';

-- (5) year_group: NULL / empty allowed_year_groups → NO access; matching list → yes
-- Dedicated resource with ONLY a year_group grant (no school/person/group grants).
RESET ROLE;
INSERT INTO public.planning_share_resources (id, owner_id, resource_type, resource_id, title, organisation_id)
VALUES (
  '20000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000001',
  'lesson',
  'lesson-yg-only',
  'Year-group only lesson',
  'org-a'
);
INSERT INTO public.planning_shares (id, resource_id, shared_by, audience_type, audience_id, permission)
VALUES (
  '30000000-0000-0000-0000-000000000010',
  '20000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000001',
  'year_group',
  'yg-1',
  'view'
);

-- Matching non-empty allowed_year_groups
SET LOCAL ROLE authenticated;
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000002');
INSERT INTO results
SELECT 'year_group: matching allowed_year_groups can read',
  public.can_read_planning_resource('20000000-0000-0000-0000-000000000010');

-- NULL allowed_year_groups → no year-group access
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000004');
INSERT INTO results
SELECT 'year_group: NULL allowed_year_groups denies',
  NOT public.can_read_planning_resource('20000000-0000-0000-0000-000000000010');

-- Empty array allowed_year_groups → no year-group access
RESET ROLE;
UPDATE public.profiles
SET allowed_year_groups = ARRAY[]::text[]
WHERE id = '10000000-0000-0000-0000-000000000004';
SET LOCAL ROLE authenticated;
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000004');
INSERT INTO results
SELECT 'year_group: empty allowed_year_groups denies',
  NOT public.can_read_planning_resource('20000000-0000-0000-0000-000000000010');

-- Restore admin year groups for later group-manage checks
RESET ROLE;
UPDATE public.profiles
SET allowed_year_groups = NULL
WHERE id = '10000000-0000-0000-0000-000000000004';

SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000004');
INSERT INTO results
SELECT 'groups: same-org admin can_manage_planning_group',
  public.can_manage_planning_group('team-a');

SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000003');
INSERT INTO results
SELECT 'groups: other-org cannot manage',
  NOT public.can_manage_planning_group('team-a');

-- (6) Suspended / anonymised denied
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000005');
INSERT INTO results
SELECT 'deny: suspended viewer',
  NOT public.can_read_planning_resource('20000000-0000-0000-0000-000000000001');

SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000006');
INSERT INTO results
SELECT 'deny: anonymised viewer',
  NOT public.can_read_planning_resource('20000000-0000-0000-0000-000000000001');

-- Owner still owns
SELECT pg_temp.as_user('10000000-0000-0000-0000-000000000001');
INSERT INTO results
SELECT 'owner: owns_planning_resource',
  public.owns_planning_resource('20000000-0000-0000-0000-000000000001');

-- Report
RESET ROLE;
DO $$
DECLARE
  r RECORD;
  failed int := 0;
BEGIN
  RAISE NOTICE '---- planning_shares_rls results ----';
  FOR r IN SELECT name, ok FROM results ORDER BY name LOOP
    RAISE NOTICE '%: %', r.name, CASE WHEN r.ok THEN 'PASS' ELSE 'FAIL' END;
    IF NOT r.ok THEN failed := failed + 1; END IF;
  END LOOP;
  IF failed > 0 THEN
    RAISE EXCEPTION '% planning_shares RLS test(s) failed', failed;
  END IF;
END $$;

ROLLBACK;
