-- =============================================================================
-- Lesson plan attachments (DreamHost-backed + optional cloud-linked)
-- Paths: <userId>/<lessonSeg>/<uuid>.<ext>
-- status: pending | ready | linked | failed
-- storage_kind: dreamhost | link
-- Depends on planning shares helpers when present (shared read). Additive only.
--
-- Writes go through the service-role server API only (REVOKE INSERT/UPDATE/DELETE
-- from authenticated). Authenticated clients may SELECT own rows + shared reads.
--
-- File proxy (/api/lesson-attachments/file/...): authorize via owner match OR
-- can_read_planning_resource on a planning_share_resources row for this lesson
-- with r.owner_id = lesson_attachments.owner_id (same check as shared-read RLS).
--
-- Google Picker: VITE_GOOGLE_API_KEY / GOOGLE_API_KEY must be restricted by
-- HTTP referrer AND API (Drive/Picker only) — Rob sets in Google Cloud Console.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  organisation_id text,
  lesson_key text NOT NULL,
  storage_path text UNIQUE,
  storage_kind text NOT NULL DEFAULT 'dreamhost'
    CHECK (storage_kind IN ('dreamhost', 'link')),
  file_name text NOT NULL DEFAULT '',
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  kind text NOT NULL CHECK (kind IN ('image', 'video', 'document', 'audio')),
  byte_size bigint NOT NULL DEFAULT 0 CHECK (byte_size >= 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'linked', 'failed')),
  provider text,
  provider_file_id text,
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_attachments_owner_idx
  ON public.lesson_attachments (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lesson_attachments_lesson_idx
  ON public.lesson_attachments (lesson_key, status);

ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

-- Owner SELECT only (writes via service role)
DROP POLICY IF EXISTS lesson_attachments_owner_all ON public.lesson_attachments;
DROP POLICY IF EXISTS lesson_attachments_owner_select ON public.lesson_attachments;
CREATE POLICY lesson_attachments_owner_select
  ON public.lesson_attachments
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.status, 'active') IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

-- Shared readers (when planning_shares migration is applied).
-- Require r.owner_id = lesson_attachments.owner_id so a share for lesson_key
-- cannot leak another owner's attachments with the same key.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'can_read_planning_resource'
  ) THEN
    EXECUTE $pol$
      DROP POLICY IF EXISTS lesson_attachments_shared_read ON public.lesson_attachments;
      CREATE POLICY lesson_attachments_shared_read
        ON public.lesson_attachments
        FOR SELECT
        TO authenticated
        USING (
          status IN ('ready', 'linked')
          AND EXISTS (
            SELECT 1
            FROM public.planning_share_resources r
            WHERE r.resource_type = 'lesson'
              AND r.resource_id = lesson_attachments.lesson_key
              AND r.owner_id = lesson_attachments.owner_id
              AND public.can_read_planning_resource(r.id)
          )
        );
    $pol$;
  END IF;
END $$;

REVOKE ALL ON public.lesson_attachments FROM PUBLIC;
REVOKE ALL ON public.lesson_attachments FROM anon;
REVOKE ALL ON public.lesson_attachments FROM authenticated;
-- Reads via RLS policies; all writes via service role (server API).
GRANT SELECT ON public.lesson_attachments TO authenticated;
