#!/usr/bin/env node
/**
 * Generate teacher-facing overview PDFs for prototype units + WTD packs.
 * Primary output: public/examples/*.pdf
 * Also copies to public/demo-resources/, public/prototype/, public/partners/weteachdrama/
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { jsPDF } = require('jspdf');

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const examplesDir = join(root, 'public', 'examples');
const demoDir = join(root, 'public', 'demo-resources');
const protoDir = join(root, 'public', 'prototype');
const wtdDir = join(root, 'public', 'partners', 'weteachdrama');
for (const d of [examplesDir, demoDir, protoDir, wtdDir]) mkdirSync(d, { recursive: true });

function writeDoc(filename, title, lines) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  const pageHeight = doc.internal.pageSize.getHeight();

  const ensureSpace = (need = 16) => {
    if (y > pageHeight - margin - need) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title, maxWidth);
  for (const t of titleLines) {
    doc.text(t, margin, y);
    y += 18;
  }
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  const disclaimer = doc.splitTextToSize(
    'CCDesigner prototype overview — original outlines for demo planning only. Not a paid publisher pack. Logos and product names do not imply endorsement.',
    maxWidth,
  );
  for (const d of disclaimer) {
    doc.text(d, margin, y);
    y += 12;
  }
  y += 14;
  doc.setTextColor(20);

  for (const line of lines) {
    if (line === '') {
      y += 8;
      continue;
    }
    const isHeading = line.startsWith('## ');
    const isBullet = line.startsWith('- ');
    const text = isHeading ? line.slice(3) : isBullet ? line.slice(2) : line;
    ensureSpace(isHeading ? 28 : 16);
    if (isHeading) {
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }
    const wrapped = doc.splitTextToSize(text, maxWidth - (isBullet ? 12 : 0));
    for (const w of wrapped) {
      ensureSpace();
      doc.text(isBullet ? `• ${w}` : w, margin + (isBullet ? 8 : 0), y);
      y += isHeading ? 15 : 13;
    }
  }

  const buf = Buffer.from(doc.output('arraybuffer'));
  const outExamples = join(examplesDir, filename);
  writeFileSync(outExamples, buf);
  writeFileSync(join(demoDir, filename), buf);
  console.log('wrote', outExamples);
  return outExamples;
}

writeDoc('ks3-four-chords-lesson-guide.pdf', 'KS3 Music — 4 Chords (unit guide)', [
  '## Key stage & curriculum',
  'KS3 Music (typically Year 7–9). Performing, composing and listening around the I–V–vi–IV progression.',
  'Pedagogy: Musical Futures–style informal learning (peer coaching, classroom band roles) and the public Axis of Awesome–style “four chords” classroom concept. Original CCDesigner outlines only.',
  '',
  '## Learning outcomes',
  '- Play I–V–vi–IV fluently with a steady pulse in a group.',
  '- Maintain an independent part (bass, chords, rhythm or melody).',
  '- Improvise / compose a short hook or song sketch on the progression.',
  '- Identify the progression in familiar songs and describe its effect.',
  '',
  '## Lesson outline (5 lessons)',
  '1. Find the four chords — recognise and play I–V–vi–IV with a steady pulse.',
  '2. Play as a band — layered parts (bass, chords, rhythm, melody).',
  '3. Melody over the loop — improvise and refine a hook.',
  '4. Mash-up / song sketch — verse–chorus structure on the progression.',
  '5. Share, reflect, next steps — perform and evaluate with KS3 vocabulary.',
  '',
  '## Classroom tips',
  'Peer coaching, classroom band roles, and short recorded feedback keep the focus on pulse and ensemble balance.',
  'Further reading: musicalfutures.org (public organisation site).',
]);

writeDoc('ks3-four-chords-chord-chart.pdf', 'KS3 — Four Chords chord chart', [
  '## Progression',
  'Roman numerals: I – V – vi – IV',
  'In G major: G – D – Em – C',
  'In C major: C – G – Am – F',
  '',
  '## Practice',
  'Say chord names in time before playing. Change on beat 1. Keep a shared pulse.',
  'Ukulele / guitar / keyboard stations: rotate roles every few minutes.',
]);

writeDoc('gcse-drama-blood-brothers-aqa-pack.pdf', 'GCSE Drama — Blood Brothers (AQA-flavoured overview)', [
  '## Key stage & curriculum',
  'KS4 / GCSE Drama (ages 14–16). AQA-style Component 3 set-text study — Blood Brothers by Willy Russell.',
  'Prototype inspired by We Teach Drama’s publicly listed Revise Blood Brothers Scheme of Learning (£45, with guided talk-through). Original CCDesigner outlines only — not a copy of paid PDFs or slides.',
  '',
  '## What the official product emphasises (public listing)',
  '- Practical workshop revision of key extracts',
  '- Exam-focused strategies for higher-mark written responses',
  '- Retrieval slide activities and a guided talk-through of resources',
  '',
  '## Assessment focus (prototype)',
  '- Vocal / physical characterisation and proxemics',
  '- Social/historical context (1980s Liverpool, class, nature vs nurture)',
  '- Design for meaning (costume, set, lighting)',
  '- Evaluative exam language: intention → skill → moment → audience effect',
  '',
  '## Example lesson sequence (5 × ~60 min)',
  '1. Context & class — 1980s Liverpool; nature vs nurture framing.',
  '2. Narrator, omen and dramatic irony — how the audience is positioned.',
  '3. Mickey & Eddie — vocal/physical contrast across childhood → adulthood.',
  '4. Design for meaning — class readable in costume, set and lighting.',
  '5. Exam rehearsal — performer question with banded success criteria.',
  '',
  '## Example lesson deep-dive — L3 Mickey & Eddie',
  'Starter (10): Still images of “same age / different worlds”; annotate proxemics.',
  'Develop (25): Pair duologues — switch status through pitch, pace, gesture.',
  'Apply (15): Rehearse a short reunion extract with clear class gap.',
  'Plenary (10): Write one exam sentence: intention → skill → moment → effect.',
  '',
  '## Official product',
  'https://www.weteachdrama.com/product-page/revise-blood-brothers-scheme-of-learning',
]);

writeDoc('gcse-drama-blood-brothers-scene-notes.pdf', 'Blood Brothers — scene focus notes', [
  '## Useful moments for practical work',
  '- Childhood games / Marilyn Monroe motif',
  '- Narrator interventions and omen sequences',
  '- Mickey / Eddie reunion (class gap through proxemics)',
  '- Final confrontation / design for fate and tragedy',
  '',
  '## Directing questions',
  'Where is the class gap clearest without dialogue?',
  'How does the Narrator shape audience irony?',
  'Which physical detail most clearly signals class?',
  '',
  '## Exam rehearsal tip',
  'Ask students to lock one intention, one skill, one precise moment, then one audience effect before they write.',
]);

writeDoc('ocr-music-film-computer-overview.pdf', 'OCR GCSE Music — Film & Computer Music (overview)', [
  '## Key stage & curriculum',
  'KS4 / OCR GCSE Music (J536) Area of Study 4: Film Music (includes television and computer game music).',
  'Listening and composing language for film cues and computer/game textures — original CCDesigner planning outlines.',
  '',
  '## Lesson outline (5 lessons)',
  '1. Film music toolkit — elements & mood.',
  '2. Leitmotif building and transformation.',
  '3. Computer & game music textures (synth, sample, loop).',
  '4. Storyboard cue — compose establish / conflict / resolve.',
  '5. Refine, export, appraise.',
  '',
  '## Vocabulary',
  'Leitmotif, underscore, diegetic/non-diegetic, hit point, synthesis, sample, loop, stem, brief.',
]);

writeDoc('ocr-music-film-computer-composition-brief.pdf', 'OCR — Film/Computer cue brief', [
  '## Brief',
  'Compose a 45–60 second cue for a three-part storyboard: establish, conflict, resolve. Include one leitmotif and at least one clear hit point.',
  '',
  '## Success criteria',
  '- Structure matches picture',
  '- Motif transforms for mood change',
  '- DAW/notation export is dated and balanced',
  '- Appraisal uses OCR-style subject terminology',
]);

const wtdPacks = [
  [
    'wtd-drama-cover-ks3-overview.pdf',
    'We Teach Drama — Drama Cover Lesson Pack (KS3 overview)',
    [
      '## Key stage & curriculum',
      'KS3 Drama · Ages 11–14 (Years 7–9). Inspired by We Teach Drama’s Drama Cover Lesson Pack (£25) — 20 printable worksheets for cover / supply / non-specialist teachers.',
      'Official pack: independent student worksheets (30–40 min, extendable to 50–60). Prototype outlines below are original CCDesigner planning only.',
      '',
      '## What the shop pack covers (public listing)',
      'Years 7–8: character, facial expression, short scene writing, costume/set/sound/lighting, physical theatre, Stanislavski intro, monologue.',
      'Year 9: developing character, tension, scripting, design disciplines, Stanislavski & Brecht, dramatic monologue.',
      '',
      '## Prototype lesson sequence (2 × ~60 min)',
      '1. Character & expression (Y7–8 cover) — invent a character; map emotion to face/gesture; freeze-frame + thought-track.',
      '2. Design & practitioners intro (Y9 cover) — costume/set choices for meaning; compare Stanislavski focus vs Brecht alienation in a short scene.',
      '',
      '## Example lesson deep-dive — Character & expression',
      'Starter (8): Emotion cards → 10-second facial/gesture switches.',
      'Develop (20): Character passport (age, want, obstacle, secret) + partner hot-seating.',
      'Apply (20): Pair scene (8–12 lines) showing emotion change; add one costume or prop choice.',
      'Plenary (12): Reflection sentence starters + optional extension monologue line.',
      '',
      '## Classroom tips',
      'Print-and-go structure suits cover: clear instructions, vocabulary banks, pair or solo routes, EAL-friendly scaffolds.',
      '',
      '## Official product',
      'https://www.weteachdrama.com/product-page/drama-cover-lesson-pack-ages-11-to-14',
    ],
  ],
  [
    'wtd-think-like-a-designer-overview.pdf',
    'We Teach Drama — Think Like a Designer (overview)',
    [
      '## Key stage & curriculum',
      'Ages 13+ · Year 9 upwards · KS3/KS4 design curriculum. Inspired by Think Like a Designer Student Workbooks (set, costume, lighting, sound) with professional video content.',
      '',
      '## What the shop pack covers (public listing)',
      '- Step-by-step student workbooks (editable/printable) + teacher notes',
      '- Video content with theatre-makers; intelligent lights; QLab tutorial',
      '- Sustainable theatre & Katie Mitchell design thinking; designer-role posters',
      '',
      '## Prototype lesson sequence (2 × ~60 min)',
      '1. Think like a set & costume designer — mood board → design intention → justify choices for a short stimulus scene.',
      '2. Lighting & sound for meaning — cue a moment of tension and a moment of intimacy; write designer vocabulary.',
      '',
      '## Example lesson deep-dive — Set & costume',
      'Starter (10): Spot the design that communicates status without dialogue.',
      'Develop (25): Sketch a set/costume concept linked to one clear intention.',
      'Apply (15): Peer pitch — “My design makes the audience feel… because…”',
      'Plenary (10): Key term retrieval (silhouette, palette, texture, practical vs decorative).',
      '',
      '## Official product',
      'https://www.weteachdrama.com/product-page/the-complete-collection-think-like-a-designer-student-workbooks',
    ],
  ],
  [
    'wtd-theatre-design-challenge-mats-overview.pdf',
    'We Teach Drama — Theatre Design Challenge Mats (overview)',
    [
      '## Key stage & curriculum',
      'KS3–KS5. Inspired by Theatre Design Challenge Mats — 100 tasks across set, costume, lighting and sound (£48), with teacher notes, answers and certificates.',
      '',
      '## Classroom uses (from public listing)',
      '- Knowledge-rich design curriculum stretch',
      '- Independent study / homework / GCSE design specialists',
      '- Displays, revision, and meaningful cover work',
      '- Supports Think Like a Designer workbook content',
      '',
      '## Prototype lesson sequence (2 × ~60 min)',
      '1. Set & costume challenge mats — timed stations; record intention + audience effect for three challenges.',
      '2. Lighting & sound challenge mats — design two contrasting cues for the same beat of action.',
      '',
      '## Example lesson deep-dive — Lighting & sound mats',
      'Starter (5): Match cue words to design tools (gobos, underscoring, diegetic sound).',
      'Develop (30): Rotate challenge cards; annotate answers using teacher-note style justification.',
      'Apply (15): Build one “wow” cue sequence for a short freeze-frame story.',
      'Plenary (10): Award a mini certificate criterion — clarity of intention.',
      '',
      '## Official product',
      'https://www.weteachdrama.com/product-page/theatre-design-challenge-mats',
    ],
  ],
  [
    'wtd-explore-katie-mitchell-overview.pdf',
    'We Teach Drama — Explore Katie Mitchell (overview)',
    [
      '## Key stage & curriculum',
      'Ages 14–18 · GCSE & A-Level. Inspired by Explore Katie Mitchell: Complete Teaching & CPD Pack (£35) — workshop plans, slide deck, CPD webinar, Live Cinema focus.',
      '',
      '## What the shop pack covers (public listing)',
      '- Naturalism, Live Cinema, voice-over and staging workshops (~3 hours practical material)',
      '- Contextual stimuli on Mitchell’s methods and influences',
      '- Differentiation / scaffolding for exam-level study; printable handouts/posters',
      '',
      '## Prototype lesson sequence (2 × ~60 min)',
      '1. Naturalism & given circumstances — build detailed character circumstances; slow-tempo detailed action.',
      '2. Live Cinema staging sketch — storyboard camera/stage relationship; voice-over vs live action experiment.',
      '',
      '## Example lesson deep-dive — Live Cinema sketch',
      'Starter (8): Clip-style discussion — what does the camera notice that the stage audience might miss?',
      'Develop (25): Groups stage a 30-second naturalistic moment + one “camera” viewpoint.',
      'Apply (17): Add a short voice-over layer; decide what remains live.',
      'Plenary (10): Evaluate control, detail and audience focus using Mitchell-linked vocabulary.',
      '',
      '## Official product',
      'https://www.weteachdrama.com/product-page/explore-katie-mitchell-complete-teaching-cpd-pack',
    ],
  ],
  [
    'wtd-explore-complicite-overview.pdf',
    'We Teach Drama — Explore Complicité (overview)',
    [
      '## Key stage & curriculum',
      'Ages 14–18 · GCSE & A-Level. Inspired by Explore Complicité: Complete Teaching & CPD Pack (£35) — ensemble / physical storytelling workshops with CPD webinar.',
      '',
      '## What the shop pack covers (public listing)',
      '- Ensemble, physical theatre, text and storytelling (~3 hours practical material)',
      '- Contextual stimuli on training, influences and rehearsal processes',
      '- Mixed-ability differentiation; printable handouts/posters',
      '',
      '## Prototype lesson sequence (2 × ~60 min)',
      '1. Ensemble & physical storytelling — chorus movement, shared impulse, image theatre.',
      '2. Text into physical theatre — transform a short extract into gesture-led ensemble score.',
      '',
      '## Example lesson deep-dive — Ensemble storytelling',
      'Starter (8): Pass-the-impulse circle; build precision and group timing.',
      'Develop (25): Create three linked ensemble images for a journey / conflict / resolution.',
      'Apply (17): Add one spoken line per image; keep physical clarity first.',
      'Plenary (10): Name one Complicité-linked habit that improved the work (listening, risk, collaboration).',
      '',
      '## Official product',
      'https://www.weteachdrama.com/product-page/explore-complicite-complete-teaching-cpd-pack',
    ],
  ],
  [
    'wtd-explore-practitioners-bundle-overview.pdf',
    'We Teach Drama — Explore Practitioners Bundle (overview)',
    [
      '## Key stage & curriculum',
      'Ages 14–18 · GCSE & A-Level. Inspired by Explore Practitioners: Complete Lesson & CPD Bundle (£99) — Stanislavski, Brecht, Berkoff and Edward Gordon Craig packs with CPD talk-throughs.',
      '',
      '## What the shop pack covers (public listing)',
      '- Four teaching packs + four one-hour CPD webinar replays',
      '- 12+ hours of practical workshop material across the four practitioners',
      '- Ready-to-use stimuli/handouts; suitable for departmental CPD',
      '',
      '## Prototype lesson sequence (2 × ~60 min)',
      '1. Stanislavski & Brecht contrast — naturalistic detail vs alienation / gestus in the same stimulus.',
      '2. Berkoff & Craig studio stations — heightened physical style vs scenic/symbolic design thinking.',
      '',
      '## Example lesson deep-dive — Stanislavski vs Brecht',
      'Starter (8): Two captions — “believe” vs “show the system”; students place themselves.',
      'Develop (28): Same short scene twice — once with objectives/given circumstances, once with placards/direct address.',
      'Apply (14): Write a comparison paragraph using practitioner vocabulary.',
      'Plenary (10): Which approach best serves the political or emotional intention — and why?',
      '',
      '## Official product',
      'https://www.weteachdrama.com/product-page/explore-practitioners-complete-lesson-cpd-bundle',
    ],
  ],
];

for (const [file, title, lines] of wtdPacks) {
  writeDoc(file, title, lines);
  copyFileSync(join(examplesDir, file), join(wtdDir, file));
}

const iccDir = join(root, 'public', 'partners', 'icompose');
mkdirSync(iccDir, { recursive: true });

writeDoc('icc-getting-started-lesson-overview.pdf', 'iCompose — Composition: how to get started! (overview)', [
  '## Key stage & curriculum',
  'KS3 / GCSE beginners (and MYP 4/5 equivalents). Inspired by the free iCompose course “Composition – how to get started!” (~30 minutes, 12 lessons on icancompose.com).',
  'Prototype outlines only — course videos and worksheets stay on iCompose.',
  '',
  '## Course themes (public listing)',
  '- Getting inspired; generating ideas; mood boards and mind maps',
  '- Listening journal and discovering linked pieces',
  '- Composer’s notebook; improvising',
  '- Starting points: image, scale/mode, rhythmic motif, chord sequence',
  '',
  '## Prototype lesson sequence (3 × classroom stubs)',
  '1. Meet the Getting Started course — skim pathway; pick lessons that fit your scheme.',
  '2. Listening into composing — one extract → melody/rhythm/texture talk → idea capture.',
  '3. First sketch and refine — 4–8 bars; share; refine against course success criteria on ICC.',
  '',
  '## Example lesson deep-dive — Start with a rhythm',
  'Starter (5): Clap a 2-bar motif; class variations.',
  'Develop (15): Notate / DAW the motif; try three pitch shapes over the same rhythm.',
  'Apply (8): Choose strongest version; name mood in one sentence.',
  'Plenary (2): Save to composer’s notebook with date and stimulus note.',
  '',
  '## Official course',
  'https://www.icancompose.com/course/getting-started-with-composition/',
]);
copyFileSync(join(examplesDir, 'icc-getting-started-lesson-overview.pdf'), join(iccDir, 'icc-getting-started-lesson-overview.pdf'));

writeDoc('icc-fanfare-lesson-overview.pdf', 'iCompose — How to Compose a Fanfare (overview)', [
  '## Key stage & curriculum',
  'KS3 (11–14) and GCSE (14–16). Inspired by iCompose paid course “How to Compose a Fanfare” (£15 · ~2.5 hours · 22 lessons).',
  'Prototype overview for Partner Hub demos — not a substitute for the paid course.',
  '',
  '## Course themes (public listing)',
  '- Origins and characteristic features of fanfares (instruments, dynamics, melody, rhythm)',
  '- Compose and develop a melodic theme; tonic/dominant triad accompaniment',
  '- Percussion and brass writing; metre/key change; contrasting section',
  '- Dynamics, tempo, articulation; score and recording',
  '',
  '## Example lesson deep-dive — Fanfare melody (rhythm then pitch)',
  'Starter (8): Listen for rhythmic snap and open intervals in a short fanfare extract (teacher-chosen public example).',
  'Develop (25): Compose a 4–8 bar fanfare rhythm; add pitch using leaps and repeated notes typical of ceremonial styles.',
  'Apply (15): Harmonise with tonic/dominant triads; add a simple percussion punctuation.',
  'Plenary (12): Checklist — impact in a few bars, clear pulse, balanced recording/export.',
  '',
  '## Stretch (from course arc)',
  'Extend with introduction, modulation, or contrasting section once the core fanfare idea is secure.',
  '',
  '## Official course',
  'https://www.icancompose.com/course/how-to-compose-a-fanfare/',
]);
copyFileSync(join(examplesDir, 'icc-fanfare-lesson-overview.pdf'), join(iccDir, 'icc-fanfare-lesson-overview.pdf'));

const drDir = join(root, 'public', 'partners', 'dramaresource');
mkdirSync(drDir, { recursive: true });

writeDoc(
  'dr-ten-second-objects-lesson-plan.pdf',
  'Drama Resource (David Farmer) — Ten Second Objects → Story Shapes',
  [
    '## Purpose of this PDF',
    'CCDesigner prototype showcase lesson plan for Drama Resource / David Farmer. Shows the depth of a full exportable lesson (outcomes, criteria, timed activities, differentiation, assessment). Inspired by public pages on dramaresource.com — not a copy of paid courses or books.',
    '',
    '## Key stage & timing',
    'KS2 showcase (Year 5 Drama) · Ages 6+ adaptable · ≈ 60 minutes · Groups of 4–6',
    'Tags (from Ten Second Objects public listing): Mime and movement · Co-operation',
    '',
    '## Learning outcomes',
    'Pupils collaborate to create clear physical images in ten seconds and sequence three freeze-frames into a short story, explaining choices with simple drama vocabulary.',
    '',
    '## Success criteria',
    '- We work as a team without talking over each other.',
    '- We use high, medium and low levels so the shape is clear.',
    '- We can explain what our object or story moment shows.',
    '- Everyone contributes to at least one freeze.',
    '',
    '## Vocabulary',
    'Freeze-frame · ensemble · levels (high / medium / low) · mime · stimulus · thought-tracking · physical theatre · collaboration',
    '',
    '## Lesson structure (timed)',
    '1. Focus circle & learning goals (5 min) — share outcomes; safety; success check.',
    '2. Ten Second Objects — practice round (10 min) — car, then washing machine, volcano, pencil sharpener, cuckoo clock, bowl of spaghetti (Farmer’s public examples).',
    '3. Theme location sculpt (12 min) — fairground / rainforest / castle; optional alphabet or changing objects.',
    '4. Guess our object → freeze gallery (8 min) — invent-and-guess; optional Action Clip; Spotlight sharing.',
    '5. Story shapes sequence (15 min) — Beginning → Problem → Resolution; thought-track; optional captions / cross-cutting.',
    '6. Perform, evaluate, next steps (10 min) — gallery share; two stars and a wish; exit ticket; signpost related games / Just Add Drama.',
    '',
    '## Introduction (teacher script outline)',
    'Share the Ten Second Objects challenge from David Farmer’s 101 Drama Games and Activities. Model one object with volunteers. Agree safety and success criteria. Warm up with a simple car shape before harder objects.',
    '',
    '## Main activity',
    'Practice round with the classic object list → themed location sculpt → invent-and-guess gallery → build a Beginning / Problem / Resolution story sequence with optional thought-tracking and literacy captions (Drama for Writing).',
    '',
    '## Plenary',
    'Perform story shapes to a rotating audience. Peer feedback using drama vocabulary. Exit ticket naming one teamwork skill and one idea for next lesson. Signpost Just Add Drama and related games on dramaresource.com.',
    '',
    '## Differentiation',
    'Support: smaller groups, pre-agreed roles (base / middle / top), picture prompts, sentence starters.',
    'Challenge: changing objects, alphabet objects, cross-cutting, sound/movement, written captions.',
    'EAL: demonstrate visually first; allow brief mother-tongue planning then English labels.',
    '',
    '## Assessment',
    'Formative observation of collaboration and shape clarity; thought-track quality; exit ticket; optional photo of best freeze for floor book (school policy).',
    '',
    '## Resources',
    'Clear space · optional mats · whiteboard object list · timer · sticky notes · teacher access to dramaresource.com/ten-second-objects',
    '',
    '## Key questions',
    'What made your shape easy to recognise? How did levels help? Where did your group decide fastest? How could this game help a story or topic we are studying?',
    '',
    '## How to see this in CCDesigner',
    'Partner Hubs → Drama Resource → Add showcase lesson → Year 5 Drama → Lesson Library → Export PDF. The in-app export includes the same plan fields plus activity cards.',
    '',
    '## Official links',
    'Ten Second Objects: https://dramaresource.com/ten-second-objects/',
    'Just Add Drama toolkit: https://dramaresource.com/just-add-drama/',
    'Drama Resource home: https://dramaresource.com/',
  ],
);
copyFileSync(
  join(examplesDir, 'dr-ten-second-objects-lesson-plan.pdf'),
  join(drDir, 'dr-ten-second-objects-lesson-plan.pdf'),
);

copyFileSync(join(examplesDir, 'ks3-four-chords-lesson-guide.pdf'), join(protoDir, 'ks3-4-chords-overview.pdf'));
copyFileSync(join(examplesDir, 'gcse-drama-blood-brothers-aqa-pack.pdf'), join(protoDir, 'gcse-blood-brothers-overview.pdf'));
copyFileSync(join(examplesDir, 'ocr-music-film-computer-overview.pdf'), join(protoDir, 'ocr-film-computer-music-overview.pdf'));

// Blood Brothers pack also lives under partners/weteachdrama
copyFileSync(join(examplesDir, 'gcse-drama-blood-brothers-aqa-pack.pdf'), join(wtdDir, 'gcse-drama-blood-brothers-aqa-pack.pdf'));
copyFileSync(join(examplesDir, 'gcse-drama-blood-brothers-scene-notes.pdf'), join(wtdDir, 'gcse-drama-blood-brothers-scene-notes.pdf'));

console.log('PDFs written to public/examples/ (+ demo-resources, prototype, partners/weteachdrama|icompose|dramaresource)');
