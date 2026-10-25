-- One-time partial-org catalog backfill (20261024340000).
-- Run after scratch + 240000..340000 (never production).
-- Resets the one-time job marker so the helper can be exercised in scratch.

BEGIN;

CREATE TEMP TABLE rls_results (name TEXT, ok BOOLEAN);

-- Allow re-running the backfill helper in this test transaction.
DELETE FROM private.ccd_one_time_jobs WHERE job_key = 'catalog_partial_defaults_v1';

INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES
  ('org_partial', 'Partial School', 'org_partial', 'org_partial', 'Partial', 'Partial', 'active'),
  ('org_full', 'Full School', 'org_full', 'org_full', 'Full', 'Full', 'active'),
  ('org_empty', 'Empty School', 'org_empty', 'org_empty', 'Empty', 'Empty', 'active')
ON CONFLICT (id) DO NOTHING;

-- Shared NULL-org defaults (super-admin set). Distinct ids so we can assert untouched.
DELETE FROM public.year_groups
WHERE id IN ('def_rec', 'def_y1', 'def_y2')
   OR (organisation_id IS NULL AND name IN ('Reception Music', 'Year 1 Music', 'Year 2 Music'));
DELETE FROM public.category_groups
WHERE id IN ('def_cg_warm')
   OR (organisation_id IS NULL AND name = 'Warm-ups Default');
DELETE FROM public.custom_categories
WHERE id IN ('def_cc_vocal')
   OR (organisation_id IS NULL AND name = 'Vocal Warmups Default');

INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES
  ('def_rec', 'Reception Music', 1, NULL),
  ('def_y1', 'Year 1 Music', 2, NULL),
  ('def_y2', 'Year 2 Music', 3, NULL);

INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
VALUES ('def_cg_warm', 'Warm-ups Default', 1, NULL);

INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
VALUES ('def_cc_vocal', 'Vocal Warmups Default', '#14B8A6', 1, NULL);

-- Partial org: only Reception (whitespace/case variant of the default name).
DELETE FROM public.year_groups WHERE organisation_id IN ('org_partial', 'org_full', 'org_empty');
DELETE FROM public.category_groups WHERE organisation_id IN ('org_partial', 'org_full', 'org_empty');
DELETE FROM public.custom_categories WHERE organisation_id IN ('org_partial', 'org_full', 'org_empty');

INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES ('partial_rec_existing', '  reception   music ', 10, 'org_partial');

-- Full org: all three defaults already present (normalised match).
INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES
  ('full_rec', 'Reception Music', 1, 'org_full'),
  ('full_y1', 'Year 1 Music', 2, 'org_full'),
  ('full_y2', 'Year 2 Music', 3, 'org_full');

INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
VALUES ('full_cg', 'Warm-ups Default', 1, 'org_full');

INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
VALUES ('full_cc', 'Vocal Warmups Default', '#111111', 1, 'org_full');

-- Snapshot NULL-org and existing partial row before backfill.
CREATE TEMP TABLE snap AS
SELECT
  (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id IS NULL) AS null_yg,
  (SELECT COUNT(*) FROM public.category_groups WHERE organisation_id IS NULL) AS null_cg,
  (SELECT COUNT(*) FROM public.custom_categories WHERE organisation_id IS NULL) AS null_cc,
  (SELECT name FROM public.year_groups WHERE id = 'partial_rec_existing') AS partial_name,
  (SELECT sort_order FROM public.year_groups WHERE id = 'partial_rec_existing') AS partial_sort,
  (SELECT name FROM public.custom_categories WHERE id = 'full_cc') AS full_cc_name,
  (SELECT color FROM public.custom_categories WHERE id = 'full_cc') AS full_cc_color;

-- Run backfill; capture returned counts.
CREATE TEMP TABLE backfill_counts (
  organisation_id text,
  year_groups_added int,
  category_groups_added int,
  custom_categories_added int
);

INSERT INTO backfill_counts
SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

-- Partial org: exactly the missing defaults (Y1 + Y2; Reception already matched by norm name)
INSERT INTO rls_results
SELECT 'partial org returned in counts',
       EXISTS (
         SELECT 1 FROM backfill_counts
         WHERE organisation_id = 'org_partial'
           AND year_groups_added = 2
           AND category_groups_added = 1
           AND custom_categories_added = 1
       );

INSERT INTO rls_results
SELECT 'partial org has all three year groups by norm name',
       (
         SELECT COUNT(DISTINCT private._ccd_norm_catalog_name(name))
         FROM public.year_groups
         WHERE organisation_id = 'org_partial'
           AND private._ccd_norm_catalog_name(name) IN (
             'reception music', 'year 1 music', 'year 2 music'
           )
       ) = 3;

INSERT INTO rls_results
SELECT 'partial org existing Reception row untouched',
       EXISTS (
         SELECT 1 FROM public.year_groups y, snap s
         WHERE y.id = 'partial_rec_existing'
           AND y.name = s.partial_name
           AND y.sort_order = s.partial_sort
           AND y.organisation_id = 'org_partial'
       );

-- Full org: none added
INSERT INTO rls_results
SELECT 'full org not in counts (or zero adds)',
       NOT EXISTS (
         SELECT 1 FROM backfill_counts
         WHERE organisation_id = 'org_full'
           AND (year_groups_added > 0 OR category_groups_added > 0 OR custom_categories_added > 0)
       );

INSERT INTO rls_results
SELECT 'full org still has exactly three year groups',
       (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_full') = 3;

INSERT INTO rls_results
SELECT 'full org existing category row untouched',
       EXISTS (
         SELECT 1 FROM public.custom_categories c, snap s
         WHERE c.id = 'full_cc'
           AND c.name = s.full_cc_name
           AND c.color = s.full_cc_color
       );

-- Empty org skipped (not partial)
INSERT INTO rls_results
SELECT 'empty org not backfilled',
       NOT EXISTS (
         SELECT 1 FROM public.year_groups WHERE organisation_id = 'org_empty'
       )
       AND NOT EXISTS (
         SELECT 1 FROM backfill_counts WHERE organisation_id = 'org_empty'
       );

-- NULL-org defaults untouched
INSERT INTO rls_results
SELECT 'NULL-org year_groups untouched',
       (SELECT null_yg FROM snap) = (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id IS NULL)
       AND EXISTS (SELECT 1 FROM public.year_groups WHERE id = 'def_rec' AND organisation_id IS NULL)
       AND EXISTS (SELECT 1 FROM public.year_groups WHERE id = 'def_y1' AND organisation_id IS NULL)
       AND EXISTS (SELECT 1 FROM public.year_groups WHERE id = 'def_y2' AND organisation_id IS NULL);

INSERT INTO rls_results
SELECT 'NULL-org categories untouched',
       (SELECT null_cg FROM snap) = (SELECT COUNT(*) FROM public.category_groups WHERE organisation_id IS NULL)
       AND (SELECT null_cc FROM snap) = (SELECT COUNT(*) FROM public.custom_categories WHERE organisation_id IS NULL)
       AND EXISTS (SELECT 1 FROM public.category_groups WHERE id = 'def_cg_warm' AND organisation_id IS NULL)
       AND EXISTS (SELECT 1 FROM public.custom_categories WHERE id = 'def_cc_vocal' AND organisation_id IS NULL);

-- Job marker recorded
INSERT INTO rls_results
SELECT 'one-time job marker recorded',
       EXISTS (
         SELECT 1 FROM private.ccd_one_time_jobs
         WHERE job_key = 'catalog_partial_defaults_v1'
       );

-- School removes a year group after backfill — rerun must not bring it back.
DELETE FROM public.year_groups
WHERE organisation_id = 'org_partial'
  AND private._ccd_norm_catalog_name(name) = 'year 2 music';

CREATE TEMP TABLE counts_after_delete AS
SELECT COUNT(*) AS n FROM public.year_groups WHERE organisation_id = 'org_partial';

-- Rerun: should add nothing (job marker)
CREATE TEMP TABLE backfill_rerun (
  organisation_id text,
  year_groups_added int,
  category_groups_added int,
  custom_categories_added int
);
INSERT INTO backfill_rerun
SELECT * FROM private._ccd_backfill_missing_catalog_defaults();

INSERT INTO rls_results
SELECT 'rerun returns no rows',
       (SELECT COUNT(*) FROM backfill_rerun) = 0;

INSERT INTO rls_results
SELECT 'rerun does not re-add removed year group',
       (SELECT n FROM counts_after_delete)
         = (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_partial')
       AND NOT EXISTS (
         SELECT 1 FROM public.year_groups
         WHERE organisation_id = 'org_partial'
           AND private._ccd_norm_catalog_name(name) = 'year 2 music'
       );

-- Normalised-name helper sanity
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
