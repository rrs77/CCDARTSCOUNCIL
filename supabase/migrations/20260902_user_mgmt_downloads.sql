-- =============================================================================
-- CCDesigner: user management extensions + resource download tracking
-- Run in Supabase SQL Editor (or via CLI) AFTER deploying the new API routes.
-- Backward compatible with existing roles: admin, teacher, viewer, student,
-- superuser, creator.
-- =============================================================================

-- 1) Roles: add organisation (+ keep creator if already present)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'admin',
    'teacher',
    'viewer',
    'student',
    'superuser',
    'creator',
    'organisation'
  ));

-- 2) Profile extensions (consent, org scope, forced password change, anonymisation)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organisation_id TEXT,
  ADD COLUMN IF NOT EXISTS organisation_name TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS can_view_download_analytics BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymised_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS school_or_org TEXT;

COMMENT ON COLUMN public.profiles.organisation_id IS 'Optional org scope for Organisation role analytics.';
COMMENT ON COLUMN public.profiles.must_change_password IS 'True when admin set a temporary password; cleared after user changes it.';
COMMENT ON COLUMN public.profiles.privacy_policy_accepted_at IS 'When user accepted privacy notice (UK GDPR).';
COMMENT ON COLUMN public.profiles.marketing_consent IS 'Optional marketing emails; default false.';
COMMENT ON COLUMN public.profiles.anonymised_at IS 'Set when account PII was anonymised (soft-delete style).';

CREATE INDEX IF NOT EXISTS idx_profiles_organisation_id ON public.profiles (organisation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);

-- Ensure current_user_is_admin includes superuser (idempotent)
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
      AND role IN ('admin', 'superuser')
      AND COALESCE(status, 'active') <> 'suspended'
      AND anonymised_at IS NULL
  );
$$;

-- 3) Organisations (lightweight registry for scoped analytics)
CREATE TABLE IF NOT EXISTS public.organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  partner_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read organisations" ON public.organisations;
CREATE POLICY "Admins read organisations"
  ON public.organisations FOR SELECT
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Org members read own organisation" ON public.organisations;
CREATE POLICY "Org members read own organisation"
  ON public.organisations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.organisation_id = organisations.id
    )
  );

-- Seed Jazz North org (optional)
INSERT INTO public.organisations (id, name, partner_slug)
VALUES ('jazznorth', 'Jazz North', 'jazznorth')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, partner_slug = EXCLUDED.partner_slug;

-- 4) Resource registry (stable IDs; downloads never expose raw buttons to unlisted hosts)
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL DEFAULT 'pdf',
  partner_slug TEXT,
  collection_id TEXT,
  filename TEXT,
  -- Allow-listed absolute HTTPS URL (Rhythmstix / Supabase Storage / etc.)
  download_url TEXT NOT NULL,
  requires_auth BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  bytes INTEGER,
  related_audio_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_partner ON public.resources (partner_slug);
CREATE INDEX IF NOT EXISTS idx_resources_collection ON public.resources (collection_id);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read active resources" ON public.resources;
CREATE POLICY "Authenticated can read active resources"
  ON public.resources FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage resources" ON public.resources;
CREATE POLICY "Admins manage resources"
  ON public.resources FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- 5) Download events
CREATE TABLE IF NOT EXISTS public.download_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organisation_id TEXT,
  partner_slug TEXT,
  ip_hash TEXT,
  geo_country TEXT,
  geo_region TEXT,
  geo_city TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_events_resource ON public.download_events (resource_id);
CREATE INDEX IF NOT EXISTS idx_download_events_user ON public.download_events (user_id);
CREATE INDEX IF NOT EXISTS idx_download_events_created ON public.download_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_events_org ON public.download_events (organisation_id);
CREATE INDEX IF NOT EXISTS idx_download_events_partner ON public.download_events (partner_slug);

ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own downloads" ON public.download_events;
CREATE POLICY "Users read own downloads"
  ON public.download_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all downloads" ON public.download_events;
CREATE POLICY "Admins read all downloads"
  ON public.download_events FOR SELECT
  USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Org analytics read org downloads" ON public.download_events;
CREATE POLICY "Org analytics read org downloads"
  ON public.download_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organisation_id IS NOT NULL
        AND p.organisation_id = download_events.organisation_id
        AND (
          p.role = 'organisation'
          OR p.can_view_download_analytics = true
          OR p.role IN ('admin', 'superuser')
        )
        AND COALESCE(p.status, 'active') <> 'suspended'
    )
  );

-- Inserts only via service role (API). No INSERT policy for authenticated clients.

-- 6) Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  meta JSONB,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log (action);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.audit_log;
CREATE POLICY "Admins read audit log"
  ON public.audit_log FOR SELECT
  USING (public.current_user_is_admin());

-- 7) Seed Jazz North Learning Resources (placeholder allow-listed URLs)
-- Replace download_url after uploading files to Rhythmstix / Supabase Storage.
INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, collection_id,
  filename, download_url, requires_auth, bytes, related_audio_id
) VALUES
  (
    'jn-can-you-sing-activities',
    'Can You Sing Your Song? — Activities',
    'Activities PDF',
    'pdf',
    'jazznorth',
    'jn-can-you-sing-your-song',
    'jn-can-you-sing-activities.pdf',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-can-you-sing-activities.pdf',
    true,
    185704,
    'jn-can-you-sing-audio'
  ),
  (
    'jn-can-you-sing-piano-accomp',
    'Can You Sing Your Song? — Piano Accompaniment',
    'Score PDF',
    'pdf',
    'jazznorth',
    'jn-can-you-sing-your-song',
    'jn-can-you-sing-piano-accomp.pdf',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-can-you-sing-piano-accomp.pdf',
    true,
    59445,
    'jn-can-you-sing-audio'
  ),
  (
    'jn-hello-song-activities',
    'Hello Song — Activities',
    'Activities PDF',
    'pdf',
    'jazznorth',
    'jn-hello-song',
    'jn-hello-song-activities.pdf',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-hello-song-activities.pdf',
    true,
    108296,
    'jn-hello-song-audio'
  ),
  (
    'jn-hello-song-score',
    'Hello Song — Score',
    'Score PDF',
    'pdf',
    'jazznorth',
    'jn-hello-song',
    'jn-hello-song-score.pdf',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-hello-song-score.pdf',
    true,
    54569,
    'jn-hello-song-audio'
  ),
  (
    'jn-2-and-4-chant-activities',
    '2 and 4 Chant — Activities',
    'Activities PDF',
    'pdf',
    'jazznorth',
    'jn-2-and-4-chant',
    'jn-2-and-4-chant-activities.pdf',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-2-and-4-chant-activities.pdf',
    true,
    81223,
    'jn-2-and-4-chant-audio'
  ),
  (
    'jn-2-and-4-chant-score',
    '2 and 4 Chant — Score (Both Versions)',
    'Score PDF',
    'pdf',
    'jazznorth',
    'jn-2-and-4-chant',
    'jn-2-and-4-chant-score.pdf',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-2-and-4-chant-score.pdf',
    true,
    161864,
    'jn-2-and-4-chant-audio'
  ),
  (
    'jn-not-quite-jazz-improv-games',
    'Not Quite Jazz — Improvisation Games',
    'Improvisation guide',
    'pdf',
    'jazznorth',
    'jn-improvisation',
    'jn-not-quite-jazz-improv-games.pdf',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-not-quite-jazz-improv-games.pdf',
    true,
    213400,
    NULL
  ),
  (
    'jn-ways-into-improvisation',
    'Ways into Improvisation',
    'Improvisation guide',
    'pdf',
    'jazznorth',
    'jn-improvisation',
    'jn-ways-into-improvisation.pdf',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-ways-into-improvisation.pdf',
    true,
    405901,
    NULL
  ),
  (
    'jn-can-you-sing-audio',
    'Can You Sing Your Song? — Audio Files',
    'Audio ZIP (upload pending)',
    'zip',
    'jazznorth',
    'jn-can-you-sing-your-song',
    'jn-can-you-sing-audio.zip',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-can-you-sing-audio.zip',
    true,
    6790447,
    NULL
  ),
  (
    'jn-hello-song-audio',
    'Hello Song — Audio Files',
    'Audio ZIP (upload pending)',
    'zip',
    'jazznorth',
    'jn-hello-song',
    'jn-hello-song-audio.zip',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-hello-song-audio.zip',
    true,
    10447856,
    NULL
  ),
  (
    'jn-2-and-4-chant-audio',
    '2 and 4 Chant — Audio Files',
    'Audio ZIP (upload pending)',
    'zip',
    'jazznorth',
    'jn-2-and-4-chant',
    'jn-2-and-4-chant-audio.zip',
    'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-2-and-4-chant-audio.zip',
    true,
    6330833,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  collection_id = EXCLUDED.collection_id,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  bytes = EXCLUDED.bytes,
  related_audio_id = EXCLUDED.related_audio_id,
  updated_at = NOW();

-- Retention note (apply via cron / scheduled function later):
-- download_events older than 24 months may be aggregated then deleted (see docs/PRIVACY_DOWNLOAD_TRACKING.md).
