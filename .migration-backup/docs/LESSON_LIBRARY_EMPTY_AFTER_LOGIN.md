# Lesson library empty after switching to Supabase Auth

If the lesson library shows no lessons after you enabled Supabase Auth (new login procedure), it is usually due to **Row Level Security (RLS)** on the `lessons` table.

## Why it happens

- **Before (no Supabase Auth):** Requests used the **anon** role. The policy “Allow anon read lessons” lets anon read all lessons, so the library could show everything.
- **After (Supabase Auth):** You are **authenticated**. The “Allow anon read lessons” policy does **not** apply (it is `TO anon`). You only see rows where:
  - `user_id = auth.uid()` (your user), or  
  - `user_id IS NULL` (shared/legacy rows).

If existing lessons have `user_id` set to another UUID (e.g. from a one-off backfill or an old admin), your user does not match and those rows are hidden, so the library looks empty.

## What to do

### 1. Apply the RLS migration (recommended)

Run the migration that makes “read lessons where `user_id` is null” explicit for authenticated users:

**Supabase Dashboard → SQL Editor** → run:

```sql
-- From: supabase_migrations/lessons_allow_authenticated_read_null_user.sql
DROP POLICY IF EXISTS "Allow authenticated read lessons null user_id" ON public.lessons;
CREATE POLICY "Allow authenticated read lessons null user_id"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (user_id IS NULL);
```

(This matches the existing “own or unassigned” logic but is explicit for the authenticated role.)

### 2. Check what is in the database

In **Supabase → SQL Editor** run:

```sql
SELECT sheet_name, academic_year, user_id
FROM public.lessons
LIMIT 20;
```

(The `lessons` table has no `id` column; it uses `sheet_name` + `academic_year` as the key.)

- If `user_id` is **NULL** for your lesson rows, they should already be visible once the policy above is in place (and the existing “Users can read own or unassigned lessons” policy is present).
- If `user_id` is a **non-null UUID** that is not your current user, those rows are hidden from you.

### 3. Make existing lessons visible to all authenticated users (optional)

Only do this if you want **all** existing lessons to be visible to every authenticated user (shared).

In **Supabase → SQL Editor** run:

```sql
-- From: supabase_migrations/lessons_make_shared_optional.sql
UPDATE public.lessons
SET user_id = NULL
WHERE user_id IS NOT NULL;
```

After this, any authenticated user can read those lessons. New saves from the app will still set `user_id` when using Supabase Auth, so new lessons remain owned by the user who created them unless you change that behaviour.

### 4. If you use lesson_plans

If lesson plans are also missing, the same idea applies to `lesson_plans`. You can run:

```sql
UPDATE public.lesson_plans
SET user_id = NULL
WHERE user_id IS NOT NULL;
```

Only run this if you intend those plans to be shared.

## Summary

| Situation | Fix |
|----------|-----|
| RLS might not allow “null user” for authenticated | Run `lessons_allow_authenticated_read_null_user.sql` (step 1). |
| Rows have `user_id` set to someone else | Run the optional `UPDATE … SET user_id = NULL` (step 3) if you want them shared. |

After applying the migration and (if needed) setting `user_id = NULL`, reload the app; the lesson library should populate for the logged-in user.
