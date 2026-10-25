-- =============================================================================
-- Protect organisations.ai_addon from client UPDATE grants.
-- RLS alone is not enough: authenticated users may have table-wide UPDATE.
-- Additive only. Do not run against live DB from agents without owner approval.
-- =============================================================================
-- Note (kept intentional): ai_addon stays on public.organisations. Anon can read
-- active organisation rows, and the flag is not treated as a secret — it only
-- gates paid AI features server-side. Writes are restricted to is_super_admin()
-- or service_role via the trigger below.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.protect_organisations_ai_addon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  changing boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    changing := COALESCE(NEW.ai_addon, false) = true;
  ELSIF TG_OP = 'UPDATE' THEN
    changing := NEW.ai_addon IS DISTINCT FROM OLD.ai_addon;
  END IF;

  IF NOT changing THEN
    RETURN NEW;
  END IF;

  -- service_role (and non-JWT SQL as postgres) may manage the flag.
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'organisations.ai_addon can only be changed by a super admin'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_organisations_ai_addon ON public.organisations;
CREATE TRIGGER trg_protect_organisations_ai_addon
  BEFORE INSERT OR UPDATE ON public.organisations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_organisations_ai_addon();

COMMENT ON FUNCTION public.protect_organisations_ai_addon() IS
  'SECURITY INVOKER. Blocks INSERT/UPDATE that change organisations.ai_addon unless public.is_super_admin() or auth.role() = service_role. ai_addon remains readable on active org rows (not a secret).';

COMMENT ON COLUMN public.organisations.ai_addon IS
  'When true, the organisation has purchased the CCDesigner AI add-on (Flesh out, Whisper, etc.). Independent of Free/Full plan and organisations.paid. Readable on active organisation rows (not a secret); writable only via is_super_admin() / service_role (see protect_organisations_ai_addon).';
