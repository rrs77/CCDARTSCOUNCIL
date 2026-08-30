-- ============================================
-- ADD DRAMA GAMES AND VOCAL WARMUPS TO custom_categories
-- These are required fixed categories that should always be present
-- ============================================

-- Check if they already exist
SELECT 
    name,
    CASE WHEN name IN ('Drama Games', 'Vocal Warmups', 'Vocal Warm-Ups') THEN 'EXISTS' ELSE 'MISSING' END as status
FROM public.custom_categories
WHERE name IN ('Drama Games', 'Vocal Warmups', 'Vocal Warm-Ups');

-- If "Vocal Warm-Ups" exists, rename it to "Vocal Warmups" first
UPDATE public.custom_categories
SET name = 'Vocal Warmups'
WHERE name = 'Vocal Warm-Ups';

-- Insert Drama Games if it doesn't exist
INSERT INTO public.custom_categories (name, color, position, year_groups, groups)
VALUES ('Drama Games', '#8b5cf6', 15, '{}'::jsonb, ARRAY[]::text[])
ON CONFLICT (name) DO UPDATE 
SET 
    color = EXCLUDED.color,
    position = EXCLUDED.position,
    year_groups = COALESCE(custom_categories.year_groups, '{}'::jsonb),
    groups = COALESCE(custom_categories.groups, ARRAY[]::text[]);

-- Insert Vocal Warmups if it doesn't exist
INSERT INTO public.custom_categories (name, color, position, year_groups, groups)
VALUES ('Vocal Warmups', '#ec4899', 16, '{}'::jsonb, ARRAY[]::text[])
ON CONFLICT (name) DO UPDATE 
SET 
    color = EXCLUDED.color,
    position = EXCLUDED.position,
    year_groups = COALESCE(custom_categories.year_groups, '{}'::jsonb),
    groups = COALESCE(custom_categories.groups, ARRAY[]::text[]);

-- Verify they were added
SELECT 
    name,
    color,
    position,
    year_groups,
    groups
FROM public.custom_categories
WHERE name IN ('Drama Games', 'Vocal Warmups')
ORDER BY position;

-- Show all categories count and verify positions
SELECT 
    COUNT(*) as total_categories,
    COUNT(CASE WHEN name = 'Drama Games' THEN 1 END) as has_drama_games,
    COUNT(CASE WHEN name = 'Vocal Warmups' THEN 1 END) as has_vocal_warmups,
    MIN(position) as min_position,
    MAX(position) as max_position
FROM public.custom_categories;

-- Show all categories in order
SELECT 
    name,
    position,
    year_groups
FROM public.custom_categories
ORDER BY position;
