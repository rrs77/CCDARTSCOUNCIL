/**
 * Download / resource helpers: allow-list, CSV sanitisation, geolocation cache.
 */

import { createServiceClient, jsonResponse } from './_authShared.js';

/** Hosts allowed as redirect targets for tracked downloads. */
export const ALLOWED_DOWNLOAD_HOSTS = new Set([
  'www.rhythmstix.co.uk',
  'rhythmstix.co.uk',
  'www.jazznorth.org',
  'jazznorth.org',
  'wiudrzdkbpyziaodqoog.supabase.co',
]);

/** Extra hosts from env (comma-separated), e.g. custom CDN. */
export function getExtraAllowedHosts() {
  const raw = process.env.DOWNLOAD_ALLOWLIST_HOSTS || '';
  return raw
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowListedUrl(urlString) {
  try {
    const u = new URL(urlString);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const host = u.hostname.toLowerCase();
    if (ALLOWED_DOWNLOAD_HOSTS.has(host)) return true;
    if (getExtraAllowedHosts().includes(host)) return true;
    // Same-origin relative paths are resolved by caller; absolute only here.
    if (host.endsWith('.supabase.co') && u.pathname.includes('/storage/v1/object/')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Prevent CSV/XLSX formula injection (Excel/Sheets treat leading =+-@ as formulae).
 */
export function sanitizeSpreadsheetCell(value) {
  if (value == null) return '';
  const s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) {
    return `'${s}`;
  }
  return s;
}

export function toCsv(rows, columns) {
  const escape = (v) => {
    const safe = sanitizeSpreadsheetCell(v);
    if (/[",\n\r]/.test(safe)) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  };
  const header = columns.map((c) => escape(c.header)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escape(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','),
  );
  // BOM helps Excel recognise UTF-8
  return `\uFEFF${[header, ...lines].join('\n')}`;
}

const geoCache = new Map();
const GEO_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Non-blocking IP geolocation via ipapi.co (no key required for light use).
 * Returns cached { country, region, city } or null. Never throws.
 */
export async function lookupGeo(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return null;
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.ts < GEO_TTL_MS) return cached.data;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;
    const data = {
      country: json.country_name || json.country || null,
      region: json.region || null,
      city: json.city || null,
      country_code: json.country_code || null,
    };
    geoCache.set(ip, { ts: Date.now(), data });
    return data;
  } catch {
    return null;
  }
}

/**
 * Resolve resource by stable id from `resources` table.
 * Falls back to seed registry JSON embedded in env is not used — DB is source of truth after migration.
 */
export async function getResourceById(resourceId) {
  const service = createServiceClient();
  if (!service) return null;
  const { data, error } = await service
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .maybeSingle();
  if (error) {
    console.warn('getResourceById:', error.message);
    return null;
  }
  return data;
}

/**
 * Check user may download: active, not suspended, and either public_auth resource
 * or partner_slug granted via admin_preset / organisation match.
 * Jazz North learning packs: any signed-in active user may download (auth gate only).
 */
export function userMayDownload(profile, resource) {
  if (!profile || !resource) return false;
  if (profile.status === 'suspended' || profile.anonymised_at) return false;
  if (resource.requires_auth === false) return true;
  // Auth-required resources: any active authenticated user
  if (profile.status === 'invited') return false;
  return true;
}

export function redirectResponse(url) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      'Cache-Control': 'no-store',
      ...Object.fromEntries(
        Object.entries({
          'Access-Control-Allow-Origin': '*',
        }),
      ),
    },
  });
}

export function formatUkDateTime(iso, timeZone = 'Europe/London') {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export { jsonResponse };
