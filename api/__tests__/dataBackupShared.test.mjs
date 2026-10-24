/**
 * Curriculum backup sanitize / Content-Length gates.
 * Run: node --test api/__tests__/dataBackupShared.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKUP_ROW_CAP,
  backupContentLengthGate,
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

describe('sanitizeRestorePayload', () => {
  it('strips identity fields when no org is chosen', () => {
    const result = sanitizeRestorePayload({
      data: {
        activities: [
          {
            id: 'should-strip',
            user_id: 'u1',
            organisation_id: 'ems',
            created_at: '2020-01-01',
            activity: 'Clap',
            category: 'Warm-up',
            lesson_number: '1',
            activityText: 'Clap twice',
          },
        ],
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.data.activities.length, 1);
    assert.equal(result.data.activities[0].activity, 'Clap');
    assert.equal(result.data.activities[0].activity_text, 'Clap twice');
    assert.equal(result.data.activities[0].id, undefined);
    assert.equal(result.data.activities[0].user_id, undefined);
    assert.equal(result.data.activities[0].organisation_id, undefined);
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
    const result = sanitizeRestorePayload({ activities: rows });
    assert.equal(result.ok, false);
    assert.match(result.error, /row cap/i);
  });

  it('rejects unknown-shaped activity rows', () => {
    const result = sanitizeRestorePayload({
      activities: [{ category: 'Warm-up' }],
    });
    assert.equal(result.ok, false);
  });
});
