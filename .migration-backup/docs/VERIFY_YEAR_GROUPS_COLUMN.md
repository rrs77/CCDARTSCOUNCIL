# Verify and Fix year_groups Column in custom_categories

## Problem

Year group assignments aren't persisting because the `custom_categories` table either:
1. Doesn't have a `year_groups` column
2. Has a `year_groups` column but it's NULL/empty for all records

## Solution

### Step 1: Run Verification Script

Run this SQL script in your Supabase SQL Editor to check the current state:

**File:** `supabase_migrations/verify_and_fix_year_groups_column.sql`

This will:
- Check if the `year_groups` column exists
- Show the data type and current values
- Count how many categories have empty/NULL year_groups
- **Automatically fix** the issue by adding the column if missing and setting defaults

### Step 2: Verify the Fix

After running the script, check the output:

1. **Column should exist** with:
   - `data_type`: `jsonb`
   - `is_nullable`: `YES` (but defaults to `{}`)
   - `column_default`: `'{}'::jsonb`

2. **All categories should have year_groups**:
   - `still_null`: Should be `0`
   - `empty_objects`: Can be any number (categories without assignments)
   - `has_data`: Should show categories with year group assignments

### Step 3: Test in the App

1. Open the app and go to Settings > Categories
2. Assign a year group to a category
3. Refresh the page
4. Verify the assignment persists

## Alternative: Check via Node Script

You can also run the Node.js verification script:

```bash
node scripts/check-supabase-categories.js
```

This will show:
- Whether `year_groups` column exists
- Sample data from the table
- Instructions if the column is missing

## Expected Schema

The `custom_categories` table should have:

```sql
CREATE TABLE public.custom_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  position INTEGER,
  group_name TEXT,
  groups JSONB,
  year_groups JSONB DEFAULT '{}',  -- ← This column must exist
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### If column still doesn't exist after running the script:

1. Check you're running it in the correct Supabase project
2. Verify you have permissions to alter tables
3. Check for any error messages in the SQL Editor

### If column exists but data isn't persisting:

1. Check the browser console for errors
2. Verify `forceSyncToSupabase()` is being called (check Network tab)
3. Check Supabase logs for failed upsert operations
4. Verify the year group keys match between save and load operations

### If you see "year_groups column: MISSING":

Run the migration manually in Supabase SQL Editor:

```sql
ALTER TABLE public.custom_categories
ADD COLUMN IF NOT EXISTS year_groups JSONB DEFAULT '{}';

UPDATE public.custom_categories
SET year_groups = '{}'::jsonb
WHERE year_groups IS NULL;
```
