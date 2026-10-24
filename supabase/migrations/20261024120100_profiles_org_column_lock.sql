-- H3 / file-access hardening: stop authenticated clients from updating
-- privileged profile columns (especially organisation_id) unless they are
-- a user manager. Self-service edits (display name, stars, password flags,
-- forum prefs) remain allowed via column grants.
--
-- Do NOT apply automatically to live DB from this agent — owner reviews first.
-- Safe to re-run.

-- 1) Drop blanket table UPDATE; replace with column-level grants.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
REVOKE UPDATE ON TABLE public.profiles FROM anon;

-- Self-service / preference columns used by the app (AccountMenu, stars,
-- password gates, ResetPasswordPage). Forum prefs also go through service role.
GRANT UPDATE (
  display_name,
  first_name,
  last_name,
  school_or_org,
  starred_activity_ids,
  starred_first_activity_categories,
  starred_first_activity_global,
  must_change_password,
  status,
  updated_at,
  privacy_policy_accepted_at,
  marketing_consent,
  marketing_consent_at,
  forum_email_notifications,
  forum_notify_replies,
  forum_notify_mentions
) ON TABLE public.profiles TO authenticated;

-- Admin UserManagement (EditUserModal) still updates privileged fields via the
-- authenticated role + RLS. Grant those columns, but the trigger below refuses
-- changes unless current_user_can_manage_users().
GRANT UPDATE (
  organisation_id,
  role,
  can_edit_activities,
  can_edit_lessons,
  can_manage_year_groups,
  can_manage_users,
  can_view_download_analytics,
  can_view_raw_ip,
  allowed_year_groups,
  admin_preset_categories,
  admin_preset_activity_pack_ids,
  forum_can_moderate,
  forum_can_manage_categories,
  forum_can_manage_settings,
  invite_sent_at,
  invite_expires_at
) ON TABLE public.profiles TO authenticated;

-- 2) Trigger: non-managers cannot change org / role / capability columns.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_can_manage_users() THEN
    RETURN NEW;
  END IF;

  -- Service role / SQL as postgres bypasses auth.uid(); allow those paths.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.organisation_id IS DISTINCT FROM OLD.organisation_id THEN
    RAISE EXCEPTION 'profiles.organisation_id cannot be changed by this user'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'profiles.role cannot be changed by this user'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.can_edit_activities IS DISTINCT FROM OLD.can_edit_activities
     OR NEW.can_edit_lessons IS DISTINCT FROM OLD.can_edit_lessons
     OR NEW.can_manage_year_groups IS DISTINCT FROM OLD.can_manage_year_groups
     OR NEW.can_manage_users IS DISTINCT FROM OLD.can_manage_users
     OR NEW.can_view_download_analytics IS DISTINCT FROM OLD.can_view_download_analytics
     OR NEW.can_view_raw_ip IS DISTINCT FROM OLD.can_view_raw_ip
     OR NEW.allowed_year_groups IS DISTINCT FROM OLD.allowed_year_groups
     OR NEW.admin_preset_categories IS DISTINCT FROM OLD.admin_preset_categories
     OR NEW.admin_preset_activity_pack_ids IS DISTINCT FROM OLD.admin_preset_activity_pack_ids
     OR NEW.forum_can_moderate IS DISTINCT FROM OLD.forum_can_moderate
     OR NEW.forum_can_manage_categories IS DISTINCT FROM OLD.forum_can_manage_categories
     OR NEW.forum_can_manage_settings IS DISTINCT FROM OLD.forum_can_manage_settings
  THEN
    RAISE EXCEPTION 'profiles privileged columns cannot be changed by this user'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

COMMENT ON FUNCTION public.protect_profile_privileged_columns() IS
  'Blocks non-managers from changing organisation_id, role, and capability columns on profiles.';
