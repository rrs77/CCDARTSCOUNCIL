-- Catalog seeded-once ledger (20261024390000 / Rob b).
-- Never-seeded empty school gets seeded once; wipe stays empty on re-run;
-- partial school skipped + marked; no duplicates; non-admin cannot write marker.
-- Run three times. Run after scratch + 240000..390000 (never production).

BEGIN;

CREATE TEMP TABLE seeded_once_results (name TEXT, ok BOOLEAN);

-- Reset job markers so the helper can be exercised in scratch.
DELETE FROM private.ccd_one_time_jobs
WHERE job_key IN (
  'catalog_partial_defaults_v1',
  'catalog_empty_org_defaults_v2',
  'catalog_empty_org_defaults_v3'
);

INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES
  ('org_so_empty', 'SO Empty', 'org_so_empty', 'org_so_empty', 'SO Empty', 'Empty', 'active'),
  ('org_so_wipe', 'SO Wipe', 'org_so_wipe', 'org_so_wipe', 'SO Wipe', 'Wipe', 'active'),
  ('org_so_partial', 'SO Partial', 'org_so_partial', 'org_so_partial', 'SO Partial', 'Partial', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-0000000000e1', 'so_teacher@test'),
  ('00000000-0000-4000-8000-0000000000e2', 'so_admin@test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, role, status, organisation_id, anonymised_at, can_manage_users)
VALUES
  ('00000000-0000-4000-8000-0000000000e1', 'so_teacher@test', 'teacher', 'active', 'org_so_empty', NULL, false),
  ('00000000-0000-4000-8000-0000000000e2', 'so_admin@test', 'admin', 'active', 'org_so_empty', NULL, true)
ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      status = EXCLUDED.status,
      organisation_id = EXCLUDED.organisation_id,
      anonymised_at = EXCLUDED.anonymised_at,
      can_manage_users = EXCLUDED.can_manage_users;

-- Shared NULL-org defaults.
DELETE FROM public.year_groups
WHERE id IN ('so_def_eyfs', 'so_def_rec', 'so_def_y1', 'so_def_y2')
   OR (organisation_id IS NULL AND name IN (
     'SO EYFS', 'SO Reception', 'SO Year 1', 'SO Year 2'
   ));
DELETE FROM public.category_groups
WHERE id IN ('so_def_cg')
   OR (organisation_id IS NULL AND name = 'SO Warm-ups');
DELETE FROM public.custom_categories
WHERE id IN ('so_def_cc')
   OR (organisation_id IS NULL AND name = 'SO Vocal');

INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES
  ('so_def_eyfs', 'SO EYFS', 0, NULL),
  ('so_def_rec', 'SO Reception', 1, NULL),
  ('so_def_y1', 'SO Year 1', 2, NULL),
  ('so_def_y2', 'SO Year 2', 3, NULL);

INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
VALUES ('so_def_cg', 'SO Warm-ups', 1, NULL);

INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
VALUES ('so_def_cc', 'SO Vocal', '#14B8A6', 1, NULL);

-- Trigger may have seeded+marked on INSERT. Reset catalog + markers so we
-- control never-seeded / partial / wipe scenarios explicitly.
DELETE FROM public.year_groups
WHERE organisation_id IN ('org_so_empty', 'org_so_wipe', 'org_so_partial');
DELETE FROM public.category_groups
WHERE organisation_id IN ('org_so_empty', 'org_so_wipe', 'org_so_partial');
DELETE FROM public.custom_categories
WHERE organisation_id IN ('org_so_empty', 'org_so_wipe', 'org_so_partial');
DELETE FROM private.ccd_org_catalog_seeded
WHERE organisation_id IN ('org_so_empty', 'org_so_wipe', 'org_so_partial');

-- Partial org: one own year group (Option 2 skip).
INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES ('so_partial_rec', 'SO Reception', 10, 'org_so_partial');

-- Wipe org: seed once now, then delete all groups before backfill re-runs.
SELECT private._ccd_seed_org_catalog_defaults('org_so_wipe');

INSERT INTO seeded_once_results
SELECT 'wipe org marked after seed',
       private._ccd_org_catalog_was_seeded('org_so_wipe');

INSERT INTO seeded_once_results
SELECT 'wipe org received defaults',
       (
         SELECT COUNT(DISTINCT private._ccd_norm_catalog_name(name))
         FROM public.year_groups
         WHERE organisation_id = 'org_so_wipe'
           AND private._ccd_norm_catalog_name(name) IN (
             'so eyfs', 'so reception', 'so year 1', 'so year 2'
           )
       ) = 4;

-- School deletes ALL its year groups (and categories) after being seeded.
DELETE FROM public.year_groups WHERE organisation_id = 'org_so_wipe';
DELETE FROM public.category_groups WHERE organisation_id = 'org_so_wipe';
DELETE FROM public.custom_categories WHERE organisation_id = 'org_so_wipe';

INSERT INTO seeded_once_results
SELECT 'wipe org empty after delete',
       (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_wipe') = 0
       AND private._ccd_org_catalog_was_seeded('org_so_wipe');

-- org_so_empty: never seeded, no year groups — should receive defaults once.
INSERT INTO seeded_once_results
SELECT 'empty org not marked before backfill',
       NOT private._ccd_org_catalog_was_seeded('org_so_empty');

CREATE TEMP TABLE so_backfill_counts (
  organisation_id text,
  year_groups_added int,
  category_groups_added int,
  custom_categories_added int
);

INSERT INTO so_backfill_counts
SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

INSERT INTO seeded_once_results
SELECT 'empty org seeded by backfill',
       EXISTS (
         SELECT 1 FROM so_backfill_counts
         WHERE organisation_id = 'org_so_empty'
           AND year_groups_added >= 4
       )
       AND (
         SELECT COUNT(DISTINCT private._ccd_norm_catalog_name(name))
         FROM public.year_groups
         WHERE organisation_id = 'org_so_empty'
           AND private._ccd_norm_catalog_name(name) IN (
             'so eyfs', 'so reception', 'so year 1', 'so year 2'
           )
       ) = 4
       AND private._ccd_org_catalog_was_seeded('org_so_empty');

INSERT INTO seeded_once_results
SELECT 'empty org marker reason is seeded',
       EXISTS (
         SELECT 1 FROM private.ccd_org_catalog_seeded
         WHERE organisation_id = 'org_so_empty' AND reason = 'seeded'
       );

INSERT INTO seeded_once_results
SELECT 'wipe org not refilled by backfill',
       NOT EXISTS (SELECT 1 FROM so_backfill_counts WHERE organisation_id = 'org_so_wipe')
       AND (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_wipe') = 0
       AND private._ccd_org_catalog_was_seeded('org_so_wipe');

INSERT INTO seeded_once_results
SELECT 'partial org skipped and marked',
       NOT EXISTS (SELECT 1 FROM so_backfill_counts WHERE organisation_id = 'org_so_partial')
       AND (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_partial') = 1
       AND EXISTS (
         SELECT 1 FROM private.ccd_org_catalog_seeded
         WHERE organisation_id = 'org_so_partial' AND reason = 'skipped_existing'
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.year_groups
         WHERE organisation_id = 'org_so_partial'
           AND private._ccd_norm_catalog_name(name) IN ('so eyfs', 'so year 1', 'so year 2')
       );

INSERT INTO seeded_once_results
SELECT 'v3 one-time job marker recorded',
       EXISTS (
         SELECT 1 FROM private.ccd_one_time_jobs
         WHERE job_key = 'catalog_empty_org_defaults_v3'
       );

-- Snap counts before three re-runs.
CREATE TEMP TABLE so_snap AS
SELECT
  (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_empty') AS empty_yg,
  (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_wipe') AS wipe_yg,
  (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_partial') AS partial_yg,
  (SELECT COUNT(*) FROM public.category_groups WHERE organisation_id = 'org_so_empty') AS empty_cg,
  (SELECT COUNT(*) FROM public.custom_categories WHERE organisation_id = 'org_so_empty') AS empty_cc;

-- Clear job marker so re-runs exercise the function body; per-org markers must hold.
DELETE FROM private.ccd_one_time_jobs WHERE job_key = 'catalog_empty_org_defaults_v3';

CREATE TEMP TABLE so_rerun1 (
  organisation_id text, year_groups_added int,
  category_groups_added int, custom_categories_added int
);
INSERT INTO so_rerun1 SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

DELETE FROM private.ccd_one_time_jobs WHERE job_key = 'catalog_empty_org_defaults_v3';

CREATE TEMP TABLE so_rerun2 (
  organisation_id text, year_groups_added int,
  category_groups_added int, custom_categories_added int
);
INSERT INTO so_rerun2 SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

DELETE FROM private.ccd_one_time_jobs WHERE job_key = 'catalog_empty_org_defaults_v3';

CREATE TEMP TABLE so_rerun3 (
  organisation_id text, year_groups_added int,
  category_groups_added int, custom_categories_added int
);
INSERT INTO so_rerun3 SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

INSERT INTO seeded_once_results
SELECT 'three re-runs return no seeded rows for test orgs',
       NOT EXISTS (
         SELECT 1 FROM so_rerun1
         WHERE organisation_id IN ('org_so_empty', 'org_so_wipe', 'org_so_partial')
       )
       AND NOT EXISTS (
         SELECT 1 FROM so_rerun2
         WHERE organisation_id IN ('org_so_empty', 'org_so_wipe', 'org_so_partial')
       )
       AND NOT EXISTS (
         SELECT 1 FROM so_rerun3
         WHERE organisation_id IN ('org_so_empty', 'org_so_wipe', 'org_so_partial')
       );

INSERT INTO seeded_once_results
SELECT 'three re-runs make no duplicates',
       (SELECT empty_yg FROM so_snap)
         = (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_empty')
       AND (SELECT empty_cg FROM so_snap)
         = (SELECT COUNT(*) FROM public.category_groups WHERE organisation_id = 'org_so_empty')
       AND (SELECT empty_cc FROM so_snap)
         = (SELECT COUNT(*) FROM public.custom_categories WHERE organisation_id = 'org_so_empty')
       AND (SELECT partial_yg FROM so_snap)
         = (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_partial');

INSERT INTO seeded_once_results
SELECT 'wipe stays empty after three re-runs',
       (SELECT wipe_yg FROM so_snap) = 0
       AND (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_wipe') = 0
       AND (SELECT COUNT(*) FROM public.category_groups WHERE organisation_id = 'org_so_wipe') = 0
       AND (SELECT COUNT(*) FROM public.custom_categories WHERE organisation_id = 'org_so_wipe') = 0;

-- Direct seed helper also refuses to refill a marked wiped school.
SELECT private._ccd_seed_org_catalog_defaults('org_so_wipe');
SELECT private._ccd_seed_org_catalog_defaults('org_so_wipe');
SELECT private._ccd_seed_org_catalog_defaults('org_so_wipe');

INSERT INTO seeded_once_results
SELECT 'direct seed three times leaves wipe empty',
       (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_wipe') = 0;

-- Partial school that later deletes everything also stays empty.
DELETE FROM public.year_groups WHERE organisation_id = 'org_so_partial';
DELETE FROM private.ccd_one_time_jobs WHERE job_key = 'catalog_empty_org_defaults_v3';
CREATE TEMP TABLE so_partial_wipe_rerun (
  organisation_id text, year_groups_added int,
  category_groups_added int, custom_categories_added int
);
INSERT INTO so_partial_wipe_rerun
SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

INSERT INTO seeded_once_results
SELECT 'partial-then-wipe stays empty',
       NOT EXISTS (
         SELECT 1 FROM so_partial_wipe_rerun WHERE organisation_id = 'org_so_partial'
       )
       AND (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_so_partial') = 0
       AND private._ccd_org_catalog_was_seeded('org_so_partial');

-- Non-admin (and school admin) cannot write the marker.
DO $$
DECLARE
  blocked_teacher boolean := false;
  blocked_admin boolean := false;
  before_n int;
  after_n int;
BEGIN
  SELECT COUNT(*) INTO before_n FROM private.ccd_org_catalog_seeded;

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000e1', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO private.ccd_org_catalog_seeded (organisation_id, reason)
    VALUES ('org_so_empty', 'seeded');
    blocked_teacher := false;
  EXCEPTION
    WHEN insufficient_privilege THEN blocked_teacher := true;
    WHEN undefined_table THEN blocked_teacher := true;
    WHEN OTHERS THEN blocked_teacher := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000e2', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO private.ccd_org_catalog_seeded (organisation_id, reason)
    VALUES ('org_hack', 'seeded');
    blocked_admin := false;
  EXCEPTION
    WHEN insufficient_privilege THEN blocked_admin := true;
    WHEN undefined_table THEN blocked_admin := true;
    WHEN OTHERS THEN blocked_admin := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  SELECT COUNT(*) INTO after_n FROM private.ccd_org_catalog_seeded;

  INSERT INTO seeded_once_results VALUES (
    'teacher cannot write seeded marker',
    blocked_teacher
  );
  INSERT INTO seeded_once_results VALUES (
    'school admin cannot write seeded marker',
    blocked_admin
  );
  INSERT INTO seeded_once_results VALUES (
    'failed marker writes leave ledger unchanged',
    after_n = before_n
  );
END $$;

-- authenticated cannot call mark/was_seeded helpers
DO $$
DECLARE
  blocked_mark boolean := false;
  blocked_was boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000e2', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM private._ccd_mark_org_catalog_seeded('org_hack', 'seeded');
    blocked_mark := false;
  EXCEPTION
    WHEN insufficient_privilege THEN blocked_mark := true;
    WHEN OTHERS THEN blocked_mark := true;
  END;
  BEGIN
    PERFORM private._ccd_org_catalog_was_seeded('org_so_empty');
    blocked_was := false;
  EXCEPTION
    WHEN insufficient_privilege THEN blocked_was := true;
    WHEN OTHERS THEN blocked_was := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  INSERT INTO seeded_once_results VALUES (
    'authenticated cannot call mark helper',
    blocked_mark
  );
  INSERT INTO seeded_once_results VALUES (
    'authenticated cannot call was_seeded helper',
    blocked_was
  );
END $$;

DO $$
DECLARE failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM seeded_once_results WHERE NOT ok;
  RAISE NOTICE 'catalog_org_seeded_once: % passed, % failed',
    (SELECT COUNT(*) FROM seeded_once_results WHERE ok), failed;
  IF failed > 0 THEN
    RAISE EXCEPTION 'catalog_org_seeded_once failures: %',
      (SELECT string_agg(name, ', ') FROM seeded_once_results WHERE NOT ok);
  END IF;
END $$;

SELECT * FROM seeded_once_results ORDER BY name;

ROLLBACK;
