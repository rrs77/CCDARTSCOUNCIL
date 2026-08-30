-- Allow authenticated users to delete year_groups (fallback when profile check fails).
-- Run in Supabase SQL Editor if "Failed to delete year group" persists.
-- This policy lets any logged-in user delete; it ORs with "Managers can delete".

ALTER TABLE public.year_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can delete year_groups" ON public.year_groups;
CREATE POLICY "Authenticated users can delete year_groups"
  ON public.year_groups FOR DELETE
  USING (auth.role() = 'authenticated');
