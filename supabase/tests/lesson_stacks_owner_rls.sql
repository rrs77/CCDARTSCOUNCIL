-- lesson_stacks owner-private RLS (20261025133000). Scratch Postgres only, never production.
-- Order: scratch schema, 240000, 240500, 20261025133000, then this file.
BEGIN;

CREATE TEMP TABLE ls_results (name TEXT, ok BOOLEAN);
GRANT ALL ON ls_results TO authenticated;

INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES ('org_a', 'Org A', 'org_a', 'org_a', 'Org A', 'Org A', 'active'),
       ('org_b', 'Org B', 'org_b', 'org_b', 'Org B', 'Org B', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'a@test'),
  ('00000000-0000-4000-8000-0000000000a2', 'a2@test'),
  ('00000000-0000-4000-8000-0000000000a3', 'admin-a@test'),
  ('00000000-0000-4000-8000-0000000000b1', 'b@test'),
  ('00000000-0000-4000-8000-0000000000a5', 'super@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id, anonymised_at) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'a@test', 'teacher', 'active', 'org_a', NULL),
  ('00000000-0000-4000-8000-0000000000a2', 'a2@test', 'teacher', 'active', 'org_a', NULL),
  ('00000000-0000-4000-8000-0000000000a3', 'admin-a@test', 'admin', 'active', 'org_a', NULL),
  ('00000000-0000-4000-8000-0000000000b1', 'b@test', 'teacher', 'active', 'org_b', NULL),
  ('00000000-0000-4000-8000-0000000000a5', 'super@test', 'super_admin', 'active', 'org_a', NULL)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status,
  organisation_id = EXCLUDED.organisation_id, anonymised_at = EXCLUDED.anonymised_at;

DELETE FROM public.lesson_stacks WHERE id LIKE 'ls-test-%';
-- Legacy ownerless org row and a system (NULL-org) row.
INSERT INTO public.lesson_stacks (id, name, organisation_id, user_id) VALUES
  ('ls-test-legacy-a', 'Legacy A', 'org_a', NULL),
  ('ls-test-system', 'System', NULL, NULL);

CREATE OR REPLACE FUNCTION pg_temp.as_user(uid text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', uid, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid)::text, true);
END $$;

-- Teacher A1 creates a stack WITHOUT user_id (app on older client) -> owner filled.
DO $$
DECLARE ok_insert boolean := false; owner uuid; spoof_owner uuid; cross_org boolean := false;
BEGIN
  PERFORM pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
  SET LOCAL ROLE authenticated;
  INSERT INTO public.lesson_stacks (id, name, organisation_id) VALUES ('ls-test-a1', 'A1 unit', 'org_a');
  ok_insert := true;
  -- Spoofing another owner is rewritten to the caller.
  INSERT INTO public.lesson_stacks (id, name, organisation_id, user_id)
  VALUES ('ls-test-a1-spoof', 'spoof', 'org_a', '00000000-0000-4000-8000-0000000000a2');
  BEGIN
    INSERT INTO public.lesson_stacks (id, name, organisation_id) VALUES ('ls-test-a1-orgb', 'x', 'org_b');
    cross_org := true;
  EXCEPTION WHEN OTHERS THEN cross_org := false; END;
  RESET ROLE;
  SELECT user_id INTO owner FROM public.lesson_stacks WHERE id = 'ls-test-a1';
  SELECT user_id INTO spoof_owner FROM public.lesson_stacks WHERE id = 'ls-test-a1-spoof';
  INSERT INTO ls_results VALUES ('teacher can create own-org stack', ok_insert);
  INSERT INTO ls_results VALUES ('owner filled from auth.uid()', owner = '00000000-0000-4000-8000-0000000000a1');
  INSERT INTO ls_results VALUES ('teacher cannot create for another user', spoof_owner = '00000000-0000-4000-8000-0000000000a1');
  INSERT INTO ls_results VALUES ('teacher cannot create in another org', NOT cross_org);
END $$;

-- Owner sees it after "reload" (new statement), plus legacy + system rows.
DO $$
DECLARE n_own int; n_legacy int; n_sys int;
BEGIN
  PERFORM pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n_own FROM public.lesson_stacks WHERE id = 'ls-test-a1';
  SELECT COUNT(*) INTO n_legacy FROM public.lesson_stacks WHERE id = 'ls-test-legacy-a';
  SELECT COUNT(*) INTO n_sys FROM public.lesson_stacks WHERE id = 'ls-test-system';
  RESET ROLE;
  INSERT INTO ls_results VALUES ('owner reads own stack', n_own = 1);
  INSERT INTO ls_results VALUES ('org member reads legacy ownerless org stack', n_legacy = 1);
  INSERT INTO ls_results VALUES ('member reads ownerless system stack', n_sys = 1);
END $$;

-- Colleague A2 (same org, teacher): cannot see, edit or delete A1's stack.
DO $$
DECLARE n int; upd int; del int; n_legacy_upd int;
BEGIN
  PERFORM pg_temp.as_user('00000000-0000-4000-8000-0000000000a2');
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.lesson_stacks WHERE id = 'ls-test-a1';
  UPDATE public.lesson_stacks SET name = 'hacked' WHERE id = 'ls-test-a1';
  GET DIAGNOSTICS upd = ROW_COUNT;
  DELETE FROM public.lesson_stacks WHERE id = 'ls-test-a1';
  GET DIAGNOSTICS del = ROW_COUNT;
  UPDATE public.lesson_stacks SET name = 'hacked' WHERE id = 'ls-test-legacy-a';
  GET DIAGNOSTICS n_legacy_upd = ROW_COUNT;
  RESET ROLE;
  INSERT INTO ls_results VALUES ('colleague cannot read private stack', n = 0);
  INSERT INTO ls_results VALUES ('colleague cannot update private stack', upd = 0);
  INSERT INTO ls_results VALUES ('colleague cannot delete private stack', del = 0);
  INSERT INTO ls_results VALUES ('colleague cannot edit legacy shared stack', n_legacy_upd = 0);
END $$;

-- Teacher B (other org): sees nothing of org A.
DO $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.lesson_stacks WHERE id IN ('ls-test-a1', 'ls-test-legacy-a');
  RESET ROLE;
  INSERT INTO ls_results VALUES ('other org cannot read org A stacks', n = 0);
END $$;

-- Owner cannot move the stack to another org or give it away.
DO $$
DECLARE o text; u uuid;
BEGIN
  PERFORM pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.lesson_stacks SET organisation_id = 'org_b', user_id = '00000000-0000-4000-8000-0000000000a2'
    WHERE id = 'ls-test-a1';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  UPDATE public.lesson_stacks SET name = 'A1 unit renamed' WHERE id = 'ls-test-a1';
  RESET ROLE;
  SELECT organisation_id, user_id INTO o, u FROM public.lesson_stacks WHERE id = 'ls-test-a1';
  INSERT INTO ls_results VALUES ('owner cannot move stack to another org/user',
    o = 'org_a' AND u = '00000000-0000-4000-8000-0000000000a1');
  INSERT INTO ls_results VALUES ('owner can rename own stack',
    (SELECT name FROM public.lesson_stacks WHERE id = 'ls-test-a1') = 'A1 unit renamed');
END $$;

-- Org admin A3: reads and can share (user_id NULL) A1's stack; then A2 sees it.
DO $$
DECLARE n int; n2 int;
BEGIN
  PERFORM pg_temp.as_user('00000000-0000-4000-8000-0000000000a3');
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.lesson_stacks WHERE id = 'ls-test-a1';
  UPDATE public.lesson_stacks SET user_id = NULL WHERE id = 'ls-test-a1';
  RESET ROLE;
  PERFORM pg_temp.as_user('00000000-0000-4000-8000-0000000000a2');
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n2 FROM public.lesson_stacks WHERE id = 'ls-test-a1';
  RESET ROLE;
  INSERT INTO ls_results VALUES ('org admin reads member stack', n = 1);
  INSERT INTO ls_results VALUES ('shared (ownerless) stack visible to colleague', n2 = 1);
END $$;

-- Super admin reads everything.
DO $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.as_user('00000000-0000-4000-8000-0000000000a5');
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.lesson_stacks WHERE id LIKE 'ls-test-%';
  RESET ROLE;
  INSERT INTO ls_results VALUES ('super admin reads all test stacks', n >= 4);
END $$;

-- Exactly the four 2510 policies remain on lesson_stacks.
INSERT INTO ls_results
SELECT 'only *_owner_2510 policies on lesson_stacks',
  array_agg(policyname::text ORDER BY policyname) = ARRAY[
    'ccd_lesson_stacks_delete_owner_2510', 'ccd_lesson_stacks_insert_owner_2510',
    'ccd_lesson_stacks_select_owner_2510', 'ccd_lesson_stacks_update_owner_2510']
FROM pg_policies WHERE tablename = 'lesson_stacks';

DO $$
DECLARE failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM ls_results WHERE NOT ok;
  RAISE NOTICE 'lesson_stacks_owner_rls: % passed, % failed', (SELECT COUNT(*) FROM ls_results WHERE ok), failed;
  IF failed > 0 THEN
    RAISE EXCEPTION 'lesson_stacks_owner_rls failures: %', (SELECT string_agg(name, ', ') FROM ls_results WHERE NOT ok);
  END IF;
END $$;

SELECT * FROM ls_results ORDER BY name;
ROLLBACK;
