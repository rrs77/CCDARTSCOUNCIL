-- Add linked_year_groups to custom_objective_year_groups so Settings > Curriculum Objectives can link year groups.
-- Run in Supabase SQL Editor if you see "Could not find the 'linked_year_groups' column" or a white screen.

ALTER TABLE public.custom_objective_year_groups
ADD COLUMN IF NOT EXISTS linked_year_groups TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.custom_objective_year_groups.linked_year_groups IS 'Names of activity year groups this objective year group links to (e.g. LKG, Reception).';
