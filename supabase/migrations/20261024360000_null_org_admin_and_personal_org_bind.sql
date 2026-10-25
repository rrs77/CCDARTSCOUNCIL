-- Security review (09f3aba):
-- 1) ccd_current_user_manages_own_org(NULL) must never be true for NULL-org
--    catalog rows — a NULL-org admin must not write shared defaults.
-- 4) planner_curriculum_user INSERT/UPDATE must bind organisation_id to the
--    caller's own profile org (super admin exempt).
-- Additive + idempotent. Do not apply to live DB until review.
-- New migration only — do not edit 240500 / 330000 / 350000.

CREATE OR REPLACE FUNCTION public.ccd_current_user_manages_own_org(p_org text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p_org IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organisation_id = p_org
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
        AND (
          lower(COALESCE(p.role, '')) IN ('admin', 'super_admin', 'superuser')
          OR p.can_manage_users IS TRUE
        )
    );
$$;

REVOKE ALL ON FUNCTION public.ccd_current_user_manages_own_org(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ccd_current_user_manages_own_org(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.ccd_current_user_manages_own_org(text) TO authenticated, service_role;

COMMENT ON FUNCTION public.ccd_current_user_manages_own_org(text) IS
  'True when the caller is an active admin of the given non-NULL organisation_id. Never true for NULL p_org (shared defaults stay super-admin-only).';

-- ---------------------------------------------------------------------------
-- planner_curriculum_user: bind writes to caller's organisation_id
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS ccd_planner_curriculum_user_insert_3300 ON public.planner_curriculum_user;
DROP POLICY IF EXISTS ccd_planner_curriculum_user_insert_3600 ON public.planner_curriculum_user;
CREATE POLICY ccd_planner_curriculum_user_insert_3600
  ON public.planner_curriculum_user FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_super_admin()
      OR organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS ccd_planner_curriculum_user_update_3300 ON public.planner_curriculum_user;
DROP POLICY IF EXISTS ccd_planner_curriculum_user_update_3600 ON public.planner_curriculum_user;
CREATE POLICY ccd_planner_curriculum_user_update_3600
  ON public.planner_curriculum_user FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_super_admin()
      OR organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
    )
  );

-- Keep delete owner-only (no org move via delete).
DROP POLICY IF EXISTS ccd_planner_curriculum_user_delete_3300 ON public.planner_curriculum_user;
DROP POLICY IF EXISTS ccd_planner_curriculum_user_delete_3600 ON public.planner_curriculum_user;
CREATE POLICY ccd_planner_curriculum_user_delete_3600
  ON public.planner_curriculum_user FOR DELETE TO authenticated
  USING (user_id = auth.uid());
