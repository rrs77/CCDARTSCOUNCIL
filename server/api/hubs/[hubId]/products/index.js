/**
 * Hub product catalogue CRUD.
 * GET/POST /api/hubs/:hubId/products
 * PATCH/DELETE via /api/hubs/:hubId/products/:productId (same module when routed)
 */

import {
  jsonResponse,
  optionsResponse,
  writeAuditLog,
} from '../../../../../api/_authShared.js';
import { requireHubAccess } from '../../../../../api/_hubShared.js';
import { requireServiceOr503, slugifyProduct } from '../../../../../api/_shopShared.js';

function hubIdFrom(request, context) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const hubsIdx = parts.indexOf('hubs');
  return context?.params?.hubId || parts[hubsIdx + 1];
}

function productIdFrom(request, context) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const productsIdx = parts.indexOf('products');
  return context?.params?.productId || (productsIdx >= 0 ? parts[productsIdx + 1] : null);
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request, context) {
  try {
    const hubId = hubIdFrom(request, context);
    const access = await requireHubAccess(request, {
      hubId,
      minRole: 'hub_viewer',
    });
    if (!access.ok) return access.response;

    const svc = requireServiceOr503();
    if (!svc.ok) return svc.response;

    const url = new URL(request.url);
    const includeDrafts = url.searchParams.get('all') === '1';
    let q = svc.service
      .from('hub_products')
      .select('*')
      .eq('organisation_id', access.organisation.id)
      .order('sort_order', { ascending: true });

    if (!includeDrafts) {
      q = q.eq('status', 'published');
    }

    const { data, error } = await q;
    if (error) {
      if (/hub_products|does not exist/i.test(error.message)) {
        return jsonResponse({
          products: [],
          warning: 'Shop tables not migrated yet. Apply 20260919_hub_shop_stripe.sql.',
        });
      }
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({
      organisation_id: access.organisation.id,
      products: data || [],
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to load products.' }, 500);
  }
}

export async function POST(request, context) {
  try {
    const hubId = hubIdFrom(request, context);
    const access = await requireHubAccess(request, {
      hubId,
      minRole: 'hub_editor',
    });
    if (!access.ok) return access.response;

    const svc = requireServiceOr503();
    if (!svc.ok) return svc.response;

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    if (!title) return jsonResponse({ error: 'Title is required.' }, 400);

    const pricePence = Math.max(0, Math.round(Number(body.price_pence ?? body.pricePence ?? 0)));
    const baseSlug = slugifyProduct(body.slug || title);
    let slug = baseSlug;
    for (let i = 0; i < 5; i += 1) {
      const { data: exists } = await svc.service
        .from('hub_products')
        .select('id')
        .eq('organisation_id', access.organisation.id)
        .eq('slug', slug)
        .maybeSingle();
      if (!exists) break;
      slug = `${baseSlug}-${i + 2}`;
    }

    const row = {
      organisation_id: access.organisation.id,
      slug,
      title,
      description: body.description ? String(body.description).trim() : null,
      meta_label: body.meta_label || body.meta || null,
      price_pence: pricePence,
      currency: (body.currency || 'gbp').toLowerCase(),
      status: body.status === 'published' ? 'published' : 'draft',
      fulfillment_type: body.fulfillment_type || body.fulfillmentType || 'manual',
      pack_id: body.pack_id || body.packId || null,
      resource_id: body.resource_id || body.resourceId || null,
      external_url: body.external_url || body.externalUrl || null,
      seed_product_id: body.seed_product_id || body.seedProductId || null,
      sort_order: Number(body.sort_order ?? 0) || 0,
      created_by: access.user.id,
    };

    const { data, error } = await svc.service.from('hub_products').insert(row).select('*').single();
    if (error) {
      if (/hub_products|does not exist/i.test(error.message)) {
        return jsonResponse(
          { error: 'Shop tables not migrated yet. Apply 20260919_hub_shop_stripe.sql.' },
          503,
        );
      }
      return jsonResponse({ error: error.message }, 500);
    }

    await writeAuditLog({
      actorUserId: access.user.id,
      action: 'shop.product_created',
      targetType: 'hub_products',
      targetId: data.id,
      organisationId: access.organisation.id,
      meta: { title, price_pence: pricePence },
    });

    return jsonResponse({ product: data }, 201);
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to create product.' }, 500);
  }
}

export async function PATCH(request, context) {
  try {
    const hubId = hubIdFrom(request, context);
    const productId = productIdFrom(request, context);
    if (!productId) return jsonResponse({ error: 'Product id required.' }, 400);

    const access = await requireHubAccess(request, {
      hubId,
      minRole: 'hub_editor',
    });
    if (!access.ok) return access.response;

    const svc = requireServiceOr503();
    if (!svc.ok) return svc.response;

    const body = await request.json().catch(() => ({}));
    const patch = { updated_at: new Date().toISOString() };
    if (body.title != null) patch.title = String(body.title).trim();
    if (body.description != null) patch.description = String(body.description).trim();
    if (body.meta_label != null || body.meta != null) {
      patch.meta_label = body.meta_label || body.meta || null;
    }
    if (body.price_pence != null || body.pricePence != null) {
      patch.price_pence = Math.max(0, Math.round(Number(body.price_pence ?? body.pricePence)));
    }
    if (body.status) patch.status = body.status;
    if (body.fulfillment_type || body.fulfillmentType) {
      patch.fulfillment_type = body.fulfillment_type || body.fulfillmentType;
    }
    if (body.pack_id != null || body.packId != null) patch.pack_id = body.pack_id || body.packId || null;
    if (body.resource_id != null || body.resourceId != null) {
      patch.resource_id = body.resource_id || body.resourceId || null;
    }
    if (body.external_url != null || body.externalUrl != null) {
      patch.external_url = body.external_url || body.externalUrl || null;
    }
    if (body.seed_product_id != null || body.seedProductId != null) {
      patch.seed_product_id = body.seed_product_id || body.seedProductId || null;
    }
    if (body.sort_order != null) patch.sort_order = Number(body.sort_order) || 0;
    if (body.action === 'publish') patch.status = 'published';
    if (body.action === 'unpublish') patch.status = 'draft';
    if (body.action === 'archive') patch.status = 'archived';

    const { data, error } = await svc.service
      .from('hub_products')
      .update(patch)
      .eq('id', productId)
      .eq('organisation_id', access.organisation.id)
      .select('*')
      .maybeSingle();

    if (error) return jsonResponse({ error: error.message }, 500);
    if (!data) return jsonResponse({ error: 'Product not found.' }, 404);

    await writeAuditLog({
      actorUserId: access.user.id,
      action: 'shop.product_updated',
      targetType: 'hub_products',
      targetId: productId,
      organisationId: access.organisation.id,
      meta: { fields: Object.keys(patch) },
    });

    return jsonResponse({ product: data });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to update product.' }, 500);
  }
}

export async function DELETE(request, context) {
  try {
    const hubId = hubIdFrom(request, context);
    const productId = productIdFrom(request, context);
    if (!productId) return jsonResponse({ error: 'Product id required.' }, 400);

    const access = await requireHubAccess(request, {
      hubId,
      minRole: 'hub_administrator',
    });
    if (!access.ok) return access.response;

    const svc = requireServiceOr503();
    if (!svc.ok) return svc.response;

    const { error } = await svc.service
      .from('hub_products')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('organisation_id', access.organisation.id);

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Failed to archive product.' }, 500);
  }
}
