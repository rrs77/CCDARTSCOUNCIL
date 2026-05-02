-- ============================================
-- FIND ALL MISSING CATEGORIES
-- Compares expected FIXED_CATEGORIES with what's in Supabase
-- ============================================

-- Expected categories from FIXED_CATEGORIES (17 total)
WITH expected AS (
  SELECT name, position FROM (VALUES
    ('Welcome', 0),
    ('Kodaly Songs', 1),
    ('Kodaly Action Songs', 2),
    ('Action/Games Songs', 3),
    ('Rhythm Sticks', 4),
    ('Scarf Songs', 5),
    ('General Game', 6),
    ('Core Songs', 7),
    ('Parachute Games', 8),
    ('Percussion Games', 9),
    ('Teaching Units', 10),
    ('Goodbye', 11),
    ('Kodaly Rhythms', 12),
    ('Kodaly Games', 13),
    ('IWB Games', 14),
    ('Drama Games', 15),
    ('Vocal Warmups', 16)
  ) AS t(name, position)
),
actual AS (
  SELECT name, position FROM public.custom_categories
)

-- Show missing categories
SELECT 
    '❌ MISSING' as status,
    e.name,
    e.position,
    'Should be added to custom_categories' as note
FROM expected e
LEFT JOIN actual a ON e.name = a.name
WHERE a.name IS NULL

UNION ALL

-- Show categories that exist but might have wrong position
SELECT 
    '✅ EXISTS' as status,
    a.name,
    a.position as actual_position,
    CONCAT('Expected position: ', e.position) as note
FROM actual a
INNER JOIN expected e ON a.name = e.name
WHERE a.position != e.position

ORDER BY 
    CASE WHEN status = '❌ MISSING' THEN 0 ELSE 1 END,
    position;

-- Summary
SELECT 
    'Summary' as info,
    (SELECT COUNT(*) FROM expected) as expected_total,
    (SELECT COUNT(*) FROM actual) as actual_total,
    (SELECT COUNT(*) FROM expected e LEFT JOIN actual a ON e.name = a.name WHERE a.name IS NULL) as missing_count;
