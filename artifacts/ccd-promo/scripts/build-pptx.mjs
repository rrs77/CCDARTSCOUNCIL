// Build an editable PowerPoint version of the CCDesigner promo video.
// Each of the 22 scenes becomes one slide using the same headline + sub copy.
import PptxGenJS from 'pptxgenjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'downloads');
const OUT_FILE = join(OUT_DIR, 'CCDesigner-Promo.pptx');
const LOGO_DARK = join(ROOT, 'public', 'ccdesigner-wordmark.png');
const CC_MARK = join(ROOT, 'public', 'cc-mark.png');

const TINTS = {
  teal:     { bg: '06181C', accent: '5EEAD4', soft: '0C3A3F' },
  plum:     { bg: '120825', accent: 'C084FC', soft: '2A1240' },
  amber:    { bg: '1A0E05', accent: 'FBBF24', soft: '3A1F08' },
  rose:     { bg: '190612', accent: 'FB7185', soft: '3A0F1F' },
  indigo:   { bg: '050A26', accent: 'A5B4FC', soft: '0D1F4D' },
  midnight: { bg: '050912', accent: '7DD3FC', soft: '0A1428' },
  white:    { bg: 'FFFFFF', accent: '7C3AED', soft: 'EDE9FE' },
};

const SCENES = [
  { tint: 'white',    eyebrow: '',                              title: 'CCDesigner',                        sub: 'A Creative Studio for Educators',                                                                                  hero: true },
  { tint: 'amber',    eyebrow: 'A philosophy, first',           title: 'Teaching is creative work.',        sub: 'Your ideas are valuable. Your practice should grow. Great teaching should never disappear into forgotten documents.' },
  { tint: 'indigo',   eyebrow: 'Your ideas, captured forever',  title: 'Never lose a brilliant idea.',      sub: 'Every spark, sketch and rehearsal note — captured, tagged, and easy to find again.' },
  { tint: 'plum',     eyebrow: 'A library only you can build',  title: 'Build your creative archive.',      sub: 'Activities, rehearsal techniques, reflections, and warmups — preserved, tagged, and always within reach.' },
  { tint: 'teal',     eyebrow: 'Curriculum mapping',            title: 'Build connected curriculum.',       sub: 'See how every lesson, skill, and outcome links across the year — and across subjects.' },
  { tint: 'midnight', eyebrow: 'Plan with intention',           title: 'Rich lessons, designed deliberately.', sub: 'Drag activities into shape. Sequence with purpose. Save the structure — keep the soul.' },
  { tint: 'rose',     eyebrow: 'Built for the arts',            title: 'Drama. Dance. Music.',              sub: 'Designed by performing-arts teachers, for the rituals, vocabularies and rehearsal practices of every discipline.' },
  { tint: 'amber',    eyebrow: 'Curiosity, by design',          title: 'Encourage creative thinking.',      sub: 'Open-ended prompts, divergent tasks, and space for the unexpected — the heart of creative pedagogy.' },
  { tint: 'indigo',   eyebrow: 'An assistant, not a replacement', title: 'AI that thinks with you.',        sub: 'A creative thinking partner — never a replacement for the teacher in the room.' },
  { tint: 'teal',     eyebrow: 'Adaptive by design',            title: 'Adapt instantly to every learner.', sub: 'One lesson, many pathways — generated and refined at the speed of the room.' },
  { tint: 'rose',     eyebrow: 'Inclusion at the centre',       title: 'Support every child meaningfully.', sub: 'Sensory considerations, communication scaffolds, and movement-friendly options — built into the planning surface.' },
  { tint: 'amber',    eyebrow: 'Depth, not speed',              title: 'Create deeper learning opportunities.', sub: 'Stretch tasks, metacognitive prompts, and challenge layers — woven naturally through every lesson.' },
  { tint: 'plum',     eyebrow: 'One thread, many subjects',     title: 'Connect subjects naturally.',       sub: 'A single creative thread can run through drama, literacy, history, and beyond — designed deliberately, not by accident.' },
  { tint: 'teal',     eyebrow: 'A loop, not a line',            title: 'Reflect. Adapt. Improve.',          sub: 'Capture what worked. Refine what didn\u2019t. Each lesson becomes the seed of the next.' },
  { tint: 'indigo',   eyebrow: 'Skills, sequenced',             title: 'Track growth over time.',           sub: 'Each skill builds on the last. Progress becomes visible — not assumed.' },
  { tint: 'midnight', eyebrow: 'Knowledge, on purpose',         title: 'Build knowledge intentionally.',    sub: 'Sequence what matters. Layer concepts so they hold. Nothing important left to chance.' },
  { tint: 'amber',    eyebrow: 'Remix, don\u2019t restart',     title: 'Inspiration that grows with you.',  sub: 'Old ideas reconnect into new lessons. Your past teaching becomes the soil for what\u2019s next.' },
  { tint: 'plum',     eyebrow: 'A growing ecosystem',           title: 'Powered by creative communities.',  sub: 'Theatres, orchestras, dance companies, universities and outreach teams — all contributing to a shared, evolving ecosystem of creative practice. Free to use, made together.' },
  { tint: 'midnight', eyebrow: 'Bigger picture, on demand',     title: 'See the bigger learning picture.',  sub: 'Zoom from a single activity to a whole-school view — and back again — without losing context.' },
  { tint: 'teal',     eyebrow: 'Share with confidence',         title: 'Beautiful, professional plans.',    sub: 'Export, print, present — for parents, leadership, inspections, and the staffroom wall.' },
  { tint: 'indigo',   eyebrow: 'Plan from the rehearsal room',  title: 'Plan anywhere.',                    sub: 'Fully responsive on phone, tablet, and laptop — capture an idea the moment it lands.' },
  { tint: 'white',    eyebrow: '',                              title: 'CCDesigner',                        sub: 'Design, deliver, and review your curriculum — made easy.',                                                          hero: true, closing: true },
];

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';     // 13.333 x 7.5 in (16:9)
pptx.title = 'CCDesigner Promo';
pptx.subject = 'Promo deck — Creative Curriculum Designer';
pptx.company = 'CCDesigner';

const W = 13.333;
const H = 7.5;

for (let i = 0; i < SCENES.length; i++) {
  const s = SCENES[i];
  const t = TINTS[s.tint];
  const isLight = s.tint === 'white';
  const slide = pptx.addSlide();

  // Background
  slide.background = { color: t.bg };

  if (!isLight) {
    // Two soft glow ellipses (orbs) — emulate the cinematic backdrop
    slide.addShape('ellipse', {
      x: -2, y: -1, w: 7, h: 7,
      fill: { type: 'solid', color: t.soft, transparency: 70 },
      line: { type: 'none' },
    });
    slide.addShape('ellipse', {
      x: W - 4, y: H - 4, w: 7, h: 7,
      fill: { type: 'solid', color: t.accent, transparency: 88 },
      line: { type: 'none' },
    });
  }

  if (s.hero) {
    // Hero / closing slide — centered wordmark + tagline
    if (fs.existsSync(LOGO_DARK)) {
      slide.addImage({ path: LOGO_DARK, x: W/2 - 3.5, y: H/2 - 1.4, w: 7, h: 1.1, sizing: { type: 'contain', w: 7, h: 1.1 } });
    }
    slide.addText(s.sub, {
      x: 1, y: H/2 + 0.1, w: W - 2, h: 0.8,
      fontFace: 'Inter', fontSize: 22, color: isLight ? '1A1033' : 'FFFFFF',
      align: 'center', valign: 'top', charSpacing: 6,
    });
    if (s.closing) {
      slide.addText('ccdesigner.app', {
        x: 1, y: H - 1.2, w: W - 2, h: 0.4,
        fontFace: 'Inter', fontSize: 12, color: '7C3AED',
        align: 'center', charSpacing: 8, bold: true,
      });
    }
  } else {
    // Content slide — eyebrow + title + sub on the left
    let y = 1.6;
    if (s.eyebrow) {
      slide.addText(s.eyebrow.toUpperCase(), {
        x: 0.9, y, w: W - 1.8, h: 0.4,
        fontFace: 'Inter', fontSize: 12, bold: true, color: t.accent,
        charSpacing: 8,
      });
      y += 0.55;
    }
    slide.addText(s.title, {
      x: 0.9, y, w: W - 1.8, h: 2.6,
      fontFace: 'Inter', fontSize: 60, bold: true, color: 'FFFFFF',
      valign: 'top',
    });
    y += 2.7;
    slide.addText(s.sub, {
      x: 0.9, y, w: W * 0.6, h: 2.0,
      fontFace: 'Inter', fontSize: 20, color: 'E2E8F0',
      valign: 'top',
    });
    // Corner brand
    if (fs.existsSync(CC_MARK)) {
      slide.addImage({ path: CC_MARK, x: 0.5, y: 0.4, w: 0.7, h: 0.4, sizing: { type: 'contain', w: 0.7, h: 0.4 } });
    }
    slide.addText('DESIGNER', {
      x: 1.25, y: 0.42, w: 1.4, h: 0.36,
      fontFace: 'Inter', fontSize: 12, bold: true, color: 'FFFFFF', charSpacing: 6, valign: 'middle',
    });
    // Scene counter
    slide.addText(`${String(i + 1).padStart(2, '0')} / ${String(SCENES.length).padStart(2, '0')}`, {
      x: W - 1.6, y: 0.4, w: 1.2, h: 0.4,
      fontFace: 'Inter', fontSize: 11, color: 'FFFFFF', charSpacing: 4,
      align: 'right', valign: 'middle',
    });
  }
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
await pptx.writeFile({ fileName: OUT_FILE });

const outDirRel = `.local/outputs`;
fs.mkdirSync(outDirRel, { recursive: true });
fs.copyFileSync(OUT_FILE, join(outDirRel, 'CCDesigner-Promo.pptx'));

const stat = fs.statSync(OUT_FILE);
console.log(`Wrote ${OUT_FILE} (${(stat.size / 1024).toFixed(1)} KB) — ${SCENES.length} slides`);
