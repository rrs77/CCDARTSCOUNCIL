/**
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/planner/offlineDemoAi.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildOfflineFleshOutPayload,
  isRomeoJulietContext,
  offlineHelpMeWrite,
  offlineLessonFillFor,
  offlinePolishBodies,
  preferOfflineDemoAi,
} from './offlineDemoAi.ts';

describe('offlineDemoAi', () => {
  it('detects Romeo and Juliet context', () => {
    assert.equal(isRomeoJulietContext('Romeo and Juliet dance'), true);
    assert.equal(isRomeoJulietContext('Generic warm-up'), false);
  });

  it('builds RJ-themed flesh-out without MUSIC / Rhythmstix / Jazz North', () => {
    const result = buildOfflineFleshOutPayload({
      instruction: 'Flesh out this Romeo and Juliet lesson',
      lesson: {
        title: 'Romeo and Juliet',
        activities: [],
        sections: [],
      },
      options: {
        includeOutcomes: true,
        includeSuccessCriteria: true,
        includeTeacherQuestions: true,
        includeDifferentiation: true,
        wholeLesson: true,
      },
    });
    const blob = JSON.stringify(result);
    assert.match(result.learningOutcome, /Romeo and Juliet/);
    assert.ok(result.suggestedActivities && result.suggestedActivities.length >= 3);
    assert.ok(result.vocabularyHtml);
    assert.doesNotMatch(blob, /Rhythmstix|Jazz North|\bMUSIC\b/);
  });

  it('Help me write returns HTML steps', () => {
    const html = offlineHelpMeWrite({
      title: 'Motif warm-up',
      tab: 'activity',
      lessonHint: 'Romeo and Juliet',
    });
    assert.match(html, /<ol>/);
    assert.match(html, /motif/i);
  });

  it('generic fill is subject-neutral', () => {
    const fill = offlineLessonFillFor('Untitled lesson');
    assert.doesNotMatch(fill.lessonTitle, /MUSIC|Rhythmstix|Jazz North/i);
    const polish = offlinePolishBodies('Share and refine');
    assert.ok(polish.learningOutcome.length > 20);
  });

  it('preferOfflineDemoAi is false outside a browser demo session', () => {
    assert.equal(preferOfflineDemoAi(), false);
  });
});
