-- Use the public.categories table as the single source of truth for app categories.
-- Add columns the app expects so it can read/write this table (Drama Games, Vocal Warm-Ups already exist here).
-- Run this in Supabase SQL Editor, then the app will use categories instead of custom_categories.

-- Ensure we can upsert by name
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_key ON public.categories (name);

-- Add year_groups (Assign Year Groups in Settings)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS year_groups JSONB DEFAULT '{}';

-- Add optional group columns (app may send these)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS group_name text;

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS groups JSONB DEFAULT '[]';

COMMENT ON COLUMN public.categories.year_groups IS 'Map of year group key to true/false. Used in Settings > Categories > Assign Year Groups.';
