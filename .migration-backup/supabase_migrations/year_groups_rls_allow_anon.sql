-- Allow app (anon key) to SELECT, INSERT, UPDATE, DELETE on year_groups.
-- Run in Supabase SQL Editor if delete year group fails with "Failed to delete year group".
-- Without these policies, RLS blocks anon from deleting rows.

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.year_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow anon full access to year_groups" ON public.year_groups;
DROP POLICY IF EXISTS "anon_select_year_groups" ON public.year_groups;
DROP POLICY IF EXISTS "anon_insert_year_groups" ON public.year_groups;
DROP POLICY IF EXISTS "anon_update_year_groups" ON public.year_groups;
DROP POLICY IF EXISTS "anon_delete_year_groups" ON public.year_groups;

-- Single policy for all operations (year_groups is app-wide config, not per-user)
CREATE POLICY "Allow anon full access to year_groups"
  ON public.year_groups
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
