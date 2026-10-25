/**
 * SSRF-safe audio fetch for Whisper / ILV transcribe.
 * Pattern matches lesson-attachments: https-only, exact host allowlist from
 * config/env (never from the request), manual redirects, private-IP reject,
 * streamed size cap, audio/* only.
 */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { DEFAULT_SUPABASE_URL } from './_authShared.js';

export const AUDIO_MAX_BYTES = 25 * 1024 * 1024;
export const AUDIO_FETCH_TIMEOUT_MS = 20_000;
export const AUDIO_MAX_REDIRECTS = 3;

/**
 * Exact host allowlist from server env / config only — never from the request.
 * Supabase storage host, DreamHost download/upload hosts, and our own site.
 *
 * AI_AUDIO_FETCH_ALLOWLIST / AUDIO_FETCH_ALLOWLIST (comma-separated hosts) may
 * extend this list for staging mirrors — NEVER add third-party or user-controlled
 * hosts; anything listed here is fetchable by any entitled AI caller.
 */
export function getAllowedAudioHosts() {
  const hosts = new Set();
  const addUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    try {
      const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const u = new URL(withProto);
      const host = u.hostname.toLowerCase().replace(/\.$/, '');
      if (host) hosts.add(host);
    } catch {
      /* ignore bad env */
    }
  };

  addUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
  addUrl(process.env.DREAMHOST_PDF_DOWNLOAD_URL || process.env.PDF_DOWNLOAD_URL);
  addUrl(process.env.DREAMHOST_FILE_DOWNLOAD_URL || process.env.FILE_DOWNLOAD_URL);
  addUrl(process.env.DREAMHOST_PDF_UPLOAD_URL || process.env.PDF_UPLOAD_URL);
  addUrl(process.env.DREAMHOST_FILE_UPLOAD_URL || process.env.FILE_UPLOAD_URL);
  addUrl(process.env.VITE_APP_URL || process.env.APP_URL);
  if (process.env.VERCEL_URL) addUrl(process.env.VERCEL_URL);

  // Extra hosts from env — must never include third-party / user-controlled hosts.
  const extra = process.env.AI_AUDIO_FETCH_ALLOWLIST || process.env.AUDIO_FETCH_ALLOWLIST || '';
  for (const part of extra.split(',')) addUrl(part);

  return hosts;
}

/** Site origin used only to resolve root-relative paths (from env, not request). */
export function getOwnSiteOrigin() {
  const raw =
    process.env.VITE_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '')}` : '');
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (u.protocol !== 'https:') return null;
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * True when the IP is not safe unicast public (private, loopback, link-local,
 * unspecified, multicast, benchmarking, or unparseable).
 * Small helper — ipaddr.js is not a dependency (node:net BlockList alternative).
 */
export function isBlockedIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const v = isIP(ip);
  if (v === 4) {
    const parts = ip.split('.').map((n) => Number(n));
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
      return true;
    }
    if (parts[0] === 0 || parts[0] === 127) return true; // this / loopback
    if (parts[0] === 10) return true;
    if (parts[0] === 169 && parts[1] === 254) return true; // link-local / metadata
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true; // CGNAT
    // 192.0.0.0/24 (IETF protocol assignments / "this network" extras)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;
    // 198.18.0.0/15 benchmarking
    if (parts[0] === 198 && parts[1] >= 18 && parts[1] <= 19) return true;
    // 224.0.0.0/4 multicast and above (including 255.255.255.255)
    if (parts[0] >= 224) return true;
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    // IPv4-mapped dotted ::ffff:a.b.c.d
    const mappedDotted = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (mappedDotted) return isBlockedIp(mappedDotted[1]);
    // IPv4-mapped hex ::ffff:7f00:1 → 127.0.0.1
    const mappedHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
    if (mappedHex) {
      const hi = Number.parseInt(mappedHex[1], 16);
      const lo = Number.parseInt(mappedHex[2], 16);
      if (Number.isFinite(hi) && Number.isFinite(lo)) {
        const a = (hi >> 8) & 0xff;
        const b = hi & 0xff;
        const c = (lo >> 8) & 0xff;
        const d = lo & 0xff;
        return isBlockedIp(`${a}.${b}.${c}.${d}`);
      }
    }
    // Expand first hextet(s) for prefix checks
    const hextets = lower.split(':').filter((h) => h.length > 0);
    const first = Number.parseInt(hextets[0] || '0', 16);
    const second = Number.parseInt(hextets[1] || '0', 16);
    if (!Number.isFinite(first)) return true;
    if (first >= 0xfc00 && first <= 0xfdff) return true; // unique local
    if (first >= 0xfe80 && first <= 0xfebf) return true; // link-local
    if (first >= 0xff00) return true; // ff00::/8 multicast
    // 64:ff9b::/96 NAT64 well-known prefix
    if (first === 0x64 && second === 0xff9b) return true;
    return false;
  }
  return true;
}

export function normalizeHostname(hostname) {
  return String(hostname || '')
    .toLowerCase()
    .replace(/\.$/, '');
}

/**
 * Parse and validate a client-supplied audio URL before any fetch.
 * Rejects protocol-relative (//evil), non-https, and non-allowlisted hosts.
 *
 * @returns {{ ok: true, url: string } | { ok: false, error: string, code?: string }}
 */
export function parseAllowlistedAudioUrl(raw, allowlist = getAllowedAudioHosts()) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, error: 'audioUrl is required', code: 'missing_url' };
  }
  const trimmed = raw.trim();
  // Explicitly reject protocol-relative before URL() normalises it.
  if (trimmed.startsWith('//')) {
    return { ok: false, error: 'Protocol-relative URLs are not allowed.', code: 'ssrf_blocked' };
  }

  let absolute = trimmed;
  if (trimmed.startsWith('/')) {
    const origin = getOwnSiteOrigin();
    if (!origin) {
      return {
        ok: false,
        error: 'Relative audio paths require APP_URL / VITE_APP_URL on the server.',
        code: 'relative_unresolved',
      };
    }
    absolute = `${origin}${trimmed}`;
  }

  let parsed;
  try {
    parsed = new URL(absolute);
  } catch {
    return { ok: false, error: 'Invalid audioUrl.', code: 'invalid_url' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'audioUrl must be https.', code: 'https_required' };
  }

  const host = normalizeHostname(parsed.hostname);
  if (!host || !allowlist.has(host)) {
    return { ok: false, error: 'audioUrl host is not allowlisted.', code: 'host_not_allowed' };
  }

  if (isIP(host) && isBlockedIp(host)) {
    return { ok: false, error: 'audioUrl address is not allowed.', code: 'ip_blocked' };
  }

  return { ok: true, url: parsed.toString() };
}

export async function assertHostResolvesPublic(hostname, { dnsLookup = lookup } = {}) {
  const host = normalizeHostname(hostname);
  if (!host) {
    throw Object.assign(new Error('Missing host.'), { status: 400, code: 'host_missing' });
  }
  if (isIP(host)) {
    if (isBlockedIp(host)) {
      throw Object.assign(new Error('Download address not allowed.'), {
        status: 400,
        code: 'ip_blocked',
      });
    }
    return;
  }
  let records;
  try {
    records = await dnsLookup(host, { all: true, verbatim: true });
  } catch {
    throw Object.assign(new Error('Could not resolve audio host.'), {
      status: 400,
      code: 'dns_failed',
    });
  }
  if (!records?.length) {
    throw Object.assign(new Error('Could not resolve audio host.'), {
      status: 400,
      code: 'dns_failed',
    });
  }
  for (const rec of records) {
    if (isBlockedIp(rec.address)) {
      throw Object.assign(new Error('Download address not allowed.'), {
        status: 400,
        code: 'ip_blocked',
      });
    }
  }
}

function isAudioContentType(contentType) {
  if (!contentType) return false;
  const ct = String(contentType).split(';')[0].trim().toLowerCase();
  return ct.startsWith('audio/');
}

/**
 * Fetch audio with SSRF controls. Inject fetchImpl / dnsLookup / allowlist for tests.
 *
 * @returns {Promise<{ buffer: Buffer, contentType: string, finalUrl: string }>}
 */
export async function fetchAllowlistedAudio(rawUrl, {
  fetchImpl = fetch,
  dnsLookup = lookup,
  allowlist = getAllowedAudioHosts(),
  maxBytes = AUDIO_MAX_BYTES,
  timeoutMs = AUDIO_FETCH_TIMEOUT_MS,
  maxRedirects = AUDIO_MAX_REDIRECTS,
} = {}) {
  const initial = parseAllowlistedAudioUrl(rawUrl, allowlist);
  if (!initial.ok) {
    throw Object.assign(new Error(initial.error), {
      status: 400,
      code: initial.code || 'ssrf_blocked',
    });
  }

  let current = initial.url;
  let hops = 0;

  while (hops <= maxRedirects) {
    let parsed;
    try {
      parsed = new URL(current);
    } catch {
      throw Object.assign(new Error('Invalid download URL.'), { status: 400, code: 'invalid_url' });
    }
    if (parsed.protocol !== 'https:') {
      throw Object.assign(new Error('Download URL must be https.'), {
        status: 400,
        code: 'https_required',
      });
    }
    const host = normalizeHostname(parsed.hostname);
    if (!allowlist.has(host)) {
      throw Object.assign(new Error('Download host not allowlisted.'), {
        status: 400,
        code: 'host_not_allowed',
      });
    }
    await assertHostResolvesPublic(host, { dnsLookup });

    let res;
    try {
      res = await fetchImpl(current, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      const name = e && typeof e === 'object' && 'name' in e ? String(e.name) : '';
      if (name === 'TimeoutError' || name === 'AbortError') {
        throw Object.assign(new Error('Audio download timed out.'), {
          status: 504,
          code: 'timeout',
        });
      }
      throw Object.assign(new Error('Audio download failed.'), { status: 502, code: 'fetch_failed' });
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      if (!loc) {
        throw Object.assign(new Error('Redirect missing Location.'), {
          status: 502,
          code: 'bad_redirect',
        });
      }
      if (String(loc).trim().startsWith('//')) {
        throw Object.assign(new Error('Protocol-relative redirect blocked.'), {
          status: 400,
          code: 'ssrf_blocked',
        });
      }
      let next;
      try {
        next = new URL(loc, parsed).toString();
      } catch {
        throw Object.assign(new Error('Invalid redirect Location.'), {
          status: 400,
          code: 'bad_redirect',
        });
      }
      // Re-check allowlist on every hop before following.
      const hopCheck = parseAllowlistedAudioUrl(next, allowlist);
      if (!hopCheck.ok) {
        throw Object.assign(new Error(hopCheck.error || 'Redirect host not allowed.'), {
          status: 400,
          code: hopCheck.code || 'ssrf_blocked',
        });
      }
      current = hopCheck.url;
      hops += 1;
      continue;
    }

    if (!res.ok) {
      throw Object.assign(new Error(`Audio download failed (${res.status}).`), {
        status: 502,
        code: 'fetch_failed',
      });
    }

    const contentType = res.headers.get('content-type') || '';
    if (!isAudioContentType(contentType)) {
      throw Object.assign(new Error('Only audio/* content types are allowed.'), {
        status: 400,
        code: 'non_audio_type',
      });
    }

    const len = Number(res.headers.get('content-length') || 0);
    if (Number.isFinite(len) && len > maxBytes) {
      throw Object.assign(new Error('Audio file is too large (max 25MB).'), {
        status: 413,
        code: 'oversize',
      });
    }

    if (!res.body || typeof res.body.getReader !== 'function') {
      const ab = await res.arrayBuffer();
      if (ab.byteLength > maxBytes) {
        throw Object.assign(new Error('Audio file is too large (max 25MB).'), {
          status: 413,
          code: 'oversize',
        });
      }
      return {
        buffer: Buffer.from(ab),
        contentType: contentType.split(';')[0].trim().toLowerCase(),
        finalUrl: current,
      };
    }

    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        throw Object.assign(new Error('Audio file is too large (max 25MB).'), {
          status: 413,
          code: 'oversize',
        });
      }
      chunks.push(Buffer.from(value));
    }
    return {
      buffer: Buffer.concat(chunks, total),
      contentType: contentType.split(';')[0].trim().toLowerCase(),
      finalUrl: current,
    };
  }

  throw Object.assign(new Error('Too many redirects.'), { status: 502, code: 'too_many_redirects' });
}
