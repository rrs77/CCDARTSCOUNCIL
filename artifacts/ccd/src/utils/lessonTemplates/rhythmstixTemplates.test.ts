/**
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/lessonTemplates/rhythmstixTemplates.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  RHYTHMSTIX_TEMPLATES,
  buildRhythmstixDoc,
  renderRhythmstixHtml,
  resolveLessonTemplateId,
  rhythmstixPlanTemplate,
  templateFromDbRow,
  templateIdForYearGroup,
  safeHexColour,
  withLessonTemplate,
} from './rhythmstixTemplates.ts';

const lesson = {
  grouped: {},
  categoryOrder: [],
  totalTime: 45,
  title: 'Exploring Sound!',
  learningOutcome: 'Children explore and compare sounds.',
  successCriteria: '<ul><li>I can listen carefully.</li><li>I can move to show loud and quiet.</li></ul>',
  vocabulary: 'sound • listen • loud',
  sections: [
    { id: 'a', kind: 'activity', title: 'Hello, sound!', durationMins: 5, bodyHtml: 'Sit in a circle.',
      activity: { activity: 'Hello, sound!', time: 5, resourceLink: 'https://www.rhythmstix.co.uk/x' } },
    { id: 'b', kind: 'free_text', title: 'Listen and copy', durationMins: 10, bodyHtml: 'Copy patterns.' },
    { id: 'q', kind: 'free_text', title: 'Key questions', bodyHtml: 'Which sound?\nCould you hear it?' },
    { id: 'c', kind: 'afl', title: 'Assessment', bodyHtml: 'responding to cues' },
    { id: 'd', kind: 'differentiation', title: 'Support', bodyHtml: 'Offer two instruments.' },
    { id: 'e', kind: 'free_text', title: 'Safety', bodyHtml: 'Model gentle playing.' },
    { id: 'f', kind: 'free_text', title: 'Subject knowledge', bodyHtml: 'Model motif.' },
  ],
};

describe('year group → template', () => {
  const cases: Array<[string, string | null]> = [
    ['Reception', 'eyfs'], ['EYFS', 'eyfs'], ['Nursery', 'eyfs'], ['Year 1', 'ks1'], ['Y2', 'ks1'],
    ['Year 3', 'lks2'], ['Y4 Music', 'lks2'], ['Year 5', 'uks2'], ['Year 6', 'uks2'],
    ['Year 7', 'ks3'], ['Y9', 'ks3'], ['Year 10', 'ks4'], ['Y11', 'ks4'], ['Year 12', 'ks5'],
    ['Y13', 'ks5'], ['GCSE Drama', 'ks4'], ['A-level Music', 'ks5'], ['', null], ['Choir', null],
  ];
  for (const [yg, id] of cases) it(`${yg || '(blank)'} → ${id}`, () => assert.equal(templateIdForYearGroup(yg), id));
  it('has exactly the seven templates in order', () => {
    assert.deepEqual(RHYTHMSTIX_TEMPLATES.map((t) => t.id), ['eyfs', 'ks1', 'lks2', 'uks2', 'ks3', 'ks4', 'ks5']);
  });
});

describe('switching templates', () => {
  it('defaults from the year group, then the saved choice wins', () => {
    assert.equal(resolveLessonTemplateId(lesson, 'Year 3'), 'lks2');
    const switched = withLessonTemplate(lesson, 'ks4');
    assert.equal(switched.lessonTemplateId, 'ks4');
    assert.equal(resolveLessonTemplateId(switched, 'Year 3'), 'ks4');
    // Saved choice survives a JSON round trip (lessons.data jsonb)
    assert.equal(resolveLessonTemplateId(JSON.parse(JSON.stringify(switched)), 'Reception'), 'ks4');
    // Switching again replaces it, without touching lesson content
    const back = withLessonTemplate(switched, 'eyfs');
    assert.equal(resolveLessonTemplateId(back, 'Year 10'), 'eyfs');
    assert.deepEqual(back.sections, lesson.sections);
    assert.equal(lesson.hasOwnProperty('lessonTemplateId'), false, 'original lesson not mutated');
  });
  it('ignores an unknown saved id and rejects setting one', () => {
    assert.equal(resolveLessonTemplateId({ lessonTemplateId: 'ks9' }, 'Year 7'), 'ks3');
    assert.throws(() => withLessonTemplate(lesson, 'ks9' as any));
  });
  it('renders different layouts for the switched template', () => {
    const eyfs = renderRhythmstixHtml(buildRhythmstixDoc(lesson, { templateId: 'eyfs', yearGroup: 'Reception' }));
    const ks3 = renderRhythmstixHtml(buildRhythmstixDoc(lesson, { templateId: 'ks3', yearGroup: 'Year 8' }));
    assert.match(eyfs, /data-rx-template="eyfs"/);
    assert.match(eyfs, /EYFS MUSIC/);
    assert.match(eyfs, /ASSESSMENT — LOOK &amp; LISTEN FOR/);
    assert.match(eyfs, /Check understanding/);
    assert.match(ks3, /data-rx-template="ks3"/);
    assert.match(ks3, /YEARS 7–9 MUSIC/);
    assert.match(ks3, /ASSESSMENT: LOOK FOR/);
    assert.match(ks3, /Teacher reference and subject toolkit/);
    assert.match(ks3, /COMMON MISCONCEPTION/);
    assert.notEqual(eyfs, ks3);
  });
});

describe('document mapping', () => {
  const doc = buildRhythmstixDoc(lesson, { templateId: 'ks3', yearGroup: 'Year 8' });
  it('keeps activity order and timings', () => {
    assert.deepEqual(doc.steps.map((s) => [s.title, s.minutes]), [['Hello, sound!', 5], ['Listen and copy', 10]]);
  });
  it('routes reference sections', () => {
    assert.deepEqual(doc.iCan, ['I can listen carefully.', 'I can move to show loud and quiet.']);
    assert.deepEqual(doc.keyQuestions, ['Which sound?', 'Could you hear it?']);
    assert.deepEqual(doc.assessment, ['responding to cues']);
    assert.match(doc.support, /two instruments/);
    assert.match(doc.safety, /gentle/);
    assert.equal(doc.toolkit[0].label, 'SUBJECT KNOWLEDGE');
  });
  it('keeps clickable links and escapes text', () => {
    const html = renderRhythmstixHtml(buildRhythmstixDoc({ ...lesson, title: '<script>x</script>' }, { templateId: 'ks1' }));
    assert.match(html, /href="https:\/\/www\.rhythmstix\.co\.uk\/x"/);
    assert.doesNotMatch(html, /<script>/);
  });
  it('has a logo slot top-left and no text under 13px', () => {
    const html = renderRhythmstixHtml(doc);
    assert.match(html, /data-logo-slot="top-left"/);
    const withLogo = renderRhythmstixHtml(doc, { logoHtml: '<img class="ccd-plan-logo" src="data:image/png;base64,AA" alt="CCDesigner">' });
    assert.match(withLogo, /data-logo-slot="top-left"><img class="ccd-plan-logo"/);
    assert.doesNotMatch(withLogo, /RHYTHMSTIX<\/span>/);
    const sizes = [...html.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
    assert.ok(sizes.length > 5);
    assert.ok(sizes.every((s) => s >= 13), `sizes: ${sizes}`);
  });
  it('does not invent outcomes when none are authored', () => {
    const d = buildRhythmstixDoc({ grouped: {}, categoryOrder: [], totalTime: 0 }, { templateId: 'eyfs' });
    assert.deepEqual(d.iCan, []);
    assert.doesNotMatch(renderRhythmstixHtml(d), /I CAN…/);
  });
});

describe('starter sections and DB rows', () => {
  it('starter sections route back into the reference page', () => {
    for (const t of RHYTHMSTIX_TEMPLATES) {
      const pt = rhythmstixPlanTemplate(t);
      const sections = pt.defaultSectionBlueprints.map((b, i) => ({ id: String(i), kind: b.kind, title: b.title, bodyHtml: 'x' }));
      const d = buildRhythmstixDoc({ grouped: {}, categoryOrder: [], totalTime: 0, sections }, { templateId: t.id });
      assert.equal(d.steps.length, 0, `${t.id}: starter sections should not become activities`);
    }
  });
  it('reads DB rows and rejects unknown keys', () => {
    assert.equal(templateFromDbRow({ template_key: 'ks2' }), null);
    const r = templateFromDbRow({ template_key: 'ks1', name: 'KS1 edited', config: { accent: '#000000' }, sort_order: 2 });
    assert.equal(r?.name, 'KS1 edited');
    assert.equal(r?.accent, '#000000');
    assert.equal(r?.referenceHeading, 'Check understanding');
  });
});

describe('accent validation', () => {
  it('only lets 6-digit hex accents reach styles', () => {
    assert.equal(safeHexColour('#1a2B3c', '#000000'), '#1a2B3c');
    for (const bad of ['red', '#fff', '#12345678', '#C87835;background:url(x)', '</style><script>', 7, null]) {
      assert.equal(safeHexColour(bad, '#C87835'), '#C87835');
    }
  });
  it('falls back to the bundled accent for a bad DB config', () => {
    const r = templateFromDbRow({ template_key: 'ks3', config: { accent: 'red;}</style><script>x</script>', tint: 'url(x)' } });
    assert.equal(r?.accent, '#665A8C');
    assert.equal(r?.tint, '#EFEDF5');
    const html = renderRhythmstixHtml(buildRhythmstixDoc(lesson, { templateId: 'ks3', template: { ...r!, accent: 'x</style>' } }));
    assert.doesNotMatch(html, /x<\/style>/);
    assert.match(html, /--rx-accent:#665A8C/);
  });
});
