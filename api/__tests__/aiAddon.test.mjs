/**
 * AI add-on entitlement + flesh-out prompt hygiene.
 * Run: node --test api/__tests__/aiAddon.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  AI_ADDON_REQUIRED_CODE,
  AI_ADDON_REQUIRED_MESSAGE,
  decideAiAddonAccess,
  orgHasAiAddon,
} from '../_aiAddon.js';
import {
  assertPayloadUsesOnlyAllowedIds,
  buildFleshOutUserPayload,
  filterAllowedStatementIds,
} from '../_fleshOutShared.js';

const root = fileURLToPath(new URL('../..', import.meta.url));

describe('orgHasAiAddon', () => {
  it('is true only when ai_addon is boolean true', () => {
    assert.equal(orgHasAiAddon({ ai_addon: true }), true);
    assert.equal(orgHasAiAddon({ ai_addon: false }), false);
    assert.equal(orgHasAiAddon({ ai_addon: 'true' }), false);
    assert.equal(orgHasAiAddon(null), false);
  });
});

describe('decideAiAddonAccess', () => {
  it('super admin passes with no add-on', () => {
    const d = decideAiAddonAccess({
      profile: { role: 'super_admin', status: 'active' },
      orgRow: { ai_addon: false },
    });
    assert.equal(d.allowed, true);
    assert.equal(d.reason, 'super_admin');
  });

  it('superuser passes with no add-on', () => {
    const d = decideAiAddonAccess({
      profile: { role: 'superuser', status: 'active' },
      orgRow: null,
    });
    assert.equal(d.allowed, true);
    assert.equal(d.reason, 'super_admin');
  });

  it('non-super-admin without add-on is denied', () => {
    const d = decideAiAddonAccess({
      profile: { role: 'teacher', status: 'active', organisation_id: 'school-a' },
      orgRow: { ai_addon: false },
    });
    assert.equal(d.allowed, false);
    assert.equal(d.reason, 'ai_addon_required');
  });

  it('non-super-admin with add-on passes', () => {
    const d = decideAiAddonAccess({
      profile: { role: 'teacher', status: 'active', organisation_id: 'school-a' },
      orgRow: { ai_addon: true },
    });
    assert.equal(d.allowed, true);
    assert.equal(d.reason, 'org_ai_addon');
  });

  it('spoofed client claim of super admin is ignored', () => {
    const d = decideAiAddonAccess({
      profile: { role: 'teacher', status: 'active', organisation_id: 'school-a' },
      orgRow: { ai_addon: false },
      clientClaims: { role: 'super_admin', aiAddon: true },
      bodyRole: 'super_admin',
      headerRole: 'super_admin',
    });
    assert.equal(d.allowed, false);
    assert.equal(d.reason, 'ai_addon_required');
  });

  it('school role=admin without add-on is denied (not platform super)', () => {
    const d = decideAiAddonAccess({
      profile: { role: 'admin', status: 'active', organisation_id: 'school-a' },
      orgRow: { ai_addon: false },
    });
    assert.equal(d.allowed, false);
  });

  it('suspended super_admin is denied', () => {
    const d = decideAiAddonAccess({
      profile: { role: 'super_admin', status: 'suspended' },
      orgRow: { ai_addon: false },
    });
    assert.equal(d.allowed, false);
  });
});

describe('AI routes gate with requireAiAddon + rate limit', () => {
  it('flesh-out and transcribe import requireAiAddon and assertRateLimit', () => {
    const flesh = readFileSync(join(root, 'server/api/interactive-lessons/flesh-out.js'), 'utf8');
    const transcribe = readFileSync(
      join(root, 'server/api/interactive-lessons/transcribe.js'),
      'utf8',
    );
    assert.match(flesh, /requireAiAddon/);
    assert.match(flesh, /assertRateLimit/);
    assert.match(transcribe, /requireAiAddon/);
    assert.match(transcribe, /assertRateLimit/);
    assert.match(flesh, /AI add-on required|ai_addon_required|requireAiAddon/);
    // Both POSTs pass the body only so spoofed role fields can be proven ignored.
    assert.match(flesh, /requireAiAddon\(auth\.userId,\s*body\)/);
    assert.match(transcribe, /requireAiAddon\(auth\.userId,\s*body\)/);
  });

  it('requireAiAddon loads role from loadProfile and voids client body/claims', () => {
    const src = readFileSync(join(root, 'api/_aiAddon.js'), 'utf8');
    assert.match(src, /loadProfile\(userId\)/);
    assert.match(src, /isSuperAdminProfile\(profile\)/);
    assert.match(src, /void requestBody/);
    assert.match(src, /void clientClaims/);
    assert.match(src, /void bodyRole/);
    assert.match(src, /void headerRole/);
    // Must not trust a body/header role field for the allow path.
    assert.doesNotMatch(src, /profile\.role\s*=\s*requestBody/);
    assert.doesNotMatch(src, /body\.role\s*===\s*['"]super_admin['"]/);
  });

  it('migration adds organisations.ai_addon', () => {
    const sql = readFileSync(
      join(root, 'supabase/migrations/20261025130000_organisations_ai_addon.sql'),
      'utf8',
    );
    assert.match(sql, /ADD COLUMN IF NOT EXISTS ai_addon boolean/i);
    assert.match(sql, /DEFAULT false/i);
  });

  it('exports stable 403 code and message', () => {
    assert.equal(AI_ADDON_REQUIRED_CODE, 'ai_addon_required');
    assert.equal(AI_ADDON_REQUIRED_MESSAGE, 'AI add-on required');
  });
});

describe('flesh-out prompt builder', () => {
  const standards = [
    { id: 'std-a', text: 'Listen carefully', strand: 'Listening', keyStage: 'ks1' },
    { id: 'std-b', text: 'Keep a pulse', strand: 'Performing', keyStage: 'ks1' },
  ];

  it('includes chosen Settings standards and never other IDs', () => {
    const payload = buildFleshOutUserPayload({
      instruction: 'Make it practical',
      lesson: {
        title: 'Pulse games',
        keyStage: 'ks1',
        yearGroup: 'Year 1',
        subject: 'Music',
        activities: [{ name: 'Clap the pulse', time: 5 }],
        sections: [{ id: 's1', kind: 'afl', title: 'Assessment', bodyHtml: '' }],
        assessment: 'Look for steady pulse',
        differentiation: 'Pair with a partner',
      },
      curriculumStatements: standards,
      options: { includeOutcomes: true, autoPickCurriculum: true },
    });

    assert.deepEqual(
      payload.allowedCurriculumIds,
      ['std-a', 'std-b'],
    );
    assert.equal(payload.curriculumStatements.length, 2);
    assert.equal(payload.title, 'Pulse games');
    assert.equal(payload.yearGroup, 'Year 1');
    assert.equal(payload.activities[0].time, 5);
    assert.match(payload.assessment, /pulse/i);

    const check = assertPayloadUsesOnlyAllowedIds(payload, ['std-a', 'std-b']);
    assert.equal(check.ok, true);

    // Injected foreign IDs must be stripped by the filter.
    assert.deepEqual(filterAllowedStatementIds(['std-a', 'invented-x', 'std-b'], ['std-a', 'std-b']), [
      'std-a',
      'std-b',
    ]);
  });

  it('does not invent I CAN when criteria already exist and teacher did not ask', () => {
    const payload = buildFleshOutUserPayload({
      instruction: 'Add teacher questions only',
      lesson: {
        title: 'Rain song',
        successCriteria: '• I can clap the pulse',
        keyStage: 'ks1',
      },
      curriculumStatements: standards,
      options: { includeSuccessCriteria: true, includeTeacherQuestions: true },
    });
    assert.equal(payload.generate.successCriteria, false);
    assert.equal(payload.generate.inventExamBoardsOrSetWorks, false);
  });

  it('allows I CAN when teacher asks, and exam boards only when asked', () => {
    const ican = buildFleshOutUserPayload({
      instruction: 'Please rewrite the I CAN outcomes',
      lesson: { title: 'Rain song', successCriteria: '• I can clap', keyStage: 'ks1' },
      curriculumStatements: standards,
      options: { includeSuccessCriteria: true },
    });
    assert.equal(ican.generate.successCriteria, true);

    const exam = buildFleshOutUserPayload({
      instruction: 'Map this to our GCSE exam board set work',
      lesson: { title: 'Devising', keyStage: 'ks4' },
      curriculumStatements: [],
      options: {},
    });
    assert.equal(exam.generate.inventExamBoardsOrSetWorks, true);
  });
});
