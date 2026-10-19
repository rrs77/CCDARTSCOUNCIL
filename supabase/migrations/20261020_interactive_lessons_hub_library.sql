-- =============================================================================
-- Slides library provenance + hub library links
-- Extends interactive_lessons for partner-hub decks and per-teacher library links.
-- Idempotent. STOP: review before prod.
-- Depends on: 20261018_interactive_lessons.sql
-- =============================================================================

ALTER TABLE public.interactive_lessons
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'user'
    CHECK (source IN ('user', 'hub', 'demo'));

ALTER TABLE public.interactive_lessons
  ADD COLUMN IF NOT EXISTS hub_id TEXT;

ALTER TABLE public.interactive_lessons
  ADD COLUMN IF NOT EXISTS hub_name TEXT;

ALTER TABLE public.interactive_lessons
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.interactive_lessons
  ADD COLUMN IF NOT EXISTS subject TEXT;

CREATE INDEX IF NOT EXISTS idx_interactive_lessons_source
  ON public.interactive_lessons (source);

CREATE INDEX IF NOT EXISTS idx_interactive_lessons_hub
  ON public.interactive_lessons (hub_id)
  WHERE hub_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactive_lessons_tags
  ON public.interactive_lessons USING GIN (tags);

COMMENT ON COLUMN public.interactive_lessons.source IS
  'Library provenance: user-created, partner-hub pack, or shipped demo.';
COMMENT ON COLUMN public.interactive_lessons.hub_id IS
  'Partner hub slug when source = hub (e.g. lso, ems).';
COMMENT ON COLUMN public.interactive_lessons.tags IS
  'Searchable tags for the Slides library picker.';
COMMENT ON COLUMN public.interactive_lessons.subject IS
  'Subject label for Slides library search/filter (e.g. Music, Drama).';

-- Per-teacher links: hub decks (or shared packs) added to their Slides library.
CREATE TABLE IF NOT EXISTS public.interactive_lesson_library_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interactive_lesson_id TEXT NOT NULL REFERENCES public.interactive_lessons(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'hub'
    CHECK (source IN ('hub', 'user', 'shared')),
  hub_id TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, interactive_lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_ilv_library_links_user
  ON public.interactive_lesson_library_links (user_id);

CREATE INDEX IF NOT EXISTS idx_ilv_library_links_lesson
  ON public.interactive_lesson_library_links (interactive_lesson_id);

ALTER TABLE public.interactive_lesson_library_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ilv_library_links_select ON public.interactive_lesson_library_links;
CREATE POLICY ilv_library_links_select ON public.interactive_lesson_library_links
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.current_user_is_admin()
  );

DROP POLICY IF EXISTS ilv_library_links_insert ON public.interactive_lesson_library_links;
CREATE POLICY ilv_library_links_insert ON public.interactive_lesson_library_links
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ilv_library_links_delete ON public.interactive_lesson_library_links;
CREATE POLICY ilv_library_links_delete ON public.interactive_lesson_library_links
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.current_user_is_admin()
  );

COMMENT ON TABLE public.interactive_lesson_library_links IS
  'Teacher Slides library membership — hub packs become available when linked here.';
