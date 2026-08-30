# Year Groups Column Diagnosis and Fix

## Problem Summary

Year group assignments aren't persisting because the `custom_categories` table in Supabase either:
1. **Doesn't have a `year_groups` column** - The migration hasn't been run
2. **Has a `year_groups` column but it's NULL/empty** - Column exists but no data

## Root Cause

The app code is working correctly:
- ✅ `forceSyncToSupabase()` is being called
- ✅ Data is being saved with `year_groups` field
- ✅ `normaliseYearGroups()` function handles NULL/empty correctly

**The issue is at the database level** - the column either doesn't exist or is empty for all records.

## Solution

### Quick Fix: Run SQL Migration

**Run this in Supabase SQL Editor:**

```sql
-- Add year_groups column if it doesn't exist
ALTER TABLE public.custom_categories
ADD COLUMN IF NOT EXISTS year_groups JSONB DEFAULT '{}';

-- Set default for existing NULL values
UPDATE public.custom_categories
SET year_groups = '{}'::jsonb
WHERE year_groups IS NULL;

-- Add comment
COMMENT ON COLUMN public.custom_categories.year_groups IS 
  'Map of year group key to true/false (e.g. {"Lower Kindergarten Music": true}). Used in Settings > Categories > Assign Year Groups.';
```

### Full Verification Script

Use the comprehensive script: `supabase_migrations/verify_and_fix_year_groups_column.sql`

This script will:
1. Check if column exists
2. Show current data status
3. Count NULL/empty/has-data records
4. **Automatically fix** the issue
5. Verify the fix worked

## How to Verify

### Option 1: Run Node Script

```bash
node scripts/check-supabase-categories.js
```

Look for:
- `year_groups column: YES` ✅ (or `MISSING` ❌)
- Sample data showing `year_groups` values

### Option 2: Check in Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor
2. Open `custom_categories` table
3. Check if `year_groups` column exists
4. Check if any rows have data in `year_groups`

### Option 3: Run SQL Query

```sql
-- Check column exists
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'custom_categories' 
  AND column_name = 'year_groups';

-- Check data
SELECT name, year_groups 
FROM custom_categories 
LIMIT 10;
```

## Expected Behavior After Fix

### Before Fix:
```
❌ Category "Welcome" has no yearGroups - excluding
❌ All 17 categories have empty yearGroups
```

### After Fix:
```
✅ Categories load with yearGroups field (empty {} or with data)
✅ Year group assignments persist after page refresh
✅ Console shows: "📦 Loaded categories from Supabase: 17 categories"
```

## Data Flow

### Save Flow (Working):
1. User assigns year group → `updateCategories()` called
2. `forceSyncToSupabase()` called immediately
3. Data sent to Supabase: `{ year_groups: {"Lower Kindergarten Music": true} }`
4. **If column doesn't exist → Upsert fails silently or column is ignored**

### Load Flow (Broken):
1. App loads categories: `customCategoriesApi.getAll()`
2. Supabase returns rows: `{ name: "Welcome", year_groups: null }` or `{ name: "Welcome" }` (no column)
3. `normaliseYearGroups(null)` returns `{}`
4. App sees empty `yearGroups` → Excludes category

## Migration Files

The migration file exists but may not have been run:

**File:** `supabase_migrations/add_custom_categories_year_groups.sql`

**Contents:**
```sql
ALTER TABLE public.custom_categories
ADD COLUMN IF NOT EXISTS year_groups JSONB DEFAULT '{}';
```

## Next Steps

1. **Run the verification script** in Supabase SQL Editor
2. **Verify the column exists** and has correct type
3. **Test assigning a year group** in the app
4. **Refresh the page** and verify it persists
5. **Check console logs** for any errors

## Related Files

- `supabase_migrations/add_custom_categories_year_groups.sql` - Migration file
- `supabase_migrations/verify_and_fix_year_groups_column.sql` - Verification & fix script
- `src/config/api.ts` - API functions (lines 1134-1193)
- `scripts/check-supabase-categories.js` - Node verification script
