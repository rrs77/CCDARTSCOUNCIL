-- Local RLS / governance checks for 20261013120000_partner_directory.sql.
-- Run against a scratch Postgres with Supabase stand-ins (never production):
--   psql -v ON_ERROR_STOP=1 -d <scratch> -f supabase/tests/partner_directory_rls.sql
-- Everything runs inside a transaction that is rolled back.
BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'super@test'),
  ('00000000-0000-0000-0000-00000000000b', 'editor@test'),
  ('00000000-0000-0000-0000-00000000000c', 'publisher@test'),
  ('00000000-0000-0000-0000-00000000000d', 'teacher@test');
INSERT INTO public.profiles (id, email, role, status) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'super@test', 'super_admin', 'active'),
  ('00000000-0000-0000-0000-00000000000b', 'editor@test', 'teacher', 'active'),
  ('00000000-0000-0000-0000-00000000000c', 'publisher@test', 'teacher', 'active'),
  ('00000000-0000-0000-0000-00000000000d', 'teacher@test', 'teacher', 'active');
INSERT INTO public.hub_memberships (organisation_id, user_id, role) VALUES
  ('ems', '00000000-0000-0000-0000-00000000000b', 'hub_editor'),
  ('ems', '00000000-0000-0000-0000-00000000000c', 'hub_publisher');

CREATE TEMP TABLE results (name TEXT, ok BOOLEAN);
GRANT ALL ON results TO authenticated;

CREATE OR REPLACE FUNCTION pg_temp.as_user(uid TEXT) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', uid, true), set_config('request.jwt.claim.role', 'authenticated', true);
$$;

-- Seed sanity
INSERT INTO results SELECT 'seed: 43 hubs', COUNT(*) = 43 FROM public.music_hubs;
INSERT INTO results SELECT 'seed: 361 areas', COUNT(*) = 361 FROM public.music_hub_areas;
INSERT INTO results SELECT 'seed: East of England has 5 hubs', COUNT(*) = 5 FROM public.music_hubs WHERE region_code = 'E12000006';
INSERT INTO results SELECT 'seed: Greater Essex has 14 areas', COUNT(*) = 14 FROM public.music_hub_areas WHERE hub_id = 'greater-essex';
INSERT INTO results SELECT 'seed: every English area has one hub', COUNT(*) = 0 FROM public.music_hub_areas WHERE nation_code = 'E92000001' AND hub_id IS NULL;
INSERT INTO results SELECT 'seed: Southend → Music-on-Sea', service_id = 'music-on-sea' FROM public.music_hub_areas WHERE name = 'Southend-on-Sea';
INSERT INTO results SELECT 'seed: 3 EMS resources scoped to hub', COUNT(*) = 3 FROM public.resource_scopes WHERE scope_id = 'greater-essex';

SET LOCAL ROLE authenticated;

-- Teacher: can read, cannot edit or draft
SELECT pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
INSERT INTO results SELECT 'teacher reads hubs', COUNT(*) = 43 FROM public.music_hubs;
UPDATE public.music_hubs SET name = 'Hacked' WHERE id = 'greater-essex';
INSERT INTO results SELECT 'teacher cannot update hub', name <> 'Hacked' FROM public.music_hubs WHERE id = 'greater-essex';
DO $$ BEGIN
  INSERT INTO public.music_hub_directory_drafts (hub_id, changes, status) VALUES ('greater-essex', '{"about":"x"}', 'pending');
  INSERT INTO results VALUES ('teacher cannot create draft', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  INSERT INTO results VALUES ('teacher cannot create draft', true);
END $$;
INSERT INTO results SELECT 'teacher cannot read private locations', COUNT(*) = 0 FROM public.resource_private_locations;
INSERT INTO results SELECT 'teacher cannot read access codes', COUNT(*) = 0 FROM public.organisation_access_codes;

-- Engagement: own rows only; organisation set by trigger
INSERT INTO public.resource_engagement_events (resource_id, event_type, user_id, organisation_id)
  VALUES ('ems-dj-workshop', 'viewed', '00000000-0000-0000-0000-00000000000d', 'jazznorth');
INSERT INTO results SELECT 'engagement org comes from resource', organisation_id = 'ems' FROM public.resource_engagement_events;
DO $$ BEGIN
  INSERT INTO public.resource_engagement_events (resource_id, event_type, user_id)
    VALUES ('ems-dj-workshop', 'viewed', '00000000-0000-0000-0000-00000000000b');
  INSERT INTO results VALUES ('cannot log engagement as someone else', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  INSERT INTO results VALUES ('cannot log engagement as someone else', true);
END $$;
DO $$ BEGIN
  PERFORM * FROM public.resource_engagement_summary('ems', 30);
  INSERT INTO results VALUES ('teacher cannot read engagement summary', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO results VALUES ('teacher cannot read engagement summary', true);
END $$;

-- Editor: drafts a change and submits it; cannot approve
SELECT pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
INSERT INTO public.music_hub_directory_drafts (hub_id, changes, status)
  VALUES ('greater-essex', '{"about":"Greater Essex Music Hub brings together music education across Essex, Southend-on-Sea and Thurrock.","name":"Renamed"}', 'pending');
INSERT INTO results SELECT 'editor created pending draft', COUNT(*) = 1 FROM public.music_hub_directory_drafts WHERE status = 'pending';
DO $$ BEGIN
  PERFORM public.review_music_hub_draft((SELECT id FROM public.music_hub_directory_drafts LIMIT 1), 'approved', NULL);
  INSERT INTO results VALUES ('editor cannot approve', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO results VALUES ('editor cannot approve', true);
END $$;
DO $$ BEGIN
  INSERT INTO public.music_hub_directory_drafts (hub_id, changes, status) VALUES ('hertfordshire', '{"about":"x"}', 'pending');
  INSERT INTO results VALUES ('editor cannot draft another hub', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  INSERT INTO results VALUES ('editor cannot draft another hub', true);
END $$;
DO $$ BEGIN
  UPDATE public.music_hub_directory_drafts SET status = 'approved';
  INSERT INTO results VALUES ('editor cannot self-approve via update', false);
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  INSERT INTO results VALUES ('editor cannot self-approve via update', true);
END $$;

-- Publisher approves: whitelisted fields applied, name untouched, revision written
SELECT pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
SELECT public.review_music_hub_draft((SELECT id FROM public.music_hub_directory_drafts LIMIT 1), 'approved', 'Looks good');
INSERT INTO results SELECT 'approval applies about text', about LIKE 'Greater Essex Music Hub brings%' FROM public.music_hubs WHERE id = 'greater-essex';
INSERT INTO results SELECT 'approval never renames hub', name = 'Greater Essex Music Hub' FROM public.music_hubs WHERE id = 'greater-essex';
INSERT INTO results SELECT 'revision recorded', COUNT(*) = 1 FROM public.music_hub_directory_revisions WHERE hub_id = 'greater-essex';
DO $$ BEGIN
  PERFORM public.review_music_hub_draft((SELECT id FROM public.music_hub_directory_drafts LIMIT 1), 'approved', NULL);
  INSERT INTO results VALUES ('cannot re-approve', false);
EXCEPTION WHEN raise_exception THEN
  INSERT INTO results VALUES ('cannot re-approve', true);
END $$;

-- Publisher cannot approve own draft
INSERT INTO public.music_hub_directory_drafts (hub_id, changes, status) VALUES ('greater-essex', '{"short_name":"GEMH"}', 'pending');
DO $$ BEGIN
  PERFORM public.review_music_hub_draft((SELECT id FROM public.music_hub_directory_drafts WHERE status = 'pending'), 'approved', NULL);
  INSERT INTO results VALUES ('publisher cannot approve own draft', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO results VALUES ('publisher cannot approve own draft', true);
END $$;

-- Super admin: engagement summary suppresses groups under 3 teachers
SELECT pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
INSERT INTO results SELECT 'summary suppresses small groups', events IS NULL AND teachers IS NULL
  FROM public.resource_engagement_summary('ems', 30) WHERE resource_id = 'ems-dj-workshop';

RESET ROLE;
SELECT name, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS result FROM results;
SELECT COUNT(*) FILTER (WHERE NOT ok) AS failures FROM results;
ROLLBACK;
