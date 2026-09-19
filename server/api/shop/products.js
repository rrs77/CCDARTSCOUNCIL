/**
 * Public published hub products (for basket / hub storefront).
 * GET /api/shop/products?organisation_id=ems
 */

import { jsonResponse, optionsResponse, createServiceClient } from '../../../api/_authShared.js';
import { productToBasketShape } from '../../../api/_shopShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const service = createServiceClient();
    if (!service) {
      return jsonResponse({ products: [], warning: 'Server not configured.' });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('organisation_id') || url.searchParams.get('hub');
    let q = service
      .from('hub_products')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .limit(200);
    if (orgId) q = q.eq('organisation_id', orgId);

    const { data, error } = await q;
    if (error) {
      if (/hub_products|does not exist/i.test(error.message)) {
        return jsonResponse({ products: [], warning: 'Shop tables not migrated.' });
      }
      return jsonResponse({ error: error.message }, 500);
    }

    const orgIds = [...new Set((data || []).map((p) => p.organisation_id))];
    let orgName = {};
    if (orgIds.length) {
      const { data: orgs } = await service
        .from('organisations')
        .select('id, display_name, name')
        .in('id', orgIds);
      orgName = Object.fromEntries(
        (orgs || []).map((o) => [o.id, o.display_name || o.name || o.id]),
      );
    }

    return jsonResponse({
      products: (data || []).map((p) => productToBasketShape(p, orgName[p.organisation_id])),
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to list products.' }, 500);
  }
}
