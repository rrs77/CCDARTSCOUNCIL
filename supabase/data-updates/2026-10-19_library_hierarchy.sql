-- Activity Library hierarchy restructure + seeded subject activities
-- Generated 2026-10-19
-- Apply manually to live Supabase. Do not run from CI.
BEGIN;

-- Category metadata: Welcome
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = '61133bdc-659b-4a22-b396-b1ee34399045';

-- Category metadata: Kodaly Songs
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = '044432a3-3151-4472-ae79-d7b7833b259d';

-- Category metadata: Kodaly Action Songs
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = 'eae4fd9a-1e9f-4d69-968c-72ab4f2a480a';

-- Category metadata: Action/Games Songs
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = '1a664a5d-55cc-4703-afb4-9ea5fa0e3e93';

-- Category metadata: Rhythm Sticks
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = 'c40ef70a-3eba-4b54-bc49-2ff3537bba11';

-- Category metadata: Scarf Songs
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = '6ab709d5-8d86-4bed-b958-986a3b7d4a4f';

-- Category metadata: General Game
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = 'ce6fad6f-e1bc-4c14-8ea8-59fc4611bb87';

-- Category metadata: Core Songs
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = 'de896a57-8e89-4934-944a-e11a4f9e4daf';

-- Category metadata: Parachute Games
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = 'dbccd6cc-1c7b-4938-81b2-aa3129665e62';

-- Category metadata: Percussion Games
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = '98f3b5f2-e97e-4a40-bbd0-bf06bd8ad763';

-- Category metadata: Goodbye
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = 'cad415e5-5514-4729-a168-4406eca04c99';

-- Category metadata: Kodaly Rhythms
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = 'f39403da-c564-4086-9c0d-e665a844085a';

-- Category metadata: Kodaly Games
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = '04f81b0a-e62d-4bf7-b671-bee1cfd839ef';

-- Category metadata: IWB Games
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = 'e675c6f9-bb41-4f59-93bf-a2514a54fa55';

-- Category metadata: Teaching Units
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['eyfs','Music']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true}'::jsonb,
  updated_at = NOW()
WHERE id = '872f4707-5f2e-483e-99f0-41396aa94996';

-- Category metadata: Drama Games
UPDATE custom_categories SET
  "group" = 'Drama',
  groups = ARRAY['eyfs','Drama']::text[],
  year_groups = '{"Reception":true,"Reception Music":true,"Reception Drama":true,"Lower Kindergarten":true,"Upper Kindergarten":true,"Upper Kindergarten Music":true,"LKG":true,"UKG":true,"Year 1":true,"Year 2":true,"Year 1 Music":true,"Year 2 Music":true,"Year 1 Drama":true,"Year 2 Drama":true,"Year 3":true,"Year 4":true,"Year 5":true,"Year 6":true,"Year 3 Music":true,"Year 4 Music":true,"Year 5 Music":true,"Year 6 Music":true,"Year 3 Drama":true,"Year 4 Drama":true,"Year 5 Drama":true,"Year 6 Drama":true}'::jsonb,
  updated_at = NOW()
WHERE id = 'cb3c9e55-7cf3-487e-b2c2-3fa248370252';

-- Category metadata: Vocal Warmups
UPDATE custom_categories SET
  "group" = 'Music',
  groups = ARRAY['ks1','Music']::text[],
  year_groups = '{"Year 1":true,"Year 2":true,"Year 1 Music":true,"Year 2 Music":true,"Year 1 Drama":true,"Year 2 Drama":true,"Year 3":true,"Year 4":true,"Year 5":true,"Year 6":true,"Year 3 Music":true,"Year 4 Music":true,"Year 5 Music":true,"Year 6 Music":true,"Year 3 Drama":true,"Year 4 Drama":true,"Year 5 Drama":true,"Year 6 Drama":true,"Year 7":true,"Year 8":true,"Year 9":true,"Year 7 Music":true,"Year 8 Music":true,"Year 9 Music":true,"Year 7 Drama":true,"Year 8 Drama":true,"Year 9 Drama":true}'::jsonb,
  updated_at = NOW()
WHERE id = '15d0d115-e4f8-41cf-ab41-553a06d0d60b';

-- Category metadata: KS1 Drama
UPDATE custom_categories SET
  "group" = 'Drama',
  groups = ARRAY['ks1','Drama']::text[],
  year_groups = '{"Year 1":true,"Year 2":true,"Year 1 Music":true,"Year 2 Music":true,"Year 1 Drama":true,"Year 2 Drama":true}'::jsonb,
  updated_at = NOW()
WHERE id = 'c9ff04bb-1c34-41d9-8d14-ce294d024353';

-- Vocal warm-up subcategory folders
INSERT INTO custom_categories (id, name, color, position, year_groups, groups, "group", created_at, updated_at)
VALUES ('3e7c3b88-7ef8-4612-a461-a7bf04b10297', 'Physical Starters', '#F472B6', 66, '{"Year 1":true,"Year 2":true,"Year 3":true,"Year 4":true,"Year 5":true,"Year 6":true,"Year 1 Music":true,"Year 2 Music":true,"Year 3 Music":true,"Year 4 Music":true,"Year 5 Music":true,"Year 6 Music":true,"Year 7 Music":true,"Year 8 Music":true,"Year 9 Music":true,"Lower Kindergarten":true,"Assemb":true}'::jsonb, ARRAY['ks2','Music']::text[], 'Music', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, color=EXCLUDED.color, year_groups=EXCLUDED.year_groups, groups=EXCLUDED.groups, "group"=EXCLUDED."group", updated_at=NOW();

INSERT INTO custom_categories (id, name, color, position, year_groups, groups, "group", created_at, updated_at)
VALUES ('26119330-caf7-4e1a-8773-c556f0ee072c', 'Breathing Exercises', '#FB7185', 67, '{"Year 1":true,"Year 2":true,"Year 3":true,"Year 4":true,"Year 5":true,"Year 6":true,"Year 1 Music":true,"Year 2 Music":true,"Year 3 Music":true,"Year 4 Music":true,"Year 5 Music":true,"Year 6 Music":true,"Year 7 Music":true,"Year 8 Music":true,"Year 9 Music":true,"Lower Kindergarten":true,"Assemb":true}'::jsonb, ARRAY['ks2','Music']::text[], 'Music', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, color=EXCLUDED.color, year_groups=EXCLUDED.year_groups, groups=EXCLUDED.groups, "group"=EXCLUDED."group", updated_at=NOW();

INSERT INTO custom_categories (id, name, color, position, year_groups, groups, "group", created_at, updated_at)
VALUES ('7c7fab86-818b-4580-b167-0bc38bf4e002', 'Facial Warm-Ups / Diction', '#E879F9', 68, '{"Year 1":true,"Year 2":true,"Year 3":true,"Year 4":true,"Year 5":true,"Year 6":true,"Year 1 Music":true,"Year 2 Music":true,"Year 3 Music":true,"Year 4 Music":true,"Year 5 Music":true,"Year 6 Music":true,"Year 7 Music":true,"Year 8 Music":true,"Year 9 Music":true,"Lower Kindergarten":true,"Assemb":true}'::jsonb, ARRAY['ks2','Music']::text[], 'Music', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, color=EXCLUDED.color, year_groups=EXCLUDED.year_groups, groups=EXCLUDED.groups, "group"=EXCLUDED."group", updated_at=NOW();

INSERT INTO custom_categories (id, name, color, position, year_groups, groups, "group", created_at, updated_at)
VALUES ('75f33149-ee97-4e80-8343-35bfbd2bbe2d', 'Pitch Exercises', '#C084FC', 69, '{"Year 1":true,"Year 2":true,"Year 3":true,"Year 4":true,"Year 5":true,"Year 6":true,"Year 1 Music":true,"Year 2 Music":true,"Year 3 Music":true,"Year 4 Music":true,"Year 5 Music":true,"Year 6 Music":true,"Year 7 Music":true,"Year 8 Music":true,"Year 9 Music":true,"Lower Kindergarten":true,"Assemb":true}'::jsonb, ARRAY['ks2','Music']::text[], 'Music', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, color=EXCLUDED.color, year_groups=EXCLUDED.year_groups, groups=EXCLUDED.groups, "group"=EXCLUDED."group", updated_at=NOW();

INSERT INTO custom_categories (id, name, color, position, year_groups, groups, "group", created_at, updated_at)
VALUES ('ccaead63-6818-489e-9bc7-3015302811fb', 'Vocal Warm-Ups', '#EC4899', 70, '{"Year 1":true,"Year 2":true,"Year 3":true,"Year 4":true,"Year 5":true,"Year 6":true,"Year 1 Music":true,"Year 2 Music":true,"Year 3 Music":true,"Year 4 Music":true,"Year 5 Music":true,"Year 6 Music":true,"Year 7 Music":true,"Year 8 Music":true,"Year 9 Music":true,"Lower Kindergarten":true,"Assemb":true}'::jsonb, ARRAY['ks2','Music']::text[], 'Music', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, color=EXCLUDED.color, year_groups=EXCLUDED.year_groups, groups=EXCLUDED.groups, "group"=EXCLUDED."group", updated_at=NOW();

COMMIT;

-- Drama Games: ensure EYFS class tags so EYFS teachers see the bank (demo/snapshot parity).
-- Full yeargroups arrays are maintained in demoSnapshot.json; apply targeted live updates as needed.
-- Vocal Warm-Ups content/colours: see 2026-10-19_vocal_warmups_content.sql
