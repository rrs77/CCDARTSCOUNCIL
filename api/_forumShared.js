/**
 * Community forum shared helpers: permissions, sanitisation, slugify, caps matrix.
 * Used by Vercel serverless routes. Auth via _authShared; hub via _hubShared.
 */

import {
  assertRateLimit,
  createServiceClient,
  corsHeaders,
  isSuspended,
  isSuperAdminProfile,
  jsonResponse,
  loadProfile,
  requireAuth,
  writeAuditLog,
} from './_authShared.js';
import { getEffectiveHubRole, hasMinHubRole } from './_hubShared.js';

export const FORUM_CAPABILITIES = [
  'forum.read',
  'forum.create_topic',
  'forum.reply',
  'forum.react',
  'forum.report',
  'forum.moderate',
  'forum.manage_categories',
  'forum.manage_settings',
  'forum.view_private_categories',
];

/** Default capability matrix by system role. */
export const ROLE_FORUM_CAPS = {
  viewer: new Set(['forum.read']),
  student: new Set(['forum.read', 'forum.react', 'forum.report']),
  teacher: new Set([
    'forum.read',
    'forum.create_topic',
    'forum.reply',
    'forum.react',
    'forum.report',
  ]),
  creator: new Set([
    'forum.read',
    'forum.create_topic',
    'forum.reply',
    'forum.react',
    'forum.report',
  ]),
  organisation: new Set([
    'forum.read',
    'forum.create_topic',
    'forum.reply',
    'forum.react',
    'forum.report',
    'forum.view_private_categories',
  ]),
  admin: new Set([
    'forum.read',
    'forum.create_topic',
    'forum.reply',
    'forum.react',
    'forum.report',
    'forum.moderate',
    'forum.manage_categories',
    'forum.manage_settings',
    'forum.view_private_categories',
  ]),
  superuser: new Set([
    'forum.read',
    'forum.create_topic',
    'forum.reply',
    'forum.react',
    'forum.report',
    'forum.moderate',
    'forum.manage_categories',
    'forum.manage_settings',
    'forum.view_private_categories',
  ]),
  super_admin: new Set([
    'forum.read',
    'forum.create_topic',
    'forum.reply',
    'forum.react',
    'forum.report',
    'forum.moderate',
    'forum.manage_categories',
    'forum.manage_settings',
    'forum.view_private_categories',
  ]),
};

export function forumCorsHeaders() {
  return corsHeaders({
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  });
}

export function forumJson(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...forumCorsHeaders(),
      ...extra,
    },
  });
}

export function forumOptions() {
  return new Response(null, { status: 204, headers: forumCorsHeaders() });
}

export function slugify(input, { max = 80 } = {}) {
  const base = String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
  return base || 'topic';
}

/**
 * Escape HTML then apply a conservative Markdown subset → HTML.
 * MIT-licensed original (CCDesigner). Client also runs DOMPurify.
 */
export function markdownToSafeHtml(md) {
  if (!md || typeof md !== 'string') return '';
  let text = md.replace(/\r\n/g, '\n').slice(0, 50_000);
  // Strip raw dangerous tags before any transform
  text = text
    .replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*iframe[\s\S]*?>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '');
  const escape = (s) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  // Fenced code blocks
  const blocks = [];
  text = text.replace(/```([\s\S]*?)```/g, (_, code) => {
    const i = blocks.length;
    blocks.push(`<pre><code>${escape(code.replace(/^\n/, ''))}</code></pre>`);
    return `\u0000BLOCK${i}\u0000`;
  });

  // Inline code
  text = text.replace(/`([^`\n]+)`/g, (_, code) => `<code>${escape(code)}</code>`);

  // Escape remaining raw HTML-ish
  text = escape(text);
  // Restore intentional tags we just inserted for code
  text = text
    .replace(/&lt;code&gt;/g, '<code>')
    .replace(/&lt;\/code&gt;/g, '</code>');

  // Links [text](url) — https/http/mailto only
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const u = url.trim();
    if (!/^(https?:\/\/|mailto:)/i.test(u) || /javascript:/i.test(u)) {
      return escape(label);
    }
    const safeHref = u.replace(/"/g, '');
    return `<a href="${safeHref}" rel="noopener noreferrer nofollow" target="_blank">${label}</a>`;
  });

  // Bold / italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Headings
  text = text.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  text = text.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  text = text.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');

  // Lists
  text = text.replace(/^(?:- |\* )(.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Paragraphs
  text = text
    .split(/\n{2,}/)
    .map((para) => {
      const t = para.trim();
      if (!t) return '';
      if (/^<(h[2-6]|ul|ol|pre|blockquote)/.test(t)) return t;
      return `<p>${t.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  // Restore fenced blocks
  text = text.replace(/\u0000BLOCK(\d+)\u0000/g, (_, i) => blocks[Number(i)] || '');

  // Final strip of event handlers / scripts if any leaked
  return sanitizeForumHtml(text);
}

/** Strip dangerous tags/attrs from HTML (server-side). */
export function sanitizeForumHtml(html) {
  if (!html || typeof html !== 'string') return '';
  let out = html
    .replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*iframe[\s\S]*?>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
    .replace(/<\s*object[\s\S]*?>[\s\S]*?<\s*\/\s*object\s*>/gi, '')
    .replace(/<\s*style[\s\S]*?>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:/gi, '');
  out = out.replace(
    /<\/?(?!\/?(p|br|strong|b|em|i|u|ul|ol|li|a|h2|h3|h4|h5|h6|blockquote|code|pre)\b)[^>]*>/gi,
    '',
  );
  return out.trim();
}

export function displayNameFromProfile(profile) {
  if (!profile) return 'Member';
  const name =
    profile.display_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    (profile.email ? profile.email.split('@')[0] : null);
  return name || 'Member';
}

export function publicAuthor(profile) {
  if (!profile) return { id: null, display_name: 'Member', role: null };
  return {
    id: profile.id,
    display_name: displayNameFromProfile(profile),
    role: profile.role,
  };
}

/**
 * Resolve forum capabilities for a profile (+ optional forum_user_status).
 */
export function resolveForumCaps(profile, forumStatus = null) {
  const caps = new Set();
  if (!profile || isSuspended(profile)) return caps;

  const roleCaps = ROLE_FORUM_CAPS[profile.role] || ROLE_FORUM_CAPS.viewer;
  for (const c of roleCaps) caps.add(c);

  if (forumStatus?.is_moderator) {
    caps.add('forum.moderate');
    caps.add('forum.view_private_categories');
  }

  // Explicit overrides
  if (profile.forum_can_moderate === true) caps.add('forum.moderate');
  if (profile.forum_can_moderate === false) caps.delete('forum.moderate');
  if (profile.forum_can_manage_categories === true) {
    caps.add('forum.manage_categories');
  }
  if (profile.forum_can_manage_categories === false) {
    caps.delete('forum.manage_categories');
  }
  if (profile.forum_can_manage_settings === true) {
    caps.add('forum.manage_settings');
  }
  if (profile.forum_can_manage_settings === false) {
    caps.delete('forum.manage_settings');
  }

  if (isSuperAdminProfile(profile)) {
    for (const c of FORUM_CAPABILITIES) caps.add(c);
  }

  // Forum suspension blocks contribute caps
  if (isForumSuspended(forumStatus)) {
    caps.delete('forum.create_topic');
    caps.delete('forum.reply');
    caps.delete('forum.react');
    // keep read + report for appeal path
  }

  return caps;
}

export function hasForumCap(caps, cap) {
  return caps instanceof Set ? caps.has(cap) : Boolean(caps?.[cap]);
}

export function isForumSuspended(forumStatus) {
  if (!forumStatus?.is_suspended) return false;
  if (forumStatus.suspended_until) {
    return new Date(forumStatus.suspended_until).getTime() > Date.now();
  }
  return true;
}

export async function loadForumStatus(userId) {
  const service = createServiceClient();
  if (!service || !userId) return null;
  const { data } = await service
    .from('forum_user_status')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

/**
 * Optional auth: returns { userId, profile, caps, forumStatus } or anonymous.
 */
export async function optionalForumAuth(request) {
  const token =
    (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim() ||
    (() => {
      try {
        return new URL(request.url).searchParams.get('access_token') || '';
      } catch {
        return '';
      }
    })();

  if (!token) {
    return {
      ok: true,
      anonymous: true,
      userId: null,
      profile: null,
      forumStatus: null,
      caps: new Set(['forum.read']),
    };
  }

  const auth = await requireAuth(request);
  if (!auth.ok) {
    // Treat invalid token as anonymous for public read endpoints
    return {
      ok: true,
      anonymous: true,
      userId: null,
      profile: null,
      forumStatus: null,
      caps: new Set(['forum.read']),
    };
  }

  const profile = await loadProfile(auth.userId);
  const forumStatus = await loadForumStatus(auth.userId);
  const caps = resolveForumCaps(profile, forumStatus);
  return {
    ok: true,
    anonymous: false,
    userId: auth.userId,
    email: auth.email,
    token: auth.token,
    profile,
    forumStatus,
    caps,
  };
}

export async function requireForumAuth(request, { capability = null, rateKey = 'forum' } = {}) {
  const rl = assertRateLimit(`${rateKey}:${request.headers.get('x-forwarded-for') || 'ip'}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) return { ok: false, response: rl.response };

  const auth = await requireAuth(request);
  if (!auth.ok) return auth;

  const profile = await loadProfile(auth.userId);
  if (!profile || isSuspended(profile)) {
    return { ok: false, response: forumJson({ error: 'Forbidden. Active account required.' }, 403) };
  }

  const forumStatus = await loadForumStatus(auth.userId);
  const caps = resolveForumCaps(profile, forumStatus);

  if (capability && !hasForumCap(caps, capability)) {
    return {
      ok: false,
      response: forumJson({ error: `Forbidden. Requires ${capability}.` }, 403),
    };
  }

  return {
    ok: true,
    ...auth,
    profile,
    forumStatus,
    caps,
  };
}

/**
 * Can the actor see this category?
 */
export async function canReadCategory(category, ctx) {
  if (!category) return false;
  const caps = ctx.caps || new Set();
  const isMod = hasForumCap(caps, 'forum.moderate') || hasForumCap(caps, 'forum.manage_categories');

  if (category.status === 'archived' && !isMod) return false;
  if (category.status === 'draft' && !isMod) return false;

  if (category.scope === 'public') return hasForumCap(caps, 'forum.read') || ctx.anonymous;

  if (ctx.anonymous || !ctx.profile) return false;

  if (isMod || isSuperAdminProfile(ctx.profile)) return true;

  if (category.scope === 'members' || category.scope === 'announcement') {
    return hasForumCap(caps, 'forum.read');
  }

  if (category.scope === 'role_restricted') {
    const roles = category.allowed_roles || [];
    if (!roles.length) return hasForumCap(caps, 'forum.read');
    return roles.includes(ctx.profile.role);
  }

  if (category.scope === 'hub' && category.hub_id) {
    if (isSuperAdminProfile(ctx.profile)) return true;
    const hubRole = await getEffectiveHubRole(ctx.profile, category.hub_id);
    return Boolean(hubRole);
  }

  return false;
}

/**
 * Can contribute (topic/reply) in category?
 */
export async function canContributeCategory(category, ctx, cap) {
  if (!(await canReadCategory(category, ctx))) return false;
  if (category.is_locked && !hasForumCap(ctx.caps, 'forum.moderate')) return false;
  if (category.status !== 'published' && !hasForumCap(ctx.caps, 'forum.manage_categories')) {
    return false;
  }
  if (category.scope === 'announcement' && !hasForumCap(ctx.caps, 'forum.moderate')) {
    // Only moderators create topics in announcements; replies may still be allowed if unlocked
    if (cap === 'forum.create_topic') return false;
  }
  // Hub: need at least hub_viewer to contribute
  if (category.scope === 'hub' && category.hub_id) {
    if (isSuperAdminProfile(ctx.profile)) return hasForumCap(ctx.caps, cap);
    const hubRole = await getEffectiveHubRole(ctx.profile, category.hub_id);
    if (!hubRole || !hasMinHubRole(hubRole, 'hub_viewer')) return false;
  }
  return hasForumCap(ctx.caps, cap);
}

export function isCategoryIndexable(category) {
  return (
    category &&
    category.status === 'published' &&
    category.scope === 'public' &&
    !category.hub_id
  );
}

export async function logForumModAction({
  actorId,
  action,
  targetType,
  targetId,
  reason,
  meta,
}) {
  const service = createServiceClient();
  if (!service) return;
  await service.from('forum_moderation_actions').insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: String(targetId),
    reason: reason || null,
    meta: meta || null,
  });
  await writeAuditLog({
    actorId,
    action: `forum.${action}`,
    targetType,
    targetId: String(targetId),
    meta,
  });
}

export async function enqueueNotification({
  userId,
  kind,
  title,
  body,
  topicId,
  postId,
  emailQueued = false,
}) {
  if (!userId) return;
  const service = createServiceClient();
  if (!service) return;
  await service.from('forum_notifications').insert({
    user_id: userId,
    kind,
    title,
    body: body || null,
    topic_id: topicId || null,
    post_id: postId || null,
    email_queued: emailQueued,
  });
}

export async function loadProfilesByIds(ids) {
  const service = createServiceClient();
  if (!service || !ids?.length) return new Map();
  const unique = [...new Set(ids.filter(Boolean))];
  const { data } = await service
    .from('profiles')
    .select('id, display_name, first_name, last_name, email, role, status')
    .in('id', unique);
  const map = new Map();
  for (const p of data || []) map.set(p.id, p);
  return map;
}

export function pageParams(url, { defaultLimit = 20, maxLimit = 50 } = {}) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(url.searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit),
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
