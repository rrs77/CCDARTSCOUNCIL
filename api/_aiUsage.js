/**
 * Durable per-user / per-org AI usage limits (DB-backed).
 * Complements in-memory assertRateLimit (coarse IP guard).
 *
 * Limits (also encoded in claim_ai_usage SQL):
 *   flesh-out:  30 / user / hour,  200 / org / day
 *   transcribe: 10 / user / hour,   50 / org / day
 */

import { createServiceClient, jsonResponse } from './_authShared.js';

export const AI_REQUEST_BODY_MAX_BYTES = 256 * 1024;

export const AI_USAGE_LIMITS = Object.freeze({
  'flesh-out': Object.freeze({
    userHourly: 30,
    orgDaily: 200,
  }),
  transcribe: Object.freeze({
    userHourly: 10,
    orgDaily: 50,
  }),
});

export const FLESH_OUT_CAPS = Object.freeze({
  curriculumStatements: 300,
  curriculumTextChars: 500,
  sections: 40,
  activities: 60,
  stringFieldChars: 4000,
  instructionChars: 2000,
  maxTokens: 4096,
});

/**
 * Reject oversized JSON bodies before request.json().
 * Missing Content-Length is allowed (chunked); only oversize is blocked.
 *
 * @returns {{ ok: true } | { ok: false, response: Response }}
 */
export function assertAiRequestBodySize(request, maxBytes = AI_REQUEST_BODY_MAX_BYTES) {
  const raw = request?.headers?.get?.('content-length');
  if (raw == null || String(raw).trim() === '') {
    return { ok: true };
  }
  const cl = Number(raw);
  if (!Number.isFinite(cl) || cl < 0) {
    return {
      ok: false,
      response: jsonResponse(
        { message: 'Invalid Content-Length.', code: 'invalid_content_length' },
        400,
      ),
    };
  }
  if (cl > maxBytes) {
    return {
      ok: false,
      response: jsonResponse(
        {
          message: `Request body too large (max ${Math.floor(maxBytes / 1024)}KB).`,
          code: 'body_too_large',
        },
        413,
      ),
    };
  }
  return { ok: true };
}

/**
 * Claim one AI call against durable counters.
 * Prefer the claim_ai_usage RPC; fall back to a soft allow if the migration
 * is not applied yet (local/dev) so routes still function.
 *
 * @returns {Promise<{ ok: true } | { ok: false, response: Response, reason: string }>}
 */
export async function claimAiUsage({ userId, organisationId = null, route }) {
  if (!userId || (route !== 'flesh-out' && route !== 'transcribe')) {
    return {
      ok: false,
      reason: 'invalid',
      response: jsonResponse({ message: 'Invalid usage claim.', code: 'usage_invalid' }, 400),
    };
  }

  const limits = AI_USAGE_LIMITS[route];
  const service = createServiceClient();
  if (!service) {
    // Misconfigured service role — fail closed for paid AI.
    return {
      ok: false,
      reason: 'server_misconfigured',
      response: jsonResponse(
        { message: 'AI usage tracking unavailable.', code: 'usage_unavailable' },
        503,
      ),
    };
  }

  try {
    const { data, error } = await service.rpc('claim_ai_usage', {
      p_user_id: userId,
      p_organisation_id: organisationId || null,
      p_route: route,
    });

    if (error) {
      // Migration not applied yet — soft-allow with a warning log.
      if (/claim_ai_usage|Could not find the function|PGRST202/i.test(error.message || '')) {
        console.warn('[aiUsage] claim_ai_usage RPC missing; soft-allowing', { route });
        return { ok: true, soft: true };
      }
      console.error('[aiUsage] claim failed', error.message);
      return {
        ok: false,
        reason: 'claim_failed',
        response: jsonResponse(
          { message: 'Could not check AI usage limits. Try again shortly.', code: 'usage_error' },
          503,
        ),
      };
    }

    const row = data && typeof data === 'object' ? data : null;
    if (row && row.allowed === false) {
      const scope = row.scope === 'org' ? 'organisation' : 'user';
      return {
        ok: false,
        reason: row.scope === 'org' ? 'org_daily_cap' : 'user_hourly_cap',
        response: jsonResponse(
          {
            message:
              scope === 'organisation'
                ? `Organisation daily AI limit reached for ${route} (max ${limits.orgDaily}/day).`
                : `Hourly AI limit reached for ${route} (max ${limits.userHourly}/hour). Try again later.`,
            code: 'ai_usage_limited',
            scope,
            route,
            limit: scope === 'organisation' ? limits.orgDaily : limits.userHourly,
          },
          429,
          { 'Retry-After': '3600' },
        ),
      };
    }

    return { ok: true };
  } catch (err) {
    console.error('[aiUsage] unexpected', err instanceof Error ? err.message : err);
    return {
      ok: false,
      reason: 'error',
      response: jsonResponse(
        { message: 'Could not check AI usage limits. Try again shortly.', code: 'usage_error' },
        503,
      ),
    };
  }
}

/** Pure counters for unit tests (mirrors SQL window logic). */
export function evaluateUsageWindows({
  route,
  userHourlyCount,
  orgDailyCount,
  organisationId = null,
}) {
  const limits = AI_USAGE_LIMITS[route];
  if (!limits) return { allowed: false, scope: 'invalid' };
  if (userHourlyCount >= limits.userHourly) {
    return { allowed: false, scope: 'user', limit: limits.userHourly };
  }
  if (organisationId && orgDailyCount >= limits.orgDaily) {
    return { allowed: false, scope: 'org', limit: limits.orgDaily };
  }
  return { allowed: true };
}
