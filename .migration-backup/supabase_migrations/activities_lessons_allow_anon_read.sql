-- Allow anon to READ activities and lessons when using local auth (no Supabase session).
-- Run in Supabase SQL Editor if Activity Library shows "0 activities" after local login.
-- With Supabase Auth, authenticated users still use their own policies.

-- ACTIVITIES: anon can SELECT (read)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read activities" ON public.activities;
CREATE POLICY "Allow anon read activities"
  ON public.activities FOR SELECT
  TO anon
  USING (true);

-- LESSONS: anon can SELECT (read)
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read lessons" ON public.lessons;
CREATE POLICY "Allow anon read lessons"
  ON public.lessons FOR SELECT
  TO anon
  USING (true);

-- LESSON_PLANS: anon can SELECT (read)
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read lesson_plans" ON public.lesson_plans;
CREATE POLICY "Allow anon read lesson_plans"
  ON public.lesson_plans FOR SELECT
  TO anon
  USING (true);
