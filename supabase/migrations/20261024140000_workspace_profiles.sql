-- =============================================================================
-- Shared workspace profile (Settings → My classes as single source of truth)
-- Classes, class names, year-group sections, school name for CCDesigner and
-- bolt-ons (Assessify, PeriFeedback) on the same Supabase project.
-- Other apps: SELECT via RLS (owner or same organisation_id); do not write —
-- writes belong to CCDesigner Settings only.
-- Additive. Do NOT apply to live DB from this agent without ops review.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  organisation_id text,
  school_name text NOT NULL DEFAULT '',
  -- [{ id, name, color? }] — flat class list from Settings → My classes
  classes jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [{ id, label, sortOrder, yearGroupIds }] — EYFS/KS1/… grouping
  year_group_sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_profiles_owner_unique UNIQUE (owner_id)
);

CREATE INDEX IF NOT EXISTS workspace_profiles_owner_idx
  ON public.workspace_profiles (owner_id);
CREATE INDEX IF NOT EXISTS workspace_profiles_org_idx
  ON public.workspace_profiles (organisation_id);

COMMENT ON TABLE public.workspace_profiles IS
  'CCDesigner Settings → My classes SSoT. Add-ons and sibling apps on this project read classes/school_name via RLS; only the owner (Settings) writes.';

ALTER TABLE public.workspace_profiles ENABLE ROW LEVEL SECURITY;

-- Owner full access (active, non-anonymised profiles only)
DROP POLICY IF EXISTS workspace_profiles_owner_all ON public.workspace_profiles;
CREATE POLICY workspace_profiles_owner_all
  ON public.workspace_profiles
  FOR ALL
  TO authenticated
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.status, 'active') IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  )
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.status, 'active') IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

-- Org peers: read-only so Assessify / PeriFeedback / sibling apps can link classes
DROP POLICY IF EXISTS workspace_profiles_org_select ON public.workspace_profiles;
CREATE POLICY workspace_profiles_org_select
  ON public.workspace_profiles
  FOR SELECT
  TO authenticated
  USING (
    organisation_id IS NOT NULL
    AND length(trim(organisation_id)) > 0
    AND EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = auth.uid()
        AND COALESCE(me.status, 'active') IS DISTINCT FROM 'suspended'
        AND me.anonymised_at IS NULL
        AND NULLIF(trim(me.organisation_id), '') IS NOT NULL
        AND trim(me.organisation_id) = trim(workspace_profiles.organisation_id)
    )
  );

-- Keep organisation_id aligned with owner's profile on insert/update
CREATE OR REPLACE FUNCTION public.set_workspace_profile_organisation_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_org text;
BEGIN
  SELECT NULLIF(trim(p.organisation_id), '')
  INTO owner_org
  FROM public.profiles p
  WHERE p.id = NEW.owner_id;

  NEW.organisation_id := owner_org;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_workspace_profile_organisation_id
  ON public.workspace_profiles;
CREATE TRIGGER trg_set_workspace_profile_organisation_id
  BEFORE INSERT OR UPDATE ON public.workspace_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_workspace_profile_organisation_id();

REVOKE EXECUTE ON FUNCTION public.set_workspace_profile_organisation_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_workspace_profile_organisation_id() FROM anon;
