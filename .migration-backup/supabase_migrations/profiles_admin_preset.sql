-- Admin preset: categories and activity packs assigned to a user by admin (user cannot remove these).
-- Run after create_profiles_table.sql and profiles_status_and_purchases.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_preset_categories TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_preset_activity_pack_ids TEXT[] DEFAULT NULL;

COMMENT ON COLUMN public.profiles.admin_preset_categories IS 'Category names assigned by admin; user sees these and cannot remove them.';
COMMENT ON COLUMN public.profiles.admin_preset_activity_pack_ids IS 'Activity pack IDs granted by admin (e.g. paid content); user has access without purchase.';
