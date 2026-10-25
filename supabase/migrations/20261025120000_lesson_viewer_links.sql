-- Lesson ↔ Interactive Lesson Viewer many-to-many links + remembered picks.
-- Also fixes can_edit_interactive_lessons() hub role mismatch (admin/owner → hub_*).
-- Idempotent / IF NOT EXISTS throughout.

-- ---------------------------------------------------------------------------
-- 1) interactive_lessons lineage columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.interactive_lessons
  ADD COLUMN IF NOT EXISTS is_original BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS derived_from_viewer_id TEXT,
  ADD COLUMN IF NOT EXISTS root_viewer_id TEXT,
  ADD COLUMN IF NOT EXISTS organisation_id TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'interactive_lessons_derived_from_fkey'
  ) THEN
    ALTER TABLE public.interactive_lessons
      ADD CONSTRAINT interactive_lessons_derived_from_fkey
      FOREIGN KEY (derived_from_viewer_id) REFERENCES public.interactive_lessons(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'interactive_lessons_root_viewer_fkey'
  ) THEN
    ALTER TABLE public.interactive_lessons
      ADD CONSTRAINT interactive_lessons_root_viewer_fkey
      FOREIGN KEY (root_viewer_id) REFERENCES public.interactive_lessons(id) ON DELETE SET NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organisations'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'interactive_lessons_organisation_fkey'
  ) THEN
    ALTER TABLE public.interactive_lessons
      ADD CONSTRAINT interactive_lessons_organisation_fkey
      FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ilv_root ON public.interactive_lessons(root_viewer_id);
CREATE INDEX IF NOT EXISTS idx_ilv_org ON public.interactive_lessons(organisation_id)
  WHERE organisation_id IS NOT NULL;

UPDATE public.interactive_lessons
SET is_original = true,
    root_viewer_id = COALESCE(root_viewer_id, id)
WHERE source IN ('demo', 'hub')
  AND (root_viewer_id IS NULL OR is_original = false);

-- ---------------------------------------------------------------------------
-- 2) Fix hub role check in can_edit_interactive_lessons
--    hub_memberships.role is hub_viewer|hub_editor|hub_publisher|hub_administrator
--    (never admin|owner). Hub editors and above may edit viewers.
-- ---------------------------------------------------------------------------
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
        public.is_super_admin(uid)
        OR p.role = 'organisation'
        OR (
          p.role = 'admin'
          AND p.organisation_id IS NOT NULL
          AND btrim(p.organisation_id) <> ''
        )
        OR EXISTS (
          SELECT 1 FROM public.hub_memberships hm
          WHERE hm.user_id = uid
            AND hm.role IN ('hub_editor', 'hub_publisher', 'hub_administrator')
        )
      )
  );
$$;

COMMENT ON FUNCTION public.can_edit_interactive_lessons(UUID) IS
  'True when the user may author interactive lessons: platform super, org role, school admin with org, or hub_editor|hub_publisher|hub_administrator.';

-- ---------------------------------------------------------------------------
-- 3) Helpers for org visibility
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_org_ids(uid UUID DEFAULT auth.uid())
RETURNS TEXT[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT org_id FROM (
        SELECT NULLIF(btrim(p.organisation_id), '') AS org_id
        FROM public.profiles p
        WHERE p.id = uid
        UNION
        SELECT hm.organisation_id
        FROM public.hub_memberships hm
        WHERE hm.user_id = uid
      ) s
      WHERE org_id IS NOT NULL
    ),
    ARRAY[]::TEXT[]
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_org_viewers(uid UUID, org TEXT)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    org IS NOT NULL
    AND btrim(org) <> ''
    AND (
      public.is_super_admin(uid)
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = uid
          AND COALESCE(p.status, 'active') <> 'suspended'
          AND p.anonymised_at IS NULL
          AND (
            (p.role IN ('organisation', 'admin') AND p.organisation_id = org)
            OR EXISTS (
              SELECT 1 FROM public.hub_memberships hm
              WHERE hm.user_id = uid
                AND hm.organisation_id = org
                AND hm.role IN ('hub_editor', 'hub_publisher', 'hub_administrator')
            )
          )
      )
    );
$$;

-- ---------------------------------------------------------------------------
-- 4) lesson_viewer_links
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_viewer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('lesson', 'scheme')),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  academic_year TEXT,
  sheet_name TEXT,
  lesson_number TEXT,
  scheme_id TEXT,
  scheme_owner_org TEXT,
  viewer_id TEXT NOT NULL REFERENCES public.interactive_lessons(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  origin TEXT NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual', 'scheme', 'migrated')),
  source_link_id UUID,
  detached_by_teacher BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lesson_viewer_links_scope_cols CHECK (
    (scope = 'lesson'
      AND owner_user_id IS NOT NULL
      AND academic_year IS NOT NULL
      AND sheet_name IS NOT NULL
      AND lesson_number IS NOT NULL
      AND scheme_id IS NULL)
    OR (scope = 'scheme'
      AND scheme_id IS NOT NULL
      AND lesson_number IS NOT NULL
      AND owner_user_id IS NULL)
  )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_viewer_links_source_link_fkey'
  ) THEN
    ALTER TABLE public.lesson_viewer_links
      ADD CONSTRAINT lesson_viewer_links_source_link_fkey
      FOREIGN KEY (source_link_id) REFERENCES public.lesson_viewer_links(id) ON DELETE SET NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organisations'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_viewer_links_scheme_org_fkey'
  ) THEN
    ALTER TABLE public.lesson_viewer_links
      ADD CONSTRAINT lesson_viewer_links_scheme_org_fkey
      FOREIGN KEY (scheme_owner_org) REFERENCES public.organisations(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_lvl_lesson
  ON public.lesson_viewer_links(owner_user_id, academic_year, sheet_name, lesson_number, viewer_id)
  WHERE scope = 'lesson';
CREATE UNIQUE INDEX IF NOT EXISTS uq_lvl_scheme
  ON public.lesson_viewer_links(scheme_id, lesson_number, viewer_id)
  WHERE scope = 'scheme';
CREATE INDEX IF NOT EXISTS idx_lvl_lesson_lookup
  ON public.lesson_viewer_links(owner_user_id, academic_year, sheet_name, lesson_number, position)
  WHERE scope = 'lesson';
CREATE INDEX IF NOT EXISTS idx_lvl_viewer ON public.lesson_viewer_links(viewer_id);
CREATE INDEX IF NOT EXISTS idx_lvl_scheme ON public.lesson_viewer_links(scheme_id, lesson_number);

ALTER TABLE public.lesson_viewer_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lvl_select" ON public.lesson_viewer_links;
CREATE POLICY "lvl_select" ON public.lesson_viewer_links FOR SELECT USING (
  public.current_user_is_admin()
  OR (scope = 'lesson' AND owner_user_id = auth.uid())
  OR (
    scope = 'scheme'
    AND (
      scheme_owner_org IS NULL
      OR scheme_owner_org = ANY (public.user_org_ids(auth.uid()))
    )
  )
);

DROP POLICY IF EXISTS "lvl_insert" ON public.lesson_viewer_links;
CREATE POLICY "lvl_insert" ON public.lesson_viewer_links FOR INSERT WITH CHECK (
  (scope = 'lesson' AND owner_user_id = auth.uid())
  OR (
    scope = 'scheme'
    AND (
      public.current_user_is_admin()
      OR public.can_manage_org_viewers(auth.uid(), scheme_owner_org)
    )
  )
);

DROP POLICY IF EXISTS "lvl_update" ON public.lesson_viewer_links;
CREATE POLICY "lvl_update" ON public.lesson_viewer_links FOR UPDATE USING (
  (scope = 'lesson' AND owner_user_id = auth.uid())
  OR (
    scope = 'scheme'
    AND (
      public.current_user_is_admin()
      OR public.can_manage_org_viewers(auth.uid(), scheme_owner_org)
    )
  )
);

DROP POLICY IF EXISTS "lvl_delete" ON public.lesson_viewer_links;
CREATE POLICY "lvl_delete" ON public.lesson_viewer_links FOR DELETE USING (
  (scope = 'lesson' AND owner_user_id = auth.uid())
  OR (
    scope = 'scheme'
    AND (
      public.current_user_is_admin()
      OR public.can_manage_org_viewers(auth.uid(), scheme_owner_org)
    )
  )
);

-- ---------------------------------------------------------------------------
-- 5) lesson_viewer_picks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_viewer_picks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_key TEXT NOT NULL,
  viewer_id TEXT NOT NULL REFERENCES public.interactive_lessons(id) ON DELETE CASCADE,
  last_scene INT,
  picked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_key)
);

CREATE INDEX IF NOT EXISTS idx_lvp_user_recent
  ON public.lesson_viewer_picks(user_id, picked_at DESC);

ALTER TABLE public.lesson_viewer_picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lvp_owner_all" ON public.lesson_viewer_picks;
CREATE POLICY "lvp_owner_all" ON public.lesson_viewer_picks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6) Org SELECT on interactive_lessons (published org copies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "ilv_select_org_published" ON public.interactive_lessons;
CREATE POLICY "ilv_select_org_published" ON public.interactive_lessons
  FOR SELECT USING (
    organisation_id IS NOT NULL
    AND organisation_id = ANY (public.user_org_ids(auth.uid()))
    AND status = 'published'
    AND archived_at IS NULL
  );

-- ---------------------------------------------------------------------------
-- 7) Backfill from LessonData.interactiveLessonId in lessons.data JSON
--    (attached_lesson_keys lack user/year — left in place, stop writing in app)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  lesson_key TEXT;
  lesson_obj JSONB;
  viewer TEXT;
  yr TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lessons'
  ) THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT id, user_id, sheet_name, academic_year, data
    FROM public.lessons
    WHERE data IS NOT NULL AND jsonb_typeof(data) = 'object'
  LOOP
    yr := COALESCE(NULLIF(btrim(r.academic_year), ''), 'unknown');
    FOR lesson_key, lesson_obj IN SELECT * FROM jsonb_each(r.data)
    LOOP
      IF jsonb_typeof(lesson_obj) <> 'object' THEN
        CONTINUE;
      END IF;
      viewer := NULLIF(btrim(lesson_obj ->> 'interactiveLessonId'), '');
      IF viewer IS NULL THEN
        CONTINUE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.interactive_lessons il WHERE il.id = viewer) THEN
        CONTINUE;
      END IF;
      INSERT INTO public.lesson_viewer_links (
        scope, owner_user_id, academic_year, sheet_name, lesson_number,
        viewer_id, position, origin, created_by
      )
      VALUES (
        'lesson', r.user_id, yr, r.sheet_name, lesson_key,
        viewer, 0, 'migrated', r.user_id
      )
      ON CONFLICT (owner_user_id, academic_year, sheet_name, lesson_number, viewer_id)
        WHERE scope = 'lesson'
        DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
