-- =============================================================================
-- MIS RLS follow-ups (after 20261024210000)
-- 1) Gate DELETE: super-admin only
-- 2) connection_id must belong to the same organisation_id
-- 3) Request INSERT: non-super force status=submitted, requested_by=auth.uid()
-- 4) Request UPDATE: non-super may only withdraw or edit message
--    (requester_name / requester_email / school_name immutable)
-- Safe to re-run. Do not apply to live DB from this agent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Split activation-gate write policy: managers INSERT/UPDATE; DELETE = super only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS mis_activation_gates_write ON public.mis_activation_gates;

DROP POLICY IF EXISTS mis_activation_gates_insert ON public.mis_activation_gates;
CREATE POLICY mis_activation_gates_insert ON public.mis_activation_gates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mis_org_connections c
      WHERE c.id = connection_id
        AND public.mis_user_can_manage_org(c.organisation_id)
    )
  );

DROP POLICY IF EXISTS mis_activation_gates_update ON public.mis_activation_gates;
CREATE POLICY mis_activation_gates_update ON public.mis_activation_gates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mis_org_connections c
      WHERE c.id = connection_id
        AND public.mis_user_can_manage_org(c.organisation_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mis_org_connections c
      WHERE c.id = connection_id
        AND public.mis_user_can_manage_org(c.organisation_id)
    )
  );

DROP POLICY IF EXISTS mis_activation_gates_delete ON public.mis_activation_gates;
CREATE POLICY mis_activation_gates_delete ON public.mis_activation_gates
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- Belt-and-braces: reject DELETE from non-super even if a policy is misconfigured
CREATE OR REPLACE FUNCTION public.mis_protect_gate_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.is_super_admin() THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Only Rhythmstix super-admins (or service role) may delete activation gates';
END;
$$;

DROP TRIGGER IF EXISTS mis_activation_gates_protect_delete ON public.mis_activation_gates;
CREATE TRIGGER mis_activation_gates_protect_delete
  BEFORE DELETE ON public.mis_activation_gates
  FOR EACH ROW EXECUTE FUNCTION public.mis_protect_gate_delete();

-- ---------------------------------------------------------------------------
-- 2) connection_id must belong to the same organisation_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mis_connection_belongs_to_org(
  p_connection_id uuid,
  p_organisation_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    p_connection_id IS NULL
    OR (
      p_organisation_id IS NOT NULL
      AND btrim(p_organisation_id) <> ''
      AND EXISTS (
        SELECT 1 FROM public.mis_org_connections c
        WHERE c.id = p_connection_id
          AND c.organisation_id = p_organisation_id
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.mis_enforce_connection_org_match()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.connection_id IS NOT NULL
     AND NOT public.mis_connection_belongs_to_org(NEW.connection_id, NEW.organisation_id)
  THEN
    RAISE EXCEPTION
      'connection_id % does not belong to organisation_id %',
      NEW.connection_id, NEW.organisation_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mis_integration_requests_connection_org ON public.mis_integration_requests;
CREATE TRIGGER mis_integration_requests_connection_org
  BEFORE INSERT OR UPDATE ON public.mis_integration_requests
  FOR EACH ROW EXECUTE FUNCTION public.mis_enforce_connection_org_match();

DROP TRIGGER IF EXISTS mis_year_group_mappings_connection_org ON public.mis_year_group_mappings;
CREATE TRIGGER mis_year_group_mappings_connection_org
  BEFORE INSERT OR UPDATE ON public.mis_year_group_mappings
  FOR EACH ROW EXECUTE FUNCTION public.mis_enforce_connection_org_match();

-- ---------------------------------------------------------------------------
-- 3) Request INSERT: non-super must land as submitted by auth.uid()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mis_force_integration_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  NEW.status := 'submitted';
  NEW.requested_by := auth.uid();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mis_integration_requests_force_insert ON public.mis_integration_requests;
CREATE TRIGGER mis_integration_requests_force_insert
  BEFORE INSERT ON public.mis_integration_requests
  FOR EACH ROW EXECUTE FUNCTION public.mis_force_integration_request_insert();

-- ---------------------------------------------------------------------------
-- 4) Request UPDATE: non-super may only withdraw or edit message
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mis_protect_integration_request_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  -- Non-super: may edit message; status may only move to 'withdrawn' (or stay put)
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IS DISTINCT FROM 'withdrawn' THEN
    RAISE EXCEPTION
      'School managers may only set integration request status to withdrawn (got %)',
      NEW.status;
  END IF;

  -- Immutable for school managers (identity + routing + requester/school fields)
  IF NEW.organisation_id IS DISTINCT FROM OLD.organisation_id
     OR NEW.provider_id IS DISTINCT FROM OLD.provider_id
     OR NEW.connection_id IS DISTINCT FROM OLD.connection_id
     OR NEW.requested_by IS DISTINCT FROM OLD.requested_by
     OR NEW.requested_apps IS DISTINCT FROM OLD.requested_apps
     OR NEW.requester_name IS DISTINCT FROM OLD.requester_name
     OR NEW.requester_email IS DISTINCT FROM OLD.requester_email
     OR NEW.school_name IS DISTINCT FROM OLD.school_name
  THEN
    RAISE EXCEPTION
      'School managers may only update message or withdraw an integration request';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mis_integration_requests_protect_update ON public.mis_integration_requests;
CREATE TRIGGER mis_integration_requests_protect_update
  BEFORE UPDATE ON public.mis_integration_requests
  FOR EACH ROW EXECUTE FUNCTION public.mis_protect_integration_request_update();

COMMENT ON FUNCTION public.mis_protect_gate_delete() IS
  'Activation gate rows may only be deleted by is_super_admin() or service_role.';
COMMENT ON FUNCTION public.mis_enforce_connection_org_match() IS
  'Ensures mis_integration_requests / mis_year_group_mappings.connection_id belongs to organisation_id.';
COMMENT ON FUNCTION public.mis_force_integration_request_insert() IS
  'Non-super INSERT: force status=submitted and requested_by=auth.uid().';
COMMENT ON FUNCTION public.mis_protect_integration_request_update() IS
  'Non-super users may only withdraw a request or edit its message; requester/school fields immutable.';
