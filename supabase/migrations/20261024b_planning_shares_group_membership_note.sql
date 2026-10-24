-- =============================================================================
-- Planning shares — follow-up note (additive; does not alter LessonPrintModal).
-- Hierarchy reminder: hub/arts org → school → year groups / groups → person.
-- Group audience REQUIRES planning_group_members (created in 20261024_planning_shares.sql).
-- This file is intentionally a no-op DDL guard so hosts that apply migrations in
-- order still see an explicit checkpoint after the RLS harden of 20261024.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'planning_group_members'
  ) THEN
    RAISE EXCEPTION
      'planning_group_members missing — apply 20261024_planning_shares.sql first';
  END IF;
END $$;

COMMENT ON TABLE public.planning_group_members IS
  'Membership for planning share audience_type=group (hub/school hierarchy leaf). Users only see/manage their own rows via RLS.';
