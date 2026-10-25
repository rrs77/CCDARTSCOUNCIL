-- Rob: personal curriculum edits are fully private.
-- Drop admin / super-admin SELECT on planner_curriculum_user so only the owner
-- (user_id = auth.uid()) can read their personal layer.
-- Keep owner-only writes and the org-bound check from 360000.
-- Additive + idempotent. Do not apply to live DB until review.

DROP POLICY IF EXISTS ccd_planner_curriculum_user_select_3300 ON public.planner_curriculum_user;
DROP POLICY IF EXISTS ccd_planner_curriculum_user_select_3700 ON public.planner_curriculum_user;
CREATE POLICY ccd_planner_curriculum_user_select_3700
  ON public.planner_curriculum_user FOR SELECT TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.planner_curriculum_user IS
  'Per-user personal planner curriculum overlays (adds, overrides, hides). Owner read/write only — fully private; org admins and super admins cannot read.';
