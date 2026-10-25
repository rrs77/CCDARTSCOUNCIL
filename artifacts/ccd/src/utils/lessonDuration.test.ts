/**
 * Run: cd scripts && node --import tsx --test ../artifacts/ccd/src/utils/lessonDuration.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_LESSON_DURATION_MINS,
  lessonActivityMinutesSum,
  lessonDurationMinutes,
} from './lessonDuration.ts';

describe('lessonDurationMinutes', () => {
  it('defaults to 45 when nothing is set and activity sum is 0', () => {
    assert.equal(DEFAULT_LESSON_DURATION_MINS, 45);
    assert.equal(lessonDurationMinutes(undefined), 45);
    assert.equal(lessonDurationMinutes({ totalTime: 0, grouped: {} }), 45);
    assert.equal(lessonDurationMinutes({ totalTime: 0, sections: [], orderedActivities: [] }), 45);
  });

  it('uses stored totalTime when set', () => {
    assert.equal(lessonDurationMinutes({ totalTime: 60, sections: [] }), 60);
    assert.equal(
      lessonDurationMinutes({
        totalTime: 45,
        sections: [{ id: 'a', kind: 'activity', title: 'A', durationMins: 10 }],
      }),
      45,
    );
  });

  it('falls back to activity / section sum when totalTime is 0', () => {
    assert.equal(
      lessonDurationMinutes({
        totalTime: 0,
        sections: [
          { id: 'a', kind: 'activity', title: 'A', durationMins: 10 },
          { id: 'b', kind: 'free_text', title: 'B', durationMins: 5 },
        ],
      }),
      15,
    );
    assert.equal(
      lessonDurationMinutes({
        totalTime: 0,
        orderedActivities: [{ activity: 'X', time: 12 } as never, { activity: 'Y', time: 8 } as never],
      }),
      20,
    );
    assert.equal(lessonActivityMinutesSum({ totalTime: 99, sections: [{ id: 'a', kind: 'free_text', title: 'A', durationMins: 7 }] }), 7);
  });
});
