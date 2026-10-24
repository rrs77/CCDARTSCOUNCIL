-- V4: profiles.status is owner-updatable for invite activation, but a suspended
-- user must not self-reactivate. Non-managers may only change invited/pending
-- → active; any change from suspended raises.
-- Keeps AccountMenu / ForcePasswordChangeGate / ResetPasswordPage working for
-- invited users setting status to active after password change.
--
-- Do NOT apply automatically to live DB — owner reviews first.
-- Idempotent / safe to re-run.
-- Depends on: protect_profile_privileged_columns from 20261024_profiles_org_column_lock.sql

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / SQL as postgres bypasses auth.uid(); allow those paths.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Managers: still unrestricted here (V5 tightens non-super-admin managers).
  IF public.current_user_can_manage_users() THEN
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

  -- V4: status self-service — invited/pending → active only; never from suspended.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF COALESCE(OLD.status, '') = 'suspended' THEN
      RAISE EXCEPTION 'profiles.status cannot be changed from suspended by this user'
        USING ERRCODE = '42501';
    END IF;
    IF NOT (
      COALESCE(OLD.status, '') IN ('invited', 'pending')
      AND NEW.status = 'active'
    ) THEN
      RAISE EXCEPTION 'profiles.status may only change from invited/pending to active for this user'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_profile_privileged_columns() IS
  'Blocks non-managers from privileged column changes; V4 limits status self-updates.';
