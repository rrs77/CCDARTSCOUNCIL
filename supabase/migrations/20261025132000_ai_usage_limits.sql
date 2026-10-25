-- =============================================================================
-- Durable AI usage limits (per-user hourly + per-organisation daily).
-- Complements in-memory IP rate limits on flesh-out / transcribe routes.
-- Additive only. Do not run against live DB from agents without owner approval.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  organisation_id text,
  route text NOT NULL CHECK (route IN ('flesh-out', 'transcribe')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_route_created
  ON public.ai_usage_events (user_id, route, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_org_route_created
  ON public.ai_usage_events (organisation_id, route, created_at DESC)
  WHERE organisation_id IS NOT NULL;

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_usage_events_service_all ON public.ai_usage_events;
-- No authenticated policies: only service_role (bypass) / postgres manage rows.
-- Routes claim via SECURITY DEFINER RPC below.

COMMENT ON TABLE public.ai_usage_events IS
  'Append-only AI call events for per-user hourly and per-org daily caps. Written only via claim_ai_usage (service_role).';

CREATE OR REPLACE FUNCTION public.claim_ai_usage(
  p_user_id uuid,
  p_organisation_id text,
  p_route text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_limit int;
  v_org_limit int;
  v_user_count int;
  v_org_count int;
BEGIN
  IF p_user_id IS NULL OR p_route IS NULL OR p_route NOT IN ('flesh-out', 'transcribe') THEN
    RETURN jsonb_build_object('allowed', false, 'scope', 'invalid');
  END IF;

  IF p_route = 'flesh-out' THEN
    v_user_limit := 30;
    v_org_limit := 200;
  ELSE
    v_user_limit := 10;
    v_org_limit := 50;
  END IF;

  SELECT COUNT(*)::int INTO v_user_count
  FROM public.ai_usage_events
  WHERE user_id = p_user_id
    AND route = p_route
    AND created_at > now() - interval '1 hour';

  IF v_user_count >= v_user_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'scope', 'user',
      'count', v_user_count,
      'limit', v_user_limit
    );
  END IF;

  IF p_organisation_id IS NOT NULL AND length(trim(p_organisation_id)) > 0 THEN
    SELECT COUNT(*)::int INTO v_org_count
    FROM public.ai_usage_events
    WHERE organisation_id = trim(p_organisation_id)
      AND route = p_route
      AND created_at > now() - interval '1 day';

    IF v_org_count >= v_org_limit THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'scope', 'org',
        'count', v_org_count,
        'limit', v_org_limit
      );
    END IF;
  END IF;

  INSERT INTO public.ai_usage_events (user_id, organisation_id, route)
  VALUES (
    p_user_id,
    NULLIF(trim(COALESCE(p_organisation_id, '')), ''),
    p_route
  );

  RETURN jsonb_build_object(
    'allowed', true,
    'scope', 'ok',
    'userCount', v_user_count + 1,
    'orgCount', COALESCE(v_org_count, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ai_usage(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_ai_usage(uuid, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_usage(uuid, text, text) TO service_role;

COMMENT ON FUNCTION public.claim_ai_usage(uuid, text, text) IS
  'SECURITY DEFINER. Claims one AI call: flesh-out 30/user/hour + 200/org/day; transcribe 10/user/hour + 50/org/day. service_role EXECUTE only.';
