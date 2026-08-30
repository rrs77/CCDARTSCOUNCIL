-- Allow anon to INSERT and UPDATE lessons where user_id IS NULL.
-- Use when the app syncs lesson library per year group without Supabase Auth (e.g. local user id).
-- Run after activities_lessons_allow_anon_read.sql.
-- Authenticated users still use "Users can insert/update own lessons" for rows with their user_id.

-- LESSONS: anon can INSERT rows with user_id NULL (so sync works without auth)
DROP POLICY IF EXISTS "Allow anon insert lessons null user" ON public.lessons;
CREATE POLICY "Allow anon insert lessons null user"
  ON public.lessons FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- LESSONS: anon can UPDATE rows where user_id IS NULL (so sync works without auth)
DROP POLICY IF EXISTS "Allow anon update lessons null user" ON public.lessons;
CREATE POLICY "Allow anon update lessons null user"
  ON public.lessons FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);
