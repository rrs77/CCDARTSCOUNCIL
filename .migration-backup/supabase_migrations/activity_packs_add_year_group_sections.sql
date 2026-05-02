-- Packs can be shown in Lesson Library only for selected year group sections (EYFS, KS1, KS2, KS3, KS4, KS5, Other).
-- When empty, pack stacks are shown for all year groups (backward compatible).

ALTER TABLE activity_packs
  ADD COLUMN IF NOT EXISTS year_group_sections TEXT[] DEFAULT '{}';

COMMENT ON COLUMN activity_packs.year_group_sections IS 'Section ids (eyfs, ks1, ks2, ks3, ks4, ks5, other) where this pack appears in Lesson Library; empty = all.';
