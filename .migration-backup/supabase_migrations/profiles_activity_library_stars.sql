-- Persist Activity Library star preferences per user (sync across devices).
-- Run after create_profiles_table.sql / profiles_admin_preset.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS starred_activity_ids TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS starred_first_activity_categories TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS starred_first_activity_global BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.starred_activity_ids IS 'User-starred activity identifiers for Activity Library ordering.';
COMMENT ON COLUMN public.profiles.starred_first_activity_categories IS 'Category names where user enabled starred-first ordering.';
COMMENT ON COLUMN public.profiles.starred_first_activity_global IS 'When true, show starred activities first in all categories.';
