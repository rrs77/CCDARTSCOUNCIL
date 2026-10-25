-- Rob (NULL-org year groups / categories): keep shared defaults; every school
-- can READ them; only super admins INSERT/UPDATE/DELETE NULL-org rows;
-- new schools are seeded with org-scoped copies their org can edit.
-- Additive + idempotent. Do not apply to live DB until review.
-- Safe to re-run.
--
-- Security: seed helper lives in schema private (SECURITY DEFINER). It is NOT
-- exposed via PostgREST — REVOKE from PUBLIC/anon/authenticated; GRANT EXECUTE
-- to service_role only. Trigger + migration backfill call it as definer.

-- ---------------------------------------------------------------------------
-- Tighten catalog write policies: NULL-org writes require is_super_admin();
-- org-scoped writes require caller's organisation_id match (unchanged).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private._ccd_apply_shared_defaults_rls(p_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  sel text := format('ccd_%s_select_defaults_3100', p_table);
  ins text := format('ccd_%s_insert_defaults_3100', p_table);
  upd text := format('ccd_%s_update_defaults_3100', p_table);
  del text := format('ccd_%s_delete_defaults_3100', p_table);
  -- Drop prior 2405 catalog policies so only one set remains.
  old_sel text := format('ccd_%s_select_org_or_system_2405', p_table);
  old_ins text := format('ccd_%s_insert_org_2405', p_table);
  old_upd text := format('ccd_%s_update_org_2405', p_table);
  old_del text := format('ccd_%s_delete_org_2405', p_table);
  org_eq text := $q$
    organisation_id IS NOT NULL
    AND organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  $q$;
  select_ok text;
  write_ok text;
BEGIN
  IF to_regclass(format('public.%I', p_table)) IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format(
    'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organisation_id TEXT',
    p_table
  );
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);

  -- Every authenticated school member may read NULL-org shared defaults + own org.
  select_ok := $q$
    public.is_super_admin()
    OR organisation_id IS NULL
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  $q$;

  -- NULL-org: super admin only. Org rows: matching school members (incl. admins).
  write_ok := format(
    $q$
    public.is_super_admin()
    OR (%s)
    $q$, org_eq
  );

  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', old_sel, p_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', old_ins, p_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', old_upd, p_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', old_del, p_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', sel, p_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', ins, p_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', upd, p_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', del, p_table);

  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)',
    sel, p_table, select_ok
  );
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',
    ins, p_table, write_ok
  );
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
    upd, p_table, write_ok, write_ok
  );
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)',
    del, p_table, write_ok
  );

  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', p_table);
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_apply_shared_defaults_rls(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_apply_shared_defaults_rls(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_apply_shared_defaults_rls(text) TO service_role;

SELECT private._ccd_apply_shared_defaults_rls('year_groups');
SELECT private._ccd_apply_shared_defaults_rls('category_groups');
SELECT private._ccd_apply_shared_defaults_rls('custom_categories');

-- Keep fill-org trigger so non-super-admins cannot accidentally write NULL-org.
SELECT private._ccd_attach_org_fill_trigger('year_groups');
SELECT private._ccd_attach_org_fill_trigger('category_groups');
SELECT private._ccd_attach_org_fill_trigger('custom_categories');

-- ---------------------------------------------------------------------------
-- Seed org-scoped copies of NULL-org catalog defaults (idempotent by name).
-- Private SECURITY DEFINER — not callable via PostgREST by anon/authenticated.
-- ---------------------------------------------------------------------------
-- Drop any earlier public exposure of this helper (idempotent cleanup).
DROP FUNCTION IF EXISTS public.ccd_seed_org_catalog_defaults(text);

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

    -- Build a defensive INSERT listing only columns that exist.
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
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_seed_org_catalog_defaults(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_seed_org_catalog_defaults(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_seed_org_catalog_defaults(text) TO service_role;

COMMENT ON FUNCTION private._ccd_seed_org_catalog_defaults(text) IS
  'Copy NULL-org year_groups / category_groups / custom_categories into an organisation. Idempotent by (organisation_id, name). Callable only by service_role / definer trigger — not via PostgREST.';

-- Trigger: seed when a new school (organisation) is created.
-- Seed failures must not block organisation INSERT.
CREATE OR REPLACE FUNCTION private._ccd_seed_org_catalog_defaults_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  BEGIN
    PERFORM private._ccd_seed_org_catalog_defaults(NEW.id::text);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'seed failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_seed_org_catalog_defaults_trg() FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_seed_org_catalog_defaults_trg() FROM anon, authenticated;
-- Trigger functions need no EXECUTE grant to roles; owner/definer runs them.

DO $$
BEGIN
  IF to_regclass('public.organisations') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_ccd_seed_org_catalog_defaults ON public.organisations;
    CREATE TRIGGER trg_ccd_seed_org_catalog_defaults
      AFTER INSERT ON public.organisations
      FOR EACH ROW
      EXECUTE FUNCTION private._ccd_seed_org_catalog_defaults_trg();
  END IF;
END $$;

-- One-time backfill: existing orgs with no year_groups of their own get copies.
DO $$
DECLARE
  r record;
BEGIN
  IF to_regclass('public.organisations') IS NULL
     OR to_regclass('public.year_groups') IS NULL THEN
    RETURN;
  END IF;
  FOR r IN
    SELECT o.id::text AS id
    FROM public.organisations o
    WHERE NOT EXISTS (
      SELECT 1 FROM public.year_groups yg
      WHERE yg.organisation_id IS NOT DISTINCT FROM o.id::text
    )
  LOOP
    PERFORM private._ccd_seed_org_catalog_defaults(r.id);
  END LOOP;
END $$;

-- Policy naming invariant still holds (ccd_* only on curriculum tables).
SELECT public.ccd_assert_curriculum_policies();
