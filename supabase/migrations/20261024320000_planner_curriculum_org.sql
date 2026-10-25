-- Planner curriculum (frameworks / strands / statements / terms) per school.
-- Replaces browser-only localStorage key ccd-planner-curriculum-v1 for live orgs.
-- RLS: school members read; org admins + super admins write.
-- Additive + idempotent. Do not apply to live DB until review.

CREATE TABLE IF NOT EXISTS public.planner_curriculum (
  organisation_id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(data) = 'object'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL
);

-- Payload size cap (~2 MiB of JSON text). Additive if table already existed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'planner_curriculum_data_size'
      AND conrelid = 'public.planner_curriculum'::regclass
  ) THEN
    ALTER TABLE public.planner_curriculum
      ADD CONSTRAINT planner_curriculum_data_size
      CHECK (octet_length(data::text) < 2000000);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.organisations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'planner_curriculum_organisation_id_fkey'
         AND conrelid = 'public.planner_curriculum'::regclass
     ) THEN
    BEGIN
      ALTER TABLE public.planner_curriculum
        ADD CONSTRAINT planner_curriculum_organisation_id_fkey
        FOREIGN KEY (organisation_id) REFERENCES public.organisations(id)
        ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      -- Live DBs may lack organisations.id type match; keep unconstrained.
      RAISE NOTICE 'planner_curriculum FK skipped: %', SQLERRM;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS planner_curriculum_updated_at_idx
  ON public.planner_curriculum (updated_at DESC);

-- Stamp updated_by / updated_at from the calling session (auth.uid()).
CREATE OR REPLACE FUNCTION private._ccd_stamp_planner_curriculum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private._ccd_stamp_planner_curriculum() FROM PUBLIC;
REVOKE ALL ON FUNCTION private._ccd_stamp_planner_curriculum() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_ccd_stamp_planner_curriculum ON public.planner_curriculum;
CREATE TRIGGER trg_ccd_stamp_planner_curriculum
  BEFORE INSERT OR UPDATE ON public.planner_curriculum
  FOR EACH ROW
  EXECUTE FUNCTION private._ccd_stamp_planner_curriculum();

ALTER TABLE public.planner_curriculum ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ccd_planner_curriculum_select_3200 ON public.planner_curriculum;
CREATE POLICY ccd_planner_curriculum_select_3200
  ON public.planner_curriculum FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR organisation_id = (
      SELECT p.organisation_id FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

DROP POLICY IF EXISTS ccd_planner_curriculum_insert_3200 ON public.planner_curriculum;
CREATE POLICY ccd_planner_curriculum_insert_3200
  ON public.planner_curriculum FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR public.ccd_current_user_manages_own_org(organisation_id)
  );

DROP POLICY IF EXISTS ccd_planner_curriculum_update_3200 ON public.planner_curriculum;
CREATE POLICY ccd_planner_curriculum_update_3200
  ON public.planner_curriculum FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR public.ccd_current_user_manages_own_org(organisation_id)
  )
  WITH CHECK (
    public.is_super_admin()
    OR public.ccd_current_user_manages_own_org(organisation_id)
  );

DROP POLICY IF EXISTS ccd_planner_curriculum_delete_3200 ON public.planner_curriculum;
CREATE POLICY ccd_planner_curriculum_delete_3200
  ON public.planner_curriculum FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR public.ccd_current_user_manages_own_org(organisation_id)
  );

REVOKE ALL ON TABLE public.planner_curriculum FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.planner_curriculum TO authenticated;

COMMENT ON TABLE public.planner_curriculum IS
  'Per-organisation planner curriculum JSON (frameworks, strands, statements, section types, plan templates, terms). Replaces ccd-planner-curriculum-v1 localStorage for live schools.';
