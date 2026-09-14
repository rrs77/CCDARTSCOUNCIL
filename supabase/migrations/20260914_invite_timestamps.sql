-- Invite tracking for Settings → Users.
-- One-time setup links expire after 24 hours (see api/_inviteShared.js INVITE_TTL_MS).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.invite_sent_at IS
  'When the latest account-setup invitation was sent.';
COMMENT ON COLUMN public.profiles.invite_expires_at IS
  'When the latest account-setup invitation expires. Null means unknown / not invited.';
COMMENT ON COLUMN public.profiles.must_change_password IS
  'True until the user sets their own password via the invitation or reset link.';

CREATE INDEX IF NOT EXISTS idx_profiles_invite_expires_at
  ON public.profiles (invite_expires_at)
  WHERE invite_expires_at IS NOT NULL;
