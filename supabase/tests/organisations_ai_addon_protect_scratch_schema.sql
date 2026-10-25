-- Minimal scratch schema for organisations.ai_addon protect trigger tests.
-- Never run against production.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS auth;

DO $$ BEGIN
  CREATE ROLE authenticated NOINHERIT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE anon NOINHERIT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE service_role NOINHERIT BYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'authenticated');
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  role text NOT NULL DEFAULT 'teacher',
  status text NOT NULL DEFAULT 'active',
  anonymised_at timestamptz,
  organisation_id text,
  school_or_org text
);

CREATE OR REPLACE FUNCTION public.is_super_admin(uid UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid
      AND role IN ('super_admin', 'superuser')
      AND COALESCE(status, 'active') = 'active'
      AND anonymised_at IS NULL
  );
$$;

CREATE TABLE IF NOT EXISTS public.organisations (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  partner_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS ai_addon boolean NOT NULL DEFAULT false;

GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE ON public.organisations TO authenticated;
GRANT SELECT ON public.organisations TO anon;
GRANT ALL ON public.organisations TO service_role;
GRANT SELECT ON public.profiles TO authenticated, service_role;
