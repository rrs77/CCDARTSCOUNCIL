-- =============================================================================
-- Interactive Lesson Viewer — media Storage bucket + RLS
-- Client uploads directly via Supabase JS (no new serverless functions).
-- Path convention: {user_id}/{lesson_id|shared}/{filename}
-- Idempotent.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interactive-lessons',
  'interactive-lessons',
  true,
  104857600, -- 100 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read (classroom player needs anonymous/authenticated media URLs)
DROP POLICY IF EXISTS ilv_storage_public_read ON storage.objects;
CREATE POLICY ilv_storage_public_read ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'interactive-lessons');

-- Owners (and editors) can upload under their own user id prefix
DROP POLICY IF EXISTS ilv_storage_insert_own ON storage.objects;
CREATE POLICY ilv_storage_insert_own ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'interactive-lessons'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.can_edit_interactive_lessons(auth.uid())
  );

DROP POLICY IF EXISTS ilv_storage_update_own ON storage.objects;
CREATE POLICY ilv_storage_update_own ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'interactive-lessons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'interactive-lessons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS ilv_storage_delete_own ON storage.objects;
CREATE POLICY ilv_storage_delete_own ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'interactive-lessons'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.current_user_is_admin()
    )
  );
