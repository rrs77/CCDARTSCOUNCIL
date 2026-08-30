-- Add introduction (rich text) to activity_packs for pack/stack overview.
ALTER TABLE activity_packs
  ADD COLUMN IF NOT EXISTS introduction TEXT;

COMMENT ON COLUMN activity_packs.introduction IS 'Optional rich-text introduction to the pack; shown to buyers before or with the pack content.';
