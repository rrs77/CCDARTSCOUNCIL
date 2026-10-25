-- Ordered apply (340000 → 380000 → 390000) without clearing job markers.
-- Asserts Option 2 + seeded-once on fixtures inserted before 340000:
--   org_ord_partial (1 year group) stays at exactly 1
--   org_ord_empty (0 year groups) is seeded once
-- Never deletes private.ccd_one_time_jobs rows. Never production.

BEGIN;

CREATE TEMP TABLE ordered_apply_results (name TEXT, ok BOOLEAN);

INSERT INTO ordered_apply_results
SELECT 'v1 job marked skipped (no partial fill)',
       EXISTS (
         SELECT 1 FROM private.ccd_one_time_jobs
         WHERE job_key = 'catalog_partial_defaults_v1'
           AND detail->>'skipped' ILIKE '%380000%'
       );

INSERT INTO ordered_apply_results
SELECT 'v2 and/or v3 empty-org job recorded',
       EXISTS (
         SELECT 1 FROM private.ccd_one_time_jobs
         WHERE job_key IN (
           'catalog_empty_org_defaults_v2',
           'catalog_empty_org_defaults_v3'
         )
       );

INSERT INTO ordered_apply_results
SELECT 'partial org still has exactly one year group',
       (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_ord_partial') = 1
       AND EXISTS (
         SELECT 1 FROM public.year_groups
         WHERE id = 'ord_partial_only'
           AND organisation_id = 'org_ord_partial'
           AND private._ccd_norm_catalog_name(name) = 'ord reception'
       );

INSERT INTO ordered_apply_results
SELECT 'partial org not filled with other defaults',
       NOT EXISTS (
         SELECT 1 FROM public.year_groups
         WHERE organisation_id = 'org_ord_partial'
           AND private._ccd_norm_catalog_name(name) IN (
             'ord eyfs', 'ord year 1', 'ord year 2'
           )
       );

INSERT INTO ordered_apply_results
SELECT 'empty org seeded with defaults once',
       (
         SELECT COUNT(DISTINCT private._ccd_norm_catalog_name(name))
         FROM public.year_groups
         WHERE organisation_id = 'org_ord_empty'
           AND private._ccd_norm_catalog_name(name) IN (
             'ord eyfs', 'ord reception', 'ord year 1', 'ord year 2'
           )
       ) = 4;

INSERT INTO ordered_apply_results
SELECT 'empty org got category defaults',
       EXISTS (
         SELECT 1 FROM public.category_groups
         WHERE organisation_id = 'org_ord_empty'
           AND private._ccd_norm_catalog_name(name) = 'ord warm-ups'
       )
       AND EXISTS (
         SELECT 1 FROM public.custom_categories
         WHERE organisation_id = 'org_ord_empty'
           AND private._ccd_norm_catalog_name(name) = 'ord vocal'
       );

INSERT INTO ordered_apply_results
SELECT 'partial org has seeded-once marker',
       private._ccd_org_catalog_was_seeded('org_ord_partial');

INSERT INTO ordered_apply_results
SELECT 'empty org has seeded-once marker',
       private._ccd_org_catalog_was_seeded('org_ord_empty');

-- Re-invoke seed + backfill helpers without clearing markers: no refill.
CREATE TEMP TABLE ord_yg_before AS
SELECT organisation_id, COUNT(*)::int AS n
FROM public.year_groups
WHERE organisation_id IN ('org_ord_partial', 'org_ord_empty')
GROUP BY organisation_id;

SELECT private._ccd_seed_org_catalog_defaults('org_ord_partial');
SELECT private._ccd_seed_org_catalog_defaults('org_ord_empty');
SELECT private._ccd_seed_org_catalog_defaults('org_ord_partial');
SELECT private._ccd_seed_org_catalog_defaults('org_ord_empty');
SELECT private._ccd_seed_org_catalog_defaults('org_ord_partial');
SELECT private._ccd_seed_org_catalog_defaults('org_ord_empty');

INSERT INTO ordered_apply_results
SELECT 'three direct seeds do not change counts',
       (SELECT n FROM ord_yg_before WHERE organisation_id = 'org_ord_partial')
         = (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_ord_partial')
       AND (SELECT n FROM ord_yg_before WHERE organisation_id = 'org_ord_empty')
         = (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_ord_empty');

-- Wipe empty org's groups; marker must prevent refill even if v3 job cleared
-- is NOT done here — we only call the seed helper (job markers untouched).
DELETE FROM public.year_groups WHERE organisation_id = 'org_ord_empty';
DELETE FROM public.category_groups WHERE organisation_id = 'org_ord_empty';
DELETE FROM public.custom_categories WHERE organisation_id = 'org_ord_empty';

SELECT private._ccd_seed_org_catalog_defaults('org_ord_empty');
SELECT private._ccd_seed_org_catalog_defaults('org_ord_empty');
SELECT private._ccd_seed_org_catalog_defaults('org_ord_empty');

INSERT INTO ordered_apply_results
SELECT 'wiped empty org stays empty (markers kept)',
       (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_ord_empty') = 0
       AND private._ccd_org_catalog_was_seeded('org_ord_empty');

INSERT INTO ordered_apply_results
SELECT 'partial still exactly one after wipe test',
       (SELECT COUNT(*) FROM public.year_groups WHERE organisation_id = 'org_ord_partial') = 1;

DO $$
DECLARE failed int;
BEGIN
  SELECT COUNT(*) INTO failed FROM ordered_apply_results WHERE NOT ok;
  RAISE NOTICE 'catalog_backfill_ordered_apply: % passed, % failed',
    (SELECT COUNT(*) FROM ordered_apply_results WHERE ok), failed;
  IF failed > 0 THEN
    RAISE EXCEPTION 'catalog_backfill_ordered_apply failures: %',
      (SELECT string_agg(name, ', ') FROM ordered_apply_results WHERE NOT ok);
  END IF;
END $$;

SELECT * FROM ordered_apply_results ORDER BY name;

ROLLBACK;
