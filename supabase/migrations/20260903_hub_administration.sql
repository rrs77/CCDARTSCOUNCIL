-- =============================================================================
-- Hub administration (extends 20260902_user_mgmt_downloads.sql)
-- Uses TEXT organisation ids (e.g. 'jazznorth') already seeded.
-- Adds: super_admin, hub_memberships, hub pages, resource lifecycle, audit scope.
-- Idempotent. Does not duplicate Jazz North resource rows or create a second login.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. System role: super_admin (keep legacy superuser)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'admin', 'teacher', 'viewer', 'student', 'superuser', 'creator',
    'organisation', 'super_admin'
  ));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_view_raw_ip BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_super_admin(uid UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid
      AND role IN ('super_admin', 'superuser')
      AND COALESCE(status, 'active') = 'active'
      AND anonymised_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superuser', 'super_admin')
      AND COALESCE(status, 'active') <> 'suspended'
      AND anonymised_at IS NULL
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Extend organisations for hub admin (keep TEXT id)
-- ---------------------------------------------------------------------------
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS site_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_src TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT,
  ADD COLUMN IF NOT EXISTS accent_color TEXT,
  ADD COLUMN IF NOT EXISTS logo_invert BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS logo_on_plate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS logo_panel_color TEXT,
  ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS interactive BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.organisations
SET
  slug = COALESCE(NULLIF(slug, ''), partner_slug, id),
  display_name = COALESCE(NULLIF(display_name, ''), name),
  short_name = COALESCE(NULLIF(short_name, ''), name)
WHERE true;

DO $$
BEGIN
  ALTER TABLE public.organisations
    ADD CONSTRAINT organisations_status_check
    CHECK (status IN ('active', 'draft', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organisations_slug_unique
  ON public.organisations (slug);

-- Jazz North hub branding
UPDATE public.organisations
SET
  slug = 'jazznorth',
  display_name = 'Jazz North',
  short_name = 'Jazz North',
  site_url = 'https://www.jazznorth.org/',
  logo_src = '/partners/jazz-north.png',
  primary_color = '#1A0A14',
  accent_color = '#FF53B6',
  logo_on_plate = true,
  logo_panel_color = '#FFFFFF',
  paid = true,
  interactive = true,
  status = 'active',
  aliases = ARRAY['jazz-north', 'jn'],
  partner_slug = 'jazznorth',
  name = 'Jazz North',
  updated_at = NOW()
WHERE id = 'jazznorth';

INSERT INTO public.organisations (
  id, name, partner_slug, slug, display_name, short_name, site_url, logo_src,
  primary_color, accent_color, logo_on_plate, logo_panel_color, paid, interactive, status, aliases
) VALUES (
  'jazznorth', 'Jazz North', 'jazznorth', 'jazznorth', 'Jazz North', 'Jazz North',
  'https://www.jazznorth.org/', '/partners/jazz-north.png',
  '#1A0A14', '#FF53B6', true, '#FFFFFF', true, true, 'active', ARRAY['jazz-north', 'jn']
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Hub memberships (many-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hub_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK (role IN ('hub_viewer', 'hub_editor', 'hub_publisher', 'hub_administrator')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_hub_memberships_user ON public.hub_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_hub_memberships_org ON public.hub_memberships(organisation_id);

CREATE OR REPLACE FUNCTION public.hub_role_rank(r TEXT)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE r
    WHEN 'hub_viewer' THEN 1
    WHEN 'hub_editor' THEN 2
    WHEN 'hub_publisher' THEN 3
    WHEN 'hub_administrator' THEN 4
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.user_hub_role(p_org TEXT, p_user UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT CASE
    WHEN public.is_super_admin(p_user) THEN 'hub_administrator'
    ELSE (
      SELECT m.role FROM public.hub_memberships m
      WHERE m.organisation_id = p_org AND m.user_id = p_user
      LIMIT 1
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_hub_role(
  p_org TEXT, p_min_role TEXT, p_user UUID DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT public.hub_role_rank(public.user_hub_role(p_org, p_user))
       >= public.hub_role_rank(p_min_role);
$$;

ALTER TABLE public.hub_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own memberships" ON public.hub_memberships;
CREATE POLICY "Members read own memberships"
  ON public.hub_memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR public.user_has_hub_role(organisation_id, 'hub_administrator')
  );

DROP POLICY IF EXISTS "Hub admins manage memberships" ON public.hub_memberships;
CREATE POLICY "Hub admins manage memberships"
  ON public.hub_memberships FOR ALL
  USING (
    public.is_super_admin()
    OR public.user_has_hub_role(organisation_id, 'hub_administrator')
  )
  WITH CHECK (
    public.is_super_admin()
    OR public.user_has_hub_role(organisation_id, 'hub_administrator')
  );

-- ---------------------------------------------------------------------------
-- 4. Hub pages + revisions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hub_pages (
  organisation_id TEXT PRIMARY KEY REFERENCES public.organisations(id) ON DELETE CASCADE,
  tagline TEXT,
  description TEXT[] DEFAULT '{}',
  intro_html TEXT DEFAULT '',
  headings JSONB NOT NULL DEFAULT '{}'::jsonb,
  featured JSONB NOT NULL DEFAULT '{}'::jsonb,
  packs JSONB NOT NULL DEFAULT '[]'::jsonb,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  draft_content JSONB,
  published_revision INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hub_page_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  revision INT NOT NULL,
  snapshot JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, revision)
);

ALTER TABLE public.hub_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_page_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read published hub pages" ON public.hub_pages;
CREATE POLICY "Read published hub pages"
  ON public.hub_pages FOR SELECT
  USING (
    published_at IS NOT NULL
    OR public.is_super_admin()
    OR public.user_has_hub_role(organisation_id, 'hub_viewer')
  );

DROP POLICY IF EXISTS "Editors update hub pages" ON public.hub_pages;
CREATE POLICY "Editors update hub pages"
  ON public.hub_pages FOR ALL
  USING (
    public.is_super_admin()
    OR public.user_has_hub_role(organisation_id, 'hub_editor')
  )
  WITH CHECK (
    public.is_super_admin()
    OR public.user_has_hub_role(organisation_id, 'hub_editor')
  );

DROP POLICY IF EXISTS "Hub page revisions read" ON public.hub_page_revisions;
CREATE POLICY "Hub page revisions read"
  ON public.hub_page_revisions FOR SELECT
  USING (
    public.is_super_admin()
    OR public.user_has_hub_role(organisation_id, 'hub_editor')
  );

INSERT INTO public.hub_pages (
  organisation_id, tagline, description, headings, featured, packs, gallery, contact, published_at, published_revision
) VALUES (
  'jazznorth',
  'Strategic development agency for jazz in the North',
  ARRAY[
    'Jazz North is the strategic development agency for jazz in the North of England — Artist Development, Sector Support and Learning & Participation, including free classroom improvisation resources, the Playlist Project, Jazz Camp for Girls and Educators’ Forums.',
    'This hub follows the premium Partner Hub template: Add to basket (demo) plus showcase lessons that seed Activity Library activities and Lesson Library plans. Official downloads stay on jazznorth.org (Learning Resources Area account).'
  ],
  jsonb_build_object(
    'featuredEyebrow', 'Featured · Learning & Participation',
    'featuredTitle', 'Learning Resources Area — Improvisation for every classroom',
    'resourcesHeading', 'Learning Resources Area packs'
  ),
  jsonb_build_object(
    'title', 'Learning Resources Area — Improvisation for every classroom',
    'href', 'https://www.jazznorth.org/learning-resources-area',
    'description', 'Free downloadable pathways for curriculum teachers (KS1–4), instrumental tutors and lifetime learners.'
  ),
  jsonb_build_array(
    jsonb_build_object('id', 'mr-big', 'title', 'Mr Big scheme of work', 'meta', 'KS1 · Active listening · Optional PSHE', 'href', 'https://www.jazznorth.org/mr-big-scheme-of-work'),
    jsonb_build_object('id', 'playlist', 'title', 'Playlist Project — Milestones', 'meta', 'KS2 · Listening pathway', 'href', 'https://www.jazznorth.org/playlist-project'),
    jsonb_build_object('id', 'jazz-camp', 'title', 'Jazz Camp for Girls', 'meta', 'Learning & participation', 'href', 'https://www.jazznorth.org/jazz-camp-for-girls'),
    jsonb_build_object('id', 'educators', 'title', 'Educators’ Forum', 'meta', 'Termly online CPD', 'href', 'https://www.jazznorth.org/news/educators-forum-june-2026'),
    jsonb_build_object('id', 'northern-line', 'title', 'Northern Line', 'meta', 'Live talent development', 'href', 'https://www.jazznorth.org/northern-line'),
    jsonb_build_object('id', 'new-northern', 'title', 'New Northern', 'meta', 'Promoter bursary', 'href', 'https://www.jazznorth.org/new-northern')
  ),
  jsonb_build_array(
    jsonb_build_object('title', 'Jazz Camp for Girls', 'href', 'https://www.jazznorth.org/jazz-camp-for-girls', 'kind', 'Learning'),
    jsonb_build_object('title', 'Playlist Project', 'href', 'https://www.jazznorth.org/playlist-project', 'kind', 'KS2'),
    jsonb_build_object('title', 'Northern Line', 'href', 'https://www.jazznorth.org/northern-line', 'kind', 'Artists')
  ),
  jsonb_build_object('href', 'https://www.jazznorth.org/contact', 'label', 'Contact Jazz North'),
  NOW(),
  1
)
ON CONFLICT (organisation_id) DO UPDATE SET
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  headings = EXCLUDED.headings,
  featured = EXCLUDED.featured,
  packs = EXCLUDED.packs,
  gallery = EXCLUDED.gallery,
  contact = EXCLUDED.contact,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 5. Extend resources for hub lifecycle (keep download_url)
-- ---------------------------------------------------------------------------
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS organisation_id TEXT REFERENCES public.organisations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pricing_note TEXT,
  ADD COLUMN IF NOT EXISTS age_range TEXT,
  ADD COLUMN IF NOT EXISTS key_stages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS url_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS url_last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS url_check_warning TEXT,
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unpublished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_status_check;
  ALTER TABLE public.resources
    ADD CONSTRAINT resources_status_check
    CHECK (status IN ('draft', 'published', 'unpublished', 'archived'));
EXCEPTION WHEN others THEN NULL;
END $$;

UPDATE public.resources
SET
  organisation_id = COALESCE(organisation_id, partner_slug, 'jazznorth'),
  status = COALESCE(status, CASE WHEN is_active THEN 'published' ELSE 'unpublished' END),
  published_at = COALESCE(published_at, CASE WHEN COALESCE(is_active, true) THEN NOW() ELSE NULL END)
WHERE partner_slug = 'jazznorth' OR organisation_id IS NULL;

CREATE TABLE IF NOT EXISTS public.resource_collections (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.resource_collections (id, organisation_id, title, description, sort_order) VALUES
  ('jn-can-you-sing-your-song', 'jazznorth', 'Can You Sing Your Song?', 'Activities, piano accompaniment, and supporting audio.', 1),
  ('jn-hello-song', 'jazznorth', 'Hello Song', 'Activities, score, and supporting audio.', 2),
  ('jn-2-and-4-chant', 'jazznorth', '2 and 4 Chant', 'Activities, both score versions, and supporting audio.', 3),
  ('jn-improvisation', 'jazznorth', 'Improvisation', 'Improvisation games and ways-into-improvisation guides.', 4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  organisation_id = EXCLUDED.organisation_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS public.resource_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hub_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_ref TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'unpublished', 'archived')),
  sort_order INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hub_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id TEXT NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'logo', 'video', 'other')),
  external_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.hub_activities (organisation_id, title, description, activity_ref, status, sort_order, metadata)
SELECT 'jazznorth', v.title, v.description, v.ref, 'published', v.sort_order, v.meta::jsonb
FROM (VALUES
  ('Mr Big showcase lesson', 'KS1 active listening showcase', 'jn-mr-big', 1, '{"seed":"mr-big"}'),
  ('Playlist Project milestones', 'KS2 listening pathway showcase', 'jn-playlist', 2, '{"seed":"playlist"}')
) AS v(title, description, ref, sort_order, meta)
WHERE NOT EXISTS (
  SELECT 1 FROM public.hub_activities a
  WHERE a.organisation_id = 'jazznorth' AND a.activity_ref = v.ref
);

INSERT INTO public.hub_media (organisation_id, title, media_type, external_url, alt_text, sort_order)
SELECT 'jazznorth', 'Jazz North logo', 'logo', '/partners/jazz-north.png', 'Jazz North', 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.hub_media m WHERE m.organisation_id = 'jazznorth' AND m.media_type = 'logo'
);

-- RLS extensions for resources (hub editors)
DROP POLICY IF EXISTS "Editors manage hub resources" ON public.resources;
CREATE POLICY "Editors manage hub resources"
  ON public.resources FOR ALL
  USING (
    public.is_super_admin()
    OR (organisation_id IS NOT NULL AND public.user_has_hub_role(organisation_id, 'hub_editor'))
  )
  WITH CHECK (
    public.is_super_admin()
    OR (organisation_id IS NOT NULL AND public.user_has_hub_role(organisation_id, 'hub_editor'))
  );

DROP POLICY IF EXISTS "Read published hub resources" ON public.resources;
CREATE POLICY "Read published hub resources"
  ON public.resources FOR SELECT
  USING (
    status = 'published'
    OR public.is_super_admin()
    OR (organisation_id IS NOT NULL AND public.user_has_hub_role(organisation_id, 'hub_viewer'))
  );

ALTER TABLE public.resource_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hub editors collections" ON public.resource_collections;
CREATE POLICY "Hub editors collections"
  ON public.resource_collections FOR ALL
  USING (
    public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_editor')
  )
  WITH CHECK (
    public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_editor')
  );

DROP POLICY IF EXISTS "Read collections" ON public.resource_collections;
CREATE POLICY "Read collections"
  ON public.resource_collections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Hub editors activities" ON public.hub_activities;
CREATE POLICY "Hub editors activities"
  ON public.hub_activities FOR ALL
  USING (
    public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_editor')
  )
  WITH CHECK (
    public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_editor')
  );

DROP POLICY IF EXISTS "Read published activities" ON public.hub_activities;
CREATE POLICY "Read published activities"
  ON public.hub_activities FOR SELECT
  USING (
    status = 'published'
    OR public.is_super_admin()
    OR public.user_has_hub_role(organisation_id, 'hub_viewer')
  );

DROP POLICY IF EXISTS "Hub media all" ON public.hub_media;
CREATE POLICY "Hub media all"
  ON public.hub_media FOR ALL
  USING (
    public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_editor')
  )
  WITH CHECK (
    public.is_super_admin() OR public.user_has_hub_role(organisation_id, 'hub_editor')
  );

DROP POLICY IF EXISTS "Read hub media" ON public.hub_media;
CREATE POLICY "Read hub media"
  ON public.hub_media FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- 6. Audit log + download_events: hub scope column
-- ---------------------------------------------------------------------------
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS organisation_id TEXT REFERENCES public.organisations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_org ON public.audit_log(organisation_id, created_at DESC);

DROP POLICY IF EXISTS "Hub admins read org audit" ON public.audit_log;
CREATE POLICY "Hub admins read org audit"
  ON public.audit_log FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      organisation_id IS NOT NULL
      AND public.user_has_hub_role(organisation_id, 'hub_administrator')
    )
  );

DROP POLICY IF EXISTS "Hub admins read org downloads" ON public.download_events;
CREATE POLICY "Hub admins read org downloads"
  ON public.download_events FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      organisation_id IS NOT NULL
      AND public.user_has_hub_role(organisation_id, 'hub_administrator')
    )
  );

-- Org list readable by hub members / public active
DROP POLICY IF EXISTS "Anyone can read active organisations" ON public.organisations;
CREATE POLICY "Anyone can read active organisations"
  ON public.organisations FOR SELECT
  USING (
    status = 'active'
    OR public.is_super_admin()
    OR public.user_has_hub_role(id, 'hub_viewer')
  );

DROP POLICY IF EXISTS "Super admins manage organisations" ON public.organisations;
CREATE POLICY "Super admins manage organisations"
  ON public.organisations FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- 7. Protect last active super_admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_last_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE remaining INT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role IN ('super_admin', 'superuser')
       AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.status = 'suspended' OR NEW.anonymised_at IS NOT NULL)
    THEN
      SELECT COUNT(*) INTO remaining FROM public.profiles
      WHERE id <> OLD.id
        AND role IN ('super_admin', 'superuser')
        AND COALESCE(status, 'active') = 'active'
        AND anonymised_at IS NULL;
      IF remaining < 1 THEN
        RAISE EXCEPTION 'Cannot remove or demote the last active super_admin';
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.role IN ('super_admin', 'superuser') THEN
      SELECT COUNT(*) INTO remaining FROM public.profiles
      WHERE id <> OLD.id
        AND role IN ('super_admin', 'superuser')
        AND COALESCE(status, 'active') = 'active'
        AND anonymised_at IS NULL;
      IF remaining < 1 THEN
        RAISE EXCEPTION 'Cannot delete the last active super_admin';
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_last_super_admin ON public.profiles;
CREATE TRIGGER trg_protect_last_super_admin
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_last_super_admin();

-- ---------------------------------------------------------------------------
-- 8. Idempotent super_admin grant (email checked ONLY in this migration)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  target_id UUID;
  normalised TEXT := lower(trim('rob.reichstorer@gmail.com'));
BEGIN
  SELECT p.id INTO target_id
  FROM public.profiles p
  WHERE lower(trim(COALESCE(p.email, ''))) = normalised
  LIMIT 1;

  IF target_id IS NULL THEN
    SELECT u.id INTO target_id
    FROM auth.users u
    WHERE lower(trim(COALESCE(u.email, ''))) = normalised
    LIMIT 1;
  END IF;

  IF target_id IS NULL THEN
    RAISE NOTICE 'hub_administration: no user for % — super_admin not assigned', normalised;
  ELSE
    UPDATE public.profiles
    SET
      role = 'super_admin',
      status = COALESCE(NULLIF(status, 'suspended'), 'active'),
      can_manage_users = true,
      can_view_download_analytics = true,
      updated_at = NOW()
    WHERE id = target_id;
    RAISE NOTICE 'hub_administration: super_admin assigned to %', target_id;
  END IF;
END $$;
