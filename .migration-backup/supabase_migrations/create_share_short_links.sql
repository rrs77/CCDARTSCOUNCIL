-- Short URLs for lesson PDFs: /pdf/1 redirects to the current blob URL for lesson 1.
-- Run in Supabase SQL Editor. RLS allows anyone to read (redirect works without auth).

CREATE TABLE IF NOT EXISTS public.share_short_links (
  short_code TEXT NOT NULL PRIMARY KEY,
  blob_url TEXT NOT NULL,
  lesson_number TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.share_short_links IS 'Maps short codes (e.g. lesson number) to Vercel Blob PDF URLs. /pdf/:code redirects to blob_url.';

ALTER TABLE public.share_short_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read short links" ON public.share_short_links;
CREATE POLICY "Anyone can read short links"
  ON public.share_short_links FOR SELECT
  USING (true);

-- Inserts/updates are done by the generate-pdf API using the service role key (bypasses RLS).
