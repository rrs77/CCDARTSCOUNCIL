-- =============================================================================
-- Interactive Lesson Viewer (prototype)
-- Per-owner interactive lessons with publish/availability + CCD lesson attach keys.
-- Idempotent. STOP: review before prod.
-- Depends on: public.profiles, current_user_is_admin() from prior migrations.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.interactive_lessons (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled interactive lesson',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  attached_lesson_keys TEXT[] NOT NULL DEFAULT '{}',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactive_lessons_owner
  ON public.interactive_lessons (owner_id);

CREATE INDEX IF NOT EXISTS idx_interactive_lessons_status
  ON public.interactive_lessons (status);

CREATE INDEX IF NOT EXISTS idx_interactive_lessons_updated
  ON public.interactive_lessons (updated_at DESC);

ALTER TABLE public.interactive_lessons ENABLE ROW LEVEL SECURITY;

-- Hub / organisation admins can manage their own rows; system admins all.
CREATE OR REPLACE FUNCTION public.can_edit_interactive_lessons(uid UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid
      AND COALESCE(p.status, 'active') <> 'suspended'
      AND p.anonymised_at IS NULL
      AND (
        p.role IN ('admin', 'superuser', 'super_admin', 'organisation')
        OR EXISTS (
          SELECT 1 FROM public.hub_memberships hm
          WHERE hm.user_id = uid
            AND hm.role IN ('admin', 'owner')
        )
      )
  );
$$;

DROP POLICY IF EXISTS interactive_lessons_select ON public.interactive_lessons;
CREATE POLICY interactive_lessons_select ON public.interactive_lessons
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR owner_id = auth.uid()
    OR public.current_user_is_admin()
  );

DROP POLICY IF EXISTS interactive_lessons_insert ON public.interactive_lessons;
CREATE POLICY interactive_lessons_insert ON public.interactive_lessons
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND public.can_edit_interactive_lessons(auth.uid())
  );

DROP POLICY IF EXISTS interactive_lessons_update ON public.interactive_lessons;
CREATE POLICY interactive_lessons_update ON public.interactive_lessons
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.current_user_is_admin()
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR public.current_user_is_admin()
  );

DROP POLICY IF EXISTS interactive_lessons_delete ON public.interactive_lessons;
CREATE POLICY interactive_lessons_delete ON public.interactive_lessons
  FOR DELETE TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.current_user_is_admin()
  );

COMMENT ON TABLE public.interactive_lessons IS
  'CCDesigner Interactive Lesson Viewer documents (scenes, lyrics, media). Owners edit; published rows readable by all authenticated users.';
