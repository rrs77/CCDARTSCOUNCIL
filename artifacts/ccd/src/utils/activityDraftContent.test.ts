/**
 * Create-activity draft gate: no untitled autosave until title or body content.
 * Run: cd scripts && node --import tsx --test ../artifacts/ccd/src/utils/activityDraftContent.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { activityDraftHasContent, activityDraftStorageKey } from './activityDraftContent.ts';

describe('activityDraftHasContent', () => {
  it('rejects empty create forms', () => {
    assert.equal(activityDraftHasContent({ activity: '', description: '', activityText: '' }), false);
    assert.equal(activityDraftHasContent({ activity: '   ', description: '<p></p>', activityText: '<br>' }), false);
    assert.equal(activityDraftHasContent({ activity: '', description: '&nbsp;', activityText: '' }), false);
  });

  it('accepts a title', () => {
    assert.equal(activityDraftHasContent({ activity: 'Pulse game', description: '', activityText: '' }), true);
  });

  it('accepts introduction or activity body text', () => {
    assert.equal(
      activityDraftHasContent({ activity: '', description: '<p>Warm up with claps.</p>', activityText: '' }),
      true,
    );
    assert.equal(
      activityDraftHasContent({ activity: '', description: '', activityText: '<p>Main task</p>' }),
      true,
    );
  });
});

describe('activityDraftStorageKey', () => {
  it('uses new for untitled create drafts', () => {
    assert.equal(activityDraftStorageKey('create', {}), 'ccd-activity-draft-create-new');
  });
});
