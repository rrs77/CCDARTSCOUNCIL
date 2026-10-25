/**
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/lessonTemplates/rhythmstixTemplates.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  compactShortLines,
  RHYTHMSTIX_TEMPLATES,
  buildRhythmstixDoc,
  renderRhythmstixHtml,
  resolveLessonTemplateId,
  rhythmstixPlanTemplate,
  templateFromDbRow,
  templateIdForYearGroup,
  templateIdForKeyStage,
  yearsLabelFor,
  splitLongBlock,
  labelForLink,
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
  it('Reception labels map to EYFS (regression)', () => {
    for (const l of ['YR', 'YR.', 'Yr R', 'Year R', 'yr', 'Reception', 'YR Music', 'Reception Class']) {
      assert.equal(templateIdForYearGroup(l), 'eyfs', l);
    }
    assert.equal(templateIdForYearGroup('Y'), null);
    assert.equal(templateIdForYearGroup('Yr 3'), 'lks2');
    assert.equal(templateIdForYearGroup('Year 1'), 'ks1');
  });
  const cases: Array<[string, string | null]> = [
    ['Reception', 'eyfs'], ['EYFS', 'eyfs'], ['Nursery', 'eyfs'], ['Year 1', 'ks1'], ['Y2', 'ks1'],
    ['Year 3', 'lks2'], ['Y4 Music', 'lks2'], ['Year 5', 'uks2'], ['Year 6', 'uks2'],
    ['Year 7', 'ks3'], ['Y9', 'ks3'], ['Year 10', 'ks4'], ['Y11', 'ks4'], ['Year 12', 'ks5'],
    ['Y13', 'ks5'], ['GCSE Drama', 'ks4'], ['A-level Music', 'ks5'], ['', null], ['Choir', null],
    ['Yr 3', 'lks2'], ['Yr 3 Music', 'lks2'], ['yr3', 'lks2'], ['Yr 1', 'ks1'], ['Yrs 5 & 6', 'uks2'],
    ['Years 3-4', 'lks2'], ['Years 3–4', 'lks2'], ['Years 5–6', 'uks2'], ['Years 7-9', 'ks3'],
    ['Years 10–11', 'ks4'], ['Years 12-13', 'ks5'], ['Year 11 Music (GCSE)', 'ks4'], ['Year 2 Drama', 'ks1'],
    ['Lower Kindergarten', 'eyfs'], ['Upper Kindergarten Music', 'eyfs'], ['LKG', 'eyfs'], ['UKG', 'eyfs'],
    ['Reception Music', 'eyfs'], ['Nursery', 'eyfs'], ['FS2', 'eyfs'], ['Early Years', 'eyfs'],
    ['KS1', 'ks1'], ['KS2', 'lks2'], ['Key Stage 2', 'lks2'], ['Upper KS2', 'uks2'], ['LKS2', 'lks2'],
    ['UKS2', 'uks2'], ['KS3', 'ks3'], ['KS4', 'ks4'], ['KS5', 'ks5'], ['Sixth Form', 'ks5'],
    ['Record club', null],
  ];
  for (const [yg, id] of cases) it(`${yg || '(blank)'} → ${id}`, () => assert.equal(templateIdForYearGroup(yg), id));
  it('KS2 is consistent between year-group and key-stage mapping', () => {
    assert.equal(templateIdForYearGroup('KS2'), templateIdForKeyStage('ks2'));
    assert.equal(templateIdForKeyStage('ks2'), 'lks2');
    assert.equal(templateIdForKeyStage('ks4'), 'ks4');
  });
  it('falls back to the toolbar key stage when the class name has no year', () => {
    assert.equal(resolveLessonTemplateId({}, 'Brass Group', 'ks3'), 'ks3');
    assert.equal(resolveLessonTemplateId({}, 'Brass Group'), 'eyfs');
    assert.equal(resolveLessonTemplateId({}, 'Year 8 Music', 'ks1'), 'ks3');
  });
  it('labels EYFS classes', () => {
    const e = RHYTHMSTIX_TEMPLATES[0];
    assert.equal(yearsLabelFor(e, 'Lower Kindergarten Music'), 'LOWER KINDERGARTEN');
    assert.equal(yearsLabelFor(e, 'UKG'), 'UPPER KINDERGARTEN');
    assert.equal(yearsLabelFor(e, 'Nursery'), 'NURSERY');
    assert.equal(yearsLabelFor(e, 'EYFS'), 'RECEPTION');
    assert.equal(yearsLabelFor(RHYTHMSTIX_TEMPLATES[4], 'Year 8 Music'), 'YEARS 7–9');
  });
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
    assert.match(eyfs, /<p class="rx-kicker">Lesson plan<\/p>/);
    assert.match(ks3, /Lesson plan • Illustrative template/);
    assert.match(ks3, /Explore • Create • Refine • Evaluate/);
    assert.match(ks3, /YEARS 7–9 &nbsp;•&nbsp; 45 minutes/);
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
  it('does not invent content: blank write-in lines, every section and Source always shown', () => {
    const d = buildRhythmstixDoc({ grouped: {}, categoryOrder: [], totalTime: 0 }, { templateId: 'eyfs' });
    assert.deepEqual(d.iCan, []);
    const html = renderRhythmstixHtml(d);
    assert.doesNotMatch(html, /Teacher to (add|complete)/);
    assert.equal((html.match(/✓ I can <div class="rx-lines"/g) || []).length, 4);
    assert.match(html, /Key vocabulary/);
    assert.match(html, /Non-specialist teacher toolkit/);
    assert.match(html, /Support, challenge and safety/);
    assert.match(html, /SOURCE &amp; ADAPTATION/);
    assert.match(html, /45 minutes/);
    for (const id of ['ks4', 'ks5'] as const) {
      const h = renderRhythmstixHtml(buildRhythmstixDoc({ grouped: {}, categoryOrder: [], totalTime: 0 }, { templateId: id }));
      assert.match(h, /Support, challenge and safety/);
      assert.match(h, /SOURCE, ATTRIBUTION AND LIVE RESOURCE LINKS/);
      assert.match(h, id === 'ks4' ? /Not tied to any examination board/ : /scholarly sources/);
    }
  });
  it('meta line: lesson minutes and focus from the lesson data', () => {
    const d = buildRhythmstixDoc(
      { grouped: {}, categoryOrder: ['Composition and musical storytelling'], totalTime: 42, title: 'Film music' },
      { templateId: 'ks3' },
    );
    assert.deepEqual(d.meta.slice(-2), ['42 minutes', 'Composition and musical storytelling']);
    const n = buildRhythmstixDoc({ grouped: {}, categoryOrder: [], totalTime: 0 }, { templateId: 'uks2' });
    assert.ok(n.meta.includes('50 minutes'));
  });
  it('compacts runs of short lines, keeps lead-ins, reads minute ranges', () => {
    assert.equal(
      compactShortLines('Encourage words:\nexcited\nproud\nworried\nThen discuss in pairs and share back with the whole class at the end.'),
      'Encourage words:\nexcited • proud • worried\nThen discuss in pairs and share back with the whole class at the end.',
    );
    const r = splitLongBlock('Main', '1. Warm up (5 minutes)<br>Clap.<br>2. Performance – Beginning to End (10–12 minutes)<br>Perform.');
    assert.equal(r.steps[1].title, 'Performance – Beginning to End');
    assert.equal(r.steps[1].minutes, 12);
  });
  it('dedupes vocabulary, resources and key questions held both on the lesson and in sections', () => {
    const l = {
      grouped: {}, categoryOrder: [], totalTime: 30,
      vocabulary: 'chord, riff', resources: '/examples/ks3-four-chords-lesson-guide.pdf', keyQuestions: 'Why four chords?',
      sections: [
        { id: '1', kind: 'vocabulary', title: 'Vocabulary', bodyHtml: 'chord, riff' },
        { id: '2', kind: 'free_text', title: 'Resources', bodyHtml: '/examples/ks3-four-chords-lesson-guide.pdf' },
        { id: '3', kind: 'free_text', title: 'Key questions', bodyHtml: 'Why four chords?' },
      ],
    };
    const d = buildRhythmstixDoc(l, { templateId: 'ks3', baseUrl: 'https://app.example' });
    assert.equal(d.vocabularyHtml, 'chord, riff');
    assert.deepEqual(d.keyQuestions, ['Why four chords?']);
    assert.deepEqual(d.resourceLines, []);
    assert.deepEqual(d.resourceLinks, [{ label: 'KS3 four chords lesson guide (PDF)', url: 'https://app.example/examples/ks3-four-chords-lesson-guide.pdf' }]);
    const html = renderRhythmstixHtml(d);
    assert.equal((html.match(/Why four chords\?/g) || []).length, 1);
    assert.doesNotMatch(html, />\/examples\//);
  });
  it('labels links and refuses unsafe ones', () => {
    assert.equal(labelForLink('https://www.rhythmstix.co.uk/'), 'rhythmstix.co.uk');
    assert.equal(labelForLink('/files/Samba_grooves-eyfs.mp3'), 'Samba grooves EYFS (MP3)');
    const d = buildRhythmstixDoc({ grouped: {}, categoryOrder: [], totalTime: 0, resources: 'javascript:alert(1)\nTambourines', resourceLink: 'javascript:alert(1)' }, { templateId: 'ks1' });
    assert.deepEqual(d.resourceLinks, []);
    assert.deepEqual(d.resourceLines, ['javascript:alert(1)', 'Tambourines']);
    assert.doesNotMatch(renderRhythmstixHtml(d), /href="javascript/);
  });
  it('splits a whole legacy lesson into steps at numbered headings', () => {
    const body = [
      'Learning Outcomes', 'By the end of the lesson:', '', 'Lesson Structure',
      '1. Warm-Up Game – Pass the Emotion (10 minutes)', 'Children stand in a circle.',
      '2. Revisiting the Painting – What Happened Before? (10 minutes)', 'Show the painting again.',
      '3. Freeze frames', 'Hold the frame.',
      'Key Vocabulary', 'Role', 'Scene',
    ].join('\n');
    const { steps, routed } = splitLongBlock('Main activity', body);
    assert.deepEqual(steps.map((s) => [s.title, s.minutes]), [
      ['Warm-Up Game – Pass the Emotion', 10], ['Revisiting the Painting – What Happened Before?', 10], ['Freeze frames', undefined],
    ]);
    assert.deepEqual(routed.map(([r]) => r), ['vocabularyHtml']);
    const d = buildRhythmstixDoc({ grouped: {}, categoryOrder: [], totalTime: 45, sections: [{ id: 'm', kind: 'free_text', title: 'Main activity', bodyHtml: body }] }, { templateId: 'ks1' });
    assert.equal(d.steps.length, 3);
    assert.match(d.vocabularyHtml, /Role<br>Scene/);
  });
  it('breaks very long unstructured text into parts', () => {
    const para = 'Lorem ipsum dolor sit amet. '.repeat(30);
    const { steps } = splitLongBlock('Main activity', [para, para, para].join('\n\n'));
    assert.ok(steps.length >= 2);
    assert.equal(steps[1].title, 'Main activity (continued)');
  });
  it('adds the continued kicker when the sequence flows past page 1', () => {
    const long = { ...lesson, sections: Array.from({ length: 8 }, (_, i) => ({ id: String(i), kind: 'free_text', title: `Step ${i}`, durationMins: 5, bodyHtml: 'Do the thing carefully. '.repeat(20) })) };
    const html = renderRhythmstixHtml(buildRhythmstixDoc(long, { templateId: 'eyfs' }));
    assert.equal((html.match(/Lesson sequence • continued/g) || []).length, 1);
    assert.match(html, /Teacher cue: <span class="rx-fillin">/);
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
