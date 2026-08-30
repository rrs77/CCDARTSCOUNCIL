# Year Group Assignment Persistence Fix

## Problem Summary

Year group assignments to categories via drag-and-drop were working initially but were lost on page refresh. The assignments reverted to their previous state.

## Root Causes Identified

### 1. **Inconsistent Year Group Key Usage** (Primary Issue)

The codebase had inconsistent logic for determining year group keys when saving vs. loading:

- **When saving** (lines 1363-1366, 1638-1641): Used `yearGroup.id` OR fallback mapping to legacy codes ('LKG', 'UKG', 'Reception')
- **When loading** (line 1694): Used `yearGroup.id || yearGroup.name` (correct)
- **When displaying** (lines 1753-1756): Used `yearGroup.id` OR fallback mapping to legacy codes

**The Problem:**
- `yearGroup.id` is actually the year group name (set in `api.ts` line 978: `id: group.name`)
- When saving, if a year group had an ID like "Lower Kindergarten Music", it would save with that key
- When loading/displaying, the fallback logic would look for "LKG" instead of "Lower Kindergarten Music"
- This mismatch caused assignments to not persist correctly

### 2. **Race Condition with Queue Save**

The save mechanism used a debounced queue system:
- Changes triggered `updateCategories()` which set state
- State change triggered a `useEffect` that queued a save
- Queue save had a 1-second debounce before processing
- If the user refreshed the page before the debounce completed, the save was lost

### 3. **Missing Immediate Sync for Year Group Changes**

Year group assignment changes only queued saves but didn't immediately sync to Supabase, making them vulnerable to page refresh before the queue processed.

## Fixes Applied

### Fix 1: Standardized Year Group Key Usage

**File:** `src/components/UserSettings.tsx`

Changed all year group key determination to consistently use:
```typescript
const yearGroupKey = yearGroup.id || yearGroup.name;
```

**Locations fixed:**
- Line ~1363: Bulk assignment year group selection
- Line ~1638: Edit mode year group checkboxes (full edit)
- Line ~1753: View mode year group tag filtering

This ensures the same key is used for both saving and loading.

### Fix 2: Immediate Sync for Year Group Changes

**File:** `src/components/UserSettings.tsx`

Added immediate `forceSyncToSupabase()` calls after all year group assignment changes:

1. **Individual checkbox changes** (lines ~1656, ~1710):
   ```typescript
   onChange={async (e) => {
     // ... update state ...
     await forceSyncToSupabase({ categories: updatedCategories });
   }}
   ```

2. **Clear all assignments** (line ~1759):
   ```typescript
   onClick={async () => {
     // ... update state ...
     await forceSyncToSupabase({ categories: updatedCategories });
   }}
   ```

3. **Bulk assignment** (line ~1454):
   ```typescript
   onClick={async () => {
     // ... apply bulk changes ...
     await forceSyncToSupabase({ categories: updatedCategories });
   }}
   ```

4. **Bulk removal** (line ~1488):
   ```typescript
   onClick={async () => {
     // ... remove bulk assignments ...
     await forceSyncToSupabase({ categories: updatedCategories });
   }}
   ```

5. **Clear all year groups** (line ~1529):
   ```typescript
   onClick={async () => {
     // ... clear all assignments ...
     await forceSyncToSupabase({ categories: updatedCategories });
   }}
   ```

This ensures changes are persisted immediately to Supabase, not just queued.

## Data Flow Verification

### Before Fix:
1. User changes year group assignment → `updateCategories()` called
2. State updated → `useEffect` triggered
3. Save queued with 1-second debounce
4. **If page refreshes before debounce completes → Save lost**

### After Fix:
1. User changes year group assignment → `updateCategories()` called
2. State updated → `useEffect` triggered (still queues for batch operations)
3. **`forceSyncToSupabase()` called immediately** → Changes saved to Supabase
4. Page refresh → Data loads from Supabase → Assignments persist ✅

## Testing Recommendations

1. **Test individual assignments:**
   - Assign a year group to a category via checkbox
   - Refresh the page immediately
   - Verify assignment persists

2. **Test bulk assignments:**
   - Select multiple categories and year groups
   - Apply bulk assignment
   - Refresh immediately
   - Verify all assignments persist

3. **Test removal:**
   - Remove year group assignments
   - Refresh immediately
   - Verify removals persist

4. **Test with different year group names:**
   - Use year groups with names like "Lower Kindergarten Music" (not just "LKG")
   - Verify assignments persist correctly

## Error Handling

All immediate sync calls include error handling:
```typescript
try {
  await forceSyncToSupabase({ categories: updatedCategories });
} catch (error) {
  console.error('❌ Failed to sync year group assignment:', error);
}
```

Errors are logged but don't block the UI. The queue system will still attempt to save the changes.

## Related Files

- `src/components/UserSettings.tsx` - Main component with fixes
- `src/contexts/SettingsContextNew.tsx` - Context providing `forceSyncToSupabase()`
- `src/config/api.ts` - API functions for Supabase operations
- `src/config/api.ts` (line 978) - Year group ID assignment logic

## Notes

- The queue system still operates in the background for batch operations
- Immediate sync ensures critical user changes (year group assignments) persist immediately
- The fix maintains backward compatibility with existing data
- Legacy code mappings ('LKG', 'UKG', 'Reception') are no longer used, ensuring consistency
