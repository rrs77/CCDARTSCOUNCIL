-- Year-group access requests: teachers with NULL/empty allowed_year_groups can
-- ask org admins for assignment. Never grants or mutates allowed_year_groups.
-- Rate limit (once / 24h / user) is enforced by the authenticated API using
-- year_group_access_requests.created_at. In-app rows go to app_notifications.

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  organisation_id text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_notifications_user_created
  ON public.app_notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_notifications_org_created
  ON public.app_notifications (organisation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.year_group_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  organisation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_year_group_access_requests_requester_created
  ON public.year_group_access_requests (requester_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_year_group_access_requests_org_created
  ON public.year_group_access_requests (organisation_id, created_at DESC);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.year_group_access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_notifications_select_own ON public.app_notifications;
CREATE POLICY app_notifications_select_own
  ON public.app_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS year_group_access_requests_select_own ON public.year_group_access_requests;
CREATE POLICY year_group_access_requests_select_own
  ON public.year_group_access_requests
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid());

-- Client roles cannot write; API uses service role.
REVOKE ALL ON public.app_notifications FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.year_group_access_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.app_notifications TO authenticated;
GRANT SELECT ON public.year_group_access_requests TO authenticated;
GRANT ALL ON public.app_notifications TO service_role;
GRANT ALL ON public.year_group_access_requests TO service_role;
