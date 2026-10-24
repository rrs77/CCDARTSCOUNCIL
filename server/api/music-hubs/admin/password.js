/**
 * POST /api/music-hubs/admin/password
 * Sets / clears org subscriber password hash via env-backed response guidance.
 * Production: persist hash in Supabase organisations table (migrate from user-mgmt branch).
 * This endpoint returns the scrypt hash for ops to store in MUSIC_HUB_SUBSCRIBER_HASHES
 * when DB persistence is not yet wired — never returns plaintext.
 *
 * Auth: requires Authorization Bearer matching MUSIC_HUB_ADMIN_TOKEN (or service role JWT setup later).
 */

import { timingSafeEqual } from 'node:crypto';
import {
  hashPasswordForStorage,
  jsonResponse,
  optionsResponse,
} from '../../../../api/_musicHubUnlock.js';

export async function OPTIONS(request) {
  return optionsResponse(request);
}

function safeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep runtime roughly constant on length mismatch.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function adminAuthorized(request) {
  const expected = process.env.MUSIC_HUB_ADMIN_TOKEN || '';
  if (!expected) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return safeEqualString(token, expected);
}

export async function POST(request) {
  try {
    if (!adminAuthorized(request)) {
      return jsonResponse({ error: 'Forbidden.' }, 403);
    }

    const body = await request.json().catch(() => null);
    const organisationId =
      typeof body?.organisationId === 'string' ? body.organisationId.trim() : '';
    const action = body?.action === 'clear' ? 'clear' : 'set';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!organisationId) {
      return jsonResponse({ error: 'organisationId required.' }, 400);
    }

    if (action === 'clear') {
      return jsonResponse({
        organisationId,
        cleared: true,
        note: 'Remove this organisation key from MUSIC_HUB_SUBSCRIBER_HASHES (or DB column). Password is never shown.',
      });
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters.' }, 400);
    }

    const hash = hashPasswordForStorage(password);
    return jsonResponse({
      organisationId,
      hash,
      note: 'Store hash in MUSIC_HUB_SUBSCRIBER_HASHES JSON. Plaintext password is not stored or returned again.',
    });
  } catch {
    return jsonResponse({ error: 'Password update failed.' }, 500);
  }
}
