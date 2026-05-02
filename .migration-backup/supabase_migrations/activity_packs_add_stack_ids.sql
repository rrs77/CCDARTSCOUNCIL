-- Add lesson stack IDs to activity packs so a pack can include whole units for sale.
-- Buyers with the pack can add these stacks to their calendar in one click.

ALTER TABLE activity_packs
  ADD COLUMN IF NOT EXISTS stack_ids TEXT[] DEFAULT '{}';

COMMENT ON COLUMN activity_packs.stack_ids IS 'Lesson stack IDs included in this pack; buyers can add these units in one click.';
