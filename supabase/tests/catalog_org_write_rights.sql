-- Catalog org write rights (20261024350000).
-- Member INSERT category ok; member UPDATE/DELETE category denied; admin ok;
-- member year_group write denied; admin year_group write ok;
-- cross-org denied; NULL-org writes denied except super admin.
-- Run after scratch + 240000 + 240500 + 310000..350000 (never production).

BEGIN;

CREATE TEMP TABLE write_rights_results (name TEXT, ok BOOLEAN);

INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES
  ('org_wr_a', 'Org WR A', 'org_wr_a', 'org_wr_a', 'Org WR A', 'Org A', 'active'),
  ('org_wr_b', 'Org WR B', 'org_wr_b', 'org_wr_b', 'Org WR B', 'Org B', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-0000000000c1', 'member_a@test'),
  ('00000000-0000-4000-8000-0000000000c2', 'admin_a@test'),
  ('00000000-0000-4000-8000-0000000000c3', 'member_b@test'),
  ('00000000-0000-4000-8000-0000000000c5', 'super_wr@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id, anonymised_at, can_manage_users)
VALUES
  ('00000000-0000-4000-8000-0000000000c1', 'member_a@test', 'teacher', 'active', 'org_wr_a', NULL, false),
  ('00000000-0000-4000-8000-0000000000c2', 'admin_a@test', 'admin', 'active', 'org_wr_a', NULL, true),
  ('00000000-0000-4000-8000-0000000000c3', 'member_b@test', 'teacher', 'active', 'org_wr_b', NULL, false),
  ('00000000-0000-4000-8000-0000000000c5', 'super_wr@test', 'super_admin', 'active', 'org_wr_a', NULL, true)
ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      status = EXCLUDED.status,
      organisation_id = EXCLUDED.organisation_id,
      anonymised_at = EXCLUDED.anonymised_at,
      can_manage_users = EXCLUDED.can_manage_users;

-- Shared NULL-org defaults
DELETE FROM public.year_groups WHERE id IN ('yg_wr_shared');
INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES ('yg_wr_shared', 'WR Shared Year', 1, NULL);

DELETE FROM public.category_groups WHERE id IN ('cg_wr_shared');
INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
VALUES ('cg_wr_shared', 'WR Shared Group', 1, NULL);

DELETE FROM public.custom_categories WHERE id IN ('cc_wr_shared');
INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
VALUES ('cc_wr_shared', 'WR Shared Cat', '#14B8A6', 1, NULL);

-- Seed org copies via private helper (service role / postgres).
-- Clear seeded-once marker if seed-on-create already ran before shared defaults.
DELETE FROM private.ccd_org_catalog_seeded WHERE organisation_id = 'org_wr_a';
SELECT private._ccd_seed_org_catalog_defaults('org_wr_a');

-- Ensure admin-owned rows exist for mutate tests
DELETE FROM public.custom_categories WHERE id IN ('cc_wr_a_existing', 'cc_wr_b_existing');
INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
VALUES
  ('cc_wr_a_existing', 'Org A Existing Cat', '#111111', 10, 'org_wr_a'),
  ('cc_wr_b_existing', 'Org B Existing Cat', '#222222', 10, 'org_wr_b');

DELETE FROM public.category_groups WHERE id IN ('cg_wr_a_existing');
INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
VALUES ('cg_wr_a_existing', 'Org A Existing Group', 10, 'org_wr_a');

DELETE FROM public.year_groups WHERE id IN ('yg_wr_a_existing', 'yg_wr_b_existing');
INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES
  ('yg_wr_a_existing', 'Org A Existing YG', 10, 'org_wr_a'),
  ('yg_wr_b_existing', 'Org B Existing YG', 10, 'org_wr_b');

-- ---------------------------------------------------------------------------
-- Member can INSERT custom_categories + category_groups (own org)
-- ---------------------------------------------------------------------------
DO $$
DECLARE wrote_cc boolean := false; wrote_cg boolean := false; n int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
    VALUES ('cc_wr_member_ins', 'Member Added Cat', '#333333', 20, 'org_wr_a');
    wrote_cc := true;
  EXCEPTION WHEN OTHERS THEN
    wrote_cc := false;
  END;
  BEGIN
    INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
    VALUES ('cg_wr_member_ins', 'Member Added Group', 20, 'org_wr_a');
    wrote_cg := true;
  EXCEPTION WHEN OTHERS THEN
    wrote_cg := false;
  END;
  SELECT COUNT(*) INTO n FROM public.custom_categories WHERE id = 'cc_wr_member_ins';
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO write_rights_results VALUES ('member inserts custom_categories', wrote_cc AND n = 1);
  INSERT INTO write_rights_results VALUES ('member inserts category_groups', wrote_cg);
END $$;

-- ---------------------------------------------------------------------------
-- Member cannot UPDATE or DELETE categories
-- ---------------------------------------------------------------------------
DO $$
DECLARE upd_blocked boolean := false; del_blocked boolean := false; still_name text;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.custom_categories SET name = 'Hacked By Member' WHERE id = 'cc_wr_a_existing';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    DELETE FROM public.custom_categories WHERE id = 'cc_wr_member_ins';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    UPDATE public.category_groups SET name = 'Hacked Group' WHERE id = 'cg_wr_a_existing';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  SELECT name INTO still_name FROM public.custom_categories WHERE id = 'cc_wr_a_existing';
  upd_blocked := (still_name = 'Org A Existing Cat');
  del_blocked := EXISTS (SELECT 1 FROM public.custom_categories WHERE id = 'cc_wr_member_ins');
  INSERT INTO write_rights_results VALUES ('member cannot update custom_categories', upd_blocked);
  INSERT INTO write_rights_results VALUES ('member cannot delete custom_categories', del_blocked);
  INSERT INTO write_rights_results VALUES (
    'member cannot update category_groups',
    EXISTS (SELECT 1 FROM public.category_groups WHERE id = 'cg_wr_a_existing' AND name = 'Org A Existing Group')
  );
END $$;

-- ---------------------------------------------------------------------------
-- Admin can UPDATE and DELETE categories
-- ---------------------------------------------------------------------------
DO $$
DECLARE upd_ok boolean := false; del_ok boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c2', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.custom_categories SET name = 'Admin Renamed Cat' WHERE id = 'cc_wr_a_existing';
    upd_ok := true;
  EXCEPTION WHEN OTHERS THEN
    upd_ok := false;
  END;
  BEGIN
    DELETE FROM public.custom_categories WHERE id = 'cc_wr_member_ins';
    del_ok := true;
  EXCEPTION WHEN OTHERS THEN
    del_ok := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO write_rights_results VALUES (
    'admin can update custom_categories',
    upd_ok AND EXISTS (
      SELECT 1 FROM public.custom_categories WHERE id = 'cc_wr_a_existing' AND name = 'Admin Renamed Cat'
    )
  );
  INSERT INTO write_rights_results VALUES (
    'admin can delete custom_categories',
    del_ok AND NOT EXISTS (SELECT 1 FROM public.custom_categories WHERE id = 'cc_wr_member_ins')
  );
END $$;

-- ---------------------------------------------------------------------------
-- Member cannot INSERT / UPDATE / DELETE year_groups
-- ---------------------------------------------------------------------------
DO $$
DECLARE ins_blocked boolean := false; upd_blocked boolean := false; del_blocked boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
    VALUES ('yg_wr_member_ins', 'Member YG', 30, 'org_wr_a');
    ins_blocked := false;
  EXCEPTION WHEN OTHERS THEN
    ins_blocked := true;
  END;
  BEGIN
    UPDATE public.year_groups SET name = 'Hacked YG' WHERE id = 'yg_wr_a_existing';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    DELETE FROM public.year_groups WHERE id = 'yg_wr_a_existing';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  -- INSERT may "succeed" with 0 rows under RLS; treat missing row as blocked.
  IF EXISTS (SELECT 1 FROM public.year_groups WHERE id = 'yg_wr_member_ins') THEN
    ins_blocked := false;
  ELSE
    ins_blocked := true;
  END IF;
  upd_blocked := EXISTS (
    SELECT 1 FROM public.year_groups WHERE id = 'yg_wr_a_existing' AND name = 'Org A Existing YG'
  );
  del_blocked := EXISTS (SELECT 1 FROM public.year_groups WHERE id = 'yg_wr_a_existing');
  INSERT INTO write_rights_results VALUES ('member cannot insert year_groups', ins_blocked);
  INSERT INTO write_rights_results VALUES ('member cannot update year_groups', upd_blocked);
  INSERT INTO write_rights_results VALUES ('member cannot delete year_groups', del_blocked);
END $$;

-- Member can still READ own-org year groups
DO $$
DECLARE n int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', true);
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO n FROM public.year_groups WHERE organisation_id = 'org_wr_a';
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO write_rights_results VALUES ('member can read own-org year_groups', n >= 1);
END $$;

-- ---------------------------------------------------------------------------
-- Admin can INSERT / UPDATE / DELETE year_groups
-- ---------------------------------------------------------------------------
DO $$
DECLARE ins_ok boolean := false; upd_ok boolean := false; del_ok boolean := false; n int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c2', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
    VALUES ('yg_wr_admin_ins', 'Admin Added YG', 40, 'org_wr_a');
    SELECT COUNT(*) INTO n FROM public.year_groups WHERE id = 'yg_wr_admin_ins';
    ins_ok := (n = 1);
  EXCEPTION WHEN OTHERS THEN
    ins_ok := false;
  END;
  BEGIN
    UPDATE public.year_groups SET name = 'Admin Renamed YG' WHERE id = 'yg_wr_a_existing';
    upd_ok := true;
  EXCEPTION WHEN OTHERS THEN
    upd_ok := false;
  END;
  BEGIN
    DELETE FROM public.year_groups WHERE id = 'yg_wr_admin_ins';
    SELECT COUNT(*) INTO n FROM public.year_groups WHERE id = 'yg_wr_admin_ins';
    del_ok := (n = 0);
  EXCEPTION WHEN OTHERS THEN
    del_ok := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO write_rights_results VALUES ('admin can insert year_groups', ins_ok);
  INSERT INTO write_rights_results VALUES (
    'admin can update year_groups',
    upd_ok AND EXISTS (
      SELECT 1 FROM public.year_groups WHERE id = 'yg_wr_a_existing' AND name = 'Admin Renamed YG'
    )
  );
  INSERT INTO write_rights_results VALUES ('admin can delete year_groups', del_ok);
END $$;

-- ---------------------------------------------------------------------------
-- Cross-org denied (member A cannot write org B; admin A cannot write org B)
-- ---------------------------------------------------------------------------
DO $$
DECLARE blocked boolean := true;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
    VALUES ('cc_wr_cross', 'Cross Org Cat', '#000000', 99, 'org_wr_b');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    UPDATE public.custom_categories SET name = 'Cross Hack' WHERE id = 'cc_wr_b_existing';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    UPDATE public.year_groups SET name = 'Cross YG Hack' WHERE id = 'yg_wr_b_existing';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  blocked :=
    NOT EXISTS (SELECT 1 FROM public.custom_categories WHERE id = 'cc_wr_cross')
    AND EXISTS (SELECT 1 FROM public.custom_categories WHERE id = 'cc_wr_b_existing' AND name = 'Org B Existing Cat')
    AND EXISTS (SELECT 1 FROM public.year_groups WHERE id = 'yg_wr_b_existing' AND name = 'Org B Existing YG');
  INSERT INTO write_rights_results VALUES ('member cross-org writes denied', blocked);
END $$;

DO $$
DECLARE blocked boolean := true;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c2', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
    VALUES ('yg_wr_admin_cross', 'Admin Cross YG', 99, 'org_wr_b');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    UPDATE public.custom_categories SET name = 'Admin Cross Hack' WHERE id = 'cc_wr_b_existing';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  blocked :=
    NOT EXISTS (SELECT 1 FROM public.year_groups WHERE id = 'yg_wr_admin_cross')
    AND EXISTS (SELECT 1 FROM public.custom_categories WHERE id = 'cc_wr_b_existing' AND name = 'Org B Existing Cat');
  INSERT INTO write_rights_results VALUES ('admin cross-org writes denied', blocked);
END $$;

-- ---------------------------------------------------------------------------
-- NULL-org writes denied except super admin
-- ---------------------------------------------------------------------------
DO $$
DECLARE still_shared boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.year_groups SET name = 'Null Hack Member' WHERE id = 'yg_wr_shared';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
    VALUES ('yg_wr_null_member', 'Null Member YG', 1, NULL);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  SELECT name = 'WR Shared Year' AND organisation_id IS NULL INTO still_shared
  FROM public.year_groups WHERE id = 'yg_wr_shared';
  INSERT INTO write_rights_results VALUES ('member cannot write NULL-org year_groups', COALESCE(still_shared, false));
  INSERT INTO write_rights_results VALUES (
    'member cannot insert NULL-org year_groups',
    NOT EXISTS (SELECT 1 FROM public.year_groups WHERE id = 'yg_wr_null_member' AND organisation_id IS NULL)
  );
END $$;

DO $$
DECLARE still_shared boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c2', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.year_groups SET name = 'Null Hack Admin' WHERE id = 'yg_wr_shared';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    UPDATE public.custom_categories SET name = 'Null Hack Cat' WHERE id = 'cc_wr_shared';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  SELECT name = 'WR Shared Year' AND organisation_id IS NULL INTO still_shared
  FROM public.year_groups WHERE id = 'yg_wr_shared';
  INSERT INTO write_rights_results VALUES ('school admin cannot write NULL-org defaults', COALESCE(still_shared, false));
  INSERT INTO write_rights_results VALUES (
    'school admin cannot update NULL-org categories',
    EXISTS (SELECT 1 FROM public.custom_categories WHERE id = 'cc_wr_shared' AND name = 'WR Shared Cat')
  );
END $$;

DO $$
DECLARE ok_yg boolean := false; ok_cc boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c5', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.year_groups SET sort_order = 99 WHERE id = 'yg_wr_shared';
    ok_yg := true;
  EXCEPTION WHEN OTHERS THEN
    ok_yg := false;
  END;
  BEGIN
    UPDATE public.custom_categories SET color = '#ABCDEF' WHERE id = 'cc_wr_shared';
    ok_cc := true;
  EXCEPTION WHEN OTHERS THEN
    ok_cc := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO write_rights_results VALUES ('super admin can update NULL-org year_groups', ok_yg);
  INSERT INTO write_rights_results VALUES ('super admin can update NULL-org categories', ok_cc);
  -- restore
  UPDATE public.year_groups SET sort_order = 1 WHERE id = 'yg_wr_shared';
  UPDATE public.custom_categories SET color = '#14B8A6' WHERE id = 'cc_wr_shared';
END $$;

DO $$
DECLARE failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM write_rights_results WHERE NOT ok;
  RAISE NOTICE 'catalog_org_write_rights: % passed, % failed',
    (SELECT COUNT(*) FROM write_rights_results WHERE ok), failed;
  IF failed > 0 THEN
    RAISE EXCEPTION 'catalog_org_write_rights failures: %',
      (SELECT string_agg(name, ', ') FROM write_rights_results WHERE NOT ok);
  END IF;
END $$;

ROLLBACK;
