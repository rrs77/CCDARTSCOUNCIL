-- half_terms: restore tenant scope (user_id + organisation_id) after d1bd288
-- dropped client filters to avoid PostgREST 400 on a missing user_id column.
-- Unique key includes scope so two teachers can own the same sheet/year/term.
-- Timestamp 20261024270000 per Security Reviewer (after MIS / security-fixes).

ALTER TABLE public.half_terms
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.half_terms
  ADD COLUMN IF NOT EXISTS organisation_id text;

CREATE INDEX IF NOT EXISTS idx_half_terms_user_id ON public.half_terms (user_id);
CREATE INDEX IF NOT EXISTS idx_half_terms_organisation_id ON public.half_terms (organisation_id);

-- Drop legacy unscoped uniques (names vary across environments).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'half_terms'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%sheet_name%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%user_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.half_terms DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  FOR r IN
    SELECT i.relname AS idx
    FROM pg_index x
    JOIN pg_class t ON t.oid = x.indrelid
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'half_terms'
      AND x.indisunique
      AND NOT x.indisprimary
      AND pg_get_indexdef(x.indexrelid) ILIKE '%sheet_name%'
      AND pg_get_indexdef(x.indexrelid) NOT ILIKE '%user_id%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.idx);
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.half_terms
    GROUP BY organisation_id, user_id, sheet_name, academic_year, term_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'half_terms has duplicate rows for (organisation_id, user_id, sheet_name, academic_year, term_id); resolve before unique index';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_half_terms_scope
  ON public.half_terms (organisation_id, user_id, sheet_name, academic_year, term_id)
  NULLS NOT DISTINCT;

ALTER TABLE public.half_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS half_terms_owner_all ON public.half_terms;
CREATE POLICY half_terms_owner_all
  ON public.half_terms
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS half_terms_org_shared_read ON public.half_terms;
CREATE POLICY half_terms_org_shared_read
  ON public.half_terms
  FOR SELECT
  USING (
    user_id IS NULL
    AND organisation_id IS NOT NULL
    AND length(trim(organisation_id)) > 0
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND NULLIF(trim(p.organisation_id), '') = trim(half_terms.organisation_id)
    )
  );

COMMENT ON COLUMN public.half_terms.user_id IS
  'Personal half-term map owner. NULL only for org-shared curriculum restore rows.';
COMMENT ON COLUMN public.half_terms.organisation_id IS
  'Tenant organisation_id tag; personal rows may still set this when the owner has an org.';
