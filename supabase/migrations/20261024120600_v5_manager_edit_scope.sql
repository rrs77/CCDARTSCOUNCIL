-- V5: Non-super-admin managers may edit only users in their own organisation,
-- cannot change organisation_id to another org, and cannot grant roles at/above
-- their own rank or any SUPER_ADMIN_ROLES (super_admin / superuser).
-- Super-admins remain unrestricted. Non-managers keep V4 status rules.
--
-- Do NOT apply automatically to live DB — owner reviews first.
-- Idempotent / safe to re-run.
-- Depends on: is_super_admin(), current_user_can_manage_users(), V4 trigger.

CREATE OR REPLACE FUNCTION public.profile_role_rank(p_role TEXT)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(COALESCE(p_role, ''))
    WHEN 'student' THEN 0
    WHEN 'viewer' THEN 0
    WHEN 'teacher' THEN 1
    WHEN 'creator' THEN 1
    WHEN 'organisation' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'superuser' THEN 4
    WHEN 'super_admin' THEN 4
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor public.profiles%ROWTYPE;
BEGIN
  -- Service role / SQL as postgres bypasses auth.uid(); allow those paths.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Super-admins: unrestricted.
  IF public.is_super_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Non-super-admin managers: org-scoped + role grant limits (V5).
  IF public.current_user_can_manage_users() THEN
    SELECT * INTO actor FROM public.profiles WHERE id = auth.uid();
    IF NOT FOUND THEN
      RAISE EXCEPTION 'profiles manager actor not found'
        USING ERRCODE = '42501';
    END IF;

    IF actor.organisation_id IS NULL
       OR length(trim(actor.organisation_id)) = 0
       OR OLD.organisation_id IS NULL
       OR length(trim(OLD.organisation_id)) = 0
       OR trim(actor.organisation_id) <> trim(OLD.organisation_id) THEN
      RAISE EXCEPTION 'managers may only edit users in their own organisation'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.organisation_id IS DISTINCT FROM OLD.organisation_id THEN
      IF NEW.organisation_id IS NULL
         OR length(trim(NEW.organisation_id)) = 0
         OR trim(NEW.organisation_id) <> trim(actor.organisation_id) THEN
        RAISE EXCEPTION 'managers cannot change organisation_id to another organisation'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF lower(COALESCE(NEW.role, '')) IN ('super_admin', 'superuser') THEN
        RAISE EXCEPTION 'managers cannot grant super-admin roles'
          USING ERRCODE = '42501';
      END IF;
      IF public.profile_role_rank(NEW.role) >= public.profile_role_rank(actor.role) THEN
        RAISE EXCEPTION 'managers cannot grant roles at or above their own'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- Non-managers: privileged columns locked.
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
  'V4 status lock + V5 org-scoped manager edits and role grant limits.';
