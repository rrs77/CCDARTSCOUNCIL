-- Ensure authenticated users can read lessons where user_id IS NULL (shared/legacy).
-- After switching to Supabase Auth, the "Allow anon read lessons" policy no longer
-- applies (it's TO anon). Authenticated users rely on "Users can read own or
-- unassigned lessons" which already allows (user_id = auth.uid() OR user_id IS NULL).
-- This policy makes that explicit for authenticated role and avoids any edge cases.

DROP POLICY IF EXISTS "Allow authenticated read lessons null user_id" ON public.lessons;
CREATE POLICY "Allow authenticated read lessons null user_id"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (user_id IS NULL);
