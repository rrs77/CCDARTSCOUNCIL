/**
 * Curriculum backup sanitize / Content-Length gates.
 * Run: node --test api/__tests__/dataBackupShared.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKUP_ROW_CAP,
  backupContentLengthGate,
  normalizeOrganisationId,
  sanitizeRestorePayload,
} from '../_dataBackupShared.js';

describe('backupContentLengthGate', () => {
  it('returns 411 when Content-Length is missing', () => {
    assert.equal(backupContentLengthGate(null)?.status, 411);
    assert.equal(backupContentLengthGate('')?.status, 411);
  });

  it('returns 413 when over the limit', () => {
    assert.equal(backupContentLengthGate(String(50 * 1024 * 1024))?.status, 413);
  });

  it('allows a valid Content-Length', () => {
    assert.equal(backupContentLengthGate('1024'), null);
  });
});

describe('normalizeOrganisationId', () => {
  it('accepts safe ids', () => {
    assert.equal(normalizeOrganisationId('ems'), 'ems');
    assert.equal(normalizeOrganisationId('Org_1-2'), 'Org_1-2');
  });

  it('rejects invalid ids', () => {
    assert.equal(normalizeOrganisationId(''), null);
    assert.equal(normalizeOrganisationId('bad id'), null);
    assert.equal(normalizeOrganisationId('x'.repeat(65)), null);
  });
});

describe('sanitizeRestorePayload', () => {
  it('requires organisationId', () => {
    const result = sanitizeRestorePayload({
      activities: [{ activity: 'Clap', category: 'Warm-up', lesson_number: '1' }],
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /organisationId/i);
  });

  it('keeps validated uuid id and forces organisation_id', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const result = sanitizeRestorePayload(
      {
        data: {
          yearGroups: [
            {
              id,
              user_id: 'u1',
              organisation_id: 'other',
              created_at: '2020-01-01',
              name: 'Y1',
            },
          ],
        },
      },
      { targetOrg: 'ems' },
    );
    assert.equal(result.ok, true);
    assert.equal(result.data.yearGroups[0].id, id);
    assert.equal(result.data.yearGroups[0].user_id, undefined);
    assert.equal(result.data.yearGroups[0].organisation_id, 'ems');
  });

  it('strips non-uuid ids', () => {
    const result = sanitizeRestorePayload(
      {
        yearGroups: [{ id: 'not-a-uuid', name: 'Y1' }],
      },
      { targetOrg: 'ems' },
    );
    assert.equal(result.ok, false);
  });

  it('requires stack data to be an object', () => {
    const bad = sanitizeRestorePayload(
      {
        lessonStacks: [{ name: 's', data: 'nope' }],
      },
      { targetOrg: 'ems' },
    );
    assert.equal(bad.ok, false);

    const good = sanitizeRestorePayload(
      {
        lessonStacks: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 's',
            data: { a: 1 },
          },
        ],
      },
      { targetOrg: 'ems' },
    );
    assert.equal(good.ok, true);
    assert.deepEqual(good.data.lessonStacks[0].data, { a: 1 });
  });

  it('sets organisation_id when restoring into a chosen org', () => {
    const result = sanitizeRestorePayload(
      {
        activities: [
          {
            activity: 'Clap',
            category: 'Warm-up',
            lesson_number: '1',
            organisation_id: 'other',
          },
        ],
      },
      { targetOrg: 'ems' },
    );
    assert.equal(result.ok, true);
    assert.equal(result.data.activities[0].organisation_id, 'ems');
  });

  it('rejects tables over the row cap', () => {
    const rows = Array.from({ length: BACKUP_ROW_CAP + 1 }, (_, i) => ({
      activity: `a${i}`,
      category: 'Warm-up',
      lesson_number: String(i),
    }));
    const result = sanitizeRestorePayload({ activities: rows }, { targetOrg: 'ems' });
    assert.equal(result.ok, false);
    assert.match(result.error, /row cap/i);
  });

  it('rejects unknown-shaped activity rows', () => {
    const result = sanitizeRestorePayload(
      { activities: [{ category: 'Warm-up' }] },
      { targetOrg: 'ems' },
    );
    assert.equal(result.ok, false);
  });
});
