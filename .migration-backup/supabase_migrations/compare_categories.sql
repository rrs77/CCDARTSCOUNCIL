-- ============================================
-- COMPARE EXPECTED VS ACTUAL CATEGORIES
-- This will show which categories are missing from Supabase
-- ============================================

-- Expected fixed categories (from FIXED_CATEGORIES in code)
WITH expected_categories AS (
  SELECT name FROM (VALUES
    ('Welcome'),
    ('Kodaly Songs'),
    ('Kodaly Action Songs'),
    ('Action/Games Songs'),
    ('Rhythm Sticks'),
    ('Scarf Songs'),
    ('General Game'),
    ('Core Songs'),
    ('Kodaly Rhythms'),
    ('Teaching Units'),
    ('Goodbye'),
    ('Parachute Games'),
    ('Kodaly Games'),
    ('IWB Games'),
    ('Drama Games'),
    ('Vocal Warmups')
  ) AS t(name)
),
actual_categories AS (
  SELECT name FROM public.custom_categories
)

-- Show missing categories
SELECT 
    'MISSING FROM SUPABASE' as status,
    e.name as category_name
FROM expected_categories e
LEFT JOIN actual_categories a ON e.name = a.name
WHERE a.name IS NULL

UNION ALL

-- Show extra categories in Supabase (not in FIXED_CATEGORIES)
SELECT 
    'EXTRA IN SUPABASE (Custom)' as status,
    a.name as category_name
FROM actual_categories a
LEFT JOIN expected_categories e ON a.name = e.name
WHERE e.name IS NULL

ORDER BY status, category_name;

-- Summary
SELECT 
    (SELECT COUNT(*) FROM expected_categories) as expected_count,
    (SELECT COUNT(*) FROM actual_categories) as actual_count,
    (SELECT COUNT(*) FROM expected_categories e LEFT JOIN actual_categories a ON e.name = a.name WHERE a.name IS NULL) as missing_count,
    (SELECT COUNT(*) FROM actual_categories a LEFT JOIN expected_categories e ON a.name = e.name WHERE e.name IS NULL) as extra_count;
