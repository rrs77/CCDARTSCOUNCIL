# Supabase SQL – run in order

**Important:** Do **not** paste this markdown file (or any line starting with `#` or `**`) into the Supabase SQL Editor — you will get a syntax error.  

**Use the .sql files instead:** open `supabase_migrations/create_profiles_table.sql` and `supabase_migrations/rls_lessons_activities_year_groups.sql`, then copy each file’s **entire contents** (only SQL) into the SQL Editor and run them in that order. See `supabase_migrations/README_RUN_IN_SUPABASE.md` for step-by-step instructions.

---

The code blocks below are for reference only. If you use them, copy **only** the lines between (and including) `-- ============================================` and the last `;` — do not copy any markdown headings, asterisks, or backticks.

---

## Block 1 – Profiles table, trigger, profile RLS, add user_id columns

Save as: `01_profiles_and_user_id.sql` (or paste directly into SQL Editor)

```sql
-- ============================================
-- BLOCK 1: PROFILES TABLE, TRIGGER, PROFILE RLS, USER_ID COLUMNS
-- ============================================

-- 1. Create profiles table (one row per auth.users id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'viewer')),
  can_edit_activities BOOLEAN NOT NULL DEFAULT false,
  can_edit_lessons BOOLEAN NOT NULL DEFAULT true,
  can_manage_year_groups BOOLEAN NOT NULL DEFAULT false,
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  allowed_year_groups TEXT[] DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Per-user profile and access control; id matches auth.users(id).';

-- 2. Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, can_edit_lessons)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher'),
    true
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Users can update own profile (limited)" ON public.profiles;
CREATE POLICY "Users can update own profile (limited)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 4. Add user_id to lessons and lesson_plans (for per-user isolation)
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_plans
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

## Block 2 – RLS for lessons, lesson_plans, activities, year_groups, custom_categories

**Run only after Block 1 has run successfully.**

Save as: `02_rls_lessons_activities_year_groups.sql` (or paste directly into SQL Editor)

```sql
-- ============================================
-- BLOCK 2: RLS FOR LESSONS, LESSON_PLANS, ACTIVITIES, YEAR_GROUPS, CUSTOM_CATEGORIES
-- ============================================

-- ----- LESSONS -----
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own or unassigned lessons" ON public.lessons;
CREATE POLICY "Users can read own or unassigned lessons"
  ON public.lessons FOR SELECT
  USING (
    (user_id IS NOT NULL AND (user_id::text = auth.uid()::text)) OR user_id IS NULL
  );

DROP POLICY IF EXISTS "Admins can read all lessons" ON public.lessons;
CREATE POLICY "Admins can read all lessons"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Users can insert own lessons" ON public.lessons;
CREATE POLICY "Users can insert own lessons"
  ON public.lessons FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own lessons" ON public.lessons;
CREATE POLICY "Users can update own lessons"
  ON public.lessons FOR UPDATE
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own lessons" ON public.lessons;
CREATE POLICY "Users can delete own lessons"
  ON public.lessons FOR DELETE
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
CREATE POLICY "Admins can manage all lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ----- LESSON_PLANS -----
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own or unassigned lesson_plans" ON public.lesson_plans;
CREATE POLICY "Users can read own or unassigned lesson_plans"
  ON public.lesson_plans FOR SELECT
  USING (
    (user_id IS NOT NULL AND (user_id::text = auth.uid()::text)) OR user_id IS NULL
  );

DROP POLICY IF EXISTS "Admins can read all lesson_plans" ON public.lesson_plans;
CREATE POLICY "Admins can read all lesson_plans"
  ON public.lesson_plans FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Users can insert own lesson_plans" ON public.lesson_plans;
CREATE POLICY "Users can insert own lesson_plans"
  ON public.lesson_plans FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own lesson_plans" ON public.lesson_plans;
CREATE POLICY "Users can update own lesson_plans"
  ON public.lesson_plans FOR UPDATE
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own lesson_plans" ON public.lesson_plans;
CREATE POLICY "Users can delete own lesson_plans"
  ON public.lesson_plans FOR DELETE
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Admins can manage all lesson_plans" ON public.lesson_plans;
CREATE POLICY "Admins can manage all lesson_plans"
  ON public.lesson_plans FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ----- ACTIVITIES -----
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read activities" ON public.activities;
CREATE POLICY "Authenticated users can read activities"
  ON public.activities FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Editors can insert activities" ON public.activities;
CREATE POLICY "Editors can insert activities"
  ON public.activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.can_edit_activities = true)
    )
  );

DROP POLICY IF EXISTS "Editors can update activities" ON public.activities;
CREATE POLICY "Editors can update activities"
  ON public.activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.can_edit_activities = true)
    )
  );

DROP POLICY IF EXISTS "Editors can delete activities" ON public.activities;
CREATE POLICY "Editors can delete activities"
  ON public.activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.can_edit_activities = true)
    )
  );

-- ----- YEAR_GROUPS -----
ALTER TABLE public.year_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read year_groups" ON public.year_groups;
CREATE POLICY "Authenticated users can read year_groups"
  ON public.year_groups FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Managers can insert year_groups" ON public.year_groups;
CREATE POLICY "Managers can insert year_groups"
  ON public.year_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.can_manage_year_groups = true)
    )
  );

DROP POLICY IF EXISTS "Managers can update year_groups" ON public.year_groups;
CREATE POLICY "Managers can update year_groups"
  ON public.year_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.can_manage_year_groups = true)
    )
  );

DROP POLICY IF EXISTS "Managers can delete year_groups" ON public.year_groups;
CREATE POLICY "Managers can delete year_groups"
  ON public.year_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.can_manage_year_groups = true)
    )
  );

-- ----- CUSTOM_CATEGORIES -----
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read custom_categories" ON public.custom_categories;
CREATE POLICY "Authenticated users can read custom_categories"
  ON public.custom_categories FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Managers can insert custom_categories" ON public.custom_categories;
CREATE POLICY "Managers can insert custom_categories"
  ON public.custom_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.can_manage_year_groups = true)
    )
  );

DROP POLICY IF EXISTS "Managers can update custom_categories" ON public.custom_categories;
CREATE POLICY "Managers can update custom_categories"
  ON public.custom_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.can_manage_year_groups = true)
    )
  );

DROP POLICY IF EXISTS "Managers can delete custom_categories" ON public.custom_categories;
CREATE POLICY "Managers can delete custom_categories"
  ON public.custom_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.can_manage_year_groups = true)
    )
  );
```

---

**Order:** Run Block 1 first, then Block 2.
