/**
 * Lesson ↔ viewer links API.
 * Routed via /api/router?__route=slides-links/... (no new /api entrypoint).
 *
 * GET  /api/slides-links/list
 * POST /api/slides-links/attach | detach | reorder | pick | apply-scheme
 *      | scheme-attach | scheme-detach | org-copy
 */

import { randomUUID } from 'node:crypto';
import {
  assertRateLimit,
  createServiceClient,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';

const MAX_LINKS = 12;
const LOCAL_MIRROR_HINT = 'ccd-lesson-viewer-links-v1';

function pathTail(request) {
  try {
    const u = new URL(request.url);
    const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    // /api/slides-links/<action>
    const i = parts.indexOf('slides-links');
    return i >= 0 ? parts.slice(i + 1) : [];
  } catch {
    return [];
  }
}

function lessonKey(year, sheet, lesson) {
  return `${year}/${sheet}/${lesson}`;
}

function isActiveProfile(profile) {
  if (!profile) return false;
  if (profile.anonymised_at) return false;
  const status = profile.status == null ? 'active' : String(profile.status);
  return status !== 'suspended';
}

function orgIdOf(profile) {
  const org = typeof profile?.organisation_id === 'string' ? profile.organisation_id.trim() : '';
  return org || null;
}

async function rate(userId, action) {
  return assertRateLimit(`slides-links:${action}:${userId}`, {
    limit: 60,
    windowMs: 60_000,
  });
}

/** Load viewer rows for enrichment. */
async function loadViewers(service, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const { data, error } = await service
    .from('interactive_lessons')
    .select('id, title, status, source, owner_id, is_original, derived_from_viewer_id, root_viewer_id, organisation_id, archived_at, data, updated_at')
    .in('id', unique);
  if (error) throw new Error(error.message);
  const map = new Map();
  for (const row of data || []) map.set(row.id, row);
  return map;
}

function sceneCount(data) {
  try {
    const scenes = data?.scenes;
    return Array.isArray(scenes) ? scenes.length : 0;
  } catch {
    return 0;
  }
}

function thumbFrom(data) {
  try {
    const scenes = data?.scenes;
    if (!Array.isArray(scenes) || !scenes.length) return null;
    const s = scenes[0];
    return s?.backgroundImage || s?.mediaUrl || s?.thumbUrl || data?.coverUrl || null;
  } catch {
    return null;
  }
}

function enrichLink(link, viewer, callerId, orgNameById) {
  if (!viewer) {
    return {
      id: link.id,
      viewerId: link.viewer_id,
      title: 'Unavailable',
      thumb: null,
      status: 'missing',
      isOriginal: false,
      derivedFrom: null,
      rootViewerId: null,
      orgName: null,
      origin: link.origin,
      position: link.position,
      available: false,
      reason: 'not-found',
      slideCount: 0,
    };
  }
  const archived = Boolean(viewer.archived_at);
  const published = viewer.status === 'published';
  const owned = viewer.owner_id === callerId;
  const isOriginal = Boolean(viewer.is_original) || viewer.source === 'demo' || viewer.source === 'hub';
  let available = !archived && (published || owned);
  let reason = null;
  if (archived) {
    available = false;
    reason = 'archived';
  } else if (!published && !owned) {
    available = false;
    reason = 'unpublished';
  }
  return {
    id: link.id,
    viewerId: viewer.id,
    title: viewer.title || 'Untitled slides',
    thumb: thumbFrom(viewer.data),
    status: viewer.status,
    isOriginal,
    derivedFrom: viewer.derived_from_viewer_id || null,
    rootViewerId: viewer.root_viewer_id || viewer.id,
    orgName: viewer.organisation_id ? orgNameById.get(viewer.organisation_id) || null : null,
    origin: link.origin,
    position: link.position,
    available,
    reason,
    slideCount: sceneCount(viewer.data),
    source: viewer.source,
  };
}

function sortLinks(enriched) {
  return [...enriched].sort((a, b) => {
    if (a.isOriginal !== b.isOriginal) return a.isOriginal ? -1 : 1;
    if (a.position !== b.position) return a.position - b.position;
    return String(a.title).localeCompare(String(b.title));
  });
}

function chooseDefault(enriched, pickViewerId, lastUsedViewerId) {
  const usable = enriched.filter((l) => l.available);
  if (pickViewerId && usable.some((l) => l.viewerId === pickViewerId)) return pickViewerId;
  if (lastUsedViewerId && usable.some((l) => l.viewerId === lastUsedViewerId)) return lastUsedViewerId;
  const original = usable.find((l) => l.isOriginal);
  if (original) return original.viewerId;
  return usable[0]?.viewerId || null;
}

async function listLessonLinks(service, userId, year, sheet, lesson) {
  const { data: links, error } = await service
    .from('lesson_viewer_links')
    .select('*')
    .eq('scope', 'lesson')
    .eq('owner_user_id', userId)
    .eq('academic_year', year)
    .eq('sheet_name', sheet)
    .eq('lesson_number', lesson)
    .eq('detached_by_teacher', false)
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return links || [];
}

async function handleList(request, service, userId) {
  const u = new URL(request.url);
  const year = (u.searchParams.get('year') || '').trim();
  const sheet = (u.searchParams.get('sheet') || '').trim();
  const lesson = (u.searchParams.get('lesson') || '').trim();
  const schemeId = (u.searchParams.get('schemeId') || '').trim();

  if (schemeId) {
    if (!lesson) return jsonResponse({ error: 'lesson is required' }, 422);
    const { data: links, error } = await service
      .from('lesson_viewer_links')
      .select('*')
      .eq('scope', 'scheme')
      .eq('scheme_id', schemeId)
      .eq('lesson_number', lesson)
      .order('position', { ascending: true });
    if (error) return jsonResponse({ error: error.message }, 400);
    const viewers = await loadViewers(service, (links || []).map((l) => l.viewer_id));
    const enriched = sortLinks((links || []).map((l) => enrichLink(l, viewers.get(l.viewer_id), userId, new Map())));
    return jsonResponse({ links: enriched, defaultViewerId: chooseDefault(enriched, null, null), canEdit: true });
  }

  if (!year || !sheet || !lesson) {
    return jsonResponse({ error: 'year, sheet and lesson are required' }, 422);
  }

  const links = await listLessonLinks(service, userId, year, sheet, lesson);
  const viewers = await loadViewers(service, links.map((l) => l.viewer_id));

  const orgIds = [...new Set([...viewers.values()].map((v) => v.organisation_id).filter(Boolean))];
  const orgNameById = new Map();
  if (orgIds.length) {
    const { data: orgs } = await service.from('organisations').select('id, name').in('id', orgIds);
    for (const o of orgs || []) orgNameById.set(o.id, o.name || o.id);
  }

  const key = lessonKey(year, sheet, lesson);
  const { data: pick } = await service
    .from('lesson_viewer_picks')
    .select('viewer_id, last_scene')
    .eq('user_id', userId)
    .eq('lesson_key', key)
    .maybeSingle();

  const { data: lastPick } = await service
    .from('lesson_viewer_picks')
    .select('viewer_id')
    .eq('user_id', userId)
    .order('picked_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const enriched = sortLinks(links.map((l) => enrichLink(l, viewers.get(l.viewer_id), userId, orgNameById)));
  return jsonResponse({
    links: enriched,
    defaultViewerId: chooseDefault(enriched, pick?.viewer_id, lastPick?.viewer_id),
    lastScene: pick?.last_scene ?? null,
    canEdit: true,
    mirrorKey: LOCAL_MIRROR_HINT,
  });
}

async function handleAttach(body, service, userId) {
  const year = String(body.year || '').trim();
  const sheet = String(body.sheet || '').trim();
  const lesson = String(body.lesson || '').trim();
  const viewerId = String(body.viewerId || '').trim();
  if (!year || !sheet || !lesson || !viewerId) {
    return jsonResponse({ error: 'year, sheet, lesson and viewerId are required' }, 422);
  }

  const existing = await listLessonLinks(service, userId, year, sheet, lesson);
  if (existing.some((l) => l.viewer_id === viewerId)) {
    return jsonResponse({ error: 'Already linked', code: 'duplicate' }, 409);
  }
  if (existing.length >= MAX_LINKS) {
    return jsonResponse({ error: `Limit ${MAX_LINKS} slideshows per lesson`, code: 'limit' }, 422);
  }

  const { data: viewer, error: vErr } = await service
    .from('interactive_lessons')
    .select('id')
    .eq('id', viewerId)
    .maybeSingle();
  if (vErr) return jsonResponse({ error: vErr.message }, 400);
  if (!viewer) return jsonResponse({ error: 'Viewer not found' }, 404);

  const maxPos = existing.reduce((m, l) => Math.max(m, l.position || 0), -1);
  const position = Number.isFinite(body.position) ? Number(body.position) : maxPos + 1;

  const { data, error } = await service
    .from('lesson_viewer_links')
    .insert({
      scope: 'lesson',
      owner_user_id: userId,
      academic_year: year,
      sheet_name: sheet,
      lesson_number: lesson,
      viewer_id: viewerId,
      position,
      origin: 'manual',
      created_by: userId,
      detached_by_teacher: false,
    })
    .select('*')
    .single();
  if (error) {
    if (String(error.message || '').includes('duplicate') || error.code === '23505') {
      return jsonResponse({ error: 'Already linked', code: 'duplicate' }, 409);
    }
    return jsonResponse({ error: error.message }, 400);
  }

  // Keep legacy mirror for one release
  try {
    await service.rpc('noop').catch(() => null);
  } catch {
    /* ignore */
  }

  return jsonResponse({ link: data }, 201);
}

async function handleDetach(body, service, userId) {
  const linkId = String(body.linkId || '').trim();
  if (!linkId) return jsonResponse({ error: 'linkId is required' }, 422);

  const { data: link, error } = await service
    .from('lesson_viewer_links')
    .select('*')
    .eq('id', linkId)
    .maybeSingle();
  if (error) return jsonResponse({ error: error.message }, 400);
  if (!link) return jsonResponse({ error: 'Not found' }, 404);
  if (link.scope === 'lesson' && link.owner_user_id !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  if (link.origin === 'scheme' && link.scope === 'lesson') {
    const { error: upErr } = await service
      .from('lesson_viewer_links')
      .update({ detached_by_teacher: true, updated_at: new Date().toISOString() })
      .eq('id', linkId);
    if (upErr) return jsonResponse({ error: upErr.message }, 400);
    return jsonResponse({ ok: true, soft: true });
  }

  const { error: delErr } = await service.from('lesson_viewer_links').delete().eq('id', linkId);
  if (delErr) return jsonResponse({ error: delErr.message }, 400);
  return jsonResponse({ ok: true });
}

async function handleReorder(body, service, userId) {
  const year = String(body.year || '').trim();
  const sheet = String(body.sheet || '').trim();
  const lesson = String(body.lesson || '').trim();
  const orderedLinkIds = Array.isArray(body.orderedLinkIds) ? body.orderedLinkIds.map(String) : [];
  if (!year || !sheet || !lesson || !orderedLinkIds.length) {
    return jsonResponse({ error: 'year, sheet, lesson and orderedLinkIds are required' }, 422);
  }

  const links = await listLessonLinks(service, userId, year, sheet, lesson);
  const byId = new Map(links.map((l) => [l.id, l]));
  const viewers = await loadViewers(
    service,
    links.map((l) => l.viewer_id),
  );

  // Original stays first: strip originals from reorder list and re-pin them
  const originals = links.filter((l) => {
    const v = viewers.get(l.viewer_id);
    return Boolean(v?.is_original) || v?.source === 'demo' || v?.source === 'hub';
  });
  const originalIds = new Set(originals.map((l) => l.id));
  const rest = orderedLinkIds.filter((id) => byId.has(id) && !originalIds.has(id));

  let pos = 0;
  for (const o of originals) {
    await service
      .from('lesson_viewer_links')
      .update({ position: pos++, updated_at: new Date().toISOString() })
      .eq('id', o.id)
      .eq('owner_user_id', userId);
  }
  for (const id of rest) {
    await service
      .from('lesson_viewer_links')
      .update({ position: pos++, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_user_id', userId);
  }

  const refreshed = await listLessonLinks(service, userId, year, sheet, lesson);
  return jsonResponse({ links: refreshed });
}

async function handlePick(body, service, userId) {
  const year = String(body.year || '').trim();
  const sheet = String(body.sheet || '').trim();
  const lesson = String(body.lesson || '').trim();
  const viewerId = String(body.viewerId || '').trim();
  const lastScene =
    body.lastScene != null && Number.isFinite(Number(body.lastScene))
      ? Math.max(1, Math.floor(Number(body.lastScene)))
      : null;
  if (!year || !sheet || !lesson || !viewerId) {
    return jsonResponse({ error: 'year, sheet, lesson and viewerId are required' }, 422);
  }
  const key = lessonKey(year, sheet, lesson);
  const { error } = await service.from('lesson_viewer_picks').upsert(
    {
      user_id: userId,
      lesson_key: key,
      viewer_id: viewerId,
      last_scene: lastScene,
      picked_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_key' },
  );
  if (error) return jsonResponse({ error: error.message }, 400);
  return jsonResponse({ defaultViewerId: viewerId, lastScene });
}

async function handleApplyScheme(body, service, userId) {
  const schemeId = String(body.schemeId || '').trim();
  const year = String(body.year || '').trim();
  const sheet = String(body.sheet || '').trim();
  const lessonNumbers = Array.isArray(body.lessonNumbers)
    ? body.lessonNumbers.map(String)
    : [];
  if (!schemeId || !year || !sheet || !lessonNumbers.length) {
    return jsonResponse({ error: 'schemeId, year, sheet and lessonNumbers are required' }, 422);
  }

  const { data: templates, error } = await service
    .from('lesson_viewer_links')
    .select('*')
    .eq('scope', 'scheme')
    .eq('scheme_id', schemeId)
    .in('lesson_number', lessonNumbers);
  if (error) return jsonResponse({ error: error.message }, 400);

  let added = 0;
  let skipped = 0;
  for (const t of templates || []) {
    const existing = await listLessonLinks(service, userId, year, sheet, t.lesson_number);
    if (existing.some((l) => l.viewer_id === t.viewer_id)) {
      skipped += 1;
      continue;
    }
    // Soft-detached rows: skip re-add
    const { data: detached } = await service
      .from('lesson_viewer_links')
      .select('id')
      .eq('scope', 'lesson')
      .eq('owner_user_id', userId)
      .eq('academic_year', year)
      .eq('sheet_name', sheet)
      .eq('lesson_number', t.lesson_number)
      .eq('viewer_id', t.viewer_id)
      .eq('detached_by_teacher', true)
      .maybeSingle();
    if (detached) {
      skipped += 1;
      continue;
    }
    if (existing.length >= MAX_LINKS) {
      skipped += 1;
      continue;
    }
    const maxPos = existing.reduce((m, l) => Math.max(m, l.position || 0), -1);
    const { error: insErr } = await service.from('lesson_viewer_links').insert({
      scope: 'lesson',
      owner_user_id: userId,
      academic_year: year,
      sheet_name: sheet,
      lesson_number: t.lesson_number,
      viewer_id: t.viewer_id,
      position: maxPos + 1,
      origin: 'scheme',
      source_link_id: t.id,
      created_by: userId,
      detached_by_teacher: false,
    });
    if (insErr) {
      skipped += 1;
    } else {
      added += 1;
    }
  }
  return jsonResponse({ added, skipped });
}

async function handleSchemeAttach(body, service, userId, profile) {
  const schemeId = String(body.schemeId || '').trim();
  const lesson = String(body.lesson || '').trim();
  const viewerId = String(body.viewerId || '').trim();
  const schemeOwnerOrg = String(body.schemeOwnerOrg || orgIdOf(profile) || '').trim() || null;
  if (!schemeId || !lesson || !viewerId) {
    return jsonResponse({ error: 'schemeId, lesson and viewerId are required' }, 422);
  }
  const { data, error } = await service
    .from('lesson_viewer_links')
    .insert({
      scope: 'scheme',
      scheme_id: schemeId,
      scheme_owner_org: schemeOwnerOrg,
      lesson_number: lesson,
      viewer_id: viewerId,
      position: Number(body.position) || 0,
      origin: 'manual',
      created_by: userId,
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') return jsonResponse({ error: 'Already linked', code: 'duplicate' }, 409);
    return jsonResponse({ error: error.message }, 400);
  }
  return jsonResponse({ link: data }, 201);
}

async function handleSchemeDetach(body, service) {
  const linkId = String(body.linkId || '').trim();
  if (!linkId) return jsonResponse({ error: 'linkId is required' }, 422);
  const { error } = await service
    .from('lesson_viewer_links')
    .delete()
    .eq('id', linkId)
    .eq('scope', 'scheme');
  if (error) return jsonResponse({ error: error.message }, 400);
  return jsonResponse({ ok: true });
}

async function handleOrgCopy(body, service, userId, profile) {
  const viewerId = String(body.viewerId || '').trim();
  const organisationId = String(body.organisationId || orgIdOf(profile) || '').trim();
  if (!viewerId || !organisationId) {
    return jsonResponse({ error: 'viewerId and organisationId are required' }, 422);
  }

  const { data: src, error } = await service
    .from('interactive_lessons')
    .select('*')
    .eq('id', viewerId)
    .maybeSingle();
  if (error) return jsonResponse({ error: error.message }, 400);
  if (!src) return jsonResponse({ error: 'Viewer not found' }, 404);

  const newId = `ilv_${randomUUID()}`;
  const rootId = src.root_viewer_id || src.id;
  const { data: created, error: insErr } = await service
    .from('interactive_lessons')
    .insert({
      id: newId,
      owner_id: userId,
      title: `${src.title || 'Slides'} (org copy)`,
      description: src.description || '',
      status: 'draft',
      source: 'user',
      data: src.data,
      is_original: false,
      derived_from_viewer_id: src.id,
      root_viewer_id: rootId,
      organisation_id: organisationId,
      attached_lesson_keys: [],
    })
    .select('*')
    .single();
  if (insErr) return jsonResponse({ error: insErr.message }, 400);
  return jsonResponse({ viewer: created }, 201);
}

export async function OPTIONS(request) {
  return optionsResponse(request);
}

export async function GET(request) {
  if (request.method === 'OPTIONS') return optionsResponse(request);
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const rl = await rate(auth.userId, 'get');
  if (!rl.ok) return rl.response;

  const service = createServiceClient();
  if (!service) return jsonResponse({ error: 'Server configuration error.' }, 500);

  const tail = pathTail(request);
  const action = tail[0] || 'list';
  try {
    if (action === 'list') return await handleList(request, service, auth.userId);
    return jsonResponse({ error: `Unknown action: ${action}` }, 404);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Server error' }, 500);
  }
}

export async function POST(request) {
  if (request.method === 'OPTIONS') return optionsResponse(request);
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const rl = await rate(auth.userId, 'post');
  if (!rl.ok) return rl.response;

  const service = createServiceClient();
  if (!service) return jsonResponse({ error: 'Server configuration error.' }, 500);

  const profile = await loadProfile(auth.userId);
  if (!isActiveProfile(profile)) return jsonResponse({ error: 'Forbidden' }, 403);

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const tail = pathTail(request);
  const action = tail[0] || '';
  try {
    switch (action) {
      case 'attach':
        return await handleAttach(body, service, auth.userId);
      case 'detach':
        return await handleDetach(body, service, auth.userId);
      case 'reorder':
        return await handleReorder(body, service, auth.userId);
      case 'pick':
        return await handlePick(body, service, auth.userId);
      case 'apply-scheme':
        return await handleApplyScheme(body, service, auth.userId);
      case 'scheme-attach':
        return await handleSchemeAttach(body, service, auth.userId, profile);
      case 'scheme-detach':
        return await handleSchemeDetach(body, service);
      case 'org-copy':
        return await handleOrgCopy(body, service, auth.userId, profile);
      default:
        return jsonResponse({ error: `Unknown action: ${action || '(none)'}` }, 404);
    }
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Server error' }, 500);
  }
}
