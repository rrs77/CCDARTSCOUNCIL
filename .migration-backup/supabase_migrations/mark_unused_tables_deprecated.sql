-- Mark tables that the app does NOT use as deprecated.
-- Run this in Supabase SQL Editor so the Table Editor shows which tables to ignore.
-- This does not delete or change any data; it only adds comments.

-- App uses public.categories for category list and year group assignments.
-- custom_categories is NOT used by the app (legacy duplicate).
COMMENT ON TABLE public.custom_categories IS '[DEPRECATED - NOT USED BY APP] App uses public.categories instead. Safe to ignore or archive.';

-- Add comment to categories so it's clear this is the one in use
COMMENT ON TABLE public.categories IS 'IN USE: App category list and Assign Year Groups. Single source of truth.';
