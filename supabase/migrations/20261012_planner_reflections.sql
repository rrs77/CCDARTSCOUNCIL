-- ============================================
-- Planner: private teaching reflections
-- Additive only. Creates one new table; does not alter or delete existing data.
--
-- A reflection belongs to one teacher and one scheduled lesson (lesson_plans.id),
-- and is never shared with the lesson content itself.
-- ============================================

CREATE TABLE IF NOT EXISTS public.planner_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  lesson_plan_id text NOT NULL,
  class_name text NOT NULL,
  lesson_date date,
  outcome text CHECK (outcome IN ('below', 'as_planned', 'exceeded')),
  went_well text NOT NULL DEFAULT '',
  to_revisit text NOT NULL DEFAULT '',
  next_time text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_plan_id)
);

CREATE INDEX IF NOT EXISTS planner_reflections_user_class_idx
  ON public.planner_reflections (user_id, class_name, lesson_date);

ALTER TABLE public.planner_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own reflections only" ON public.planner_reflections;
CREATE POLICY "Own reflections only"
  ON public.planner_reflections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.planner_reflections IS
  'Private post-lesson reflections from the Planner. One row per teacher per scheduled lesson (lesson_plans.id).';
