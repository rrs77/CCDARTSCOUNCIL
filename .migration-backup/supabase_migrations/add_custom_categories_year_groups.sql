-- Add year_groups column to custom_categories if it doesn't exist.
-- This stores which year groups each category is assigned to (e.g. LKG, UKG, Reception).
-- Run this in Supabase SQL Editor if category year group assignments are not persisting.

ALTER TABLE public.custom_categories
ADD COLUMN IF NOT EXISTS year_groups JSONB DEFAULT '{}';

COMMENT ON COLUMN public.custom_categories.year_groups IS 'Map of year group key to true/false (e.g. {"LKG": true, "UKG": true}). Used in Settings > Categories > Assign Year Groups.';

-- Required for upsert by name (app uses onConflict: 'name')
CREATE UNIQUE INDEX IF NOT EXISTS custom_categories_name_key ON public.custom_categories (name);
