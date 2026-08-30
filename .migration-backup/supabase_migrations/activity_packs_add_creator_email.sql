-- Add creator_email to activity_packs so creators only edit/delete their own packs.
-- Run in Supabase SQL Editor.

ALTER TABLE public.activity_packs
ADD COLUMN IF NOT EXISTS creator_email TEXT;

COMMENT ON COLUMN public.activity_packs.creator_email IS 'Email of the creator who owns this pack. NULL = legacy/admin-owned. Creators can only edit/delete packs where creator_email = their email.';

CREATE INDEX IF NOT EXISTS idx_activity_packs_creator_email ON public.activity_packs(creator_email);

-- RLS: creators can SELECT/INSERT/UPDATE/DELETE their own packs (creator_email = their email)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_packs' AND policyname = 'Creators can manage own packs') THEN
    CREATE POLICY "Creators can manage own packs"
      ON public.activity_packs FOR ALL
      USING (creator_email = current_setting('request.jwt.claims', true)::json->>'email')
      WITH CHECK (creator_email = current_setting('request.jwt.claims', true)::json->>'email');
  END IF;
END $$;
