-- NULL-org admin guard + personal curriculum org bind (20261024360000).
-- Run after scratch + 240000..360000 (never production).

BEGIN;

CREATE TEMP TABLE guard_results (name TEXT, ok BOOLEAN);

INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES
  ('org_na', 'Org NA', 'org_na', 'org_na', 'Org NA', 'Org NA', 'active'),
  ('org_nb', 'Org NB', 'org_nb', 'org_nb', 'Org NB', 'Org NB', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-0000000000d1', 'null_admin@test'),
  ('00000000-0000-4000-8000-0000000000d2', 'org_admin@test'),
  ('00000000-0000-4000-8000-0000000000d3', 'teacher_na@test'),
  ('00000000-0000-4000-8000-0000000000d5', 'super_na@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id, anonymised_at, can_manage_users)
VALUES
  -- Admin with NULL organisation_id — must NOT manage shared defaults
  ('00000000-0000-4000-8000-0000000000d1', 'null_admin@test', 'admin', 'active', NULL, NULL, true),
  ('00000000-0000-4000-8000-0000000000d2', 'org_admin@test', 'admin', 'active', 'org_na', NULL, true),
  ('00000000-0000-4000-8000-0000000000d3', 'teacher_na@test', 'teacher', 'active', 'org_na', NULL, false),
  ('00000000-0000-4000-8000-0000000000d5', 'super_na@test', 'super_admin', 'active', 'org_na', NULL, true)
ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      status = EXCLUDED.status,
      organisation_id = EXCLUDED.organisation_id,
      anonymised_at = EXCLUDED.anonymised_at,
      can_manage_users = EXCLUDED.can_manage_users;

DELETE FROM public.year_groups WHERE id IN ('yg_na_shared');
INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES ('yg_na_shared', 'NA Shared YG', 1, NULL);

DELETE FROM public.category_groups WHERE id IN ('cg_na_shared');
INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
VALUES ('cg_na_shared', 'NA Shared Group', 1, NULL);

DELETE FROM public.custom_categories WHERE id IN ('cc_na_shared');
INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
VALUES ('cc_na_shared', 'NA Shared Cat', '#14B8A6', 1, NULL);

-- Helper returns false for NULL p_org even for NULL-org admins
DO $$
DECLARE got boolean;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d1', true);
  SET LOCAL ROLE authenticated;
  SELECT public.ccd_current_user_manages_own_org(NULL) INTO got;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO guard_results VALUES ('manages_own_org(NULL) is false for NULL-org admin', got IS NOT TRUE);
END $$;

-- NULL-org admin cannot UPDATE / DELETE / INSERT NULL-org catalog rows
DO $$
DECLARE still_name text; blocked_ins boolean := true;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.year_groups SET name = 'Hacked By Null Admin' WHERE id = 'yg_na_shared';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DELETE FROM public.custom_categories WHERE id = 'cc_na_shared';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
    VALUES ('yg_na_null_ins', 'Null Admin Insert', 99, NULL);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    UPDATE public.category_groups SET name = 'Hacked CG' WHERE id = 'cg_na_shared';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  SELECT name INTO still_name FROM public.year_groups WHERE id = 'yg_na_shared';
  blocked_ins := NOT EXISTS (
    SELECT 1 FROM public.year_groups WHERE id = 'yg_na_null_ins' AND organisation_id IS NULL
  );
  INSERT INTO guard_results VALUES (
    'NULL-org admin cannot update NULL-org year_groups',
    still_name = 'NA Shared YG'
  );
  INSERT INTO guard_results VALUES (
    'NULL-org admin cannot delete NULL-org categories',
    EXISTS (SELECT 1 FROM public.custom_categories WHERE id = 'cc_na_shared' AND name = 'NA Shared Cat')
  );
  INSERT INTO guard_results VALUES (
    'NULL-org admin cannot insert NULL-org year_groups',
    blocked_ins
  );
  INSERT INTO guard_results VALUES (
    'NULL-org admin cannot update NULL-org category_groups',
    EXISTS (SELECT 1 FROM public.category_groups WHERE id = 'cg_na_shared' AND name = 'NA Shared Group')
  );
END $$;

-- Super admin still can update NULL-org defaults
DO $$
DECLARE ok boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.year_groups SET sort_order = 42 WHERE id = 'yg_na_shared';
    ok := true;
  EXCEPTION WHEN OTHERS THEN
    ok := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO guard_results VALUES ('super admin can still update NULL-org year_groups', ok);
  UPDATE public.year_groups SET sort_order = 1 WHERE id = 'yg_na_shared';
END $$;

-- Org admin still manages own org
DO $$
DECLARE got boolean;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d2', true);
  SET LOCAL ROLE authenticated;
  SELECT public.ccd_current_user_manages_own_org('org_na') INTO got;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  INSERT INTO guard_results VALUES ('org admin manages_own_org(own org) is true', got IS TRUE);
END $$;

-- ---------------------------------------------------------------------------
-- planner_curriculum_user: cannot insert under another organisation_id
-- ---------------------------------------------------------------------------
DELETE FROM public.planner_curriculum_user
WHERE user_id IN (
  '00000000-0000-4000-8000-0000000000d3',
  '00000000-0000-4000-8000-0000000000d5'
);

DO $$
DECLARE blocked boolean := true; ok_own boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d3', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.planner_curriculum_user (user_id, organisation_id, data)
    VALUES (
      '00000000-0000-4000-8000-0000000000d3',
      'org_nb',
      '{"statements":[],"overrides":{},"hiddenIds":[],"frameworks":[],"strands":[]}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    INSERT INTO public.planner_curriculum_user (user_id, organisation_id, data)
    VALUES (
      '00000000-0000-4000-8000-0000000000d3',
      'org_na',
      '{"statements":[{"id":"x"}],"overrides":{},"hiddenIds":[],"frameworks":[],"strands":[]}'::jsonb
    );
    ok_own := true;
  EXCEPTION WHEN OTHERS THEN
    ok_own := false;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  blocked := NOT EXISTS (
    SELECT 1 FROM public.planner_curriculum_user
    WHERE user_id = '00000000-0000-4000-8000-0000000000d3'
      AND organisation_id = 'org_nb'
  );
  INSERT INTO guard_results VALUES ('teacher cannot insert personal curriculum under other org', blocked);
  INSERT INTO guard_results VALUES (
    'teacher can insert personal curriculum under own org',
    ok_own AND EXISTS (
      SELECT 1 FROM public.planner_curriculum_user
      WHERE user_id = '00000000-0000-4000-8000-0000000000d3'
        AND organisation_id = 'org_na'
    )
  );
END $$;

-- Teacher cannot move own row to another org via UPDATE
DO $$
DECLARE blocked boolean := true;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d3', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.planner_curriculum_user
    SET organisation_id = 'org_nb'
    WHERE user_id = '00000000-0000-4000-8000-0000000000d3';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  blocked := EXISTS (
    SELECT 1 FROM public.planner_curriculum_user
    WHERE user_id = '00000000-0000-4000-8000-0000000000d3'
      AND organisation_id = 'org_na'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.planner_curriculum_user
    WHERE user_id = '00000000-0000-4000-8000-0000000000d3'
      AND organisation_id = 'org_nb'
  );
  INSERT INTO guard_results VALUES ('teacher cannot move personal curriculum to other org', blocked);
END $$;

DO $$
DECLARE failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM guard_results WHERE NOT ok;
  RAISE NOTICE 'null_org_admin_and_personal_org_bind: % passed, % failed',
    (SELECT COUNT(*) FROM guard_results WHERE ok), failed;
  IF failed > 0 THEN
    RAISE EXCEPTION 'null_org_admin_and_personal_org_bind failures: %',
      (SELECT string_agg(name, ', ') FROM guard_results WHERE NOT ok);
  END IF;
END $$;

ROLLBACK;
