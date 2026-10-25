-- Fail CI if any policy on the 14 curriculum tables is not named ccd_*.
-- Run after scratch schema + 240000 + 240500 (never production).
SELECT public.ccd_assert_curriculum_policies();
