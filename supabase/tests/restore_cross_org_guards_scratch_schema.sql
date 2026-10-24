-- Minimal scratch schema for restore_cross_org_guards tests (Postgres 15+).
-- Never run against production.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY,
  email TEXT
);

CREATE TABLE IF NOT EXISTS public.organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  partner_slug TEXT,
  slug TEXT,
  display_name TEXT,
  short_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'teacher',
  status TEXT NOT NULL DEFAULT 'active',
  organisation_id TEXT REFERENCES public.organisations(id),
  can_manage_users BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'superuser')
  );
$$;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE TABLE IF NOT EXISTS public.branding_settings (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage branding" ON public.branding_settings;
CREATE POLICY "Admins can manage branding"
  ON public.branding_settings FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity TEXT NOT NULL,
  category TEXT NOT NULL,
  lesson_number TEXT,
  description TEXT,
  activity_text TEXT,
  time NUMERIC,
  video_link TEXT,
  music_link TEXT,
  backing_link TEXT,
  resource_link TEXT,
  link TEXT,
  vocals_link TEXT,
  image_link TEXT,
  canva_link TEXT DEFAULT '',
  teaching_unit TEXT,
  level TEXT,
  unit_name TEXT,
  eyfs_standards TEXT[],
  user_id UUID,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  lesson_numbers JSONB NOT NULL DEFAULT '[]'::jsonb,
  teaching_units JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  academic_year TEXT,
  user_id UUID,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.eyfs_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_name TEXT NOT NULL,
  all_statements JSONB NOT NULL DEFAULT '[]'::jsonb,
  structured_statements JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.year_groups (
  id TEXT PRIMARY KEY,
  name TEXT,
  sort_order INT,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.category_groups (
  id TEXT PRIMARY KEY,
  name TEXT,
  sort_order INT,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.custom_categories (
  id TEXT PRIMARY KEY,
  name TEXT,
  color TEXT,
  sort_order INT,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.half_terms (
  id TEXT PRIMARY KEY,
  sheet_name TEXT,
  academic_year TEXT,
  name TEXT,
  lessons JSONB DEFAULT '[]'::jsonb,
  is_complete BOOLEAN DEFAULT false,
  term_id TEXT,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ,
  week TEXT,
  class_name TEXT,
  activities JSONB,
  duration NUMERIC,
  notes TEXT,
  status TEXT,
  unit_id TEXT,
  unit_name TEXT,
  lesson_number TEXT,
  title TEXT,
  term TEXT,
  time TEXT,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.lesson_stacks (
  id TEXT PRIMARY KEY,
  name TEXT,
  data JSONB,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.activity_stacks (
  id TEXT PRIMARY KEY,
  name TEXT,
  data JSONB,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.custom_objective_year_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  sort_order INT,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.custom_objective_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  year_group_id UUID,
  sort_order INT,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.custom_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT,
  area_id UUID,
  sort_order INT,
  organisation_id TEXT
);

CREATE TABLE IF NOT EXISTS public.activity_custom_objectives (
  activity_id UUID NOT NULL,
  objective_id UUID NOT NULL,
  organisation_id TEXT
  -- PK is org-scoped via uq_activity_custom_objectives_org_pair in 20261024240000
);

CREATE TABLE IF NOT EXISTS public.curriculum_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  organisation_id TEXT,
  storage_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  row_counts JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_backups ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branding_settings TO authenticated;
GRANT SELECT ON public.organisations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
