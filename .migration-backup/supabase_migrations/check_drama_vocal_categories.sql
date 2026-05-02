-- ============================================
-- CHECK FOR DRAMA GAMES AND VOCAL WARMUPS
-- This will help identify if they exist with different names
-- ============================================

-- Check in custom_categories table
SELECT 
    'custom_categories' as source,
    name,
    year_groups,
    position
FROM public.custom_categories
WHERE name ILIKE '%drama%' 
   OR name ILIKE '%vocal%'
   OR name ILIKE '%warm%'
ORDER BY name;

-- Check in categories table (alternative table)
SELECT 
    'categories' as source,
    name,
    year_groups,
    position
FROM public.categories
WHERE name ILIKE '%drama%' 
   OR name ILIKE '%vocal%'
   OR name ILIKE '%warm%'
ORDER BY name;

-- Check what categories are used in activities (to see if Drama Games/Vocal Warmups exist there)
SELECT DISTINCT
    'activities' as source,
    category as name,
    COUNT(*) as activity_count
FROM public.activities
WHERE category ILIKE '%drama%' 
   OR category ILIKE '%vocal%'
   OR category ILIKE '%warm%'
GROUP BY category
ORDER BY category;

-- Show all category names in custom_categories for reference
SELECT 
    name,
    position,
    year_groups
FROM public.custom_categories
ORDER BY position, name;
