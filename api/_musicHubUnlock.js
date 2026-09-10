/**
 * Shared Music Hub subscriber unlock helpers (Vercel serverless).
 * Passwords are verified with scrypt; tokens are HMAC-signed. Never log passwords.
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
    },
  });
}

function signingSecret() {
  return (
    process.env.MUSIC_HUB_UNLOCK_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  );
}

/**
 * Hash map: MUSIC_HUB_SUBSCRIBER_HASHES='{"ems":"scrypt$saltHex$hashHex"}'
 * Generate: node -e "const {randomBytes,scryptSync}=require('crypto'); const s=randomBytes(16); const h=scryptSync('YOUR_PASSWORD',s,64); console.log('scrypt$'+s.toString('hex')+'$'+h.toString('hex'))"
 */
function loadHashMap() {
  const raw = process.env.MUSIC_HUB_SUBSCRIBER_HASHES || '';
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Server-only protected resource URLs — never ship in client seed. */
const PROTECTED_RESOURCES = {
  'ems-subscriber-example': {
    organisationId: 'ems',
    url: 'https://www.essexmusicservice.org.uk/site/',
  },
};

function parseStoredHash(stored) {
  if (typeof stored !== 'string') return null;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return null;
  return { saltHex: parts[1], hashHex: parts[2] };
}

function verifyPassword(password, stored) {
  const parsed = parseStoredHash(stored);
  if (!parsed) return false;
  try {
    const salt = Buffer.from(parsed.saltHex, 'hex');
    const expected = Buffer.from(parsed.hashHex, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Dev/demo only when no hashes configured — clearly labelled, not for production. */
function demoPasswordOk(organisationId, password) {
  if (process.env.MUSIC_HUB_ALLOW_DEMO_PASSWORD !== '1') return false;
  const expected = process.env.MUSIC_HUB_DEMO_PASSWORD || 'ems-demo-unlock';
  if (organisationId !== 'ems' && organisationId !== 'triborough') return false;
  const a = Buffer.from(String(password));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function mintToken(organisationId) {
  const secret = signingSecret();
  if (!secret) return null;
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const nonce = randomBytes(8).toString('hex');
  const payload = `${organisationId}.${expiresAt}.${nonce}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return { token: `${payload}.${sig}`, expiresAt };
}

function verifyToken(token, organisationId) {
  const secret = signingSecret();
  if (!secret || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [org, expStr, nonce, sig] = parts;
  if (org !== organisationId) return false;
  const expiresAt = Number(expStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const payload = `${org}.${expStr}.${nonce}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function hashPasswordForStorage(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export {
  jsonResponse,
  optionsResponse,
  loadHashMap,
  verifyPassword,
  demoPasswordOk,
  mintToken,
  verifyToken,
  hashPasswordForStorage,
  PROTECTED_RESOURCES,
  signingSecret,
};
