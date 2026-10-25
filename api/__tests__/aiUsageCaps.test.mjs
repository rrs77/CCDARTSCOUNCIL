/**
 * AI usage limits + flesh-out payload caps + HTML sanitiser.
 * Run: node --test api/__tests__/aiUsageCaps.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  AI_REQUEST_BODY_MAX_BYTES,
  AI_USAGE_LIMITS,
  FLESH_OUT_CAPS,
  assertAiRequestBodySize,
  evaluateUsageWindows,
} from '../_aiUsage.js';
import {
  buildFleshOutUserPayload,
  sanitizeAiBodyHtml,
  validateAndFilterResult,
} from '../_fleshOutShared.js';

const root = fileURLToPath(new URL('../..', import.meta.url));

function fakeRequest(contentLength) {
  return {
    headers: {
      get: (name) =>
        String(name).toLowerCase() === 'content-length' ? contentLength : null,
    },
  };
}

describe('assertAiRequestBodySize', () => {
  it('allows missing Content-Length and small bodies', () => {
    assert.equal(assertAiRequestBodySize(fakeRequest(null)).ok, true);
    assert.equal(assertAiRequestBodySize(fakeRequest('1024')).ok, true);
  });

  it('rejects over ~256KB', () => {
    const r = assertAiRequestBodySize(fakeRequest(String(AI_REQUEST_BODY_MAX_BYTES + 1)));
    assert.equal(r.ok, false);
    assert.equal(r.response.status, 413);
  });
});

describe('evaluateUsageWindows', () => {
  it('enforces per-user hourly caps', () => {
    const flesh = evaluateUsageWindows({
      route: 'flesh-out',
      userHourlyCount: AI_USAGE_LIMITS['flesh-out'].userHourly,
      orgDailyCount: 0,
      organisationId: 'school-a',
    });
    assert.equal(flesh.allowed, false);
    assert.equal(flesh.scope, 'user');

    const tr = evaluateUsageWindows({
      route: 'transcribe',
      userHourlyCount: AI_USAGE_LIMITS.transcribe.userHourly,
      orgDailyCount: 0,
      organisationId: 'school-a',
    });
    assert.equal(tr.allowed, false);
    assert.equal(tr.scope, 'user');
  });

  it('enforces per-organisation daily caps', () => {
    const flesh = evaluateUsageWindows({
      route: 'flesh-out',
      userHourlyCount: 0,
      orgDailyCount: AI_USAGE_LIMITS['flesh-out'].orgDaily,
      organisationId: 'school-a',
    });
    assert.equal(flesh.allowed, false);
    assert.equal(flesh.scope, 'org');
  });

  it('allows under both caps', () => {
    const ok = evaluateUsageWindows({
      route: 'flesh-out',
      userHourlyCount: 1,
      orgDailyCount: 1,
      organisationId: 'school-a',
    });
    assert.equal(ok.allowed, true);
  });
});

describe('flesh-out payload caps', () => {
  it('caps curriculumStatements at 300 and text at 500 chars', () => {
    const many = Array.from({ length: 350 }, (_, i) => ({
      id: `id-${i}`,
      text: 'x'.repeat(600),
    }));
    const payload = buildFleshOutUserPayload({
      instruction: 'Make it practical',
      lesson: { title: 'Pulse' },
      curriculumStatements: many,
      options: {},
    });
    assert.equal(payload.curriculumStatements.length, FLESH_OUT_CAPS.curriculumStatements);
    assert.ok(payload.curriculumStatements.every((s) => s.text.length <= FLESH_OUT_CAPS.curriculumTextChars));
  });

  it('caps sections at 40 and activities at 60', () => {
    const sections = Array.from({ length: 55 }, (_, i) => ({
      id: `s${i}`,
      kind: 'free_text',
      title: `S${i}`,
      bodyHtml: '<p>ok</p>',
    }));
    const activities = Array.from({ length: 80 }, (_, i) => ({
      name: `A${i}`,
      description: 'd',
    }));
    const payload = buildFleshOutUserPayload({
      instruction: 'x',
      lesson: { title: 'T', sections, activities },
      curriculumStatements: [],
      options: {},
    });
    assert.equal(payload.sections.length, FLESH_OUT_CAPS.sections);
    assert.equal(payload.activities.length, FLESH_OUT_CAPS.activities);
  });

  it('truncates long string fields and instruction', () => {
    const payload = buildFleshOutUserPayload({
      instruction: 'I'.repeat(5000),
      lesson: {
        title: 'T'.repeat(500),
        learningOutcome: 'O'.repeat(9000),
      },
      curriculumStatements: [],
      options: {},
    });
    assert.ok(payload.instruction.length <= FLESH_OUT_CAPS.instructionChars);
    assert.ok(payload.title.length <= 300);
    assert.ok(payload.learningOutcome.length <= FLESH_OUT_CAPS.stringFieldChars);
  });
});

describe('sanitizeAiBodyHtml', () => {
  it('strips script, iframe, on* attributes and javascript: links', () => {
    const dirty =
      '<p onclick="alert(1)">Hi</p><script>alert(2)</script><iframe src="x"></iframe>' +
      '<a href="javascript:alert(3)">x</a><img src="https://ok.test/a.png" onerror="evil()">';
    const clean = sanitizeAiBodyHtml(dirty);
    assert.doesNotMatch(clean, /<script/i);
    assert.doesNotMatch(clean, /<iframe/i);
    assert.doesNotMatch(clean, /\son\w+\s*=/i);
    assert.doesNotMatch(clean, /javascript:/i);
    assert.match(clean, /Hi/);
  });

  it('validateAndFilterResult sanitises model bodyHtml', () => {
    const result = validateAndFilterResult(
      {
        learningOutcome: '',
        successCriteria: '',
        assessment: '',
        teacherQuestions: { opening: [], during: [], plenary: [] },
        differentiation: { support: '', core: '', challenge: '', sendEal: '' },
        selectedStatementIds: [],
        wholeLessonSections: [
          {
            sectionId: 's1',
            title: 'Warm-up',
            bodyHtml: '<p onmouseover="x">Clap</p><script>bad()</script>',
          },
        ],
        sectionBodies: [],
      },
      [],
      {
        includeOutcomes: false,
        includeSuccessCriteria: false,
        includeTeacherQuestions: false,
        includeDifferentiation: false,
        includeAssessment: false,
        autoPickCurriculum: false,
        wholeLesson: true,
        sectionId: '',
      },
    );
    assert.equal(result.wholeLessonSections.length, 1);
    assert.doesNotMatch(result.wholeLessonSections[0].bodyHtml, /<script/i);
    assert.doesNotMatch(result.wholeLessonSections[0].bodyHtml, /\son\w+\s*=/i);
    assert.match(result.wholeLessonSections[0].bodyHtml, /Clap/);
  });
});

describe('AI routes wire durable usage + body cap + max_tokens', () => {
  it('flesh-out and transcribe call claimAiUsage and assertAiRequestBodySize', () => {
    const flesh = readFileSync(join(root, 'server/api/interactive-lessons/flesh-out.js'), 'utf8');
    const transcribe = readFileSync(
      join(root, 'server/api/interactive-lessons/transcribe.js'),
      'utf8',
    );
    assert.match(flesh, /claimAiUsage/);
    assert.match(flesh, /assertAiRequestBodySize/);
    assert.match(flesh, /max_tokens:\s*FLESH_OUT_CAPS\.maxTokens/);
    assert.match(transcribe, /claimAiUsage/);
    assert.match(transcribe, /assertAiRequestBodySize/);
    assert.match(transcribe, /fetchAllowlistedAudio|resolveAudioBuffer/);
  });

  it('usage migration defines claim_ai_usage with expected caps', () => {
    const sql = readFileSync(
      join(root, 'supabase/migrations/20261025132000_ai_usage_limits.sql'),
      'utf8',
    );
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.ai_usage_events/);
    assert.match(sql, /claim_ai_usage/);
    assert.match(sql, /v_user_limit := 30/);
    assert.match(sql, /v_user_limit := 10/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.claim_ai_usage/);
  });
});
