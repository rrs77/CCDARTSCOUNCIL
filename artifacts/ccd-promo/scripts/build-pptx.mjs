// Build a professional, fully-editable pitch deck of the CCDesigner promo.
// Every headline, eyebrow, body line, and footer is a real PowerPoint text
// box — open in PowerPoint / Keynote / Google Slides and edit anything.
// Layout, typography, and brand palette mirror the promo video without
// relying on rendered image stills, so the deck stays light and crisp.
import PptxGenJS from 'pptxgenjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'downloads');
const OUT_FILE = join(OUT_DIR, 'CCDesigner-Promo.pptx');
const LOGO_DARK = join(ROOT, 'public', 'ccdesigner-wordmark.png');     // dark wordmark on light bg
const LOGO_LIGHT_CANDIDATES = [
  join(ROOT, 'public', 'ccdesigner-wordmark-light.png'),
  join(ROOT, 'public', 'ccdesigner-wordmark.png'),                      // fallback
];
const LOGO_MARK = join(ROOT, 'public', 'cc-mark.png');

function pickFile(paths) {
  for (const p of paths) if (fs.existsSync(p)) return p;
  return null;
}

// Brand palette — eyebrow + accent-word colors per scene tint
const TINTS = {
  amber:    { eyebrow: 'F59E0B', accent: 'FBBF24' },
  indigo:   { eyebrow: 'A5B4FC', accent: 'A5B4FC' },
  plum:     { eyebrow: 'C084FC', accent: 'C084FC' },
  teal:     { eyebrow: '5EEAD4', accent: '5EEAD4' },
  midnight: { eyebrow: '7DD3FC', accent: '7DD3FC' },
  rose:     { eyebrow: 'FB7185', accent: 'FB7185' },
};

const BRAND = {
  ink: '1A1033',           // headline color on light slides
  inkSoft: '4B4565',
  paper: 'FFFFFF',
  paperWash: 'F5F2FB',
  rule: 'E6E0F2',
  navy: '0B0820',
  navySoft: '120F2E',
  navyText: 'F5F2FB',      // headline color on dark slides
  navySub: 'D7D3E8',
  purple: '7C3AED',
  url: 'creativecurriculumdesigner.com',
};

// Section labels give the deck investor-/client-style structure.
// Headlines split into runs so the accent word keeps its tint.
const SCENES = [
  { n: 1,  kind: 'cover',
    section: '',
    eyebrow: 'A creative studio for educators',
    headline: [{ t: 'Creative Curriculum Designer' }],
    sub: 'Where great teaching is captured, refined, and never lost.' },

  { n: 2,  tint: 'amber', section: 'The philosophy',
    eyebrow: 'A philosophy, first',
    headline: [{ t: 'Teaching is ' }, { t: 'creative work.', accent: true }],
    sub: 'Your ideas are valuable. Your practice should grow. Great teaching should never disappear into forgotten documents.' },

  { n: 3,  tint: 'indigo', center: true, section: 'The problem',
    eyebrow: 'Your ideas, captured forever',
    headline: [{ t: 'Never lose a brilliant idea.', accent: true }],
    sub: 'Every warm-up, rehearsal note, and lesson spark — captured the moment it happens, ready to use again.' },

  { n: 4,  tint: 'plum', section: 'The product',
    eyebrow: 'A library only you can build',
    headline: [{ t: 'Build your creative ' }, { t: 'archive.', accent: true }],
    sub: 'Activities, rehearsal techniques, reflections, and warm-ups — preserved, tagged, and always within reach.' },

  { n: 5,  tint: 'teal', section: 'The product',
    eyebrow: 'Curriculum mapping',
    headline: [{ t: 'Build connected ' }, { t: 'learning journeys.', accent: true }],
    sub: 'See how every lesson, skill, and outcome links across the year — and across subjects.' },

  { n: 6,  tint: 'midnight', section: 'The product',
    eyebrow: 'Plan with intention',
    headline: [{ t: 'Rich lessons, ' }, { t: 'built in minutes.', accent: true }],
    sub: 'Drag activities into shape. Sequence with purpose. Save the structure — keep the soul.' },

  { n: 7,  tint: 'rose', section: 'The market',
    eyebrow: 'Built for the arts',
    headline: [{ t: 'Drama. Dance. ' }, { t: 'Music.', accent: true }],
    sub: 'Designed by performing-arts teachers, for the rituals, vocabularies and rehearsal practices of every discipline.' },

  { n: 8,  tint: 'amber', center: true, section: 'The promise',
    eyebrow: 'Curiosity, by design',
    headline: [{ t: 'Encourage ' }, { t: 'curiosity', accent: true }, { t: ' and imagination.' }],
    sub: 'Design moments of wonder, risk-taking, and play — woven into every learning sequence.' },

  { n: 9,  tint: 'indigo', section: 'The differentiator',
    eyebrow: 'An assistant, not a replacement',
    headline: [{ t: 'AI that ' }, { t: 'amplifies', accent: true }, { t: ' your thinking.' }],
    sub: 'A creative thinking partner — never a replacement for the teacher in the room.' },

  { n: 10, tint: 'teal', section: 'The capability',
    eyebrow: 'Adaptive by design',
    headline: [{ t: 'Adapt instantly for ' }, { t: 'different learners.', accent: true }],
    sub: 'One lesson, many pathways — generated and refined at the speed of the room.' },

  { n: 11, tint: 'rose', center: true, section: 'The values',
    eyebrow: 'Inclusion at the centre',
    headline: [{ t: 'Support every child ' }, { t: 'meaningfully.', accent: true }],
    sub: 'Sensory considerations, communication scaffolds, and movement-friendly options — built into the planning surface.' },

  { n: 12, tint: 'amber', section: 'The depth',
    eyebrow: 'Depth, not speed',
    headline: [{ t: 'Create ' }, { t: 'deeper', accent: true }, { t: ' learning opportunities.' }],
    sub: 'Stretch tasks, metacognitive prompts, and challenge layers — woven naturally through every lesson.' },

  { n: 13, tint: 'plum', section: 'The depth',
    eyebrow: 'One thread, many subjects',
    headline: [{ t: 'Connect ' }, { t: 'subjects', accent: true }, { t: ' naturally.' }],
    sub: 'A single creative thread can run through drama, literacy, history, and beyond — designed deliberately, not by accident.' },

  { n: 14, tint: 'teal', section: 'The practice',
    eyebrow: 'A loop, not a line',
    headline: [{ t: 'Reflect. Adapt. ' }, { t: 'Improve.', accent: true }],
    sub: "Capture what worked. Refine what didn't. Each lesson becomes the seed of the next." },

  { n: 15, tint: 'indigo', section: 'The progress',
    eyebrow: 'Skills, sequenced',
    headline: [{ t: 'Track ' }, { t: 'growth', accent: true }, { t: ' over time.' }],
    sub: 'Each skill builds on the last. Progress becomes visible — not assumed.' },

  { n: 16, tint: 'midnight', section: 'The structure',
    eyebrow: 'Knowledge, on purpose',
    headline: [{ t: 'Build knowledge ' }, { t: 'intentionally.', accent: true }],
    sub: 'Sequence what matters. Layer concepts so they hold. Nothing important left to chance.' },

  { n: 17, tint: 'amber', section: 'The compound effect',
    eyebrow: "Remix, don't restart",
    headline: [{ t: 'Inspiration that ' }, { t: 'grows with you.', accent: true }],
    sub: "Old ideas reconnect into new lessons. Your past teaching becomes the soil for what's next." },

  { n: 18, tint: 'plum', section: 'The ecosystem',
    eyebrow: 'A growing ecosystem',
    headline: [{ t: 'Powered by ' }, { t: 'creative', accent: true }, { t: ' communities.' }],
    sub: 'Theatres, orchestras, dance companies, universities and outreach teams — all contributing to a shared, evolving ecosystem of creative practice. Free to use, made together.' },

  { n: 19, tint: 'midnight', section: 'The view',
    eyebrow: 'Bigger picture, on demand',
    headline: [{ t: 'See the ' }, { t: 'bigger', accent: true }, { t: ' learning picture.' }],
    sub: 'Zoom from a single activity to a whole-school view — and back again — without losing context.' },

  { n: 20, tint: 'teal', section: 'The output',
    eyebrow: 'Share with confidence',
    headline: [{ t: 'Beautiful, ' }, { t: 'professional', accent: true }, { t: ' plans.' }],
    sub: 'Export, print, present — for parents, leadership, inspections, and the staffroom wall.' },

  { n: 21, tint: 'indigo', section: 'The reach',
    eyebrow: 'Plan from the rehearsal room',
    headline: [{ t: 'Plan ' }, { t: 'anywhere.', accent: true }],
    sub: 'Fully responsive on phone, tablet, and laptop — capture an idea the moment it lands.' },

  { n: 22, kind: 'closing',
    section: "What's next",
    eyebrow: 'Join the studio',
    headline: [{ t: 'Creative Curriculum Designer' }],
    sub: BRAND.url },
];

// 16:9 widescreen, in inches
const W = 13.333;
const H = 7.5;
const FONT = 'Calibri'; // ubiquitous; renders consistently across PPT engines

/* ------------------------------------------------------------------ *
 *  Backgrounds
 * ------------------------------------------------------------------ */
function paintLightBackground(slide) {
  slide.background = { color: BRAND.paper };
  // Soft lavender wash on the right third for depth
  slide.addShape('rect', {
    x: W * 0.55, y: 0, w: W * 0.45, h: H,
    fill: { color: BRAND.paperWash }, line: { type: 'none' },
  });
  // Brand accent rule along the bottom
  slide.addShape('rect', {
    x: 0, y: H - 0.06, w: W, h: 0.06,
    fill: { color: BRAND.purple }, line: { type: 'none' },
  });
}

function paintDarkBackground(slide, tint) {
  slide.background = { color: BRAND.navy };
  // Diagonal panel for depth
  slide.addShape('rect', {
    x: 0, y: 0, w: W * 0.62, h: H,
    fill: { color: BRAND.navySoft }, line: { type: 'none' },
  });
  // Accent halos in the brand palette + scene tint
  slide.addShape('ellipse', {
    x: -2.5, y: H - 4.2, w: 8.5, h: 8.5,
    fill: { color: BRAND.purple, transparency: 82 },
    line: { type: 'none' },
  });
  slide.addShape('ellipse', {
    x: W - 4.8, y: -3.2, w: 7.6, h: 7.6,
    fill: { color: tint.accent, transparency: 86 },
    line: { type: 'none' },
  });
  // Thin top rule in scene tint for hierarchy
  slide.addShape('rect', {
    x: 0, y: 0, w: W, h: 0.05,
    fill: { color: tint.accent, transparency: 60 },
    line: { type: 'none' },
  });
}

/* ------------------------------------------------------------------ *
 *  Chrome (logo, slide number, footer, section label)
 * ------------------------------------------------------------------ */
function addChrome(slide, scene, isLight) {
  // Top-left wordmark on every content slide
  if (scene.kind !== 'cover' && scene.kind !== 'closing') {
    const logo = pickFile(isLight ? [LOGO_DARK] : LOGO_LIGHT_CANDIDATES);
    if (logo) {
      slide.addImage({ path: logo, x: 0.55, y: 0.42, w: 1.7, h: 0.45 });
    }
  }

  // Top-right slide counter pill
  slide.addShape('roundRect', {
    x: W - 1.55, y: 0.45, w: 1.05, h: 0.38,
    rectRadius: 0.19,
    fill: { color: isLight ? 'FFFFFF' : '1F1A3A' },
    line: { color: isLight ? BRAND.rule : '3A3470', width: 0.75 },
  });
  slide.addText(`${String(scene.n).padStart(2, '0')} / 22`, {
    x: W - 1.55, y: 0.45, w: 1.05, h: 0.38,
    fontSize: 10, fontFace: FONT, bold: true, charSpacing: 4,
    color: isLight ? '6B5BA5' : 'A99FD8',
    align: 'center', valign: 'middle',
  });

  // Section label (top-center) — only on content slides
  if (scene.section && scene.kind !== 'cover' && scene.kind !== 'closing') {
    slide.addText(scene.section.toUpperCase(), {
      x: W / 2 - 2.5, y: 0.5, w: 5, h: 0.32,
      fontSize: 10, fontFace: FONT, bold: true, charSpacing: 6,
      color: isLight ? '6B5BA5' : 'A99FD8',
      align: 'center', valign: 'middle',
    });
  }

  // Footer: brand name + URL
  slide.addText(
    [
      { text: 'Creative Curriculum Designer', options: { bold: true } },
      { text: '   ·   ', options: {} },
      { text: BRAND.url, options: {} },
    ],
    {
      x: 0.55, y: H - 0.55, w: W - 1.1, h: 0.3,
      fontSize: 9, fontFace: FONT,
      color: isLight ? '8378A8' : '8B85B8',
      align: 'left', valign: 'middle', charSpacing: 2,
    }
  );
}

/* ------------------------------------------------------------------ *
 *  Slide builders
 * ------------------------------------------------------------------ */
function addCoverSlide(pptx, scene) {
  const slide = pptx.addSlide();
  paintLightBackground(slide);

  if (fs.existsSync(LOGO_MARK)) {
    slide.addImage({ path: LOGO_MARK, x: W / 2 - 1.3, y: 1.5, w: 2.6, h: 2.2 });
  }

  // Eyebrow
  slide.addText(scene.eyebrow.toUpperCase(), {
    x: 1, y: 4.0, w: W - 2, h: 0.4,
    fontSize: 13, fontFace: FONT, bold: true, charSpacing: 8,
    color: BRAND.purple, align: 'center',
  });

  // Title — italic, hero-scale
  slide.addText(scene.headline.map((p) => p.t).join(''), {
    x: 1, y: 4.55, w: W - 2, h: 1.1,
    fontSize: 50, fontFace: FONT, bold: true, italic: true,
    color: BRAND.ink, align: 'center',
  });

  // Subtitle
  slide.addText(scene.sub, {
    x: 1.5, y: 5.85, w: W - 3, h: 0.6,
    fontSize: 18, fontFace: FONT,
    color: BRAND.inkSoft, align: 'center',
  });

  // Footer rule + URL
  slide.addShape('rect', {
    x: W / 2 - 0.6, y: 6.55, w: 1.2, h: 0.04,
    fill: { color: BRAND.purple }, line: { type: 'none' },
  });
  slide.addText(BRAND.url, {
    x: 1, y: 6.7, w: W - 2, h: 0.3,
    fontSize: 11, fontFace: FONT, bold: true, charSpacing: 4,
    color: BRAND.purple, align: 'center',
  });

  addChrome(slide, scene, true);
}

function addClosingSlide(pptx, scene) {
  const slide = pptx.addSlide();
  paintLightBackground(slide);

  if (fs.existsSync(LOGO_MARK)) {
    slide.addImage({ path: LOGO_MARK, x: W / 2 - 1.1, y: 1.7, w: 2.2, h: 1.9 });
  }

  slide.addText(scene.eyebrow.toUpperCase(), {
    x: 1, y: 3.85, w: W - 2, h: 0.4,
    fontSize: 13, fontFace: FONT, bold: true, charSpacing: 8,
    color: BRAND.purple, align: 'center',
  });

  slide.addText(scene.headline.map((p) => p.t).join(''), {
    x: 1, y: 4.4, w: W - 2, h: 1.0,
    fontSize: 44, fontFace: FONT, bold: true, italic: true,
    color: BRAND.ink, align: 'center',
  });

  slide.addShape('rect', {
    x: W / 2 - 0.6, y: 5.5, w: 1.2, h: 0.04,
    fill: { color: BRAND.purple }, line: { type: 'none' },
  });

  slide.addText(scene.sub, {
    x: 1, y: 5.7, w: W - 2, h: 0.5,
    fontSize: 22, fontFace: FONT, bold: true, charSpacing: 4,
    color: BRAND.purple, align: 'center',
  });

  addChrome(slide, scene, true);
}

function buildHeadlineRuns(parts, accentHex, color) {
  return parts.map((p) => ({
    text: p.t,
    options: { color: p.accent ? accentHex : color, bold: true },
  }));
}

function addContentSlide(pptx, scene) {
  const slide = pptx.addSlide();
  const tint = TINTS[scene.tint] || TINTS.indigo;
  paintDarkBackground(slide, tint);

  const center = !!scene.center;
  const padX = 0.95;
  const contentW = W - padX * 2;

  // Eyebrow chip
  const chipW = Math.min(4.2, scene.eyebrow.length * 0.085 + 0.6);
  if (!center) {
    slide.addShape('roundRect', {
      x: padX, y: 2.05, w: chipW, h: 0.42,
      rectRadius: 0.21,
      fill: { color: tint.eyebrow, transparency: 82 },
      line: { color: tint.eyebrow, width: 0.5, transparency: 50 },
    });
    slide.addText(scene.eyebrow.toUpperCase(), {
      x: padX, y: 2.05, w: chipW, h: 0.42,
      fontSize: 10, fontFace: FONT, bold: true, charSpacing: 6,
      color: tint.eyebrow, align: 'center', valign: 'middle',
    });
  } else {
    slide.addShape('roundRect', {
      x: W / 2 - chipW / 2, y: 1.85, w: chipW, h: 0.42,
      rectRadius: 0.21,
      fill: { color: tint.eyebrow, transparency: 82 },
      line: { color: tint.eyebrow, width: 0.5, transparency: 50 },
    });
    slide.addText(scene.eyebrow.toUpperCase(), {
      x: W / 2 - chipW / 2, y: 1.85, w: chipW, h: 0.42,
      fontSize: 10, fontFace: FONT, bold: true, charSpacing: 6,
      color: tint.eyebrow, align: 'center', valign: 'middle',
    });
  }

  // Headline
  slide.addText(buildHeadlineRuns(scene.headline, tint.accent, BRAND.navyText), {
    x: padX, y: center ? 2.55 : 2.7, w: contentW, h: 2.6,
    fontSize: center ? 60 : 56, fontFace: FONT, bold: true,
    align: center ? 'center' : 'left',
    valign: 'top',
    paraSpaceAfter: 2,
  });

  // Underline accent
  if (!center) {
    slide.addShape('rect', {
      x: padX, y: 5.25, w: 0.9, h: 0.06,
      fill: { color: tint.accent }, line: { type: 'none' },
    });
  }

  // Subtitle
  slide.addText(scene.sub, {
    x: padX, y: center ? 5.4 : 5.45, w: center ? contentW : contentW * 0.78,
    h: 1.4,
    fontSize: 18, fontFace: FONT,
    color: BRAND.navySub, align: center ? 'center' : 'left',
    paraSpaceBefore: 4,
  });

  addChrome(slide, scene, false);
}

/* ------------------------------------------------------------------ *
 *  Build
 * ------------------------------------------------------------------ */
async function build() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = 'Creative Curriculum Designer — Pitch Deck';
  pptx.subject = 'Editable 22-slide pitch deck';
  pptx.company = 'Creative Curriculum Designer';
  pptx.author = 'Creative Curriculum Designer';

  for (const scene of SCENES) {
    if (scene.kind === 'cover') addCoverSlide(pptx, scene);
    else if (scene.kind === 'closing') addClosingSlide(pptx, scene);
    else addContentSlide(pptx, scene);
  }

  await pptx.writeFile({ fileName: OUT_FILE });
  console.log(`Wrote ${OUT_FILE}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
