-- Rhythmstix lesson plan templates (EYFS → KS5) as shared defaults.
-- Additive only. NULL organisation_id rows are shared defaults readable by
-- every signed-in school user; only super admins can write them. Org rows
-- (organisation_id set) are reserved for later school overrides and are
-- readable by that organisation only.
-- The app keeps a bundled copy (rhythmstixTemplates.ts) for demo mode / DB down.

CREATE TABLE IF NOT EXISTS public.lesson_plan_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id text NULL,
  template_key text NOT NULL CHECK (template_key IN ('eyfs','ks1','lks2','uks2','ks3','ks4','ks5')),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(config) = 'object'),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One shared default per key; one per key per org.
CREATE UNIQUE INDEX IF NOT EXISTS lesson_plan_templates_default_key
  ON public.lesson_plan_templates (template_key) WHERE organisation_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS lesson_plan_templates_org_key
  ON public.lesson_plan_templates (organisation_id, template_key) WHERE organisation_id IS NOT NULL;

-- RLS helper: may the current user write this template row?
CREATE OR REPLACE FUNCTION public.can_manage_lesson_plan_template(p_organisation_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Shared defaults and (for now) org rows: super admins only.
  SELECT public.is_super_admin();
$$;

REVOKE ALL ON FUNCTION public.can_manage_lesson_plan_template(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_lesson_plan_template(text) TO authenticated;

ALTER TABLE public.lesson_plan_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lesson_plan_templates_select ON public.lesson_plan_templates;
CREATE POLICY lesson_plan_templates_select ON public.lesson_plan_templates
  FOR SELECT TO authenticated
  USING (
    organisation_id IS NULL
    OR public.is_super_admin()
    OR btrim(organisation_id) = (
      SELECT btrim(p.organisation_id::text) FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lesson_plan_templates_insert ON public.lesson_plan_templates;
CREATE POLICY lesson_plan_templates_insert ON public.lesson_plan_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_lesson_plan_template(organisation_id));

DROP POLICY IF EXISTS lesson_plan_templates_update ON public.lesson_plan_templates;
CREATE POLICY lesson_plan_templates_update ON public.lesson_plan_templates
  FOR UPDATE TO authenticated
  USING (public.can_manage_lesson_plan_template(organisation_id))
  WITH CHECK (public.can_manage_lesson_plan_template(organisation_id));

DROP POLICY IF EXISTS lesson_plan_templates_delete ON public.lesson_plan_templates;
CREATE POLICY lesson_plan_templates_delete ON public.lesson_plan_templates
  FOR DELETE TO authenticated
  USING (public.can_manage_lesson_plan_template(organisation_id));

REVOKE ALL ON public.lesson_plan_templates FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_plan_templates TO authenticated;

-- Seed the seven shared defaults (idempotent; does not overwrite super-admin edits).
INSERT INTO public.lesson_plan_templates (template_key, name, description, config, sort_order)
VALUES
  ('eyfs', 'EYFS · Nursery & Reception', 'Sing, move, play and explore. Short I CAN outcomes, look & listen assessment.', jsonb_build_object('accent', '#C87835'), 1),
  ('ks1', 'KS1 · Years 1–2', 'Practise, copy, choose and perform, with explicit teacher prompts.', jsonb_build_object('accent', '#4E9177'), 2),
  ('lks2', 'KS2 · Years 3–4', 'Experiment, apply, sequence and create; begin to evaluate.', jsonb_build_object('accent', '#C5A13B'), 3),
  ('uks2', 'KS2 · Years 5–6', 'Develop technique, refine and justify ideas independently.', jsonb_build_object('accent', '#3E6F9D'), 4),
  ('ks3', 'KS3 · Years 7–9', 'Conceptual exploration, specialist practice and critical reflection.', jsonb_build_object('accent', '#665A8C'), 5),
  ('ks4', 'KS4 · Years 10–11', 'Deliberate practical choices, refinement and teacher-selected qualification mapping.', jsonb_build_object('accent', '#9B5A4A'), 6),
  ('ks5', 'KS5 · Years 12–13', 'Advanced reasoning, independent enquiry and scholarly evidence.', jsonb_build_object('accent', '#7B415D'), 7)
ON CONFLICT (template_key) WHERE organisation_id IS NULL DO NOTHING;
