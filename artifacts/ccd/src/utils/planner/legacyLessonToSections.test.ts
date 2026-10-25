/**
 * Lightweight node test (no vitest harness required).
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/planner/legacyLessonToSections.test.ts
 * or via the npm script once wired.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { LessonData } from '../../contexts/DataContext';
import { ensureLessonSections, legacyLessonToSections } from './legacyLessonToSections.ts';

const sample = {
  grouped: {
    'Drama Games': [
      {
        activity: 'Freeze frames',
        description: 'Create still images',
        time: 10,
        category: 'Drama Games',
        teachingUnit: '',
        level: 'Y5',
        unitName: '',
        lessonNumber: '',
        videoLink: '',
        musicLink: '',
        backingLink: '',
        resourceLink: '',
        link: '',
        vocalsLink: '',
        imageLink: '',
      },
    ],
    Songs: [
      {
        activity: 'Hello song',
        description: 'Warm-up song',
        time: 5,
        category: 'Songs',
        teachingUnit: '',
        level: 'Y5',
        unitName: '',
        lessonNumber: '',
        videoLink: '',
        musicLink: '',
        backingLink: '',
        resourceLink: '',
        link: '',
        vocalsLink: '',
        imageLink: '',
      },
    ],
  },
  categoryOrder: ['Songs', 'Drama Games'],
  totalTime: 15,
  introduction: 'Welcome circle',
  vocabulary: 'tableau, freeze',
  differentiation: 'Support with sentence starters',
  assessment: 'Thumbs up check',
  plenary: 'Share one freeze',
  mainActivity: '',
  resources: 'Scarves',
  title: 'Sample',
} as unknown as LessonData;

describe('legacyLessonToSections', () => {
  it('preserves activity order from categoryOrder and plan text fields', () => {
    const sections = legacyLessonToSections(sample);
    const titles = sections.map((s) => s.title);
    assert.equal(titles[0], 'Introduction');
    assert.equal(titles[1], 'Hello song');
    assert.equal(titles[2], 'Freeze frames');
    assert.ok(titles.includes('Vocabulary'));
    assert.ok(titles.includes('Differentiation'));
    assert.ok(titles.includes('Assessment for learning'));
    assert.ok(titles.includes('Plenary'));
    assert.ok(titles.includes('Resources'));
    assert.equal(
      sections.filter((s) => s.kind === 'activity').length,
      2,
    );
  });

  it('returns existing sections unchanged when present', () => {
    const withSections = {
      ...sample,
      sections: [
        {
          id: 'x1',
          kind: 'free_text' as const,
          title: 'Already migrated',
          bodyHtml: 'hi',
        },
      ],
    };
    const sections = legacyLessonToSections(withSections as LessonData);
    assert.equal(sections.length, 1);
    assert.equal(sections[0].title, 'Already migrated');
  });

  it('ensureLessonSections is idempotent for legacy lessons', () => {
    const once = ensureLessonSections(sample);
    const twice = ensureLessonSections(once);
    assert.equal(once.sections.length, twice.sections.length);
  });
});
