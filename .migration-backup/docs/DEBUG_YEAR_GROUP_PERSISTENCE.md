# Debug Year Group Persistence Issue

## Current Status

✅ **Column exists**: The `year_groups` column exists in `custom_categories` table  
✅ **Column initialized**: All 15 categories have empty `{}` objects (no NULLs)  
❌ **Data not persisting**: Assignments aren't being saved or are being lost

## Enhanced Debugging Added

I've added comprehensive logging to help diagnose the issue:

### 1. API Level Logging (`src/config/api.ts`)

- **Before upsert**: Logs which categories have year group assignments
- **After upsert**: Logs what was returned from Supabase
- Shows the exact `year_groups` object being saved

### 2. Component Level Logging (`src/components/UserSettings.tsx`)

- **On checkbox change**: Logs the category, year group key, and checked state
- **After sync**: Logs whether sync was successful or failed

### 3. Test Script (`scripts/test-year-group-assignment.js`)

A Node.js script to test the save/load cycle:
```bash
node scripts/test-year-group-assignment.js
```

This will:
- Show all year groups and their IDs/names
- Show current category assignments
- Test saving an assignment
- Verify it was saved correctly

## What to Check Next

### Step 1: Check Browser Console

When you assign a year group, look for these logs:

1. **On checkbox change:**
   ```
   🔄 Immediate sync triggered for year group assignment: {
     category: "Welcome",
     yearGroupKey: "Lower Kindergarten Music",
     checked: true,
     yearGroups: { "Lower Kindergarten Music": true }
   }
   ```

2. **Before upsert:**
   ```
   💾 Saving category with year groups: {
     name: "Welcome",
     yearGroups: { "Lower Kindergarten Music": true },
     yearGroupKeys: ["Lower Kindergarten Music"]
   }
   ```

3. **Upsert request:**
   ```
   📤 Upserting categories with year group assignments: [...]
   ```

4. **After upsert:**
   ```
   ✅ Categories returned from Supabase with year groups: [...]
   ```

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "custom_categories"
3. Assign a year group
4. Look for the POST/PATCH request to Supabase
5. Check:
   - **Request payload**: Does it include `year_groups` with the correct key?
   - **Response**: Does Supabase return the updated data?

### Step 3: Verify Year Group Keys Match

The key issue might be a mismatch between:
- **What key is used when saving** (e.g., `"Lower Kindergarten Music"`)
- **What key is used when loading** (might be looking for something else)

**Check:**
1. What are your actual year group names in Supabase?
2. What are the year group IDs? (Remember: `id: group.name` from API)
3. Are the keys consistent?

### Step 4: Run Test Script

```bash
node scripts/test-year-group-assignment.js
```

This will show you:
- All year groups and their IDs
- Current category assignments
- Test saving an assignment
- Verify it persists

## Common Issues

### Issue 1: Year Group Key Mismatch

**Symptom**: Data saves but doesn't load correctly

**Check**: The year group key used when saving must match the key used when loading.

**Fix**: Ensure `yearGroup.id || yearGroup.name` is used consistently (already fixed in code).

### Issue 2: Upsert Conflict Resolution

**Symptom**: Upsert succeeds but data doesn't change

**Check**: The `onConflict: 'name'` might not be updating the `year_groups` field.

**Fix**: Verify Supabase is updating all fields, not just the conflict field.

### Issue 3: Data Being Overwritten

**Symptom**: Assignment saves but disappears after page refresh

**Check**: Is another process overwriting the data?

**Possible causes**:
- Queue save system overwriting with stale data
- Initial load overwriting user changes
- Race condition between save and load

## Next Steps

1. **Assign a year group** and watch the console logs
2. **Check the Network tab** to see what's being sent/received
3. **Run the test script** to verify the save/load cycle
4. **Share the console logs** so we can see exactly what's happening

## Expected Console Output

When assigning a year group, you should see:

```
🔄 Immediate sync triggered for year group assignment: {...}
💾 Saving category with year groups: {...}
📤 Upserting categories with year group assignments: [...]
✅ Categories returned from Supabase with year groups: [...]
✅ Immediate sync successful for year group assignment
```

If you see errors or missing logs, that will help identify where the issue is.
