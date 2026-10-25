-- Rob: helpers + job ledger for catalog defaults backfill.
-- Originally defined a partial-fill backfill (catalog_partial_defaults_v1).
-- Rob Option 2 + Security Reviewer: do NOT run that partial fill at apply
-- time — it would insert missing defaults into schools that already have
-- some year groups, which cannot be undone. 380000 replaces the function
-- with empty-org-only seeding; 390000 adds the per-org seeded-once marker.
--
-- This migration still creates private.ccd_one_time_jobs, _ccd_norm_catalog_name,
-- and the (superseded) function body so later migrations can CREATE OR REPLACE.
-- It records catalog_partial_defaults_v1 as skipped so nothing can execute the
-- old partial fill later. Additive + idempotent. Do not apply to live DB until review.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- ---------------------------------------------------------------------------
-- One-time job ledger (prevents re-adding after a school deletes a default).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS private.ccd_one_time_jobs (
  job_key TEXT PRIMARY KEY,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(detail) = 'object')
);

REVOKE ALL ON TABLE private.ccd_one_time_jobs FROM PUBLIC;
REVOKE ALL ON TABLE private.ccd_one_time_jobs FROM anon, authenticated;
GRANT ALL ON TABLE private.ccd_one_time_jobs TO postgres, service_role;

-- Normalise catalog names for matching (trim, collapse whitespace, lower-case).
CREATE OR REPLACE FUNCTION private._ccd_norm_catalog_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT NULLIF(
    lower(btrim(regexp_replace(COALESCE(p_name, ''), '\s+', ' ', 'g'))),
    ''
  );
$$;

REVOKE ALL ON FUNCTION private._ccd_norm_catalog_name(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_norm_catalog_name(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_norm_catalog_name(text) TO service_role;

COMMENT ON FUNCTION private._ccd_norm_catalog_name(text) IS
  'Normalise year-group / category names for backfill matching (lower, trim, collapse spaces).';

-- ---------------------------------------------------------------------------
-- Backfill missing defaults for partial orgs. Returns per-org insert counts.
-- ---------------------------------------------------------------------------
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
  v_job_key text := 'catalog_partial_defaults_v1';
  v_org record;
  v_yg int;
  v_cg int;
  v_cc int;
  v_detail jsonb := '{}'::jsonb;
  has_yg_color boolean;
  has_cc_color boolean;
  has_cc_sort boolean;
  has_cc_position boolean;
  has_cc_groups boolean;
  has_cc_year_groups boolean;
  has_cc_group_col boolean;
  n_defaults int;
BEGIN
  -- Already ran: return no rows and insert nothing.
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

  SELECT COUNT(*) INTO n_defaults
  FROM public.year_groups s
  WHERE s.organisation_id IS NULL
    AND private._ccd_norm_catalog_name(s.name) IS NOT NULL;

  IF n_defaults = 0 THEN
    INSERT INTO private.ccd_one_time_jobs (job_key, detail)
    VALUES (v_job_key, jsonb_build_object('skipped', 'no NULL-org year_groups defaults'));
    RETURN;
  END IF;

  has_yg_color := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'year_groups' AND column_name = 'color'
  );
  has_cc_color := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'color'
  );
  has_cc_sort := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'sort_order'
  );
  has_cc_position := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'position'
  );
  has_cc_groups := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'groups'
  );
  has_cc_year_groups := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'year_groups'
  );
  has_cc_group_col := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'group'
  );

  -- Partial orgs only: already have ≥1 year_group of their own, and are
  -- missing at least one NULL-org default by normalised name.
  FOR v_org IN
    SELECT o.id::text AS id
    FROM public.organisations o
    WHERE EXISTS (
      SELECT 1 FROM public.year_groups yg
      WHERE yg.organisation_id IS NOT DISTINCT FROM o.id::text
    )
    AND EXISTS (
      SELECT 1
      FROM public.year_groups s
      WHERE s.organisation_id IS NULL
        AND private._ccd_norm_catalog_name(s.name) IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.year_groups yg2
          WHERE yg2.organisation_id IS NOT DISTINCT FROM o.id::text
            AND private._ccd_norm_catalog_name(yg2.name)
              IS NOT DISTINCT FROM private._ccd_norm_catalog_name(s.name)
        )
    )
    ORDER BY o.id::text
  LOOP
    v_yg := 0;
    v_cg := 0;
    v_cc := 0;

    -- year_groups (insert missing only; never update existing)
    IF has_yg_color THEN
      EXECUTE $q$
        WITH ins AS (
          INSERT INTO public.year_groups (id, name, sort_order, color, organisation_id)
          SELECT gen_random_uuid()::text, s.name, s.sort_order, s.color, $1
          FROM public.year_groups s
          WHERE s.organisation_id IS NULL
            AND private._ccd_norm_catalog_name(s.name) IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM public.year_groups o
              WHERE o.organisation_id IS NOT DISTINCT FROM $1
                AND private._ccd_norm_catalog_name(o.name)
                  IS NOT DISTINCT FROM private._ccd_norm_catalog_name(s.name)
            )
          RETURNING 1
        )
        SELECT COUNT(*)::int FROM ins
      $q$ INTO v_yg USING v_org.id;
    ELSE
      EXECUTE $q$
        WITH ins AS (
          INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
          SELECT gen_random_uuid()::text, s.name, s.sort_order, $1
          FROM public.year_groups s
          WHERE s.organisation_id IS NULL
            AND private._ccd_norm_catalog_name(s.name) IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM public.year_groups o
              WHERE o.organisation_id IS NOT DISTINCT FROM $1
                AND private._ccd_norm_catalog_name(o.name)
                  IS NOT DISTINCT FROM private._ccd_norm_catalog_name(s.name)
            )
          RETURNING 1
        )
        SELECT COUNT(*)::int FROM ins
      $q$ INTO v_yg USING v_org.id;
    END IF;

    -- category_groups
    IF to_regclass('public.category_groups') IS NOT NULL THEN
      EXECUTE $q$
        WITH ins AS (
          INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
          SELECT gen_random_uuid()::text, s.name, s.sort_order, $1
          FROM public.category_groups s
          WHERE s.organisation_id IS NULL
            AND private._ccd_norm_catalog_name(s.name) IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM public.category_groups o
              WHERE o.organisation_id IS NOT DISTINCT FROM $1
                AND private._ccd_norm_catalog_name(o.name)
                  IS NOT DISTINCT FROM private._ccd_norm_catalog_name(s.name)
            )
          RETURNING 1
        )
        SELECT COUNT(*)::int FROM ins
      $q$ INTO v_cg USING v_org.id;
    END IF;

    -- custom_categories
    IF to_regclass('public.custom_categories') IS NOT NULL THEN
      EXECUTE format(
        $q$
        WITH ins AS (
          INSERT INTO public.custom_categories AS t (%s)
          SELECT %s
          FROM public.custom_categories s
          WHERE s.organisation_id IS NULL
            AND private._ccd_norm_catalog_name(s.name) IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM public.custom_categories o
              WHERE o.organisation_id IS NOT DISTINCT FROM $1
                AND private._ccd_norm_catalog_name(o.name)
                  IS NOT DISTINCT FROM private._ccd_norm_catalog_name(s.name)
            )
          RETURNING 1
        )
        SELECT COUNT(*)::int FROM ins
        $q$,
        array_to_string(
          ARRAY['id', 'name', 'organisation_id']
            || CASE WHEN has_cc_color THEN ARRAY['color'] ELSE ARRAY[]::text[] END
            || CASE WHEN has_cc_sort THEN ARRAY['sort_order'] ELSE ARRAY[]::text[] END
            || CASE WHEN has_cc_position THEN ARRAY['position'] ELSE ARRAY[]::text[] END
            || CASE WHEN has_cc_groups THEN ARRAY['groups'] ELSE ARRAY[]::text[] END
            || CASE WHEN has_cc_year_groups THEN ARRAY['year_groups'] ELSE ARRAY[]::text[] END
            || CASE WHEN has_cc_group_col THEN ARRAY['"group"'] ELSE ARRAY[]::text[] END,
          ', '
        ),
        array_to_string(
          ARRAY['gen_random_uuid()::text', 's.name', '$1']
            || CASE WHEN has_cc_color THEN ARRAY['s.color'] ELSE ARRAY[]::text[] END
            || CASE WHEN has_cc_sort THEN ARRAY['s.sort_order'] ELSE ARRAY[]::text[] END
            || CASE WHEN has_cc_position THEN ARRAY['s.position'] ELSE ARRAY[]::text[] END
            || CASE WHEN has_cc_groups THEN ARRAY['s.groups'] ELSE ARRAY[]::text[] END
            || CASE WHEN has_cc_year_groups THEN ARRAY['s.year_groups'] ELSE ARRAY[]::text[] END
            || CASE WHEN has_cc_group_col THEN ARRAY['s."group"'] ELSE ARRAY[]::text[] END,
          ', '
        )
      ) INTO v_cc USING v_org.id;
    END IF;

    organisation_id := v_org.id;
    year_groups_added := COALESCE(v_yg, 0);
    category_groups_added := COALESCE(v_cg, 0);
    custom_categories_added := COALESCE(v_cc, 0);

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

  -- Mark complete even when no partial orgs needed changes (full set everywhere).
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
  'Superseded at apply time: body kept for CREATE OR REPLACE chain. Do not execute — Rob Option 2 (380000) seeds empty orgs only; 390000 adds per-org seeded-once markers. Job key catalog_partial_defaults_v1 is pre-marked skipped.';

-- Do NOT run the partial fill. Record v1 as skipped so a later accidental
-- call of this (pre-380000) function body is a no-op via the job marker.
INSERT INTO private.ccd_one_time_jobs (job_key, detail)
VALUES (
  'catalog_partial_defaults_v1',
  jsonb_build_object(
    'skipped',
    'superseded by 380000 / Rob Option 2'
  )
)
ON CONFLICT (job_key) DO NOTHING;
