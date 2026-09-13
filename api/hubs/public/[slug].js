/**
 * Public / signed-in published hub content by slug (no admin secrets).
 * GET /api/hubs/public/:slug
 */

import {
  createServiceClient,
  jsonResponse,
  optionsResponse,
} from '../../_authShared.js';
import { resolveOrganisation } from '../../_hubShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request, context) {
  try {
    const parts = new URL(request.url).pathname.split('/').filter(Boolean);
    const slug = context?.params?.slug || parts[parts.length - 1];
    const organisation = await resolveOrganisation({ slug });
    if (!organisation || organisation.status !== 'active') {
      return jsonResponse({ error: 'Hub not found.' }, 404);
    }

    const service = createServiceClient();
    const orgId = organisation.id;

    const [pageRes, resourcesRes, collectionsRes, activitiesRes, mediaRes] =
      await Promise.all([
        service.from('hub_pages').select('*').eq('organisation_id', orgId).maybeSingle(),
        service
          .from('resources')
          .select(
            'id, title, description, resource_type, collection_id, is_free, pricing_note, age_range, key_stages, subjects, tags, sort_order, preview_url, related_resource_id, status',
          )
          .eq('organisation_id', orgId)
          .eq('status', 'published')
          .order('sort_order'),
        service
          .from('resource_collections')
          .select('*')
          .eq('organisation_id', orgId)
          .order('sort_order'),
        service
          .from('hub_activities')
          .select('*')
          .eq('organisation_id', orgId)
          .eq('status', 'published')
          .order('sort_order'),
        service
          .from('hub_media')
          .select('*')
          .eq('organisation_id', orgId)
          .order('sort_order'),
      ]);

    const page = pageRes.data;
    if (!page?.published_at) {
      // Fall back to empty structured page — client may use hard-coded defaults
      return jsonResponse({
        organisation: {
          slug: organisation.slug,
          display_name: organisation.display_name,
          short_name: organisation.short_name,
          site_url: organisation.site_url,
          logo_src: organisation.logo_src,
          primary_color: organisation.primary_color,
          accent_color: organisation.accent_color,
          logo_on_plate: organisation.logo_on_plate,
          logo_panel_color: organisation.logo_panel_color,
          paid: organisation.paid,
        },
        page: null,
        resources: [],
        collections: [],
        activities: [],
        media: mediaRes.data || [],
      });
    }

    // Never expose draft_content or external_url on public listing —
    // downloads go through /api/resources/:id/download
    return jsonResponse({
      organisation: {
        slug: organisation.slug,
        display_name: organisation.display_name,
        short_name: organisation.short_name,
        site_url: organisation.site_url,
        logo_src: organisation.logo_src,
        primary_color: organisation.primary_color,
        accent_color: organisation.accent_color,
        logo_on_plate: organisation.logo_on_plate,
        logo_panel_color: organisation.logo_panel_color,
        paid: organisation.paid,
      },
      page: {
        tagline: page.tagline,
        description: page.description,
        intro_html: page.intro_html,
        headings: page.headings,
        featured: page.featured,
        packs: page.packs,
        gallery: page.gallery,
        contact: page.contact,
        images: page.images,
        published_at: page.published_at,
        published_revision: page.published_revision,
      },
      resources: resourcesRes.data || [],
      collections: collectionsRes.data || [],
      activities: activitiesRes.data || [],
      media: mediaRes.data || [],
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to load public hub.' }, 500);
  }
}
