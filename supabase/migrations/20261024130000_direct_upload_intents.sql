-- Single-use nonces for direct-to-DreamHost signed upload tokens.
-- Service-role only (no client RLS policies). Do not apply until owner reviews.

CREATE TABLE IF NOT EXISTS public.direct_upload_intents (
  nonce UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  organisation_id TEXT,
  storage_path TEXT NOT NULL,
  max_bytes INTEGER NOT NULL CHECK (max_bytes > 0 AND max_bytes <= 104857600),
  visibility TEXT NOT NULL DEFAULT 'org'
    CHECK (visibility IN ('org', 'private', 'licensed')),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_upload_intents_user_expires
  ON public.direct_upload_intents (user_id, expires_at);

ALTER TABLE public.direct_upload_intents ENABLE ROW LEVEL SECURITY;

-- No policies: anon/authenticated cannot read or write. Service role bypasses RLS.

COMMENT ON TABLE public.direct_upload_intents IS
  'Minted by POST /api/files/upload-token; consumed by POST /api/files/upload-complete after PHP exclusive write.';
