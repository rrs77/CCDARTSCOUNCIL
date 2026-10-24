-- =============================================================================
-- Lesson plan attachments (DreamHost-backed + optional cloud-linked)
-- Paths: <userId>/<lessonSeg>/<uuid>.<ext>
-- status: pending | ready | linked | failed
-- storage_kind: dreamhost | link
-- Depends on planning shares helpers when present (shared read). Additive only.
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

DROP POLICY IF EXISTS lesson_attachments_owner_all ON public.lesson_attachments;
CREATE POLICY lesson_attachments_owner_all
  ON public.lesson_attachments
  FOR ALL
  TO authenticated
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.status, 'active') IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  )
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.status, 'active') IS DISTINCT FROM 'suspended'
        AND p.anonymised_at IS NULL
    )
  );

-- Shared readers (when planning_shares migration is applied)
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
              AND public.can_read_planning_resource(r.id)
          )
        );
    $pol$;
  END IF;
END $$;

REVOKE ALL ON public.lesson_attachments FROM PUBLIC;
REVOKE ALL ON public.lesson_attachments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_attachments TO authenticated;
