# Category Management - Complete Guide

## ✅ All Categories Present

You now have all **17 fixed categories** in Supabase:
1. Welcome ✅
2. Kodaly Songs ✅
3. Kodaly Action Songs ✅
4. Action/Games Songs ✅
5. Rhythm Sticks ✅
6. Scarf Songs ✅
7. General Game ✅
8. Core Songs ✅
9. Parachute Games ✅
10. Percussion Games ✅
11. Teaching Units ✅
12. Goodbye ✅
13. Kodaly Rhythms ✅
14. Kodaly Games ✅
15. IWB Games ✅
16. Drama Games ✅ (now added)
17. Vocal Warmups ✅ (now added)

## ✅ Adding New Categories

**Yes, you can add new categories in Settings, and they will:**

1. ✅ **Save to Supabase automatically** - The `handleAddCategory` function calls `updateCategories()` which triggers the save mechanism
2. ✅ **Allow year group assignment** - You can assign year groups when creating the category, or edit them later
3. ✅ **Persist correctly** - Uses actual year group IDs/names (not legacy codes) so assignments will work

### How It Works:

1. **Go to Settings → Categories tab**
2. **Fill in the form:**
   - Category name
   - Color
   - Click "Select year groups" to assign year groups
3. **Click "Add"**
4. **The category will:**
   - Appear in your categories list immediately
   - Be saved to Supabase via `updateCategories()`
   - Be available for year group assignment

### Year Group Assignment:

- **When creating:** Use the "Select year groups" button in the add form
- **After creation:** Click the category → Click "Assign Year Groups" → Select year groups → Changes save immediately

## ✅ Year Group Assignment Flow

### Fixed Categories (like Drama Games, Vocal Warmups):
1. They exist in Supabase with empty `year_groups: {}`
2. Go to Settings → Categories
3. Find the category (e.g., "Drama Games")
4. Click "Assign Year Groups" (or the "+ Assign Year Groups" button)
5. Select the year groups you want
6. Changes save immediately to Supabase
7. Category will appear in Activity Library/Lesson Builder for those year groups

### New Categories:
1. Create category with year groups assigned
2. Saves to Supabase automatically
3. Available immediately for assigned year groups

## ✅ Data Flow

### Save Flow:
```
User assigns year group
  ↓
updateCategories() called
  ↓
forceSyncToSupabase() called immediately
  ↓
customCategoriesApi.upsert() → Supabase
  ↓
Data persisted with year group IDs/names as keys
```

### Load Flow:
```
Page loads
  ↓
customCategoriesApi.getAll() → Supabase
  ↓
normaliseYearGroups() processes data
  ↓
Categories loaded with yearGroups field
  ↓
Filtered by year group assignment for display
```

## ✅ Key Fixes Applied

1. **Standardized year group keys** - All use `yearGroup.id || yearGroup.name`
2. **Immediate sync** - Year group changes save immediately (not queued)
3. **Fixed add category form** - Now uses actual year group IDs/names
4. **Cleared old defaults** - Removed `{"LKG":true,"UKG":true,"Reception":true}` pattern
5. **Added missing categories** - Drama Games and Vocal Warmups

## ✅ Testing Checklist

- [ ] All 17 categories visible in Settings → Categories
- [ ] Can assign year groups to existing categories
- [ ] Assignments persist after page refresh
- [ ] Can create new category
- [ ] Can assign year groups when creating new category
- [ ] New category appears in Activity Library for assigned year groups
- [ ] Categories filter correctly by year group in Activity Library

## Notes

- **Year group keys** are now consistent: Use actual IDs/names (e.g., "Lower Kindergarten Music") not codes ("LKG")
- **All categories** start with empty `year_groups: {}` - you must explicitly assign them
- **Custom categories** (not in FIXED_CATEGORIES) are always saved to Supabase
- **Fixed categories** are only saved if they have year group or group assignments
