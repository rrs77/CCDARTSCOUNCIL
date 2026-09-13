-- =============================================================================
-- CCDesigner Community Forum (integrated native)
-- Requires: 20260902_user_mgmt_downloads.sql, 20260903_hub_administration.sql
-- Idempotent. Uses TEXT organisation ids (hub_id) for hub-scoped categories.
-- Super-admin checks use role only (never email at request time).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profile forum capability flags (nullable = use role defaults)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS forum_can_moderate BOOLEAN,
  ADD COLUMN IF NOT EXISTS forum_can_manage_categories BOOLEAN,
  ADD COLUMN IF NOT EXISTS forum_can_manage_settings BOOLEAN,
  ADD COLUMN IF NOT EXISTS forum_email_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS forum_notify_replies BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS forum_notify_mentions BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.forum_can_moderate IS
  'NULL = derive from role; true/false overrides forum.moderate';
COMMENT ON COLUMN public.profiles.forum_can_manage_categories IS
  'NULL = derive from role; true/false overrides forum.manage_categories';

-- ---------------------------------------------------------------------------
-- 2. Categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 100,
  -- draft | published | archived
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  -- public | members | hub | announcement | role_restricted
  scope TEXT NOT NULL DEFAULT 'public'
    CHECK (scope IN ('public', 'members', 'hub', 'announcement', 'role_restricted')),
  hub_id TEXT REFERENCES public.organisations(id) ON DELETE CASCADE,
  allowed_roles TEXT[] DEFAULT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  topic_count INT NOT NULL DEFAULT 0,
  post_count INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT forum_categories_hub_scope_chk CHECK (
    (scope = 'hub' AND hub_id IS NOT NULL)
    OR (scope <> 'hub')
  )
);

CREATE INDEX IF NOT EXISTS idx_forum_categories_status ON public.forum_categories(status);
CREATE INDEX IF NOT EXISTS idx_forum_categories_scope ON public.forum_categories(scope);
CREATE INDEX IF NOT EXISTS idx_forum_categories_hub ON public.forum_categories(hub_id);
CREATE INDEX IF NOT EXISTS idx_forum_categories_sort ON public.forum_categories(sort_order, title);

COMMENT ON TABLE public.forum_categories IS
  'Forum categories. Hub-scoped rows require hub membership for private visibility.';

-- ---------------------------------------------------------------------------
-- 3. Topics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  body_md TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_announcement BOOLEAN NOT NULL DEFAULT false,
  reply_count INT NOT NULL DEFAULT 0,
  reaction_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON public.forum_topics(category_id, is_pinned DESC, last_reply_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_forum_topics_author ON public.forum_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created ON public.forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_search ON public.forum_topics
  USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body_md, '')));

-- ---------------------------------------------------------------------------
-- 4. Posts (replies; topic body is also mirrored as first post optionally)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES public.forum_posts(id) ON DELETE SET NULL,
  body_md TEXT NOT NULL,
  body_html TEXT NOT NULL DEFAULT '',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_topic_starter BOOLEAN NOT NULL DEFAULT false,
  reaction_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON public.forum_posts(topic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_search ON public.forum_posts
  USING gin (to_tsvector('english', coalesce(body_md, '')));

-- ---------------------------------------------------------------------------
-- 5. Reactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL DEFAULT 'like'
    CHECK (reaction IN ('like', 'helpful', 'insightful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_forum_reactions_post ON public.forum_reactions(post_id);

-- ---------------------------------------------------------------------------
-- 6. Subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT forum_subscriptions_target_chk CHECK (
    (topic_id IS NOT NULL AND category_id IS NULL)
    OR (topic_id IS NULL AND category_id IS NOT NULL)
  ),
  UNIQUE (user_id, topic_id),
  UNIQUE (user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_subscriptions_user ON public.forum_subscriptions(user_id);

-- ---------------------------------------------------------------------------
-- 7. Reports (moderation + safeguarding distinguished)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  -- spam | abuse | off_topic | safeguarding | other
  reason TEXT NOT NULL
    CHECK (reason IN ('spam', 'abuse', 'off_topic', 'safeguarding', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  is_safeguarding BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT forum_reports_target_chk CHECK (
    topic_id IS NOT NULL OR post_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_forum_reports_status ON public.forum_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_reports_safeguarding ON public.forum_reports(is_safeguarding)
  WHERE is_safeguarding = true;

-- ---------------------------------------------------------------------------
-- 8. Moderation actions (audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_mod_actions_created ON public.forum_moderation_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_mod_actions_target ON public.forum_moderation_actions(target_type, target_id);

-- ---------------------------------------------------------------------------
-- 9. Per-user forum status (suspension)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_user_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspended_until TIMESTAMPTZ,
  suspend_reason TEXT,
  suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_moderator BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 10. In-app notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL
    CHECK (kind IN ('reply', 'mention', 'moderation', 'report_update', 'subscription')),
  title TEXT NOT NULL,
  body TEXT,
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  email_queued BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_notifications_user
  ON public.forum_notifications(user_id, is_read, created_at DESC);

-- ---------------------------------------------------------------------------
-- 11. Helpers (RLS) — role-based, never email
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.forum_is_moderator(uid UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid
      AND COALESCE(p.status, 'active') = 'active'
      AND p.anonymised_at IS NULL
      AND (
        p.role IN ('admin', 'superuser', 'super_admin')
        OR p.forum_can_moderate IS TRUE
        OR EXISTS (
          SELECT 1 FROM public.forum_user_status s
          WHERE s.user_id = uid AND s.is_moderator = true
            AND s.is_suspended = false
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.forum_can_read_category(cat public.forum_categories, uid UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  prof RECORD;
  hub_ok boolean;
BEGIN
  IF cat.status = 'archived' AND NOT public.forum_is_moderator(uid) THEN
    RETURN false;
  END IF;
  -- Draft categories: moderators / managers only (unless published)
  IF cat.status = 'draft' AND NOT public.forum_is_moderator(uid) THEN
    RETURN false;
  END IF;

  IF cat.scope = 'public' THEN
    RETURN true;
  END IF;

  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = uid;
  IF NOT FOUND OR COALESCE(prof.status, 'active') <> 'active' OR prof.anonymised_at IS NOT NULL THEN
    RETURN false;
  END IF;

  IF public.forum_is_moderator(uid) OR public.is_super_admin(uid) THEN
    RETURN true;
  END IF;

  IF cat.scope = 'members' OR cat.scope = 'announcement' THEN
    RETURN true;
  END IF;

  IF cat.scope = 'role_restricted' THEN
    RETURN cat.allowed_roles IS NULL
      OR cardinality(cat.allowed_roles) = 0
      OR prof.role = ANY (cat.allowed_roles);
  END IF;

  IF cat.scope = 'hub' AND cat.hub_id IS NOT NULL THEN
    IF public.is_super_admin(uid) THEN
      RETURN true;
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.hub_memberships m
      WHERE m.organisation_id = cat.hub_id AND m.user_id = uid
    ) INTO hub_ok;
    RETURN hub_ok;
  END IF;

  RETURN false;
END;
$$;

-- ---------------------------------------------------------------------------
-- 12. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_notifications ENABLE ROW LEVEL SECURITY;

-- Categories: readable when forum_can_read_category; writes via service role / API
DROP POLICY IF EXISTS "forum_categories_select" ON public.forum_categories;
CREATE POLICY "forum_categories_select"
  ON public.forum_categories FOR SELECT
  USING (public.forum_can_read_category(forum_categories, auth.uid()));

DROP POLICY IF EXISTS "forum_categories_mod_all" ON public.forum_categories;
CREATE POLICY "forum_categories_mod_all"
  ON public.forum_categories FOR ALL
  USING (public.forum_is_moderator(auth.uid()))
  WITH CHECK (public.forum_is_moderator(auth.uid()));

DROP POLICY IF EXISTS "forum_topics_select" ON public.forum_topics;
CREATE POLICY "forum_topics_select"
  ON public.forum_topics FOR SELECT
  USING (
    (NOT is_hidden OR public.forum_is_moderator(auth.uid()) OR author_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.forum_categories c
      WHERE c.id = forum_topics.category_id
        AND public.forum_can_read_category(c, auth.uid())
    )
  );

DROP POLICY IF EXISTS "forum_topics_insert" ON public.forum_topics;
CREATE POLICY "forum_topics_insert"
  ON public.forum_topics FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.forum_categories c
      WHERE c.id = category_id
        AND c.status = 'published'
        AND c.is_locked = false
        AND public.forum_can_read_category(c, auth.uid())
    )
  );

DROP POLICY IF EXISTS "forum_topics_update_own" ON public.forum_topics;
CREATE POLICY "forum_topics_update_own"
  ON public.forum_topics FOR UPDATE
  USING (author_id = auth.uid() OR public.forum_is_moderator(auth.uid()))
  WITH CHECK (author_id = auth.uid() OR public.forum_is_moderator(auth.uid()));

DROP POLICY IF EXISTS "forum_posts_select" ON public.forum_posts;
CREATE POLICY "forum_posts_select"
  ON public.forum_posts FOR SELECT
  USING (
    (NOT is_hidden OR public.forum_is_moderator(auth.uid()) OR author_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.forum_topics t
      JOIN public.forum_categories c ON c.id = t.category_id
      WHERE t.id = forum_posts.topic_id
        AND public.forum_can_read_category(c, auth.uid())
    )
  );

DROP POLICY IF EXISTS "forum_posts_insert" ON public.forum_posts;
CREATE POLICY "forum_posts_insert"
  ON public.forum_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "forum_posts_update" ON public.forum_posts;
CREATE POLICY "forum_posts_update"
  ON public.forum_posts FOR UPDATE
  USING (author_id = auth.uid() OR public.forum_is_moderator(auth.uid()));

DROP POLICY IF EXISTS "forum_reactions_select" ON public.forum_reactions;
CREATE POLICY "forum_reactions_select"
  ON public.forum_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "forum_reactions_write" ON public.forum_reactions;
CREATE POLICY "forum_reactions_write"
  ON public.forum_reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "forum_subscriptions_own" ON public.forum_subscriptions;
CREATE POLICY "forum_subscriptions_own"
  ON public.forum_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "forum_reports_insert" ON public.forum_reports;
CREATE POLICY "forum_reports_insert"
  ON public.forum_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "forum_reports_select" ON public.forum_reports;
CREATE POLICY "forum_reports_select"
  ON public.forum_reports FOR SELECT
  USING (
    reporter_id = auth.uid()
    OR public.forum_is_moderator(auth.uid())
  );

DROP POLICY IF EXISTS "forum_reports_mod_update" ON public.forum_reports;
CREATE POLICY "forum_reports_mod_update"
  ON public.forum_reports FOR UPDATE
  USING (public.forum_is_moderator(auth.uid()));

DROP POLICY IF EXISTS "forum_mod_actions_select" ON public.forum_moderation_actions;
CREATE POLICY "forum_mod_actions_select"
  ON public.forum_moderation_actions FOR SELECT
  USING (public.forum_is_moderator(auth.uid()));

DROP POLICY IF EXISTS "forum_mod_actions_insert" ON public.forum_moderation_actions;
CREATE POLICY "forum_mod_actions_insert"
  ON public.forum_moderation_actions FOR INSERT
  WITH CHECK (public.forum_is_moderator(auth.uid()) AND actor_id = auth.uid());

DROP POLICY IF EXISTS "forum_user_status_select_own" ON public.forum_user_status;
CREATE POLICY "forum_user_status_select_own"
  ON public.forum_user_status FOR SELECT
  USING (user_id = auth.uid() OR public.forum_is_moderator(auth.uid()));

DROP POLICY IF EXISTS "forum_user_status_mod" ON public.forum_user_status;
CREATE POLICY "forum_user_status_mod"
  ON public.forum_user_status FOR ALL
  USING (public.forum_is_moderator(auth.uid()))
  WITH CHECK (public.forum_is_moderator(auth.uid()));

DROP POLICY IF EXISTS "forum_notifications_own" ON public.forum_notifications;
CREATE POLICY "forum_notifications_own"
  ON public.forum_notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 13. Seed draft categories (FOR OWNER REVIEW before publish)
-- ---------------------------------------------------------------------------
INSERT INTO public.forum_categories (slug, title, description, sort_order, status, scope)
VALUES
  ('announcements', 'Announcements', 'Official CCDesigner / partner announcements. Moderators post; members read.', 10, 'draft', 'announcement'),
  ('curriculum-planning', 'Curriculum planning', 'Share schemes of work, sequencing and planning approaches.', 20, 'draft', 'public'),
  ('music', 'Music', 'Classroom music, ensembles, and music education practice.', 30, 'draft', 'public'),
  ('drama', 'Drama', 'Drama pedagogy, texts, and classroom practice.', 40, 'draft', 'public'),
  ('resources', 'Resources', 'Share and discuss teaching resources (no copyrighted file dumps).', 50, 'draft', 'public'),
  ('arts-orgs', 'Arts organisations', 'Partner organisations, projects and collaboration.', 60, 'draft', 'members'),
  ('technical-help', 'Technical help', 'CCDesigner product support and how-to questions.', 70, 'draft', 'public'),
  ('introductions', 'Introductions', 'Say hello and introduce your school or organisation.', 80, 'draft', 'public')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
  -- status intentionally NOT overwritten so published live categories stay published

COMMENT ON TABLE public.forum_reports IS
  'User reports. safeguarding reason sets is_safeguarding=true for priority handling.';
