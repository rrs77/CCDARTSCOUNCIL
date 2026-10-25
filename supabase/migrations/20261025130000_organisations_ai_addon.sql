-- =============================================================================
-- AI add-on entitlement (extra-cost; independent of Free/Full plan and hub.paid)
-- Additive only. Do not run against live DB from agents without owner approval.
-- =============================================================================

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS ai_addon boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organisations.ai_addon IS
  'When true, the organisation has purchased the CCDesigner AI add-on (Flesh out, Whisper, etc.). Independent of Free/Full plan and organisations.paid (partner hub flag).';
