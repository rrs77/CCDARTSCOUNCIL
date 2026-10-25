-- Catalog backfill Option 2 (20261024380000 replaces partial-fill behaviour).
-- Skip schools that already have ANY org-scoped year groups.
-- Empty (never seeded) schools get defaults once.
-- Run after scratch + 240000..380000 (never production).

BEGIN;

CREATE TEMP TABLE rls_results (name TEXT, ok BOOLEAN);

-- Reset both job markers so the helper can be exercised in scratch.
DELETE FROM private.ccd_one_time_jobs
WHERE job_key IN ('catalog_partial_defaults_v1', 'catalog_empty_org_defaults_v2');

INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES
  ('org_partial', 'Partial School', 'org_partial', 'org_partial', 'Partial', 'Partial', 'active'),
  ('org_eyfs_y1', 'EYFS Y1 Only', 'org_eyfs_y1', 'org_eyfs_y1', 'EYFS Y1', 'EYFS', 'active'),
  ('org_full', 'Full School', 'org_full', 'org_full', 'Full', 'Full', 'active'),
  ('org_empty', 'Empty School', 'org_empty', 'org_empty', 'Empty', 'Empty', 'active')
ON CONFLICT (id) DO NOTHING;

-- Shared NULL-org defaults.
DELETE FROM public.year_groups
WHERE id IN ('def_rec', 'def_y1', 'def_y2', 'def_eyfs')
   OR (organisation_id IS NULL AND name IN (
     'Reception Music', 'Year 1 Music', 'Year 2 Music', 'EYFS'
   ));
DELETE FROM public.category_groups
WHERE id IN ('def_cg_warm')
   OR (organisation_id IS NULL AND name = 'Warm-ups Default');
DELETE FROM public.custom_categories
WHERE id IN ('def_cc_vocal')
   OR (organisation_id IS NULL AND name = 'Vocal Warmups Default');

INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES
  ('def_eyfs', 'EYFS', 0, NULL),
  ('def_rec', 'Reception Music', 1, NULL),
  ('def_y1', 'Year 1 Music', 2, NULL),
  ('def_y2', 'Year 2 Music', 3, NULL);

INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
VALUES ('def_cg_warm', 'Warm-ups Default', 1, NULL);

INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
VALUES ('def_cc_vocal', 'Vocal Warmups Default', '#14B8A6', 1, NULL);

DELETE FROM public.year_groups
WHERE organisation_id IN ('org_partial', 'org_eyfs_y1', 'org_full', 'org_empty');
DELETE FROM public.category_groups
WHERE organisation_id IN ('org_partial', 'org_eyfs_y1', 'org_full', 'org_empty');
DELETE FROM public.custom_categories
WHERE organisation_id IN ('org_partial', 'org_eyfs_y1', 'org_full', 'org_empty');

-- Partial org: only Reception (whitespace/case variant) — must stay alone (Option 2).
INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES ('partial_rec_existing', '  reception   music ', 10, 'org_partial');

-- School that kept only EYFS and Year 1 — must stay at those two.
INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES
  ('eyfs_y1_eyfs', 'EYFS', 1, 'org_eyfs_y1'),
  ('eyfs_y1_y1', 'Year 1 Music', 2, 'org_eyfs_y1');

-- Full org: all defaults already present.
INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES
  ('full_eyfs', 'EYFS', 0, 'org_full'),
  ('full_rec', 'Reception Music', 1, 'org_full'),
  ('full_y1', 'Year 1 Music', 2, 'org_full'),
  ('full_y2', 'Year 2 Music', 3, 'org_full');

INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
VALUES ('full_cg', 'Warm-ups Default', 1, 'org_full');

INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
VALUES ('full_cc', 'Vocal Warmups Default', '#111111', 1, 'org_full');

-- org_empty: no year groups — should receive defaults once.

CREATE TEMP TABLE snap AS
SELECT
  (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id IS NULL) AS null_yg,
  (SELECT COUNT(*) FROM public.category_groups WHERE organisation_id IS NULL) AS null_cg,
  (SELECT COUNT(*) FROM public.custom_categories WHERE organisation_id IS NULL) AS null_cc,
  (SELECT name FROM public.year_groups WHERE id = 'partial_rec_existing') AS partial_name,
  (SELECT sort_order FROM public.year_groups WHERE id = 'partial_rec_existing') AS partial_sort,
  (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_partial') AS partial_yg_n,
  (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_eyfs_y1') AS eyfs_y1_n,
  (SELECT name FROM public.custom_categories WHERE id = 'full_cc') AS full_cc_name,
  (SELECT color FROM public.custom_categories WHERE id = 'full_cc') AS full_cc_color;

CREATE TEMP TABLE backfill_counts (
  organisation_id text,
  year_groups_added int,
  category_groups_added int,
  custom_categories_added int
);

INSERT INTO backfill_counts
SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

-- Partial org left alone (Option 2)
INSERT INTO rls_results
SELECT 'partial org not in counts',
       NOT EXISTS (SELECT 1 FROM backfill_counts WHERE organisation_id = 'org_partial');

INSERT INTO rls_results
SELECT 'partial org year groups unchanged',
       (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_partial')
         = (SELECT partial_yg_n FROM snap)
       AND EXISTS (
         SELECT 1 FROM public.year_groups y, snap s
         WHERE y.id = 'partial_rec_existing'
           AND y.name = s.partial_name
           AND y.sort_order = s.partial_sort
       );

INSERT INTO rls_results
SELECT 'partial org still missing Year 2 (not filled)',
       NOT EXISTS (
         SELECT 1 FROM public.year_groups
         WHERE organisation_id = 'org_partial'
           AND private._ccd_norm_catalog_name(name) = 'year 2 music'
       );

-- EYFS + Year 1 only stays at those two
INSERT INTO rls_results
SELECT 'eyfs+y1 school not in counts',
       NOT EXISTS (SELECT 1 FROM backfill_counts WHERE organisation_id = 'org_eyfs_y1');

INSERT INTO rls_results
SELECT 'eyfs+y1 school stays at EYFS and Year 1 only',
       (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_eyfs_y1') = 2
       AND EXISTS (
         SELECT 1 FROM public.year_groups
         WHERE organisation_id = 'org_eyfs_y1'
           AND private._ccd_norm_catalog_name(name) = 'eyfs'
       )
       AND EXISTS (
         SELECT 1 FROM public.year_groups
         WHERE organisation_id = 'org_eyfs_y1'
           AND private._ccd_norm_catalog_name(name) = 'year 1 music'
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.year_groups
         WHERE organisation_id = 'org_eyfs_y1'
           AND private._ccd_norm_catalog_name(name) IN ('reception music', 'year 2 music')
       );

-- Empty org gets defaults once
INSERT INTO rls_results
SELECT 'empty org returned in counts',
       EXISTS (
         SELECT 1 FROM backfill_counts
         WHERE organisation_id = 'org_empty'
           AND year_groups_added >= 4
       );

INSERT INTO rls_results
SELECT 'empty org now has all default year groups',
       (
         SELECT COUNT(DISTINCT private._ccd_norm_catalog_name(name))
         FROM public.year_groups
         WHERE organisation_id = 'org_empty'
           AND private._ccd_norm_catalog_name(name) IN (
             'eyfs', 'reception music', 'year 1 music', 'year 2 music'
           )
       ) = 4;

INSERT INTO rls_results
SELECT 'empty org got category defaults',
       EXISTS (
         SELECT 1 FROM public.category_groups
         WHERE organisation_id = 'org_empty'
           AND private._ccd_norm_catalog_name(name) = 'warm-ups default'
       )
       AND EXISTS (
         SELECT 1 FROM public.custom_categories
         WHERE organisation_id = 'org_empty'
           AND private._ccd_norm_catalog_name(name) = 'vocal warmups default'
       );

-- Full org untouched
INSERT INTO rls_results
SELECT 'full org not in counts',
       NOT EXISTS (SELECT 1 FROM backfill_counts WHERE organisation_id = 'org_full');

INSERT INTO rls_results
SELECT 'full org existing category row untouched',
       EXISTS (
         SELECT 1 FROM public.custom_categories c, snap s
         WHERE c.id = 'full_cc'
           AND c.name = s.full_cc_name
           AND c.color = s.full_cc_color
       );

-- NULL-org defaults untouched
INSERT INTO rls_results
SELECT 'NULL-org year_groups untouched',
       (SELECT null_yg FROM snap) = (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id IS NULL);

INSERT INTO rls_results
SELECT 'NULL-org categories untouched',
       (SELECT null_cg FROM snap) = (SELECT COUNT(*) FROM public.category_groups WHERE organisation_id IS NULL)
       AND (SELECT null_cc FROM snap) = (SELECT COUNT(*) FROM public.custom_categories WHERE organisation_id IS NULL);

INSERT INTO rls_results
SELECT 'one-time job marker recorded',
       EXISTS (
         SELECT 1 FROM private.ccd_one_time_jobs
         WHERE job_key = 'catalog_empty_org_defaults_v2'
       );

-- Three re-runs: no changes, no duplicates
CREATE TEMP TABLE empty_yg_after_first AS
SELECT COUNT(*) AS n FROM public.year_groups WHERE organisation_id = 'org_empty';

CREATE TEMP TABLE backfill_rerun1 (
  organisation_id text, year_groups_added int,
  category_groups_added int, custom_categories_added int
);
INSERT INTO backfill_rerun1 SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

CREATE TEMP TABLE backfill_rerun2 (
  organisation_id text, year_groups_added int,
  category_groups_added int, custom_categories_added int
);
INSERT INTO backfill_rerun2 SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

CREATE TEMP TABLE backfill_rerun3 (
  organisation_id text, year_groups_added int,
  category_groups_added int, custom_categories_added int
);
INSERT INTO backfill_rerun3 SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

INSERT INTO rls_results
SELECT 'three re-runs return no rows',
       (SELECT COUNT(*) FROM backfill_rerun1) = 0
       AND (SELECT COUNT(*) FROM backfill_rerun2) = 0
       AND (SELECT COUNT(*) FROM backfill_rerun3) = 0;

INSERT INTO rls_results
SELECT 'three re-runs make no duplicates',
       (SELECT n FROM empty_yg_after_first)
         = (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_empty')
       AND (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_partial')
         = (SELECT partial_yg_n FROM snap)
       AND (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_eyfs_y1') = 2;

INSERT INTO rls_results
SELECT 'norm name collapses whitespace and case',
       private._ccd_norm_catalog_name('  Year   1  Music ') = 'year 1 music';

DO $$
DECLARE failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM rls_results WHERE NOT ok;
  RAISE NOTICE 'catalog_partial_defaults_backfill: % passed, % failed',
    (SELECT COUNT(*) FROM rls_results WHERE ok), failed;
  IF failed > 0 THEN
    RAISE EXCEPTION 'catalog_partial_defaults_backfill failures: %',
      (SELECT string_agg(name, ', ') FROM rls_results WHERE NOT ok);
  END IF;
END $$;

SELECT * FROM rls_results ORDER BY name;

ROLLBACK;
