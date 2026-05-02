DO NOT PASTE THIS FILE INTO SUPABASE. This is instructions only, not SQL. You will get an error.

Only paste the contents of the two .sql files below, one at a time.

-------------------------------------------------------------------------------
STEP 1 - Run first
-------------------------------------------------------------------------------
1. Open the file:  create_profiles_table.sql
2. Select ALL text in that file (Cmd+A or Ctrl+A)
3. Copy and paste into Supabase Dashboard → SQL Editor
4. Click Run

-------------------------------------------------------------------------------
STEP 2 - Run second (only after Step 1 succeeded)
-------------------------------------------------------------------------------
1. Open the file:  rls_lessons_activities_year_groups.sql
2. Select ALL text in that file (Cmd+A or Ctrl+A)
3. Copy and paste into Supabase Dashboard → SQL Editor
4. Click Run

Files to use:  create_profiles_table.sql   and   rls_lessons_activities_year_groups.sql
Do not copy from this README or any .md file.

-------------------------------------------------------------------------------
STEP 3 (optional) - If year group delete fails with "Failed to delete year group"
-------------------------------------------------------------------------------
1. Open the file:  year_groups_rls_allow_authenticated_delete.sql
2. Select ALL text in that file (Cmd+A or Ctrl+A)
3. Copy and paste into Supabase Dashboard → SQL Editor
4. Click Run

This adds a fallback policy so any authenticated user can delete year groups.

-------------------------------------------------------------------------------
STEP 4 - If you get "infinite recursion detected in policy for relation profiles"
-------------------------------------------------------------------------------
1. Open the file:  fix_profiles_rls_recursion.sql
2. Select ALL text in that file (Cmd+A or Ctrl+A)
3. Copy and paste into Supabase Dashboard → SQL Editor
4. Click Run

This fixes RLS policies that caused recursion when checking profiles.

-------------------------------------------------------------------------------
STEP 5 (optional) - If Activity Library shows "0 activities" after local login
-------------------------------------------------------------------------------
1. Open the file:  activities_lessons_allow_anon_read.sql
2. Select ALL text in that file (Cmd+A or Ctrl+A)
3. Copy and paste into Supabase Dashboard → SQL Editor
4. Click Run

This allows reading activities/lessons when using local auth (no Supabase session).

-------------------------------------------------------------------------------
STEP 6 (optional) - Persist footer and app branding across devices
-------------------------------------------------------------------------------
1. Open the file:  create_branding_settings.sql
2. Select ALL text in that file (Cmd+A or Ctrl+A)
3. Copy and paste into Supabase Dashboard → SQL Editor
4. Click Run

This stores custom footer/login branding in Supabase so it survives cache clears and different browsers/devices. Run after fix_profiles_rls_recursion.sql.

-------------------------------------------------------------------------------
STEP 7 (optional) - If year group Lesson Library does not sync with Supabase
-------------------------------------------------------------------------------
1. Open the file:  lessons_allow_anon_sync.sql
2. Select ALL text in that file (Cmd+A or Ctrl+A)
3. Copy and paste into Supabase Dashboard → SQL Editor
4. Click Run

This allows the app to save lesson library data per year group when using local auth (no Supabase session). Run after activities_lessons_allow_anon_read.sql.

-------------------------------------------------------------------------------
STEP 8 (optional) - User Management: superuser role and RLS for admins
-------------------------------------------------------------------------------
1. Open the file:  profiles_superuser_and_rls.sql
2. Select ALL text in that file (Cmd+A or Ctrl+A)
3. Copy and paste into Supabase Dashboard → SQL Editor
4. Click Run

This adds a "superuser" role to profiles, lets admins/superusers read and update all users, syncs email from auth into profiles, and backfills missing emails. Run this if you use Supabase Auth and want the Users tab in Settings to work (view all users, edit roles, send password reset emails).

-------------------------------------------------------------------------------
STEP 9 (optional) - Make your login show as superuser in Users
-------------------------------------------------------------------------------
After you have signed in at least once (so your profile exists):

1. Open the file:  set_first_superuser.sql
2. The file is set to rob.reichstorer@gmail.com; to use another email, edit that line.
3. Select ALL text in that file (Cmd+A or Ctrl+A), copy and paste into Supabase Dashboard → SQL Editor
4. Click Run

Your account will then appear in Settings → Admin → Users with role Superuser. You can change who is a superuser at any time from Settings → Admin → Users → Edit User → Role (choose Superuser).

-------------------------------------------------------------------------------
STEP 10 (optional) - Users & access: status and purchases table
-------------------------------------------------------------------------------
1. Open the file:  profiles_status_and_purchases.sql
2. Select ALL text, copy and paste into Supabase Dashboard → SQL Editor
3. Click Run

This adds a **status** column to profiles (Active / Invited / Suspended), allows the **student** role, and creates the **user_purchases** table for "View Purchases" in Settings → Admin → Users. Run this if you use the full Users & access feature (status, View Purchases, Create User with status).
