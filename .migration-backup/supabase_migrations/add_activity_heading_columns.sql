-- Add heading columns to activities table (required for activity create/edit)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS activity_heading TEXT DEFAULT 'Activity';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS description_heading TEXT DEFAULT 'Introduction/Context';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS link_heading TEXT DEFAULT 'Additional Link';
