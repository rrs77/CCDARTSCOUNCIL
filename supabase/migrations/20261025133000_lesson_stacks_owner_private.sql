-- Lesson stacks (schemes of work / units): persist reliably and make them
-- private to their owner unless shared (Rob: "No, private unless shared").
--
-- ADDITIVE ONLY. Safe to run once, in order, after 20261024240500.
--   * Adds the columns the app writes but older databases lack
--     (custom_objectives, curriculum_type, organisation_id, user_id).
--     The July 2026 live snapshot of lesson_stacks had none of them, so app
--     inserts failed (PGRST204) and new stacks only lived in page memory.
--   * Owner is filled from auth.uid() on insert and cannot be changed by
--     non-admins on update.
--   * Replaces the 2405 "whole org can read" policies on lesson_stacks with
--     owner + org admin + super admin (+ planning share hook, false until wired).
--     Legacy rows with user_id NULL stay visible to their org (they pre-date
--     ownership and are treated as shared school content); only the owner,
--     org admins and the super admin can edit or delete.
--     An org admin or the super admin can share a stack org-wide by setting
--     user_id to NULL.
-- Do NOT re-run 20261024240500 afterwards: it would recreate the org-wide read.

ALTER TABLE public.lesson_stacks ADD COLUMN IF NOT EXISTS custom_objectives JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.lesson_stacks ADD COLUMN IF NOT EXISTS curriculum_type TEXT;
ALTER TABLE public.lesson_stacks ADD COLUMN IF NOT EXISTS organisation_id TEXT;
ALTER TABLE public.lesson_stacks ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.lesson_stacks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.lesson_stacks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS lesson_stacks_org_user_idx
  ON public.lesson_stacks (organisation_id, user_id);

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private._ccd_lesson_stacks_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      IF NEW.user_id IS NULL THEN
        -- Everyone (super admin included) owns what they create.
        NEW.user_id := auth.uid();
      ELSIF NEW.user_id <> auth.uid()
            AND NOT public.is_super_admin()
            AND NOT public.ccd_current_user_manages_own_org(NEW.organisation_id) THEN
        -- Teachers cannot create rows on someone else's behalf.
        NEW.user_id := auth.uid();
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       AND NOT public.is_super_admin()
       AND NOT public.ccd_current_user_manages_own_org(OLD.organisation_id) THEN
      NEW.user_id := OLD.user_id;
    END IF;
    IF NEW.organisation_id IS DISTINCT FROM OLD.organisation_id
       AND NOT public.is_super_admin() THEN
      NEW.organisation_id := OLD.organisation_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_lesson_stacks_owner() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_ccd_lesson_stacks_owner ON public.lesson_stacks;
CREATE TRIGGER trg_ccd_lesson_stacks_owner
  BEFORE INSERT OR UPDATE ON public.lesson_stacks
  FOR EACH ROW EXECUTE FUNCTION private._ccd_lesson_stacks_owner();

ALTER TABLE public.lesson_stacks ENABLE ROW LEVEL SECURITY;

-- Old org-wide policies (240500) for this table only.
DROP POLICY IF EXISTS ccd_lesson_stacks_select_org_or_system_2405 ON public.lesson_stacks;
DROP POLICY IF EXISTS ccd_lesson_stacks_insert_org_2405 ON public.lesson_stacks;
DROP POLICY IF EXISTS ccd_lesson_stacks_update_org_2405 ON public.lesson_stacks;
DROP POLICY IF EXISTS ccd_lesson_stacks_delete_org_2405 ON public.lesson_stacks;

DROP POLICY IF EXISTS ccd_lesson_stacks_select_owner_2510 ON public.lesson_stacks;
CREATE POLICY ccd_lesson_stacks_select_owner_2510 ON public.lesson_stacks
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    -- NULL-org system rows: unchanged from 2405 when ownerless; otherwise owner only.
    OR (organisation_id IS NULL AND (user_id IS NULL OR user_id = auth.uid()))
    OR (
      organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
      AND (
        user_id IS NULL
        OR user_id = auth.uid()
        OR public.ccd_current_user_manages_own_org(organisation_id)
        OR private._ccd_planning_share_allows(organisation_id, user_id, auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS ccd_lesson_stacks_insert_owner_2510 ON public.lesson_stacks;
CREATE POLICY ccd_lesson_stacks_insert_owner_2510 ON public.lesson_stacks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
      AND (user_id = auth.uid() OR public.ccd_current_user_manages_own_org(organisation_id))
    )
  );

DROP POLICY IF EXISTS ccd_lesson_stacks_update_owner_2510 ON public.lesson_stacks;
CREATE POLICY ccd_lesson_stacks_update_owner_2510 ON public.lesson_stacks
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
      AND (user_id = auth.uid() OR public.ccd_current_user_manages_own_org(organisation_id))
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
      AND (user_id = auth.uid() OR public.ccd_current_user_manages_own_org(organisation_id))
    )
  );

DROP POLICY IF EXISTS ccd_lesson_stacks_delete_owner_2510 ON public.lesson_stacks;
CREATE POLICY ccd_lesson_stacks_delete_owner_2510 ON public.lesson_stacks
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      organisation_id = (
        SELECT p.organisation_id FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status IS DISTINCT FROM 'suspended'
          AND p.anonymised_at IS NULL
      )
      AND (user_id = auth.uid() OR public.ccd_current_user_manages_own_org(organisation_id))
    )
  );

REVOKE ALL ON TABLE public.lesson_stacks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_stacks TO authenticated;

-- Post-apply check (expect exactly the four *_owner_2510 policies):
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'lesson_stacks' ORDER BY 1;
