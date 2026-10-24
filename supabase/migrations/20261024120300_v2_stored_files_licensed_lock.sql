-- V2: Lock licensed / purchased stored_files fields against client demotion.
-- For non-server UPDATEs: if OLD.visibility = 'licensed' OR OLD.is_purchased_resource,
-- raise when either visibility or is_purchased_resource changes at all
-- (closes licensed → private → org, and clearing the purchased flag).
--
-- Do NOT apply automatically to live DB — owner reviews first.
-- Idempotent / safe to re-run.
-- Depends on: protect_stored_file_visibility from 20261024_stored_files_visibility.sql

CREATE OR REPLACE FUNCTION public.protect_stored_file_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / SQL as postgres: auth.uid() is null — allow (webhooks, admin).
  IF auth.uid() IS NULL THEN
    IF NEW.is_purchased_resource THEN
      NEW.visibility := 'licensed';
    END IF;
    -- Unknown visibility fails closed to private (even for service writers).
    IF NEW.visibility IS NULL OR NEW.visibility NOT IN ('org', 'private', 'licensed') THEN
      NEW.visibility := 'private';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- Ownership cannot be transferred by clients.
  IF TG_OP = 'UPDATE' AND NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'stored_files.owner_id cannot be changed by this user'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'only the file owner may update stored_files'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'stored_files.owner_id must be the inserting user'
      USING ERRCODE = '42501';
  END IF;

  -- V2: once licensed or purchased, clients cannot change those fields at all.
  IF TG_OP = 'UPDATE'
     AND (OLD.visibility = 'licensed' OR OLD.is_purchased_resource IS TRUE) THEN
    IF NEW.visibility IS DISTINCT FROM OLD.visibility
       OR NEW.is_purchased_resource IS DISTINCT FROM OLD.is_purchased_resource THEN
      RAISE EXCEPTION 'licensed/purchased stored_files visibility and purchase flag are immutable for clients'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Clients cannot mark purchased / force licensed.
  IF NEW.is_purchased_resource IS TRUE
     AND (TG_OP = 'INSERT' OR OLD.is_purchased_resource IS DISTINCT FROM TRUE) THEN
    RAISE EXCEPTION 'is_purchased_resource can only be set by service role'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.visibility = 'licensed'
     AND (TG_OP = 'INSERT' OR COALESCE(OLD.visibility, '') IS DISTINCT FROM 'licensed') THEN
    RAISE EXCEPTION 'visibility cannot be set to licensed by clients'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.is_purchased_resource THEN
    NEW.visibility := 'licensed';
  END IF;

  -- Unknown visibility fails closed to private. Default for new rows remains 'org'
  -- via column DEFAULT; this only coerces invalid/null values.
  IF NEW.visibility IS NULL OR NEW.visibility NOT IN ('org', 'private', 'licensed') THEN
    NEW.visibility := 'private';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_stored_file_visibility() IS
  'Owner-only updates; V2 locks licensed/purchased fields against any client change.';
