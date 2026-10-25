-- =============================================================================
-- MIS integrations: school role=admin must not act as platform super-admin
-- =============================================================================
-- Repro (FAIL at 53c6977): current_user_is_full_user_admin() is true for
-- profiles.role = 'admin' (school manager). That incorrectly:
--   - let school admins set provider_approval_confirmed / commercial_terms_confirmed
--   - exposed mis_org_connection_secrets for every organisation
--   - granted mis_user_can_manage_org / mis_user_in_org for every org
-- Fix: gates + secrets use is_super_admin() or service_role only.
--      Org manage/read limited to the caller's own organisation_id
--      (is_super_admin may access any org).
-- Sorts after 20261024200000. Safe to re-run. Not applied to live DB by agent.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mis_user_can_manage_org(p_org_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p_org_id IS NOT NULL
    AND btrim(p_org_id) <> ''
    AND EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = auth.uid()
        AND me.status IS DISTINCT FROM 'suspended'
        AND me.anonymised_at IS NULL
    )
    AND (
      public.is_super_admin()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
          AND p.organisation_id IS NOT NULL
          AND btrim(p.organisation_id) <> ''
          AND p.organisation_id = p_org_id
          AND (
            p.role IN ('admin', 'organisation')
            OR COALESCE(p.can_manage_users, false) = true
          )
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.mis_user_in_org(p_org_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p_org_id IS NOT NULL
    AND btrim(p_org_id) <> ''
    AND EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = auth.uid()
        AND me.status IS DISTINCT FROM 'suspended'
        AND me.anonymised_at IS NULL
    )
    AND (
      public.is_super_admin()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
          AND p.organisation_id IS NOT NULL
          AND btrim(p.organisation_id) <> ''
          AND p.organisation_id = p_org_id
      )
    );
$$;

REVOKE ALL ON FUNCTION public.mis_user_can_manage_org(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mis_user_can_manage_org(text) FROM anon;
REVOKE ALL ON FUNCTION public.mis_user_in_org(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mis_user_in_org(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mis_user_can_manage_org(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mis_user_can_manage_org(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mis_user_in_org(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mis_user_in_org(text) TO service_role;

CREATE OR REPLACE FUNCTION public.mis_protect_provider_gates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.gate_id IN ('commercial_terms_confirmed', 'provider_approval_confirmed') THEN
    IF TG_OP = 'INSERT' AND COALESCE(NEW.met, false) = false THEN
      RETURN NEW;
    END IF;
    IF COALESCE(NEW.met, false) = true
       OR (TG_OP = 'UPDATE' AND OLD.met IS DISTINCT FROM NEW.met)
       OR (TG_OP = 'UPDATE' AND COALESCE(OLD.met, false) = true AND OLD.notes IS DISTINCT FROM NEW.notes)
    THEN
      IF auth.role() = 'service_role' OR public.is_super_admin() THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION
        'Only Rhythmstix super-admins (or service role) may set activation gate %',
        NEW.gate_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mis_activation_gates_protect ON public.mis_activation_gates;
CREATE TRIGGER mis_activation_gates_protect
  BEFORE INSERT OR UPDATE ON public.mis_activation_gates
  FOR EACH ROW EXECUTE FUNCTION public.mis_protect_provider_gates();

DROP POLICY IF EXISTS mis_providers_admin_write ON public.mis_providers;
CREATE POLICY mis_providers_admin_write ON public.mis_providers
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS mis_org_connection_secrets_admin ON public.mis_org_connection_secrets;
CREATE POLICY mis_org_connection_secrets_admin ON public.mis_org_connection_secrets
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS mis_integration_requests_update ON public.mis_integration_requests;
CREATE POLICY mis_integration_requests_update ON public.mis_integration_requests
  FOR UPDATE TO authenticated
  USING (
    public.mis_user_can_manage_org(organisation_id)
    OR public.is_super_admin()
  )
  WITH CHECK (
    public.mis_user_can_manage_org(organisation_id)
    OR public.is_super_admin()
  );

COMMENT ON FUNCTION public.mis_user_can_manage_org(text) IS
  'MIS manage: is_super_admin() for any org, else only the caller''s own organisation_id. Never current_user_is_full_user_admin().';
COMMENT ON FUNCTION public.mis_user_in_org(text) IS
  'Org membership for MIS RLS. Own profiles.organisation_id only (or is_super_admin). Never school_or_org / full-user-admin.';
COMMENT ON FUNCTION public.mis_protect_provider_gates() IS
  'Blocks school admins from setting commercial_terms_confirmed / provider_approval_confirmed; is_super_admin() or service_role only.';
COMMENT ON TABLE public.mis_org_connection_secrets IS
  'Secure config placeholders. is_super_admin() only (service_role bypasses RLS). School role=admin must never read these.';
