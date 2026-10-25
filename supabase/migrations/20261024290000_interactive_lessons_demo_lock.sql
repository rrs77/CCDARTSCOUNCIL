-- Server-side lock for the built-in demo interactive lesson.
-- The demo ('demo-interactive-lesson', data.isDemo = true) is shipped in code
-- and must never be stored. Rows are allowed only if isDemo is absent, JSON
-- false or JSON null, and source is not "demo" (any case). No client (any role)
-- can insert or update a row that claims to be the demo. Idempotent; NOT VALID
-- (see the pre-check below).

ALTER TABLE public.interactive_lessons
  DROP CONSTRAINT IF EXISTS interactive_lessons_not_builtin_demo;

ALTER TABLE public.interactive_lessons
  ADD CONSTRAINT interactive_lessons_not_builtin_demo
  CHECK (
    id <> 'demo-interactive-lesson'
    AND COALESCE(data -> 'isDemo', 'false'::jsonb) IN ('false'::jsonb, 'null'::jsonb)
    AND lower(COALESCE(data ->> 'source', '')) <> 'demo'
  ) NOT VALID;

-- Pre-check: MUST return 0 before applying. NOT VALID skips existing rows at
-- ADD time, but any existing offending row could then never be updated
-- (every UPDATE re-checks the constraint), so fix/remove such rows first.
-- SELECT count(*) FROM public.interactive_lessons
--  WHERE NOT (
--    id <> 'demo-interactive-lesson'
--    AND COALESCE(data -> 'isDemo', 'false'::jsonb) IN ('false'::jsonb, 'null'::jsonb)
--    AND lower(COALESCE(data ->> 'source', '')) <> 'demo'
--  );
-- If 0, optionally: ALTER TABLE public.interactive_lessons
--   VALIDATE CONSTRAINT interactive_lessons_not_builtin_demo;
