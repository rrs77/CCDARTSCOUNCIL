-- Commedia dell'arte – KS3 Drama: purchasable pack (🎭)
-- Run after create_activity_packs.sql (and activity_packs_add_stack_ids.sql if you use stack_ids).
-- This pack then appears: (1) in Resource Shop (Settings → Resource Shop) for users to buy,
-- (2) in Admin → User Management → Edit user → Assign packs, for you to assign to users.
-- Link a lesson stack in Settings → Manage Packs → Edit this pack → "Link lesson stacks / units".
-- year_group_sections: show pack stacks in Lesson Library for KS3 (Y7, Y8, Y9).

ALTER TABLE activity_packs ADD COLUMN IF NOT EXISTS year_group_sections TEXT[] DEFAULT '{}';

INSERT INTO activity_packs (pack_id, name, description, price, icon, category_ids, is_active, year_group_sections)
VALUES (
  'COMMEDIA_KS3_DRAMA',
  'Commedia dell''arte – KS3 Drama',
  'Full lesson packs ready to use. Complete lesson packs on Commedia dell''arte for KS3. Just download the pack and add the lessons straight into your built-in teaching calendar—no extra setup.',
  19.99,
  '🎭',
  ARRAY[]::TEXT[],
  true,
  ARRAY['ks3']::TEXT[]
)
ON CONFLICT (pack_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  year_group_sections = COALESCE(EXCLUDED.year_group_sections, activity_packs.year_group_sections),
  updated_at = NOW();
