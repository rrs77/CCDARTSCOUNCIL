-- ============================================
-- RLS POLICIES: lessons, lesson_plans, activities, year_groups, custom_categories
-- Run after create_profiles_table.sql
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

-- ----- ACTIVITIES (shared read; write by can_edit_activities or admin) -----
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

-- ----- YEAR_GROUPS (shared read; write by can_manage_year_groups or admin) -----
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

-- ----- CUSTOM_CATEGORIES (same as year_groups) -----
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
