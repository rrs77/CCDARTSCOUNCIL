-- Fixtures for ordered-apply check: set up AFTER 330000, BEFORE 340000.
-- Simulates existing schools already on the database when Option 2 / seeded-once
-- migrations apply. Seed trigger disabled so we control year-group counts.
-- Never production.

DO $$
BEGIN
  IF to_regclass('public.organisations') IS NULL
     OR to_regclass('public.year_groups') IS NULL THEN
    RAISE EXCEPTION 'catalog_backfill_ordered_apply_fixtures: missing tables';
  END IF;
END $$;

-- Shared NULL-org defaults the later backfill will copy into empty orgs.
DELETE FROM public.year_groups
WHERE id IN ('ord_def_eyfs', 'ord_def_rec', 'ord_def_y1', 'ord_def_y2')
   OR (organisation_id IS NULL AND name IN (
     'Ord EYFS', 'Ord Reception', 'Ord Year 1', 'Ord Year 2'
   ));
DELETE FROM public.category_groups
WHERE id IN ('ord_def_cg')
   OR (organisation_id IS NULL AND name = 'Ord Warm-ups');
DELETE FROM public.custom_categories
WHERE id IN ('ord_def_cc')
   OR (organisation_id IS NULL AND name = 'Ord Vocal');

INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES
  ('ord_def_eyfs', 'Ord EYFS', 0, NULL),
  ('ord_def_rec', 'Ord Reception', 1, NULL),
  ('ord_def_y1', 'Ord Year 1', 2, NULL),
  ('ord_def_y2', 'Ord Year 2', 3, NULL);

INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
VALUES ('ord_def_cg', 'Ord Warm-ups', 1, NULL);

INSERT INTO public.custom_categories (id, name, color, sort_order, organisation_id)
VALUES ('ord_def_cc', 'Ord Vocal', '#14B8A6', 1, NULL);

ALTER TABLE public.organisations DISABLE TRIGGER trg_ccd_seed_org_catalog_defaults;

INSERT INTO public.organisations (id, name, partner_slug, slug, display_name, short_name, status)
VALUES
  ('org_ord_partial', 'Ord Partial', 'org_ord_partial', 'org_ord_partial', 'Ord Partial', 'Partial', 'active'),
  ('org_ord_empty', 'Ord Empty', 'org_ord_empty', 'org_ord_empty', 'Ord Empty', 'Empty', 'active')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.organisations ENABLE TRIGGER trg_ccd_seed_org_catalog_defaults;

DELETE FROM public.year_groups
WHERE organisation_id IN ('org_ord_partial', 'org_ord_empty');
DELETE FROM public.category_groups
WHERE organisation_id IN ('org_ord_partial', 'org_ord_empty');
DELETE FROM public.custom_categories
WHERE organisation_id IN ('org_ord_partial', 'org_ord_empty');

-- Partial school: exactly one own year group before 340000/380000/390000.
INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
VALUES ('ord_partial_only', 'Ord Reception', 10, 'org_ord_partial');

-- Empty school: zero year groups (never seeded).
