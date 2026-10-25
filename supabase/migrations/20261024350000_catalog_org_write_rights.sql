-- Rob Q2: who can change a school's year groups and categories.
-- Categories (category_groups + custom_categories): any org member INSERT;
--   only org admins (ccd_current_user_manages_own_org) + super admins UPDATE/DELETE.
-- Year groups: only org admins + super admins INSERT/UPDATE/DELETE; members read.
-- NULL-org defaults: super-admin write only; readable by all (unchanged).
-- Additive + idempotent. Do not apply to live DB until review.
--
-- Pattern: private SECURITY DEFINER helper, REVOKE PUBLIC/anon/authenticated,
-- explicit search_path, service_role EXECUTE only.

CREATE OR REPLACE FUNCTION private._ccd_apply_catalog_write_rights(p_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  sel text := format('ccd_%s_select_defaults_3500', p_table);
  ins text := format('ccd_%s_insert_defaults_3500', p_table);
  upd text := format('ccd_%s_update_defaults_3500', p_table);
  del text := format('ccd_%s_delete_defaults_3500', p_table);
  -- Drop prior 3100 policies so only one set remains.
  old_sel text := format('ccd_%s_select_defaults_3100', p_table);
  old_ins text := format('ccd_%s_insert_defaults_3100', p_table);
  old_upd text := format('ccd_%s_update_defaults_3100', p_table);
  old_del text := format('ccd_%s_delete_defaults_3100', p_table);
  -- Also drop any earlier 2405 leftovers if still present.
  older_sel text := format('ccd_%s_select_org_or_system_2405', p_table);
  older_ins text := format('ccd_%s_insert_org_2405', p_table);
  older_upd text := format('ccd_%s_update_org_2405', p_table);
  older_del text := format('ccd_%s_delete_org_2405', p_table);
  org_member text := $q$
    organisation_id IS NOT NULL
    AND organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  $q$;
  select_ok text;
  insert_ok text;
  mutate_ok text;
  is_year_groups boolean := (p_table = 'year_groups');
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

  -- UPDATE/DELETE (and year_groups INSERT): org admin of that org, or super admin.
  -- NULL-org rows: only is_super_admin() (ccd_current_user_manages_own_org(NULL) is false
  -- for normal school admins whose organisation_id is set).
  mutate_ok := $q$
    public.is_super_admin()
    OR public.ccd_current_user_manages_own_org(organisation_id)
  $q$;

  IF is_year_groups THEN
    -- Year groups: schools choose which they use by admin add/remove only.
    insert_ok := mutate_ok;
  ELSE
    -- Categories: any member of the organisation may INSERT own-org rows.
    insert_ok := format(
      $q$
      public.is_super_admin()
      OR (%s)
      $q$, org_member
    );
  END IF;

  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', older_sel, p_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', older_ins, p_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', older_upd, p_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', older_del, p_table);
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
    ins, p_table, insert_ok
  );
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
    upd, p_table, mutate_ok, mutate_ok
  );
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)',
    del, p_table, mutate_ok
  );

  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', p_table);
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_apply_catalog_write_rights(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_apply_catalog_write_rights(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private._ccd_apply_catalog_write_rights(text) TO service_role;

SELECT private._ccd_apply_catalog_write_rights('year_groups');
SELECT private._ccd_apply_catalog_write_rights('category_groups');
SELECT private._ccd_apply_catalog_write_rights('custom_categories');

-- Keep fill-org trigger so non-super-admins cannot accidentally write NULL-org.
SELECT private._ccd_attach_org_fill_trigger('year_groups');
SELECT private._ccd_attach_org_fill_trigger('category_groups');
SELECT private._ccd_attach_org_fill_trigger('custom_categories');

COMMENT ON FUNCTION private._ccd_apply_catalog_write_rights(text) IS
  'Catalog write RLS (3500): year_groups admin-only writes; categories member INSERT + admin UPDATE/DELETE; NULL-org super-admin write. Not callable via PostgREST.';
