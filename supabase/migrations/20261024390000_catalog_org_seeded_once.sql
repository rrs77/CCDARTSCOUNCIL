-- Rob (b): "Yes, only seed each school once, a school that deleted all its
-- year groups stays empty".
--
-- Per-school one-time 'seeded once' ledger in schema private. Written when a
-- school is seeded (seed-on-create or backfill) OR when backfill skips a school
-- that already has any org-scoped year groups (Option 2). Not user-writable —
-- REVOKE ALL from PUBLIC/anon/authenticated like the rest of private.
--
-- Seed helper and backfill both no-op when the marker is present, so wiping
-- every year group after a seed/skip leaves the school empty on re-run.
--
-- New job key catalog_empty_org_defaults_v3 so a prior v2 run still gets a
-- marking pass. Additive + idempotent. Do not apply to live DB until review.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- ---------------------------------------------------------------------------
-- Per-org seeded-once ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS private.ccd_org_catalog_seeded (
  organisation_id TEXT PRIMARY KEY,
  seeded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT NOT NULL DEFAULT 'seeded'
    CHECK (reason IN ('seeded', 'skipped_existing'))
);

REVOKE ALL ON TABLE private.ccd_org_catalog_seeded FROM PUBLIC;
REVOKE ALL ON TABLE private.ccd_org_catalog_seeded FROM anon, authenticated;
GRANT ALL ON TABLE private.ccd_org_catalog_seeded TO postgres, service_role;

COMMENT ON TABLE private.ccd_org_catalog_seeded IS
  'One-time per-school catalog seed marker. Set when defaults are seeded or when backfill skips a school that already has year groups. Prevents refill after a school deletes all its year groups. Not exposed via PostgREST.';

CREATE OR REPLACE FUNCTION private._ccd_org_catalog_was_seeded(p_org text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.ccd_org_catalog_seeded s
    WHERE s.organisation_id = NULLIF(btrim(p_org), '')
  );
$$;

REVOKE ALL ON FUNCTION private._ccd_org_catalog_was_seeded(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_org_catalog_was_seeded(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_org_catalog_was_seeded(text) TO service_role;

CREATE OR REPLACE FUNCTION private._ccd_mark_org_catalog_seeded(p_org text, p_reason text DEFAULT 'seeded')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org text := NULLIF(btrim(p_org), '');
  v_reason text := CASE
    WHEN p_reason IN ('seeded', 'skipped_existing') THEN p_reason
    ELSE 'seeded'
  END;
BEGIN
  IF v_org IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO private.ccd_org_catalog_seeded (organisation_id, reason)
  VALUES (v_org, v_reason)
  ON CONFLICT (organisation_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_mark_org_catalog_seeded(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_mark_org_catalog_seeded(text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_mark_org_catalog_seeded(text, text) TO service_role;

-- Default-arg single-parameter overload for convenience callers.
CREATE OR REPLACE FUNCTION private._ccd_mark_org_catalog_seeded(p_org text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM private._ccd_mark_org_catalog_seeded(p_org, 'seeded');
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_mark_org_catalog_seeded(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_mark_org_catalog_seeded(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_mark_org_catalog_seeded(text) TO service_role;

-- ---------------------------------------------------------------------------
-- Seed helper: no-op when already marked; mark after seeding.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private._ccd_seed_org_catalog_defaults(p_org text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org text := NULLIF(btrim(p_org), '');
  has_color boolean;
  has_position boolean;
  has_groups boolean;
  has_year_groups boolean;
  has_group_col boolean;
  has_sort boolean;
BEGIN
  IF v_org IS NULL THEN
    RETURN;
  END IF;

  -- Rob (b): only seed each school once.
  IF private._ccd_org_catalog_was_seeded(v_org) THEN
    RETURN;
  END IF;

  -- year_groups -------------------------------------------------------------
  IF to_regclass('public.year_groups') IS NOT NULL THEN
    has_color := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'year_groups' AND column_name = 'color'
    );
    IF has_color THEN
      EXECUTE $q$
        INSERT INTO public.year_groups (id, name, sort_order, color, organisation_id)
        SELECT gen_random_uuid()::text, s.name, s.sort_order, s.color, $1
        FROM public.year_groups s
        WHERE s.organisation_id IS NULL
          AND s.name IS NOT NULL
          AND btrim(s.name) <> ''
          AND NOT EXISTS (
            SELECT 1 FROM public.year_groups o
            WHERE o.organisation_id IS NOT DISTINCT FROM $1
              AND o.name IS NOT DISTINCT FROM s.name
          )
      $q$ USING v_org;
    ELSE
      EXECUTE $q$
        INSERT INTO public.year_groups (id, name, sort_order, organisation_id)
        SELECT gen_random_uuid()::text, s.name, s.sort_order, $1
        FROM public.year_groups s
        WHERE s.organisation_id IS NULL
          AND s.name IS NOT NULL
          AND btrim(s.name) <> ''
          AND NOT EXISTS (
            SELECT 1 FROM public.year_groups o
            WHERE o.organisation_id IS NOT DISTINCT FROM $1
              AND o.name IS NOT DISTINCT FROM s.name
          )
      $q$ USING v_org;
    END IF;
  END IF;

  -- category_groups ---------------------------------------------------------
  IF to_regclass('public.category_groups') IS NOT NULL THEN
    EXECUTE $q$
      INSERT INTO public.category_groups (id, name, sort_order, organisation_id)
      SELECT gen_random_uuid()::text, s.name, s.sort_order, $1
      FROM public.category_groups s
      WHERE s.organisation_id IS NULL
        AND s.name IS NOT NULL
        AND btrim(s.name) <> ''
        AND NOT EXISTS (
          SELECT 1 FROM public.category_groups o
          WHERE o.organisation_id IS NOT DISTINCT FROM $1
            AND o.name IS NOT DISTINCT FROM s.name
        )
    $q$ USING v_org;
  END IF;

  -- custom_categories -------------------------------------------------------
  IF to_regclass('public.custom_categories') IS NOT NULL THEN
    has_color := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'color'
    );
    has_sort := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'sort_order'
    );
    has_position := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'position'
    );
    has_groups := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'groups'
    );
    has_year_groups := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'year_groups'
    );
    has_group_col := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'custom_categories' AND column_name = 'group'
    );

    EXECUTE format(
      $q$
      INSERT INTO public.custom_categories AS t (%s)
      SELECT %s
      FROM public.custom_categories s
      WHERE s.organisation_id IS NULL
        AND s.name IS NOT NULL
        AND btrim(s.name) <> ''
        AND NOT EXISTS (
          SELECT 1 FROM public.custom_categories o
          WHERE o.organisation_id IS NOT DISTINCT FROM $1
            AND o.name IS NOT DISTINCT FROM s.name
        )
      $q$,
      array_to_string(
        ARRAY['id', 'name', 'organisation_id']
          || CASE WHEN has_color THEN ARRAY['color'] ELSE ARRAY[]::text[] END
          || CASE WHEN has_sort THEN ARRAY['sort_order'] ELSE ARRAY[]::text[] END
          || CASE WHEN has_position THEN ARRAY['position'] ELSE ARRAY[]::text[] END
          || CASE WHEN has_groups THEN ARRAY['groups'] ELSE ARRAY[]::text[] END
          || CASE WHEN has_year_groups THEN ARRAY['year_groups'] ELSE ARRAY[]::text[] END
          || CASE WHEN has_group_col THEN ARRAY['"group"'] ELSE ARRAY[]::text[] END,
        ', '
      ),
      array_to_string(
        ARRAY['gen_random_uuid()::text', 's.name', '$1']
          || CASE WHEN has_color THEN ARRAY['s.color'] ELSE ARRAY[]::text[] END
          || CASE WHEN has_sort THEN ARRAY['s.sort_order'] ELSE ARRAY[]::text[] END
          || CASE WHEN has_position THEN ARRAY['s.position'] ELSE ARRAY[]::text[] END
          || CASE WHEN has_groups THEN ARRAY['s.groups'] ELSE ARRAY[]::text[] END
          || CASE WHEN has_year_groups THEN ARRAY['s.year_groups'] ELSE ARRAY[]::text[] END
          || CASE WHEN has_group_col THEN ARRAY['s."group"'] ELSE ARRAY[]::text[] END,
        ', '
      )
    ) USING v_org;
  END IF;

  PERFORM private._ccd_mark_org_catalog_seeded(v_org, 'seeded');
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_seed_org_catalog_defaults(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_seed_org_catalog_defaults(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_seed_org_catalog_defaults(text) TO service_role;

COMMENT ON FUNCTION private._ccd_seed_org_catalog_defaults(text) IS
  'Copy NULL-org year_groups / category_groups / custom_categories into an organisation once. No-ops if private.ccd_org_catalog_seeded already has the org. Marks the org after seeding. Callable only by service_role / definer trigger — not via PostgREST.';

-- ---------------------------------------------------------------------------
-- Backfill: Option 2 skip-any-YG + mark skipped and seeded; honour ledger.
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
  -- v3: empty-org seed + per-org seeded-once markers (Rob b).
  v_job_key text := 'catalog_empty_org_defaults_v3';
  v_org record;
  v_before_yg int;
  v_before_cg int;
  v_before_cc int;
  v_after_yg int;
  v_after_cg int;
  v_after_cc int;
  v_has_yg boolean;
  v_detail jsonb := '{}'::jsonb;
  n_defaults int;
  n_skipped int := 0;
  n_seeded int := 0;
  n_already int := 0;
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

  -- Walk every organisation: mark Option-2 skips; seed never-seeded empties.
  FOR v_org IN
    SELECT o.id::text AS id
    FROM public.organisations o
    ORDER BY o.id::text
  LOOP
    IF private._ccd_org_catalog_was_seeded(v_org.id) THEN
      n_already := n_already + 1;
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.year_groups yg
      WHERE yg.organisation_id IS NOT DISTINCT FROM v_org.id
    ) INTO v_has_yg;

    -- Option 2: any own year groups → skip and mark so a later wipe stays empty.
    IF v_has_yg THEN
      PERFORM private._ccd_mark_org_catalog_seeded(v_org.id, 'skipped_existing');
      n_skipped := n_skipped + 1;
      v_detail := v_detail || jsonb_build_object(
        v_org.id,
        jsonb_build_object('action', 'skipped_existing')
      );
      CONTINUE;
    END IF;

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

    n_seeded := n_seeded + 1;
    v_detail := v_detail || jsonb_build_object(
      v_org.id,
      jsonb_build_object(
        'action', 'seeded',
        'year_groups_added', year_groups_added,
        'category_groups_added', category_groups_added,
        'custom_categories_added', custom_categories_added
      )
    );

    RETURN NEXT;
  END LOOP;

  INSERT INTO private.ccd_one_time_jobs (job_key, detail)
  VALUES (
    v_job_key,
    jsonb_build_object(
      'seeded', n_seeded,
      'skipped_existing', n_skipped,
      'already_marked', n_already,
      'orgs', v_detail
    )
  )
  ON CONFLICT (job_key) DO NOTHING;

  RAISE NOTICE 'ccd backfill % complete: seeded=%, skipped=%, already=%',
    v_job_key, n_seeded, n_skipped, n_already;
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_backfill_missing_catalog_defaults() FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_backfill_missing_catalog_defaults() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_backfill_missing_catalog_defaults() TO service_role;

COMMENT ON FUNCTION private._ccd_backfill_missing_catalog_defaults() IS
  'One-time (catalog_empty_org_defaults_v3): seed NULL-org catalog defaults into never-seeded orgs with ZERO year_groups. Skips and marks schools that already have any org-scoped year groups (Option 2). Marks seeded schools too so a later full wipe is not refilled.';

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
  RAISE NOTICE 'catalog_empty_org_defaults_v3: % orgs seeded', n;
END $$;
