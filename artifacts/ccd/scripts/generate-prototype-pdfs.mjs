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
  'KS4 / GCSE Drama. AQA-style Component 3 set-text study (Blood Brothers by Willy Russell).',
  'Prototype inspired by We Teach Drama’s publicly listed Revise Blood Brothers scheme — original CCDesigner outlines only; not a copy of paid PDFs.',
  '',
  '## Assessment focus',
  '- Vocal / physical characterisation and proxemics',
  '- Social/historical context (1980s Liverpool, class, nature vs nurture)',
  '- Design for meaning (costume, set, lighting)',
  '- Evaluative exam language: intention → skill → moment → audience effect',
  '',
  '## Lesson outline (5 lessons)',
  '1. Context & class — 1980s Liverpool.',
  '2. Narrator, omen and dramatic irony.',
  '3. Mickey & Eddie — vocal/physical contrast.',
  '4. Design for meaning — class on stage.',
  '5. Exam rehearsal — performer question.',
  '',
  '## Official product',
  'weteachdrama.com — Revise Blood Brothers Scheme of Learning (+ video talk-through).',
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
      'KS3 Drama (ages 11–14). Cover-style character, expression and design intro tasks.',
      '',
      '## Prototype lessons',
      '1. Character & expression (Y7–8 cover-style tasks).',
      '2. Design & practitioners intro (Y9 cover-style tasks).',
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
      'Ages 13+ · KS3/KS4 design focus — set, costume, lighting and sound for meaning.',
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
      'KS3–KS5 design challenge mats (set, costume, lighting & sound).',
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
      'Ages 14–18 · GCSE & A-Level practitioners (KS4/KS5).',
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
      'Ages 14–18 · GCSE & A-Level ensemble / physical theatre (KS4/KS5).',
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
      'Ages 14–18 · GCSE & A-Level practitioner comparison (Stanislavski, Brecht, Berkoff, Craig).',
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

copyFileSync(join(examplesDir, 'ks3-four-chords-lesson-guide.pdf'), join(protoDir, 'ks3-4-chords-overview.pdf'));
copyFileSync(join(examplesDir, 'gcse-drama-blood-brothers-aqa-pack.pdf'), join(protoDir, 'gcse-blood-brothers-overview.pdf'));
copyFileSync(join(examplesDir, 'ocr-music-film-computer-overview.pdf'), join(protoDir, 'ocr-film-computer-music-overview.pdf'));

// Blood Brothers pack also lives under partners/weteachdrama
copyFileSync(join(examplesDir, 'gcse-drama-blood-brothers-aqa-pack.pdf'), join(wtdDir, 'gcse-drama-blood-brothers-aqa-pack.pdf'));
copyFileSync(join(examplesDir, 'gcse-drama-blood-brothers-scene-notes.pdf'), join(wtdDir, 'gcse-drama-blood-brothers-scene-notes.pdf'));

console.log('PDFs written to public/examples/ (+ demo-resources, prototype, partners/weteachdrama aliases)');
