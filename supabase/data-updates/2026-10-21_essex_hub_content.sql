-- =============================================================================
-- Greater Essex hub content — live data update
-- Generated 2026-10-21 from artifacts/ccd/src/components/hubsPreview/directorySeed.json
-- (+ uk-hub-map.json site_url for the hub).
--
-- Apply manually in the Supabase SQL editor. Idempotent: upserts only Greater Essex
-- hub/services/areas/resources/scopes. Does not delete or alter other hubs' data.
--
-- Area "links" have no dedicated column (see partnerDirectory.ts); they are stored
-- on music_hub_areas.contact.links and read back by databaseRecords().
-- =============================================================================
BEGIN;

-- Ensure EMS organisation exists (required for hub org_id + resources)
INSERT INTO public.organisations (
  id, name, partner_slug, slug, display_name, short_name, site_url, logo_src,
  primary_color, accent_color, logo_on_plate, paid, interactive, status, aliases
) VALUES (
  'ems', 'Essex Music Service', 'ems', 'ems', 'Essex Music Service', 'EMS', 'https://www.essexmusicservice.org.uk/site/', '/partners/essex-music-service.svg',
  '#330968', '#7a00df', false, false, true, 'active', ARRAY['essex-music-service', 'greater-essex']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  partner_slug = EXCLUDED.partner_slug,
  slug = EXCLUDED.slug,
  display_name = EXCLUDED.display_name,
  short_name = EXCLUDED.short_name,
  site_url = EXCLUDED.site_url,
  logo_src = EXCLUDED.logo_src,
  primary_color = EXCLUDED.primary_color,
  accent_color = EXCLUDED.accent_color,
  aliases = EXCLUDED.aliases,
  status = EXCLUDED.status;

-- Greater Essex music hub (force content to match seed)
UPDATE public.music_hubs SET
  site_url = 'https://www.greateressexmusichub.org.uk/site/',
  about = 'Greater Essex Music Hub is a partnership of organisations, including the music services of Essex, Southend-on-Sea and Thurrock, and schools. It helps children and young people from all backgrounds and every part of the hub’s area to deepen their engagement with music.

Essex Music Service (Essex County Council) is the Hub Lead Organisation.',
  contact = '{"lines":["Essex Music Service","Greater Essex Music Hub"],"phone":"0333 013 8953","email":"musichub@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/contact/"}'::jsonb,
  organisation_id = (SELECT id FROM public.organisations WHERE id = 'ems'),
  source_url = 'https://www.greateressexmusichub.org.uk/site/',
  relationship_status = 'demonstration',
  status = 'published',
  verified = true,
  updated_at = NOW()
WHERE id = 'greater-essex';

INSERT INTO public.music_hubs (
  id, name, short_name, ace_area_name, nation_code, region_code, region_codes, region_note,
  lead_organisation_name, lead_body, organisation_id, site_url, about, contact, verified, source_url,
  relationship_status, status
)
SELECT
  'greater-essex', 'Greater Essex Music Hub', NULL, 'Essex, Southend-on-Sea & Thurrock',
  'E92000001', 'E12000006', ARRAY['E12000006']::text[], NULL,
  'Essex Music Service', 'Essex County Council',
  (SELECT id FROM public.organisations WHERE id = 'ems'),
  'https://www.greateressexmusichub.org.uk/site/', 'Greater Essex Music Hub is a partnership of organisations, including the music services of Essex, Southend-on-Sea and Thurrock, and schools. It helps children and young people from all backgrounds and every part of the hub’s area to deepen their engagement with music.

Essex Music Service (Essex County Council) is the Hub Lead Organisation.', '{"lines":["Essex Music Service","Greater Essex Music Hub"],"phone":"0333 013 8953","email":"musichub@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/contact/"}'::jsonb, true,
  'https://www.greateressexmusichub.org.uk/site/', 'demonstration', 'published'
WHERE NOT EXISTS (SELECT 1 FROM public.music_hubs WHERE id = 'greater-essex');

-- Greater Essex services
INSERT INTO public.music_hub_services (id, hub_id, name, role, organisation_id, site_url, verified, sort_order)
VALUES (
  'essex-music-service', 'greater-essex', 'Essex Music Service', 'lead',
  (SELECT id FROM public.organisations WHERE id = 'ems'),
  'https://www.essexmusicservice.org.uk/site/', true, 0
)
ON CONFLICT (id) DO UPDATE SET
  hub_id = EXCLUDED.hub_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  organisation_id = EXCLUDED.organisation_id,
  site_url = EXCLUDED.site_url,
  verified = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.music_hub_services (id, hub_id, name, role, organisation_id, site_url, verified, sort_order)
VALUES (
  'music-on-sea', 'greater-essex', 'Music-on-Sea', 'partner',
  NULL,
  'https://www.musiconsea.co.uk/site/', true, 1
)
ON CONFLICT (id) DO UPDATE SET
  hub_id = EXCLUDED.hub_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  organisation_id = EXCLUDED.organisation_id,
  site_url = EXCLUDED.site_url,
  verified = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO public.music_hub_services (id, hub_id, name, role, organisation_id, site_url, verified, sort_order)
VALUES (
  'thurrock-music-service', 'greater-essex', 'Thurrock Music Service', 'partner',
  NULL,
  'https://www.thurrock.gov.uk/music', true, 2
)
ON CONFLICT (id) DO UPDATE SET
  hub_id = EXCLUDED.hub_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  organisation_id = EXCLUDED.organisation_id,
  site_url = EXCLUDED.site_url,
  verified = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Greater Essex areas: about / site_url / contact (links embedded in contact.links)
INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000066',
  'basildon',
  'Basildon',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Basildon sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Basildon Bands! Community Music Centre: Are you the 21st Century answer to Yazoo, Depeche Mode or Alison Moyet? Join Basildon Bands!

The centre focuses on developing band instruments and putting bands together. Sessions run Fridays after school during term-time, 3.45pm to 5.45pm, at De la Salle School, Ghyllgrove, Basildon.',
  'https://www.essexmusicservice.org.uk/site/music-centres/basildon-bands-community-music-centre/',
  '{"lines":["Basildon Bands! Community Music Centre","Essex Music Service"],"address":"De la Salle School Basildon Ghyllgrove Basildon","phone":"0333 013 8953","email":"music.service@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/basildon-bands-community-music-centre/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/basildon-bands-community-music-centre/","links":[{"label":"Basildon Bands! Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/basildon-bands-community-music-centre/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000067',
  'braintree',
  'Braintree',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Braintree sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Braintree Community Music Centre offers music lessons, bands and ensembles for ages 5 to 18 — helping children develop musical skills, confidence and friendships through fun, weekly music-making.

Sessions run Saturdays, 9.00am to 1.00pm, at I-Construct Innovation Hub, Enterprise Drive, Braintree. Contact: Erin Gore.',
  'https://www.essexmusicservice.org.uk/site/music-centres/braintree/',
  '{"lines":["Braintree Community Music Centre","Essex Music Service","Contact: Erin Gore"],"address":"I-Construct Innovation Hub Enterprise Drive Braintree","phone":"0333 013 8953","email":"Erin.Gore@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/braintree/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/braintree/","links":[{"label":"Braintree Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/braintree/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"},{"label":"Witham Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/witham-communitymusic-centre/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000068',
  'brentwood',
  'Brentwood',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Brentwood sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Brentwood Community Music Centre focuses on group music-making — instrumental learning and musicianship strengthened through learning with others.

Sessions run after school on Thursdays (term time only), 5–7.30pm, at Becket Keys School, Runcie Building, Sawyers Hall Lane, Brentwood CM15 9DA. Contact: Tracey Jenkins.',
  'https://www.essexmusicservice.org.uk/site/music-centres/brentwood-community-music-centre/',
  '{"lines":["Brentwood Community Music Centre","Essex Music Service","Contact: Tracey Jenkins"],"address":"Becket Keys School Runcie Building Sawyers Hall Lane Brentwood CM15 9DA","phone":"0333 013 8953","email":"tracey.jenkins@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/brentwood-community-music-centre/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/brentwood-community-music-centre/","links":[{"label":"Brentwood Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/brentwood-community-music-centre/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000069',
  'castle-point',
  'Castle Point',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Castle Point sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Benfleet Community Music Centre serves the Castle Point area with community music provision on Saturdays during term time.

Sessions run Saturdays (term time only) 8:30am–12pm at Thundersley Primary School, 2 Dark Lane, Thundersley, Benfleet SS7 3PT. Contact: Kathleen Curtis.',
  'https://www.essexmusicservice.org.uk/site/music-centres/benfleet/',
  '{"lines":["Benfleet Community Music Centre","Essex Music Service","Contact: Kathleen Curtis"],"address":"Benfleet Community Music Centre Thundersley Primary School 2 Dark Lane Thundersley Benfleet SS7 3PT","phone":"0333 013 8953","email":"Kathleen.Curtis@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/benfleet/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/benfleet/","links":[{"label":"Benfleet Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/benfleet/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000070',
  'chelmsford',
  'Chelmsford',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Chelmsford sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Chelmsford Community Music Centre offers a combination of individual, small group, and ensemble music provision in Chelmsford after school on Tuesdays during term-time.

Regular sessions take place on Tuesdays after school at Chelmsford County High School for Girls, open to students from across Mid Essex and further afield. Students aged 5–18 are welcome. Offer includes 1-to-1 provision, a junior musicianship programme and a string group. Contact: Kathleen Curtis.',
  'https://www.essexmusicservice.org.uk/site/music-centres/chelmsford/',
  '{"lines":["Chelmsford Community Music Centre","Essex Music Service","Contact: Kathleen Curtis"],"address":"Chelmsford County High School for Girls Broomfield Road Chelmsford","phone":"0333 013 8953","email":"Kathleen.Curtis@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/chelmsford/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/chelmsford/","links":[{"label":"Chelmsford Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/chelmsford/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000071',
  'colchester',
  'Colchester',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Colchester sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Colchester Community Music Centre provides community music provision on Saturdays during term time at Colchester County High School for Girls, Norman Way, Colchester CO3 3US.

Sessions run Saturdays (term time only) 9am–12pm. Contact: Melissa Bailey. Additional Colchester venues published by EMS include Colchester Townhouse and West Colchester Community Music Centre.',
  'https://www.essexmusicservice.org.uk/site/music-centres/colchester/',
  '{"lines":["Colchester Community Music Centre","Essex Music Service","Contact: Melissa Bailey"],"address":"Colchester Community Music Centre Colchester County High School for Girls Norman Way Colchester. CO3 3US","phone":"0333 013 8953","email":"Melissa.Bailey2@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/colchester/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/colchester/","links":[{"label":"Colchester Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/colchester/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"},{"label":"Colchester Townhouse","href":"https://www.essexmusicservice.org.uk/site/music-centres/colchester-townhouse/"},{"label":"West Colchester Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/west-colchester-community-music-centre/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000072',
  'epping-forest',
  'Epping Forest',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Epping Forest sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Epping Forest Community Music Centre offers a combination of individual, small group, and ensemble music provision at Epping St John’s School on Mondays after school during term time, including a free choir.

Sessions run Mondays (term-time only) 4.00–6.00pm at Epping St John''s School, Bury Ln, Epping CM16 5JB. Contact: Kay Archer.',
  'https://www.essexmusicservice.org.uk/site/music-centres/epping-forest-community-music-centre/',
  '{"lines":["Epping Forest Community Music Centre","Essex Music Service","Contact: Kay Archer"],"address":"Epping St John''s School Bury Ln Epping CM16 5JB","phone":"0333 013 8953","email":"kay.archer@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/epping-forest-community-music-centre/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/epping-forest-community-music-centre/","links":[{"label":"Epping Forest Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/epping-forest-community-music-centre/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000073',
  'harlow',
  'Harlow',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Harlow sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Livewire Music School (Harlow Juniors) is the junior programme for young people exploring and learning music together in the Harlow area, Tuesdays after school during term time.

Sessions run Tuesdays after school (term time only) 3.30–5pm at Hare Street Community Primary School, Little Grove Field, Harlow. Published contact name: Becky Gentry; published centre email: kay.archer@essex.gov.uk.',
  'https://www.essexmusicservice.org.uk/site/music-centres/livewire-music-school/',
  '{"lines":["Livewire Music School (Harlow Juniors)","Essex Music Service","Contact: Becky Gentry"],"address":"Hare Street Community Primary School Little Grove Field Harlow","phone":"0333 013 8953","email":"kay.archer@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/livewire-music-school/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/livewire-music-school/","links":[{"label":"Livewire Music School (Harlow Juniors)","href":"https://www.essexmusicservice.org.uk/site/music-centres/livewire-music-school/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"},{"label":"Livewire Choir (Harlow Playhouse)","href":"https://www.essexmusicservice.org.uk/site/music-centres/livewire-choir-harlow-playhouse/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000074',
  'maldon',
  'Maldon',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Maldon sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Maldon Community Music Centre offers a combination of individual, small group, and ensemble music provision in Maldon after school on Tuesdays during term-time. The focus is on group music-making — instrumental learning and musicianship is strengthened through learning with others.

Regular sessions take place on Tuesday evenings at the Plume Academy in Maldon during term time. Students aged 5–18 are welcome. Offer includes All in Band, guitar group, music technology group, theory/aural/musicianship, and the Essex Youth Wind Quintet. Contact: Tina Spivey.',
  'https://www.essexmusicservice.org.uk/site/music-centres/maldon-music-school-community-music-centre/',
  '{"lines":["Maldon Community Music Centre","Essex Music Service","Contact: Tina Spivey"],"address":"Plume Academy Fambridge Road Maldon CM9 6AB","phone":"0333 013 8953","email":"tina.spivey@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/maldon-music-school-community-music-centre/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/maldon-music-school-community-music-centre/","links":[{"label":"Maldon Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/maldon-music-school-community-music-centre/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000075',
  'rochford',
  'Rochford',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Rochford sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Rayleigh Community Music Centre serves the Rochford area. EMS publishes 1-to-1 lessons and a rock band for those looking to play music in a group.

Regular sessions take place on Wednesdays after school (term time only) 4pm–7pm at The FitzWimarc School, Hockley Road, Rayleigh SS6 8EB. Contact: Kathleen Curtis.',
  'https://www.essexmusicservice.org.uk/site/music-centres/rayleigh-community-music-centre/',
  '{"lines":["Rayleigh Community Music Centre","Essex Music Service","Contact: Kathleen Curtis"],"address":"The FitzWimarc School Hockley Road Rayleigh. SS6 8EB","phone":"0333 013 8953","email":"kathleen.curtis@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/rayleigh-community-music-centre/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/rayleigh-community-music-centre/","links":[{"label":"Rayleigh Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/rayleigh-community-music-centre/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000076',
  'tendring',
  'Tendring',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Tendring sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Tendring Community Music Centre offers a combination of individual, small group, and ensemble music provision in Manningtree on Saturday mornings during term-time, open to students from across the Tendring and Colchester areas. Students aged 5–18 are welcome.

Offer includes All in Band, Brass Ensemble, rock/soul/pop band, Junior Wind Ensemble, and groups for theory, aural and musicianship. Sessions run Saturdays (term time only) 8:30am–1pm at Manningtree High School, Colchester Road, Lawford, Manningtree CO11 2BW. Published contact name: Tess Greene; published centre email: sam.geden@essex.gov.uk.',
  'https://www.essexmusicservice.org.uk/site/music-centres/tendring-community-music-centre/',
  '{"lines":["Tendring Community Music Centre","Essex Music Service","Contact: Tess Greene"],"address":"Tendring Community Music Centre Manningtree High School Colchester Road Lawford Manningtree CO11 2BW","phone":"0333 013 8953","email":"sam.geden@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/tendring-community-music-centre/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/tendring-community-music-centre/","links":[{"label":"Tendring Community Music Centre","href":"https://www.essexmusicservice.org.uk/site/music-centres/tendring-community-music-centre/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"},{"label":"We Are Music (Harwich)","href":"https://www.essexmusicservice.org.uk/site/music-centres/we-are-music-harwich/"},{"label":"We Are Music (Jaywick)","href":"https://www.essexmusicservice.org.uk/site/music-centres/we-are-music-jaywick/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E07000077',
  'uttlesford',
  'Uttlesford',
  'E92000001',
  'E12000006',
  'Essex',
  'greater-essex',
  'essex-music-service',
  'Uttlesford sits within the Essex Music Service delivery area for Greater Essex Music Hub.

Essex Music Service is the lead partner with Saffron Hall and Saffron Walden County High School for Saffron Centre for Young Musicians (SCYM).

Sessions run Saturdays during term time at Saffron Centre for Young Musicians c/o Saffron Hall, Uttlesford District Council Offices, London Road, Saffron Walden, Essex CB11 4ER. Contact: Helen Moss.',
  'https://www.essexmusicservice.org.uk/site/music-centres/saffron/',
  '{"lines":["Saffron Centre for Young Musicians (SCYM)","Essex Music Service","Contact: Helen Moss"],"address":"Saffron Centre for Young Musicians c/o Saffron Hall Uttlesford District Council Offices London Road Saffron Walden Essex CB11 4ER","phone":"0333 013 8953","email":"helen.moss@essex.gov.uk","website":"https://www.essexmusicservice.org.uk/site/music-centres/saffron/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicServiceEssex"},{"label":"X (Twitter)","href":"https://x.com/MusicServEssex"},{"label":"YouTube","href":"https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg"},{"label":"SoundCloud","href":"https://soundcloud.com/user-695076106"}],"sourceUrl":"https://www.essexmusicservice.org.uk/site/music-centres/saffron/","links":[{"label":"Saffron Centre for Young Musicians (SCYM)","href":"https://www.essexmusicservice.org.uk/site/music-centres/saffron/"},{"label":"Community music charges","href":"https://www.essexmusicservice.org.uk/site/community-music-charges/"},{"label":"Essex Music Service","href":"https://www.essexmusicservice.org.uk/site/"},{"label":"EMS contact","href":"https://www.essexmusicservice.org.uk/site/contact/"},{"label":"Music curriculum and CPD resources","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/"},{"label":"Instrumental and vocal provision","href":"https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/"},{"label":"Inclusion and financial support","href":"https://www.essexmusicservice.org.uk/site/school-provision/inclusion/"},{"label":"Music outside of school","href":"https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/"},{"label":"Making music near you","href":"https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"},{"label":"Opportunities for schools (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/"},{"label":"Opportunities for students (GEMH)","href":"https://www.greateressexmusichub.org.uk/site/opportunities-for-students/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E06000033',
  'southend-on-sea',
  'Southend-on-Sea',
  'E92000001',
  'E12000006',
  NULL,
  'greater-essex',
  'music-on-sea',
  'Southend-on-Sea is served by Music-on-Sea (Southend Music Service) as part of Greater Essex Music Hub, alongside Essex Music Service and Thurrock Music Service.

Southend Music Service ‘Music on Sea’ is committed to supporting the delivery of and providing high musical opportunities to children and young people across Southend City Council.

Vision (published): all children and young people should have the opportunity to learn to sing, play an instrument and create music together, as well as progress their musical interests and talent, including through professional pathways.

Music on Sea aims to support schools and other education settings to deliver high quality music education, including opportunities in and outside of school.',
  'https://www.musiconsea.co.uk/site/',
  '{"lines":["Music-on-Sea","Southend Music Service"],"phone":"01702 215861","email":"musiconsea@southend.gov.uk","website":"https://www.musiconsea.co.uk/site/","socials":[{"label":"Facebook","href":"https://www.facebook.com/MusicOnSea"},{"label":"X (Twitter)","href":"https://www.twitter.com/MusicOnSea"},{"label":"Instagram","href":"https://www.instagram.com/MusicOnSea"}],"sourceUrl":"https://www.musiconsea.co.uk/site/contactus/","links":[{"label":"Music-on-Sea home","href":"https://www.musiconsea.co.uk/site/"},{"label":"About us","href":"https://www.musiconsea.co.uk/site/aboutus/"},{"label":"Contact us","href":"https://www.musiconsea.co.uk/site/contactus/"},{"label":"Music in schools","href":"https://www.musiconsea.co.uk/site/music-in-schools/"},{"label":"Whole class provision (WCET)","href":"https://www.musiconsea.co.uk/site/music-in-schools/whole-class-provision/"},{"label":"Curriculum delivery support","href":"https://www.musiconsea.co.uk/site/music-in-schools/provision-support-curriculum-delivery/"},{"label":"Instrumental and vocal tuition","href":"https://www.musiconsea.co.uk/site/music-in-schools/music-tuition-school/"},{"label":"Networks and professional development","href":"https://www.musiconsea.co.uk/site/music-in-schools/networks-professional-development/"},{"label":"Information for families","href":"https://www.musiconsea.co.uk/site/information-for-families/"},{"label":"Ensembles","href":"https://www.musiconsea.co.uk/site/information-for-families/ensembles/"},{"label":"Instrument hire","href":"https://www.musiconsea.co.uk/site/information-for-families/instrument-hire/"},{"label":"Financial assistance","href":"https://www.musiconsea.co.uk/site/information-for-families/financial-assistance/"},{"label":"Inclusion","href":"https://www.musiconsea.co.uk/site/policy-and-resources/inclusion/"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

INSERT INTO public.music_hub_areas (
  code, slug, name, nation_code, region_code, county, hub_id, service_id, about, site_url, contact
) VALUES (
  'E06000034',
  'thurrock',
  'Thurrock',
  'E92000001',
  'E12000006',
  NULL,
  'greater-essex',
  'thurrock-music-service',
  'Thurrock is served by Thurrock Music Service as part of Greater Essex Music Hub, alongside Essex Music Service and Music-on-Sea.

Thurrock Council publishes: Our team of highly qualified music teachers visit Thurrock''s schools to provide a high level of instrumental and vocal tuition. Pupils are taught on a range of instruments. Contact your child''s school for more information.

Thurrock Music Services is listed as a lead partner of the Thurrock Music Education Hub (thurrockmusic.co.uk) for instrument hire, music schools, examinations, ensembles, events and festivals.',
  'https://www.thurrock.gov.uk/music',
  '{"lines":["Thurrock Music Services"],"address":"High House Production Park, Vellacott Close, Purfleet-on-Thames, RM19 1RJ","phone":"01375 413 680","email":"music.services@thurrock.gov.uk","website":"https://www.thurrock.gov.uk/music","socials":[{"label":"Facebook (Thurrock Council)","href":"https://www.facebook.com/thurrockcouncil/"},{"label":"X (Thurrock Council)","href":"https://twitter.com/thurrockcouncil/"},{"label":"YouTube (Thurrock Council)","href":"https://www.youtube.com/thurrockcouncil"}],"sourceUrl":"https://www.thurrock.gov.uk/music","links":[{"label":"Music education in Thurrock (council)","href":"https://www.thurrock.gov.uk/music"},{"label":"Thurrock Music Education Hub","href":"https://thurrockmusic.co.uk/"},{"label":"Instrument hire","href":"https://thurrockmusic.co.uk/instrumenthire.php"},{"label":"At music school","href":"https://thurrockmusic.co.uk/atmusicschool.php"},{"label":"Exams","href":"https://thurrockmusic.co.uk/exams.php"},{"label":"Ensembles","href":"https://thurrockmusic.co.uk/ensembles.php"},{"label":"Dates / events","href":"https://thurrockmusic.co.uk/dates.php"},{"label":"Music festivals","href":"https://thurrockmusic.co.uk/musicfestivals.php"},{"label":"Advice for parents","href":"https://thurrockmusic.co.uk/adviceparents.php"},{"label":"Greater Essex Music Hub","href":"https://www.greateressexmusichub.org.uk/site/"}]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  hub_id = 'greater-essex',
  service_id = COALESCE(EXCLUDED.service_id, public.music_hub_areas.service_id),
  about = EXCLUDED.about,
  site_url = EXCLUDED.site_url,
  contact = EXCLUDED.contact,
  updated_at = NOW();

-- Published Essex resources (upsert content; leave unrelated resources untouched)
INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'ems-schools-brochure', 'Schools brochure', 'Essex Music Service’s offer to schools: curriculum platforms, instrumental and vocal pathways, workshops and CPD.', 'pdf',
  'ems', 'ems-schools-brochure.pdf', '/demo-resources/ems-schools-brochure.pdf', false, true,
  'ems', 'published', true, ARRAY['KS3']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"KS3 (set up for Years 7–8)","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Shared by Essex Music Service for planning. © Essex Music Service.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'ems-dj-workshop', 'DJ Workshop', 'Featured EMS workshop: beat-matching, structure and performance. Course notes plus a ready-made lesson sequence.', 'workshop',
  'ems', 'ems-dj-workshop-course-notes.pdf', '/demo-resources/ems-dj-workshop-course-notes.pdf', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Shared by Essex Music Service for planning. © Essex Music Service.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'ems-rap-it-workshop', 'Rap-It!', 'Literacy-linked rap writing and performance workshop from Essex Music Service, with course notes and lessons.', 'workshop',
  'ems', 'ems-rap-it-workshop-course-notes.pdf', '/demo-resources/ems-rap-it-workshop-course-notes.pdf', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Shared by Essex Music Service for planning. © Essex Music Service.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-cmc', 'Basildon Bands! Community Music Centre', 'Local community music centre for Basildon. Fridays after school during term-time 3.45pm to 5.45pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/basildon-bands-community-music-centre/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/basildon-bands-community-music-centre/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-dj', 'DJ Workshop (Basildon schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-rap-it', 'Rap-It! (Basildon schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'basildon-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-cmc', 'Braintree Community Music Centre', 'Local community music centre for Braintree. Saturday, 9.00am to 1.00pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/braintree/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/braintree/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-dj', 'DJ Workshop (Braintree schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-rap-it', 'Rap-It! (Braintree schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'braintree-extra-0', 'Witham Community Music Centre', 'Additional EMS-listed provision for the Braintree area.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/witham-communitymusic-centre/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service.', 'https://www.essexmusicservice.org.uk/site/music-centres/witham-communitymusic-centre/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-cmc', 'Brentwood Community Music Centre', 'Local community music centre for Brentwood. After School (term time only) Thursdays 5 - 7.30pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/brentwood-community-music-centre/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/brentwood-community-music-centre/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-dj', 'DJ Workshop (Brentwood schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-rap-it', 'Rap-It! (Brentwood schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'brentwood-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-cmc', 'Benfleet Community Music Centre', 'Local community music centre for Castle Point. Saturday (term time only) 8:30am – 12pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/benfleet/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/benfleet/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-dj', 'DJ Workshop (Castle Point schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-rap-it', 'Rap-It! (Castle Point schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'castle-point-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-cmc', 'Chelmsford Community Music Centre', 'Local community music centre for Chelmsford. Tuesday 4.30pm – 7pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/chelmsford/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/chelmsford/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-dj', 'DJ Workshop (Chelmsford schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-rap-it', 'Rap-It! (Chelmsford schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'chelmsford-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-cmc', 'Colchester Community Music Centre', 'Local community music centre for Colchester. Saturday (term time only) 9am – 12pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/colchester/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/colchester/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-dj', 'DJ Workshop (Colchester schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-rap-it', 'Rap-It! (Colchester schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-extra-0', 'Colchester Townhouse', 'Additional EMS-listed provision for the Colchester area.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/colchester-townhouse/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service.', 'https://www.essexmusicservice.org.uk/site/music-centres/colchester-townhouse/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'colchester-extra-1', 'West Colchester Community Music Centre', 'Additional EMS-listed provision for the Colchester area.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/west-colchester-community-music-centre/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service.', 'https://www.essexmusicservice.org.uk/site/music-centres/west-colchester-community-music-centre/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-cmc', 'Epping Forest Community Music Centre', 'Local community music centre for Epping Forest. Monday (term-time only) 4.00-6.00pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/epping-forest-community-music-centre/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/epping-forest-community-music-centre/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-dj', 'DJ Workshop (Epping Forest schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-rap-it', 'Rap-It! (Epping Forest schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'epping-forest-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-cmc', 'Livewire Music School (Harlow Juniors)', 'Local community music centre for Harlow. Tuesdays after school (term time only) 3.30 - 5pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/livewire-music-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/livewire-music-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-dj', 'DJ Workshop (Harlow schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-rap-it', 'Rap-It! (Harlow schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'harlow-extra-0', 'Livewire Choir (Harlow Playhouse)', 'Additional EMS-listed provision for the Harlow area.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/livewire-choir-harlow-playhouse/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service.', 'https://www.essexmusicservice.org.uk/site/music-centres/livewire-choir-harlow-playhouse/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-cmc', 'Maldon Community Music Centre', 'Local community music centre for Maldon. Tuesday (term time only) 5pm – 7:30pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/maldon-music-school-community-music-centre/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/maldon-music-school-community-music-centre/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-dj', 'DJ Workshop (Maldon schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-rap-it', 'Rap-It! (Maldon schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'maldon-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-cmc', 'Rayleigh Community Music Centre', 'Local community music centre for Rochford. Wednesday (term time only) 4pm – 7pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/rayleigh-community-music-centre/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/rayleigh-community-music-centre/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-dj', 'DJ Workshop (Rochford schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-rap-it', 'Rap-It! (Rochford schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'rochford-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-cmc', 'Tendring Community Music Centre', 'Local community music centre for Tendring. Saturday (term time only) 8:30am – 1pm', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/tendring-community-music-centre/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/tendring-community-music-centre/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-dj', 'DJ Workshop (Tendring schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-rap-it', 'Rap-It! (Tendring schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-extra-0', 'We Are Music (Harwich)', 'Additional EMS-listed provision for the Tendring area.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/we-are-music-harwich/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service.', 'https://www.essexmusicservice.org.uk/site/music-centres/we-are-music-harwich/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'tendring-extra-1', 'We Are Music (Jaywick)', 'Additional EMS-listed provision for the Tendring area.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/we-are-music-jaywick/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service.', 'https://www.essexmusicservice.org.uk/site/music-centres/we-are-music-jaywick/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-cmc', 'Saffron Centre for Young Musicians (SCYM)', 'Local community music centre for Uttlesford. Saturdays during term time', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-centres/saffron/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Centre","phase_label":"Ages 5–18","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-centres/saffron/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-charges', 'Community music charges', 'Official EMS fees for community instrumental and group provision.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/community-music-charges/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-brochure-2025', 'EMS Schools brochure 2025–26', 'Official Essex Music Service schools brochure (PDF).', 'pdf',
  'ems', 'DS25_8824-Music-Service-Schools-Digital-1.pdf', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"PDF","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/files/2025/06/DS25_8824-Music-Service-Schools-Digital-1.pdf', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-curriculum-cpd', 'Music curriculum and CPD resources', 'Charanga, YuStudio, Focus on Sound and related CPD for schools.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-instrumental-vocal', 'Instrumental and vocal provision', 'Whole-class, small-group and workshop offer including DJ and Rap-It!.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"EYFS–KS4","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-inclusion', 'Inclusion and financial support', 'Hub inclusion commitment and financial support information.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-outside-school', 'Music outside of school', 'EMS pathways beyond the classroom.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/music-outside-of-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-near-you', 'Making music near you', 'Local music-making opportunities for families.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/music-information-for-parents/making-music-near-you/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-dj', 'DJ Workshop (Uttlesford schools)', 'EMS DJ workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3']::text[], ARRAY['Music technology']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS3","library_pack":"ems-dj-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-rap-it', 'Rap-It! (Uttlesford schools)', 'Literacy-linked rap workshop — Add to CCDesigner for demo lesson export.', 'workshop',
  'ems', '', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', false, true,
  'ems', 'published', true, ARRAY['KS2', 'KS3', 'KS4']::text[], ARRAY['Music', 'English']::text[],
  '{"type":"Workshop","phase_label":"KS2–KS4","library_pack":"ems-rap-it-workshop"}'::jsonb, NOW(), 'free', 'Essex Music Service', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.essexmusicservice.org.uk/site/school-provision/instrumental-and-vocal-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-gemh-schools', 'Opportunities for schools (GEMH)', 'Greater Essex Music Hub support for schools.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'uttlesford-gemh-students', 'Opportunities for students (GEMH)', 'Greater Essex Music Hub student pathways.', 'workshop',
  'ems', '', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', false, true,
  'ems', 'published', true, ARRAY['KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"KS1–KS5","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Greater Essex Music Hub', 'Published by Essex Music Service / Greater Essex Music Hub.', 'https://www.greateressexmusichub.org.uk/site/opportunities-for-students/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-about', 'About Music-on-Sea', 'Official About page for Southend Music Service / Music on Sea.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/aboutus/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/aboutus/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-schools', 'Music in schools', 'Whole-class, curriculum support, tuition and CPD pathways for Southend schools.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/music-in-schools/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/music-in-schools/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-wcet', 'Whole class provision (WCET)', 'Music-on-Sea whole class ensemble tuition offer.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/music-in-schools/whole-class-provision/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/music-in-schools/whole-class-provision/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-curriculum', 'Curriculum delivery support', 'Provision to support curriculum delivery in Southend schools.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/music-in-schools/provision-support-curriculum-delivery/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/music-in-schools/provision-support-curriculum-delivery/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-tuition', 'Instrumental and vocal tuition in school', 'In-school instrumental and vocal tuition from Music-on-Sea.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/music-in-schools/music-tuition-school/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/music-in-schools/music-tuition-school/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-cpd', 'Networks and professional development', 'Teacher networks and CPD from Music-on-Sea.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/music-in-schools/networks-professional-development/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/music-in-schools/networks-professional-development/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-families', 'Information for families', 'Tuition, ensembles, instrument hire and financial assistance for families.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/information-for-families/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/information-for-families/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-ensembles', 'Ensembles', 'Family-facing ensembles information from Music-on-Sea.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/information-for-families/ensembles/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/information-for-families/ensembles/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-hire', 'Instrument hire', 'Instrument hire information for Music-on-Sea families.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/information-for-families/instrument-hire/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/information-for-families/instrument-hire/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-finance', 'Financial assistance', 'Financial assistance information for Music-on-Sea families.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/information-for-families/financial-assistance/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/information-for-families/financial-assistance/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'southend-inclusion', 'Inclusion', 'Inclusion policy and resources from Music-on-Sea.', 'workshop',
  'ems', '', 'https://www.musiconsea.co.uk/site/policy-and-resources/inclusion/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Music-on-Sea', 'Published by Music-on-Sea / Southend Music Service.', 'https://www.musiconsea.co.uk/site/policy-and-resources/inclusion/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'thurrock-council-music', 'Music education in Thurrock', 'Thurrock Council music education overview and school tuition note.', 'workshop',
  'ems', 'music', 'https://www.thurrock.gov.uk/music', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Thurrock Music Service', 'Published by Thurrock Council / Thurrock Music Education Hub.', 'https://www.thurrock.gov.uk/music', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'thurrock-hub', 'Thurrock Music Education Hub', 'Hub site for instrument hire, music schools, exams, ensembles and festivals.', 'workshop',
  'ems', '', 'https://thurrockmusic.co.uk/', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Thurrock Music Service', 'Published by Thurrock Council / Thurrock Music Education Hub.', 'https://thurrockmusic.co.uk/', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'thurrock-hire', 'Instrument hire (Thurrock)', 'Instrument hire via Thurrock Music Education Hub.', 'workshop',
  'ems', 'instrumenthire.php', 'https://thurrockmusic.co.uk/instrumenthire.php', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Thurrock Music Service', 'Published by Thurrock Council / Thurrock Music Education Hub.', 'https://thurrockmusic.co.uk/instrumenthire.php', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'thurrock-school', 'At music school (Thurrock)', 'Music school information from Thurrock Music Education Hub.', 'workshop',
  'ems', 'atmusicschool.php', 'https://thurrockmusic.co.uk/atmusicschool.php', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Thurrock Music Service', 'Published by Thurrock Council / Thurrock Music Education Hub.', 'https://thurrockmusic.co.uk/atmusicschool.php', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'thurrock-exams', 'Exams (Thurrock)', 'Music examinations information.', 'workshop',
  'ems', 'exams.php', 'https://thurrockmusic.co.uk/exams.php', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Thurrock Music Service', 'Published by Thurrock Council / Thurrock Music Education Hub.', 'https://thurrockmusic.co.uk/exams.php', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'thurrock-ensembles', 'Ensembles (Thurrock)', 'Orchestras, ensembles and choirs.', 'workshop',
  'ems', 'ensembles.php', 'https://thurrockmusic.co.uk/ensembles.php', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Thurrock Music Service', 'Published by Thurrock Council / Thurrock Music Education Hub.', 'https://thurrockmusic.co.uk/ensembles.php', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'thurrock-events', 'Dates / events (Thurrock)', 'Music events and activities calendar.', 'workshop',
  'ems', 'dates.php', 'https://thurrockmusic.co.uk/dates.php', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Thurrock Music Service', 'Published by Thurrock Council / Thurrock Music Education Hub.', 'https://thurrockmusic.co.uk/dates.php', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'thurrock-festivals', 'Music festivals (Thurrock)', 'Music festivals information.', 'workshop',
  'ems', 'musicfestivals.php', 'https://thurrockmusic.co.uk/musicfestivals.php', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Thurrock Music Service', 'Published by Thurrock Council / Thurrock Music Education Hub.', 'https://thurrockmusic.co.uk/musicfestivals.php', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

INSERT INTO public.resources (
  id, title, description, resource_type, partner_slug, filename, download_url, requires_auth, is_active,
  organisation_id, status, is_free, key_stages, subjects, metadata, published_at,
  access_level, contributor_name, licence, source_url, updated_at
) VALUES (
  'thurrock-parents', 'Advice for parents (Thurrock)', 'Tips for parents of young musicians.', 'workshop',
  'ems', 'adviceparents.php', 'https://thurrockmusic.co.uk/adviceparents.php', false, true,
  'ems', 'published', true, ARRAY['EYFS', 'KS1', 'KS2', 'KS3', 'KS4', 'KS5']::text[], ARRAY['Music']::text[],
  '{"type":"Guide","phase_label":"All phases","library_pack":"ems-schools-brochure"}'::jsonb, NOW(), 'free', 'Thurrock Music Service', 'Published by Thurrock Council / Thurrock Music Education Hub.', 'https://thurrockmusic.co.uk/adviceparents.php', NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  resource_type = EXCLUDED.resource_type,
  partner_slug = EXCLUDED.partner_slug,
  filename = EXCLUDED.filename,
  download_url = EXCLUDED.download_url,
  requires_auth = EXCLUDED.requires_auth,
  is_active = true,
  organisation_id = EXCLUDED.organisation_id,
  status = 'published',
  is_free = EXCLUDED.is_free,
  key_stages = EXCLUDED.key_stages,
  subjects = EXCLUDED.subjects,
  metadata = EXCLUDED.metadata,
  published_at = COALESCE(public.resources.published_at, NOW()),
  access_level = EXCLUDED.access_level,
  contributor_name = EXCLUDED.contributor_name,
  licence = EXCLUDED.licence,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

-- Replace scopes only for the Essex resources we upserted (exact seed match)
DELETE FROM public.resource_scopes
WHERE resource_id IN ('ems-schools-brochure', 'ems-dj-workshop', 'ems-rap-it-workshop', 'basildon-cmc', 'basildon-charges', 'basildon-brochure-2025', 'basildon-curriculum-cpd', 'basildon-instrumental-vocal', 'basildon-inclusion', 'basildon-outside-school', 'basildon-near-you', 'basildon-dj', 'basildon-rap-it', 'basildon-gemh-schools', 'basildon-gemh-students', 'braintree-cmc', 'braintree-charges', 'braintree-brochure-2025', 'braintree-curriculum-cpd', 'braintree-instrumental-vocal', 'braintree-inclusion', 'braintree-outside-school', 'braintree-near-you', 'braintree-dj', 'braintree-rap-it', 'braintree-gemh-schools', 'braintree-gemh-students', 'braintree-extra-0', 'brentwood-cmc', 'brentwood-charges', 'brentwood-brochure-2025', 'brentwood-curriculum-cpd', 'brentwood-instrumental-vocal', 'brentwood-inclusion', 'brentwood-outside-school', 'brentwood-near-you', 'brentwood-dj', 'brentwood-rap-it', 'brentwood-gemh-schools', 'brentwood-gemh-students', 'castle-point-cmc', 'castle-point-charges', 'castle-point-brochure-2025', 'castle-point-curriculum-cpd', 'castle-point-instrumental-vocal', 'castle-point-inclusion', 'castle-point-outside-school', 'castle-point-near-you', 'castle-point-dj', 'castle-point-rap-it', 'castle-point-gemh-schools', 'castle-point-gemh-students', 'chelmsford-cmc', 'chelmsford-charges', 'chelmsford-brochure-2025', 'chelmsford-curriculum-cpd', 'chelmsford-instrumental-vocal', 'chelmsford-inclusion', 'chelmsford-outside-school', 'chelmsford-near-you', 'chelmsford-dj', 'chelmsford-rap-it', 'chelmsford-gemh-schools', 'chelmsford-gemh-students', 'colchester-cmc', 'colchester-charges', 'colchester-brochure-2025', 'colchester-curriculum-cpd', 'colchester-instrumental-vocal', 'colchester-inclusion', 'colchester-outside-school', 'colchester-near-you', 'colchester-dj', 'colchester-rap-it', 'colchester-gemh-schools', 'colchester-gemh-students', 'colchester-extra-0', 'colchester-extra-1', 'epping-forest-cmc', 'epping-forest-charges', 'epping-forest-brochure-2025', 'epping-forest-curriculum-cpd', 'epping-forest-instrumental-vocal', 'epping-forest-inclusion', 'epping-forest-outside-school', 'epping-forest-near-you', 'epping-forest-dj', 'epping-forest-rap-it', 'epping-forest-gemh-schools', 'epping-forest-gemh-students', 'harlow-cmc', 'harlow-charges', 'harlow-brochure-2025', 'harlow-curriculum-cpd', 'harlow-instrumental-vocal', 'harlow-inclusion', 'harlow-outside-school', 'harlow-near-you', 'harlow-dj', 'harlow-rap-it', 'harlow-gemh-schools', 'harlow-gemh-students', 'harlow-extra-0', 'maldon-cmc', 'maldon-charges', 'maldon-brochure-2025', 'maldon-curriculum-cpd', 'maldon-instrumental-vocal', 'maldon-inclusion', 'maldon-outside-school', 'maldon-near-you', 'maldon-dj', 'maldon-rap-it', 'maldon-gemh-schools', 'maldon-gemh-students', 'rochford-cmc', 'rochford-charges', 'rochford-brochure-2025', 'rochford-curriculum-cpd', 'rochford-instrumental-vocal', 'rochford-inclusion', 'rochford-outside-school', 'rochford-near-you', 'rochford-dj', 'rochford-rap-it', 'rochford-gemh-schools', 'rochford-gemh-students', 'tendring-cmc', 'tendring-charges', 'tendring-brochure-2025', 'tendring-curriculum-cpd', 'tendring-instrumental-vocal', 'tendring-inclusion', 'tendring-outside-school', 'tendring-near-you', 'tendring-dj', 'tendring-rap-it', 'tendring-gemh-schools', 'tendring-gemh-students', 'tendring-extra-0', 'tendring-extra-1', 'uttlesford-cmc', 'uttlesford-charges', 'uttlesford-brochure-2025', 'uttlesford-curriculum-cpd', 'uttlesford-instrumental-vocal', 'uttlesford-inclusion', 'uttlesford-outside-school', 'uttlesford-near-you', 'uttlesford-dj', 'uttlesford-rap-it', 'uttlesford-gemh-schools', 'uttlesford-gemh-students', 'southend-about', 'southend-schools', 'southend-wcet', 'southend-curriculum', 'southend-tuition', 'southend-cpd', 'southend-families', 'southend-ensembles', 'southend-hire', 'southend-finance', 'southend-inclusion', 'thurrock-council-music', 'thurrock-hub', 'thurrock-hire', 'thurrock-school', 'thurrock-exams', 'thurrock-ensembles', 'thurrock-events', 'thurrock-festivals', 'thurrock-parents');

INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('ems-schools-brochure', 'hub', 'greater-essex')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('ems-dj-workshop', 'hub', 'greater-essex')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('ems-rap-it-workshop', 'hub', 'greater-essex')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-cmc', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-charges', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-brochure-2025', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-curriculum-cpd', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-instrumental-vocal', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-inclusion', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-outside-school', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-near-you', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-dj', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-rap-it', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-gemh-schools', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('basildon-gemh-students', 'area', 'E07000066')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-cmc', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-charges', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-brochure-2025', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-curriculum-cpd', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-instrumental-vocal', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-inclusion', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-outside-school', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-near-you', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-dj', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-rap-it', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-gemh-schools', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-gemh-students', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('braintree-extra-0', 'area', 'E07000067')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-cmc', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-charges', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-brochure-2025', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-curriculum-cpd', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-instrumental-vocal', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-inclusion', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-outside-school', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-near-you', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-dj', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-rap-it', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-gemh-schools', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('brentwood-gemh-students', 'area', 'E07000068')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-cmc', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-charges', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-brochure-2025', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-curriculum-cpd', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-instrumental-vocal', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-inclusion', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-outside-school', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-near-you', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-dj', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-rap-it', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-gemh-schools', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('castle-point-gemh-students', 'area', 'E07000069')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-cmc', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-charges', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-brochure-2025', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-curriculum-cpd', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-instrumental-vocal', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-inclusion', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-outside-school', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-near-you', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-dj', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-rap-it', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-gemh-schools', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('chelmsford-gemh-students', 'area', 'E07000070')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-cmc', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-charges', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-brochure-2025', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-curriculum-cpd', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-instrumental-vocal', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-inclusion', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-outside-school', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-near-you', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-dj', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-rap-it', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-gemh-schools', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-gemh-students', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-extra-0', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('colchester-extra-1', 'area', 'E07000071')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-cmc', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-charges', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-brochure-2025', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-curriculum-cpd', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-instrumental-vocal', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-inclusion', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-outside-school', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-near-you', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-dj', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-rap-it', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-gemh-schools', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('epping-forest-gemh-students', 'area', 'E07000072')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-cmc', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-charges', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-brochure-2025', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-curriculum-cpd', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-instrumental-vocal', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-inclusion', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-outside-school', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-near-you', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-dj', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-rap-it', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-gemh-schools', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-gemh-students', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('harlow-extra-0', 'area', 'E07000073')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-cmc', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-charges', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-brochure-2025', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-curriculum-cpd', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-instrumental-vocal', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-inclusion', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-outside-school', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-near-you', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-dj', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-rap-it', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-gemh-schools', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('maldon-gemh-students', 'area', 'E07000074')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-cmc', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-charges', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-brochure-2025', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-curriculum-cpd', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-instrumental-vocal', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-inclusion', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-outside-school', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-near-you', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-dj', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-rap-it', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-gemh-schools', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('rochford-gemh-students', 'area', 'E07000075')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-cmc', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-charges', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-brochure-2025', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-curriculum-cpd', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-instrumental-vocal', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-inclusion', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-outside-school', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-near-you', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-dj', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-rap-it', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-gemh-schools', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-gemh-students', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-extra-0', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('tendring-extra-1', 'area', 'E07000076')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-cmc', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-charges', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-brochure-2025', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-curriculum-cpd', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-instrumental-vocal', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-inclusion', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-outside-school', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-near-you', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-dj', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-rap-it', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-gemh-schools', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('uttlesford-gemh-students', 'area', 'E07000077')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-about', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-schools', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-wcet', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-curriculum', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-tuition', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-cpd', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-families', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-ensembles', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-hire', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-finance', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('southend-inclusion', 'area', 'E06000033')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('thurrock-council-music', 'area', 'E06000034')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('thurrock-hub', 'area', 'E06000034')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('thurrock-hire', 'area', 'E06000034')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('thurrock-school', 'area', 'E06000034')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('thurrock-exams', 'area', 'E06000034')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('thurrock-ensembles', 'area', 'E06000034')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('thurrock-events', 'area', 'E06000034')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('thurrock-festivals', 'area', 'E06000034')
ON CONFLICT DO NOTHING;
INSERT INTO public.resource_scopes (resource_id, scope_type, scope_id)
VALUES ('thurrock-parents', 'area', 'E06000034')
ON CONFLICT DO NOTHING;

COMMIT;

