-- Server-side lock for the built-in demo interactive lesson.
-- The demo ('demo-interactive-lesson', data.isDemo = true) is shipped in code
-- and must never be stored, so no client (any role) can insert or update a row
-- that claims to be it. Idempotent; NOT VALID so it applies to new writes
-- without failing on any legacy row (pre-check: see query at bottom).

ALTER TABLE public.interactive_lessons
  DROP CONSTRAINT IF EXISTS interactive_lessons_not_builtin_demo;

ALTER TABLE public.interactive_lessons
  ADD CONSTRAINT interactive_lessons_not_builtin_demo
  CHECK (
    id <> 'demo-interactive-lesson'
    AND COALESCE(data -> 'isDemo', 'false'::jsonb) NOT IN ('true'::jsonb, '"true"'::jsonb)
    AND COALESCE(data ->> 'source', '') <> 'demo'
  ) NOT VALID;

-- Pre-merge check (run manually on staging/live; expect 0):
-- SELECT count(*) FROM public.interactive_lessons
--  WHERE id = 'demo-interactive-lesson'
--     OR data -> 'isDemo' IN ('true'::jsonb, '"true"'::jsonb)
--     OR data ->> 'source' = 'demo';
-- If 0, optionally: ALTER TABLE public.interactive_lessons
--   VALIDATE CONSTRAINT interactive_lessons_not_builtin_demo;
