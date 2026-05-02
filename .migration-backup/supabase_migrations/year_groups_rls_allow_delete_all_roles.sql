-- Allow DELETE on public.year_groups for all roles used by the browser client (anon + authenticated).
--
-- Symptom: Year groups remove in the app (localStorage) but Supabase delete fails with RLS / permission errors.
-- Cause: Policies like "Managers can delete year_groups" only pass when profiles.role = 'admin' OR
--        profiles.can_manage_year_groups = true. Normal staff accounts use the anon or authenticated
--        role but fail that check, so DELETE is denied while local state still updates.
--
-- This policy is PERMISSIVE (default), so it ORs with existing manager policies and unblocks deletes.
-- year_groups rows are shared curriculum labels (not per-row tenant secrets); tighten later if you
-- add multi-tenant year_groups.
--
-- Run in Supabase SQL Editor (or apply via migrations) if class/year group deletes fail on production.

ALTER TABLE public.year_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "year_groups_delete_allow_client" ON public.year_groups;
CREATE POLICY "year_groups_delete_allow_client"
  ON public.year_groups
  FOR DELETE
  USING (true);
