-- Optional one-off: activities imported from a vocal warm-ups Excel where "Category" was a
-- sub-heading (Physical Starters, etc.) instead of the library category "Vocal Warmups".
-- Run after verifying affected rows (see SELECT below).

-- Preview:
-- SELECT id, activity, category, unit_name FROM public.activities
-- WHERE lower(trim(category)) IN (
--   'physical starters', 'breathing exercises', 'facial warm-ups / diction',
--   'facial warm ups / diction', 'pitch exercises'
-- );

UPDATE public.activities
SET
  category = 'Vocal Warmups',
  teaching_unit = 'Vocal Warmups',
  unit_name = COALESCE(NULLIF(trim(unit_name), ''), category)
WHERE lower(trim(category)) IN (
  'physical starters',
  'breathing exercises',
  'facial warm-ups / diction',
  'facial warm ups / diction',
  'pitch exercises'
);
