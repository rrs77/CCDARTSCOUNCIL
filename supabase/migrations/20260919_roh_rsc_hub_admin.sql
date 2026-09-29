-- =============================================================================
-- ROH + RSC organisation hubs (admin editing via HubAdminDashboard)
-- Idempotent. Grants public pages editable under Settings → Hub admin when a
-- user has hub_memberships (or is super_admin).
-- =============================================================================

INSERT INTO public.organisations (
  id, name, partner_slug, slug, display_name, short_name, site_url, logo_src,
  primary_color, accent_color, logo_invert, logo_on_plate, logo_panel_color,
  paid, interactive, status, aliases
) VALUES
  (
    'roh', 'Royal Ballet and Opera', 'roh', 'roh', 'Royal Ballet and Opera', 'ROH',
    'https://www.rbo.org.uk/schools/', '/partners/royal-opera-house.svg',
    '#1a1033', '#C9A227', true, false, '#1a1033',
    false, true, 'active', ARRAY['royal-opera-house', 'rbo', 'royalballetopera']
  ),
  (
    'rsc', 'RSC Education', 'rsc', 'rsc', 'RSC Education', 'RSC',
    'https://www.rsc.org.uk/learn/schools-and-teachers/', '/partners/rsc-education.svg',
    '#111111', '#C8102E', true, false, '#111111',
    false, true, 'active', ARRAY['rsceducation', 'royalshakespeare', 'royal-shakespeare-company']
  )
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  display_name = EXCLUDED.display_name,
  short_name = EXCLUDED.short_name,
  site_url = EXCLUDED.site_url,
  logo_src = EXCLUDED.logo_src,
  primary_color = EXCLUDED.primary_color,
  accent_color = EXCLUDED.accent_color,
  logo_invert = EXCLUDED.logo_invert,
  logo_panel_color = EXCLUDED.logo_panel_color,
  interactive = true,
  status = 'active',
  aliases = EXCLUDED.aliases,
  partner_slug = EXCLUDED.partner_slug,
  name = EXCLUDED.name,
  updated_at = NOW();

INSERT INTO public.hub_pages (
  organisation_id, tagline, description, intro_html, published_revision, published_at, updated_at
) VALUES
  (
    'roh',
    'Create & Dance resources for schools',
    ARRAY[
      'The Royal Ballet and Opera creates world-class ballet and opera education resources for schools.',
      'Hub admins can edit this page and resources from Settings → Hub admin.'
    ],
    '',
    1,
    NOW(),
    NOW()
  ),
  (
    'rsc',
    'Shakespeare for every classroom',
    ARRAY[
      'RSC Education supports schools with rehearsal-room approaches to Shakespeare — from Key Stage 1 to A-Level.',
      'Hub admins can edit this page and resources from Settings → Hub admin.'
    ],
    '',
    1,
    NOW(),
    NOW()
  )
ON CONFLICT (organisation_id) DO UPDATE SET
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  updated_at = NOW();
