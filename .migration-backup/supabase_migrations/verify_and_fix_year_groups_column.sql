-- ============================================
-- VERIFY AND FIX year_groups COLUMN IN custom_categories
-- Run this in Supabase SQL Editor to check and fix the schema
-- ============================================

-- 1. CHECK IF COLUMN EXISTS
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'custom_categories'
  AND column_name = 'year_groups';

-- 2. CHECK CURRENT DATA IN year_groups COLUMN
SELECT 
    name,
    year_groups,
    CASE 
        WHEN year_groups IS NULL THEN 'NULL'
        WHEN year_groups = '{}'::jsonb THEN 'EMPTY OBJECT {}'
        WHEN jsonb_typeof(year_groups) = 'object' THEN 'HAS DATA: ' || year_groups::text
        ELSE 'UNEXPECTED TYPE: ' || jsonb_typeof(year_groups)
    END as year_groups_status
FROM public.custom_categories
ORDER BY name
LIMIT 20;

-- 3. COUNT CATEGORIES WITH EMPTY/NULL year_groups
SELECT 
    COUNT(*) as total_categories,
    COUNT(CASE WHEN year_groups IS NULL THEN 1 END) as null_count,
    COUNT(CASE WHEN year_groups = '{}'::jsonb THEN 1 END) as empty_object_count,
    COUNT(CASE WHEN year_groups IS NOT NULL AND year_groups != '{}'::jsonb THEN 1 END) as has_data_count
FROM public.custom_categories;

-- ============================================
-- FIX: ADD COLUMN IF IT DOESN'T EXIST
-- ============================================

-- Add year_groups column if it doesn't exist
ALTER TABLE public.custom_categories
ADD COLUMN IF NOT EXISTS year_groups JSONB DEFAULT '{}';

-- Set default for existing NULL values
UPDATE public.custom_categories
SET year_groups = '{}'::jsonb
WHERE year_groups IS NULL;

-- Add comment
COMMENT ON COLUMN public.custom_categories.year_groups IS 'Map of year group key to true/false (e.g. {"Lower Kindergarten Music": true, "Upper Kindergarten Music": true}). Used in Settings > Categories > Assign Year Groups.';

-- ============================================
-- VERIFY AFTER FIX
-- ============================================

-- Check column exists and has correct type
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'custom_categories'
  AND column_name = 'year_groups';

-- Verify all records have year_groups (should be {} for empty, not NULL)
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN year_groups IS NULL THEN 1 END) as still_null,
    COUNT(CASE WHEN year_groups = '{}'::jsonb THEN 1 END) as empty_objects,
    COUNT(CASE WHEN year_groups IS NOT NULL AND year_groups != '{}'::jsonb THEN 1 END) as has_data
FROM public.custom_categories;
