-- Add complete_by (upload token exp + 30 minutes) for upload-complete grace.
-- REVOKE client roles from direct_upload_intents. Service role only.
-- Safe to re-run. Do not apply to live DB until the owner reviews.

ALTER TABLE public.direct_upload_intents
  ADD COLUMN IF NOT EXISTS complete_by TIMESTAMPTZ;

UPDATE public.direct_upload_intents
SET complete_by = expires_at + interval '30 minutes'
WHERE complete_by IS NULL;

ALTER TABLE public.direct_upload_intents
  ALTER COLUMN complete_by SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_direct_upload_intents_complete_by
  ON public.direct_upload_intents (complete_by)
  WHERE consumed_at IS NULL;

REVOKE ALL ON TABLE public.direct_upload_intents FROM anon, authenticated;

COMMENT ON COLUMN public.direct_upload_intents.complete_by IS
  'upload-complete deadline (expires_at + 30m). Upload token exp still gates PHP write.';

COMMENT ON TABLE public.direct_upload_intents IS
  'Minted by POST /api/files/upload-token; probed then consumed by upload-complete. Service-role only.';
