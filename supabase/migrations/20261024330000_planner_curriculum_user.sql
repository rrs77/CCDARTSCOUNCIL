-- Layer 2: each user's personal planner curriculum (per user + organisation).
-- Rob: personal edits fully private — owner read/write only for mutations;
-- org admins + super admins may READ (same owner+admin pattern as planner
-- half_terms / lesson_plans) but cannot write another teacher's copy.
-- Additive + idempotent. Do not apply to live DB until review.

CREATE TABLE IF NOT EXISTS public.planner_curriculum_user (
  user_id UUID NOT NULL,
  organisation_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(data) = 'object'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL,
  PRIMARY KEY (user_id, organisation_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'planner_curriculum_user_data_size'
      AND conrelid = 'public.planner_curriculum_user'::regclass
  ) THEN
    ALTER TABLE public.planner_curriculum_user
      ADD CONSTRAINT planner_curriculum_user_data_size
      CHECK (octet_length(data::text) < 2000000);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.organisations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'planner_curriculum_user_organisation_id_fkey'
         AND conrelid = 'public.planner_curriculum_user'::regclass
     ) THEN
    BEGIN
      ALTER TABLE public.planner_curriculum_user
        ADD CONSTRAINT planner_curriculum_user_organisation_id_fkey
        FOREIGN KEY (organisation_id) REFERENCES public.organisations(id)
        ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'planner_curriculum_user org FK skipped: %', SQLERRM;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS planner_curriculum_user_org_idx
  ON public.planner_curriculum_user (organisation_id);

CREATE INDEX IF NOT EXISTS planner_curriculum_user_updated_at_idx
  ON public.planner_curriculum_user (updated_at DESC);

-- Stamp updated_by / updated_at; force user_id to the caller on write.
CREATE OR REPLACE FUNCTION private._ccd_stamp_planner_curriculum_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  -- Owner-only rows: never allow inserting/updating as another user.
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_stamp_planner_curriculum_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_stamp_planner_curriculum_user() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_ccd_stamp_planner_curriculum_user ON public.planner_curriculum_user;
CREATE TRIGGER trg_ccd_stamp_planner_curriculum_user
  BEFORE INSERT OR UPDATE ON public.planner_curriculum_user
  FOR EACH ROW
  EXECUTE FUNCTION private._ccd_stamp_planner_curriculum_user();

ALTER TABLE public.planner_curriculum_user ENABLE ROW LEVEL SECURITY;

-- SELECT: owner, or org admin / super admin (read-only oversight).
DROP POLICY IF EXISTS ccd_planner_curriculum_user_select_3300 ON public.planner_curriculum_user;
CREATE POLICY ccd_planner_curriculum_user_select_3300
  ON public.planner_curriculum_user FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR public.ccd_current_user_manages_own_org(organisation_id)
  );

-- INSERT / UPDATE / DELETE: owner only (admins and super admins cannot write others).
DROP POLICY IF EXISTS ccd_planner_curriculum_user_insert_3300 ON public.planner_curriculum_user;
CREATE POLICY ccd_planner_curriculum_user_insert_3300
  ON public.planner_curriculum_user FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ccd_planner_curriculum_user_update_3300 ON public.planner_curriculum_user;
CREATE POLICY ccd_planner_curriculum_user_update_3300
  ON public.planner_curriculum_user FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ccd_planner_curriculum_user_delete_3300 ON public.planner_curriculum_user;
CREATE POLICY ccd_planner_curriculum_user_delete_3300
  ON public.planner_curriculum_user FOR DELETE TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.planner_curriculum_user FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.planner_curriculum_user TO authenticated;

COMMENT ON TABLE public.planner_curriculum_user IS
  'Per-user personal planner curriculum overlays (adds, overrides, hides). Owner read/write; org admins and super admins may read only.';
