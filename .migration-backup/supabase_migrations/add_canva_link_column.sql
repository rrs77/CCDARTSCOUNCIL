-- Add canva_link column to activities table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS canva_link TEXT DEFAULT '';
