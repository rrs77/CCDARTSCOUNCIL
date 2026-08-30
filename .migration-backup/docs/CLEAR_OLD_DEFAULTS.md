# Clear Old Default Year Group Assignments

## Problem

All categories in `custom_categories` have the old default pattern:
```json
{"LKG":true,"UKG":true,"Reception":true}
```

This pattern:
1. Gets detected and cleared by the app's cleanup logic on every load
2. Interferes with new year group assignments
3. Causes categories to appear as "no assignment" even though they have data

## Solution

Run this SQL script in Supabase SQL Editor to clear all old defaults at once:

**File:** `supabase_migrations/clear_old_default_year_groups.sql`

This will:
1. Show current state (which categories have old defaults)
2. Clear all old default patterns to `{}`
3. Verify the cleanup worked
4. Show final state

## After Running the Script

1. **Refresh your app** - The cleanup logic won't need to run anymore
2. **Assign year groups** - New assignments should persist correctly
3. **Verify persistence** - Refresh the page and check assignments remain

## Expected Result

**Before:**
- All categories: `{"LKG":true,"UKG":true,"Reception":true}`
- Cleanup runs on every load
- New assignments don't persist

**After:**
- All categories: `{}` (empty)
- No cleanup needed
- New assignments persist correctly

## Next Steps

After clearing the old defaults:

1. Go to Settings → Categories
2. Assign year groups to categories (use actual year group names like "Lower Kindergarten Music")
3. Refresh the page
4. Verify assignments persist

The app will now use the actual year group IDs/names (like "Lower Kindergarten Music") instead of the old codes ("LKG", "UKG", "Reception").
