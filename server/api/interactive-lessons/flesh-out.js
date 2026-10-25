/**
 * Lesson plan “Flesh out with AI” — OpenAI chat proxy.
 * Secret: OPENAI_API_KEY (server env only — never expose client-side).
 * Routed through /api/router (Hobby function limit).
 *
 * Gating: assertRateLimit + requireAiAddon (super_admin via profiles.role OR
 * organisations.ai_addon). Spoofed client role fields are ignored.
 */

import {
  assertRateLimit,
  corsHeaders,
  getClientIp,
  getBearerToken,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';
import { probeAiAddon, requireAiAddon } from '../../../api/_aiAddon.js';
import {
  FLESH_OUT_CAPS,
  assertAiRequestBodySize,
  claimAiUsage,
} from '../../../api/_aiUsage.js';
import {
  buildFleshOutUserPayload,
  buildSystemPrompt,
  buildUserMessage,
  validateAndFilterResult,
} from '../../../api/_fleshOutShared.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_FLESH_OUT_MODEL || 'gpt-4o-mini';

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || '';
}

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    learningOutcome: { type: 'string' },
    successCriteria: { type: 'string' },
    assessment: { type: 'string' },
    teacherQuestions: {
      type: 'object',
      additionalProperties: false,
      properties: {
        opening: { type: 'array', items: { type: 'string' } },
        during: { type: 'array', items: { type: 'string' } },
        plenary: { type: 'array', items: { type: 'string' } },
      },
      required: ['opening', 'during', 'plenary'],
    },
    differentiation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        support: { type: 'string' },
        core: { type: 'string' },
        challenge: { type: 'string' },
        sendEal: { type: 'string' },
      },
      required: ['support', 'core', 'challenge', 'sendEal'],
    },
    selectedStatementIds: { type: 'array', items: { type: 'string' } },
    wholeLessonSections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          sectionId: { type: 'string' },
          title: { type: 'string' },
          durationMins: { type: 'number' },
          bodyHtml: { type: 'string' },
        },
        required: ['sectionId', 'title', 'bodyHtml'],
      },
    },
    sectionBodies: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          sectionId: { type: 'string' },
          bodyHtml: { type: 'string' },
        },
        required: ['sectionId', 'bodyHtml'],
      },
    },
  },
  required: [
    'learningOutcome',
    'successCriteria',
    'assessment',
    'teacherQuestions',
    'differentiation',
    'selectedStatementIds',
    'wholeLessonSections',
    'sectionBodies',
  ],
};

export async function GET(request) {
  const key = getOpenAiKey();
  let aiAddon = false;
  let aiReason = 'unauthenticated';
  try {
    const token = getBearerToken(request);
    if (token) {
      const auth = await requireAuth(request);
      if (auth.ok) {
        const probe = await probeAiAddon(auth.userId);
        aiAddon = probe.aiAddon;
        aiReason = probe.reason;
      }
    }
  } catch {
    /* availability still reports key status */
  }

  if (!key) {
    return jsonResponse(
      {
        available: false,
        aiAddon,
        aiReason,
        message:
          'OPENAI_API_KEY is not set on the server. Flesh out with AI is unavailable until an admin adds it.',
      },
      200,
    );
  }
  return jsonResponse({
    available: true,
    aiAddon,
    aiReason,
    model: MODEL,
    message: aiAddon
      ? undefined
      : 'AI add-on required',
  });
}

export async function POST(request) {
  if (request.method === 'OPTIONS') return optionsResponse();

  const ip = getClientIp(request) || 'unknown';
  const limited = assertRateLimit(`flesh-out:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  const bodySize = assertAiRequestBodySize(request);
  if (!bodySize.ok) return bodySize.response;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid JSON body' }, 400);
  }

  // Pass body only so spoofed role/aiAddon fields can be proven ignored.
  const entitlement = await requireAiAddon(auth.userId, body);
  if (!entitlement.ok) return entitlement.response;

  const usage = await claimAiUsage({
    userId: auth.userId,
    organisationId: entitlement.organisationId,
    route: 'flesh-out',
  });
  if (!usage.ok) return usage.response;

  const key = getOpenAiKey();
  if (!key) {
    return jsonResponse(
      {
        available: false,
        message:
          'OPENAI_API_KEY is not set on the server. Ask an admin to configure it on the API project (production + preview).',
      },
      501,
    );
  }

  const lesson = body?.lesson && typeof body.lesson === 'object' ? body.lesson : {};
  const options = body?.options && typeof body.options === 'object' ? body.options : {};
  const curriculumStatements = Array.isArray(body?.curriculumStatements)
    ? body.curriculumStatements.slice(0, FLESH_OUT_CAPS.curriculumStatements)
    : [];

  const keyStage = String(lesson.keyStage || 'ks2').toLowerCase();
  const allowedStatementIds = curriculumStatements
    .map((s) => String(s?.id || '').trim())
    .filter(Boolean);

  const includeOutcomes = options.includeOutcomes !== false;
  const includeSuccessCriteria = options.includeSuccessCriteria !== false;
  const includeTeacherQuestions = !!options.includeTeacherQuestions;
  const includeDifferentiation = !!options.includeDifferentiation;
  const includeAssessment = options.includeAssessment !== false;
  const autoPickCurriculum = !!options.autoPickCurriculum;
  const wholeLesson = !!options.wholeLesson;
  const sectionId = typeof options.sectionId === 'string' ? options.sectionId : '';
  const instruction = String(body?.instruction || '').trim() || 'Flesh out this lesson plan';

  if (autoPickCurriculum && allowedStatementIds.length === 0) {
    return jsonResponse(
      {
        message:
          'No curriculum statements are defined in Settings for this lesson. Add frameworks, strands and statements in Settings → Curriculum, then try again.',
        code: 'empty_curriculum',
      },
      400,
    );
  }

  const userPayload = buildFleshOutUserPayload({
    instruction,
    lesson: { ...lesson, keyStage },
    curriculumStatements,
    options: {
      includeOutcomes,
      includeSuccessCriteria,
      includeTeacherQuestions,
      includeDifferentiation,
      includeAssessment,
      autoPickCurriculum,
      wholeLesson,
      sectionId,
    },
  });

  try {
    const oaRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.35,
        max_tokens: FLESH_OUT_CAPS.maxTokens,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'ccd_flesh_out',
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
        messages: [
          { role: 'system', content: buildSystemPrompt(keyStage) },
          { role: 'user', content: buildUserMessage(userPayload, keyStage) },
        ],
      }),
    });

    if (!oaRes.ok) {
      const errText = await oaRes.text().catch(() => '');
      console.error('Flesh-out OpenAI error', {
        status: oaRes.status,
        model: MODEL,
        body: errText.slice(0, 500).replace(/sk-[A-Za-z0-9_-]+/g, 'sk-***'),
      });
      return jsonResponse(
        {
          message: mapOpenAiHttpError(oaRes.status, errText),
          code: 'openai_http_error',
          status: oaRes.status,
        },
        502,
      );
    }

    const oaJson = await oaRes.json();
    const content = oaJson?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return jsonResponse({ message: 'Empty response from OpenAI' }, 502);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return jsonResponse({ message: 'OpenAI returned invalid JSON' }, 502);
    }

    const result = validateAndFilterResult(parsed, allowedStatementIds, {
      includeOutcomes,
      includeSuccessCriteria: userPayload.generate.successCriteria,
      includeTeacherQuestions,
      includeDifferentiation,
      includeAssessment,
      autoPickCurriculum,
      wholeLesson,
      sectionId,
    });

    const neededSomething =
      includeOutcomes ||
      userPayload.generate.successCriteria ||
      includeTeacherQuestions ||
      includeDifferentiation ||
      includeAssessment ||
      wholeLesson ||
      Boolean(sectionId);

    const gotSomething =
      !!result.learningOutcome ||
      !!result.successCriteria ||
      !!result.assessment ||
      result.teacherQuestions.opening.length +
        result.teacherQuestions.during.length +
        result.teacherQuestions.plenary.length >
        0 ||
      !!result.differentiation.support ||
      !!result.differentiation.core ||
      result.wholeLessonSections.length > 0 ||
      result.sectionBodies.length > 0 ||
      result.selectedStatementIds.length > 0;

    if (neededSomething && !gotSomething) {
      return jsonResponse(
        {
          message:
            'Flesh out returned only generic placeholder text, which was rejected. Try again with a clearer lesson title and named activities.',
          code: 'generic_rejected',
        },
        502,
      );
    }

    return jsonResponse({
      available: true,
      aiAddon: true,
      model: MODEL,
      result,
      pickedByAi: autoPickCurriculum ? result.selectedStatementIds.length > 0 : false,
    });
  } catch (err) {
    const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : '';
    const msg = err instanceof Error ? err.message : String(err || '');
    console.error('Flesh-out failed', { name, message: msg.slice(0, 300) });
    const isTimeout =
      name === 'AbortError' ||
      name === 'TimeoutError' ||
      /timeout|timed out|network/i.test(msg);
    return jsonResponse(
      {
        message: isTimeout
          ? 'Flesh out timed out waiting for OpenAI. Try again in a moment.'
          : 'Flesh out failed unexpectedly on the server. Try again, or check API logs.',
        code: isTimeout ? 'timeout' : 'server_error',
      },
      isTimeout ? 504 : 500,
    );
  }
}

function mapOpenAiHttpError(status, errText) {
  const lower = String(errText || '').toLowerCase();
  if (status === 401 || status === 403) {
    return `OpenAI auth failed (HTTP ${status}): the server API key was rejected. Ask an admin to check OPENAI_API_KEY.`;
  }
  if (status === 429) {
    return `OpenAI quota or rate limit (HTTP 429): wait a moment or check billing/quota on the API project.`;
  }
  if (status === 404 || /model|does not exist|not found/i.test(lower)) {
    return `OpenAI model unavailable (HTTP ${status}): model “${MODEL}” was not found or is not allowed for this key.`;
  }
  if (status === 408 || status === 504 || /timeout/i.test(lower)) {
    return `OpenAI timed out (HTTP ${status}). Try again in a moment.`;
  }
  if (status >= 500) {
    return `OpenAI is unavailable (HTTP ${status}). Try again shortly.`;
  }
  return `Flesh out failed talking to OpenAI (HTTP ${status}). Try again, or ask an admin to check the API logs.`;
}

export async function OPTIONS() {
  return optionsResponse();
}

void corsHeaders;
