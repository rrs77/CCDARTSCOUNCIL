-- ============================================
-- FIX: Infinite recursion in profiles RLS policies
-- The "Admins can read/update" policies used EXISTS (SELECT FROM profiles)
-- which re-triggered RLS on profiles → infinite recursion.
-- Solution: SECURITY DEFINER function that bypasses RLS to check admin status.
-- ============================================

-- 1. Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 2. Replace profiles policies to use the function
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.current_user_is_admin());

-- 3. Replace policies in other tables that reference profiles (same recursion risk)
-- LESSONS
DROP POLICY IF EXISTS "Admins can read all lessons" ON public.lessons;
CREATE POLICY "Admins can read all lessons"
  ON public.lessons FOR SELECT
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
CREATE POLICY "Admins can manage all lessons"
  ON public.lessons FOR ALL
  USING (public.current_user_is_admin());

-- LESSON_PLANS
DROP POLICY IF EXISTS "Admins can read all lesson_plans" ON public.lesson_plans;
CREATE POLICY "Admins can read all lesson_plans"
  ON public.lesson_plans FOR SELECT
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage all lesson_plans" ON public.lesson_plans;
CREATE POLICY "Admins can manage all lesson_plans"
  ON public.lesson_plans FOR ALL
  USING (public.current_user_is_admin());

-- ACTIVITIES (Editors = admin OR can_edit_activities)
CREATE OR REPLACE FUNCTION public.current_user_can_edit_activities()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR can_edit_activities = true)
  );
$$;

DROP POLICY IF EXISTS "Editors can insert activities" ON public.activities;
CREATE POLICY "Editors can insert activities"
  ON public.activities FOR INSERT
  WITH CHECK (public.current_user_can_edit_activities());

DROP POLICY IF EXISTS "Editors can update activities" ON public.activities;
CREATE POLICY "Editors can update activities"
  ON public.activities FOR UPDATE
  USING (public.current_user_can_edit_activities());

DROP POLICY IF EXISTS "Editors can delete activities" ON public.activities;
CREATE POLICY "Editors can delete activities"
  ON public.activities FOR DELETE
  USING (public.current_user_can_edit_activities());

-- YEAR_GROUPS (Managers = admin OR can_manage_year_groups)
CREATE OR REPLACE FUNCTION public.current_user_can_manage_year_groups()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR can_manage_year_groups = true)
  );
$$;

DROP POLICY IF EXISTS "Managers can insert year_groups" ON public.year_groups;
CREATE POLICY "Managers can insert year_groups"
  ON public.year_groups FOR INSERT
  WITH CHECK (public.current_user_can_manage_year_groups());

DROP POLICY IF EXISTS "Managers can update year_groups" ON public.year_groups;
CREATE POLICY "Managers can update year_groups"
  ON public.year_groups FOR UPDATE
  USING (public.current_user_can_manage_year_groups());

DROP POLICY IF EXISTS "Managers can delete year_groups" ON public.year_groups;
CREATE POLICY "Managers can delete year_groups"
  ON public.year_groups FOR DELETE
  USING (public.current_user_can_manage_year_groups());

-- CUSTOM_CATEGORIES
DROP POLICY IF EXISTS "Managers can insert custom_categories" ON public.custom_categories;
CREATE POLICY "Managers can insert custom_categories"
  ON public.custom_categories FOR INSERT
  WITH CHECK (public.current_user_can_manage_year_groups());

DROP POLICY IF EXISTS "Managers can update custom_categories" ON public.custom_categories;
CREATE POLICY "Managers can update custom_categories"
  ON public.custom_categories FOR UPDATE
  USING (public.current_user_can_manage_year_groups());

DROP POLICY IF EXISTS "Managers can delete custom_categories" ON public.custom_categories;
CREATE POLICY "Managers can delete custom_categories"
  ON public.custom_categories FOR DELETE
  USING (public.current_user_can_manage_year_groups());
