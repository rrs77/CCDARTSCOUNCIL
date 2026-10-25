-- Rob (Option 2): "skip schools that already have any year groups of their own".
-- When the year-group backfill runs on existing schools, it cannot tell a year
-- group a school deliberately trimmed from one it never had — so leave any
-- school that already has ≥1 org-scoped year_group untouched (partial sets
-- stay partial).
--
-- Schools with NO org-scoped year groups that have never been seeded still
-- get the full NULL-org defaults once (via private._ccd_seed_org_catalog_defaults).
-- Categories follow the same org skip: if a school already has year groups we
-- do not touch its category_groups / custom_categories either (avoids undoing
-- a deliberate trim on a school that has already set up). Empty (never seeded)
-- schools still receive year groups + categories together from the seed helper.
--
-- Does NOT implement "deleted all groups → don't refill on re-run" — waiting
-- on Rob. Current behaviour for that case is documented in the PR/test notes.
--
-- New migration only — does not edit 340000. New job key so a prior
-- catalog_partial_defaults_v1 run (if any) is not re-executed as a partial fill.
-- Additive + idempotent. Do not apply to live DB until review.

CREATE OR REPLACE FUNCTION private._ccd_backfill_missing_catalog_defaults()
RETURNS TABLE (
  organisation_id text,
  year_groups_added integer,
  category_groups_added integer,
  custom_categories_added integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  -- v2: empty-org seed only (Option 2). Distinct from catalog_partial_defaults_v1.
  v_job_key text := 'catalog_empty_org_defaults_v2';
  v_org record;
  v_before_yg int;
  v_before_cg int;
  v_before_cc int;
  v_after_yg int;
  v_after_cg int;
  v_after_cc int;
  v_detail jsonb := '{}'::jsonb;
  n_defaults int;
BEGIN
  IF EXISTS (
    SELECT 1 FROM private.ccd_one_time_jobs j WHERE j.job_key = v_job_key
  ) THEN
    RAISE NOTICE 'ccd backfill % already completed — skipping', v_job_key;
    RETURN;
  END IF;

  IF to_regclass('public.organisations') IS NULL
     OR to_regclass('public.year_groups') IS NULL THEN
    INSERT INTO private.ccd_one_time_jobs (job_key, detail)
    VALUES (v_job_key, jsonb_build_object('skipped', 'missing tables'));
    RETURN;
  END IF;

  IF to_regprocedure('private._ccd_seed_org_catalog_defaults(text)') IS NULL THEN
    INSERT INTO private.ccd_one_time_jobs (job_key, detail)
    VALUES (v_job_key, jsonb_build_object('skipped', 'seed helper missing'));
    RETURN;
  END IF;

  SELECT COUNT(*) INTO n_defaults
  FROM public.year_groups s
  WHERE s.organisation_id IS NULL
    AND private._ccd_norm_catalog_name(s.name) IS NOT NULL;

  IF n_defaults = 0 THEN
    INSERT INTO private.ccd_one_time_jobs (job_key, detail)
    VALUES (v_job_key, jsonb_build_object('skipped', 'no NULL-org year_groups defaults'));
    RETURN;
  END IF;

  -- Option 2: only organisations with ZERO org-scoped year groups.
  -- Any school that already has ≥1 year group (including a partial set) is skipped.
  FOR v_org IN
    SELECT o.id::text AS id
    FROM public.organisations o
    WHERE NOT EXISTS (
      SELECT 1 FROM public.year_groups yg
      WHERE yg.organisation_id IS NOT DISTINCT FROM o.id::text
    )
    ORDER BY o.id::text
  LOOP
    SELECT COUNT(*) INTO v_before_yg
    FROM public.year_groups yg WHERE yg.organisation_id IS NOT DISTINCT FROM v_org.id;
    SELECT COUNT(*) INTO v_before_cg
    FROM public.category_groups cg WHERE cg.organisation_id IS NOT DISTINCT FROM v_org.id;
    SELECT COUNT(*) INTO v_before_cc
    FROM public.custom_categories cc WHERE cc.organisation_id IS NOT DISTINCT FROM v_org.id;

    PERFORM private._ccd_seed_org_catalog_defaults(v_org.id);

    SELECT COUNT(*) INTO v_after_yg
    FROM public.year_groups yg WHERE yg.organisation_id IS NOT DISTINCT FROM v_org.id;
    SELECT COUNT(*) INTO v_after_cg
    FROM public.category_groups cg WHERE cg.organisation_id IS NOT DISTINCT FROM v_org.id;
    SELECT COUNT(*) INTO v_after_cc
    FROM public.custom_categories cc WHERE cc.organisation_id IS NOT DISTINCT FROM v_org.id;

    organisation_id := v_org.id;
    year_groups_added := GREATEST(v_after_yg - v_before_yg, 0);
    category_groups_added := GREATEST(v_after_cg - v_before_cg, 0);
    custom_categories_added := GREATEST(v_after_cc - v_before_cc, 0);

    v_detail := v_detail || jsonb_build_object(
      v_org.id,
      jsonb_build_object(
        'year_groups_added', year_groups_added,
        'category_groups_added', category_groups_added,
        'custom_categories_added', custom_categories_added
      )
    );

    RETURN NEXT;
  END LOOP;

  INSERT INTO private.ccd_one_time_jobs (job_key, detail)
  VALUES (v_job_key, v_detail)
  ON CONFLICT (job_key) DO NOTHING;

  RAISE NOTICE 'ccd backfill % complete: %', v_job_key, v_detail;
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_backfill_missing_catalog_defaults() FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_backfill_missing_catalog_defaults() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_backfill_missing_catalog_defaults() TO service_role;

COMMENT ON FUNCTION private._ccd_backfill_missing_catalog_defaults() IS
  'One-time (catalog_empty_org_defaults_v2): seed NULL-org catalog defaults into orgs with ZERO year_groups. Skips any school that already has any org-scoped year groups (Rob Option 2 — partial sets stay as-is). Categories follow the same org skip.';

-- Apply once at migration time.
DO $$
DECLARE
  r record;
  n int := 0;
BEGIN
  FOR r IN SELECT * FROM private._ccd_backfill_missing_catalog_defaults()
  LOOP
    n := n + 1;
    RAISE NOTICE 'empty-org seed %: yg+%, cg+%, cc+%',
      r.organisation_id, r.year_groups_added, r.category_groups_added, r.custom_categories_added;
  END LOOP;
  RAISE NOTICE 'catalog_empty_org_defaults_v2: % orgs seeded', n;
END $$;
