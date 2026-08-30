-- ============================================
-- CLEAR OLD DEFAULT YEAR GROUP ASSIGNMENTS
-- This removes the old default pattern {"LKG":true,"UKG":true,"Reception":true}
-- from all categories so new assignments can work correctly
-- ============================================

-- Show current state
SELECT 
    name,
    year_groups,
    CASE 
        WHEN year_groups = '{"LKG":true,"UKG":true,"Reception":true}'::jsonb THEN 'OLD DEFAULT - WILL BE CLEARED'
        WHEN year_groups IS NULL OR year_groups = '{}'::jsonb THEN 'EMPTY'
        ELSE 'HAS CUSTOM ASSIGNMENTS'
    END as status
FROM public.custom_categories
ORDER BY name;

-- Clear old defaults: Set year_groups to {} for categories with the old default pattern
UPDATE public.custom_categories
SET year_groups = '{}'::jsonb
WHERE year_groups = '{"LKG":true,"UKG":true,"Reception":true}'::jsonb;

-- Verify the cleanup
SELECT 
    COUNT(*) as total_categories,
    COUNT(CASE WHEN year_groups = '{"LKG":true,"UKG":true,"Reception":true}'::jsonb THEN 1 END) as still_has_old_defaults,
    COUNT(CASE WHEN year_groups IS NULL OR year_groups = '{}'::jsonb THEN 1 END) as empty_count,
    COUNT(CASE WHEN year_groups IS NOT NULL AND year_groups != '{}'::jsonb AND year_groups != '{"LKG":true,"UKG":true,"Reception":true}'::jsonb THEN 1 END) as has_custom_assignments
FROM public.custom_categories;

-- Show final state
SELECT 
    name,
    year_groups
FROM public.custom_categories
ORDER BY name;
