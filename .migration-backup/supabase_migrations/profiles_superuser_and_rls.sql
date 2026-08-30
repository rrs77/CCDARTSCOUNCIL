-- ============================================
-- PROFILES: Add superuser role and fix RLS for admin/superuser
-- Run in Supabase SQL Editor. Ensures admins and superusers can manage users.
-- ============================================

-- 1. Allow 'superuser' in profiles.role (existing CHECK only allows admin, teacher, viewer)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'teacher', 'viewer', 'superuser'));

-- 2. Treat superuser like admin in RLS: update helper so admin OR superuser can read/update all profiles
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superuser')
  );
$$;

-- 3. (Optional) Sync email from auth.users into profiles for existing users
--    Run once if profiles.email is missing for some rows. Requires trigger or one-off update.
--    Using a trigger on auth.users UPDATE to keep profiles.email in sync:
CREATE OR REPLACE FUNCTION public.sync_profile_email_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email, updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email_from_auth();

-- One-time backfill: set profiles.email from auth.users where profile exists but email is null
UPDATE public.profiles p
SET email = u.email, updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

COMMENT ON FUNCTION public.current_user_is_admin() IS 'True if current user profile has role admin or superuser; used by RLS.';
