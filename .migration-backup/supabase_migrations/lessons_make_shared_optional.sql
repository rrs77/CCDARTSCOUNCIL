-- OPTIONAL: Run in Supabase SQL Editor only if the lesson library is empty
-- after switching to Supabase Auth and you want existing lessons to be
-- visible to all authenticated users (shared).
--
-- This sets user_id = NULL on all lessons so RLS allows any authenticated
-- user to read them. New saves will still set user_id when using Supabase Auth.
--
-- To inspect first: SELECT sheet_name, academic_year, user_id FROM public.lessons LIMIT 20;

UPDATE public.lessons
SET user_id = NULL
WHERE user_id IS NOT NULL;

-- Optionally same for lesson_plans if your lesson plans are also missing:
-- UPDATE public.lesson_plans SET user_id = NULL WHERE user_id IS NOT NULL;
