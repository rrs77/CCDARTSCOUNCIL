// Build an EDITABLE text-based pitch deck of the CCDesigner promo.
// Each slide mirrors a scene from the 22-scene promo video, but the
// headline / eyebrow / body text are real PowerPoint text boxes (not
// flattened images), so the user can edit them directly in PowerPoint
// or Keynote.
import PptxGenJS from 'pptxgenjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'downloads');
const OUT_FILE = join(OUT_DIR, 'CCDesigner-Promo.pptx');
const LOGO_DARK = join(ROOT, 'public', 'ccdesigner-wordmark.png');
const LOGO_MARK = join(ROOT, 'public', 'cc-mark.png');

// Brand palette mirrors the in-video Eyebrow tints + accent words.
const TINTS = {
  amber:    { eyebrow: 'F59E0B', accent: 'FBBF24' },
  indigo:   { eyebrow: 'A5B4FC', accent: 'A5B4FC' },
  plum:     { eyebrow: 'C084FC', accent: 'C084FC' },
  teal:     { eyebrow: '5EEAD4', accent: '5EEAD4' },
  midnight: { eyebrow: '7DD3FC', accent: '7DD3FC' },
  rose:     { eyebrow: 'FB7185', accent: 'FB7185' },
};

// Scene definitions — headline split into [plain, accent, plain] parts so we
// can color the accent word, mirroring the video.
const SCENES = [
  {
    n: 1, kind: 'hero',
    eyebrow: 'A Creative Studio for Educators',
    headline: [{ t: 'CCDesigner', accent: true }],
    sub: 'A creative studio for educators — where great teaching is captured, refined, and never lost.',
  },
  {
    n: 2, tint: 'amber',
    eyebrow: 'A philosophy, first',
    headline: [{ t: 'Teaching is ' }, { t: 'creative work.', accent: true }],
    sub: 'Your ideas are valuable. Your practice should grow. Great teaching should never disappear into forgotten documents.',
  },
  {
    n: 3, tint: 'indigo', center: true,
    eyebrow: 'Your ideas, captured forever',
    headline: [{ t: 'Never lose a brilliant idea.', accent: true }],
    sub: 'Every warm-up, rehearsal note, and lesson spark — captured the moment it happens, and ready to use again.',
  },
  {
    n: 4, tint: 'plum',
    eyebrow: 'A library only you can build',
    headline: [{ t: 'Build your creative ' }, { t: 'archive.', accent: true }],
    sub: 'Activities, rehearsal techniques, reflections, and warm-ups — preserved, tagged, and always within reach.',
  },
  {
    n: 5, tint: 'teal',
    eyebrow: 'Curriculum mapping',
    headline: [{ t: 'Build connected ' }, { t: 'learning journeys.', accent: true }],
    sub: 'See how every lesson, skill, and outcome links across the year — and across subjects.',
  },
  {
    n: 6, tint: 'midnight',
    eyebrow: 'Plan with intention',
    headline: [{ t: 'Rich lessons, ' }, { t: 'built in minutes.', accent: true }],
    sub: 'Drag activities into shape. Sequence with purpose. Save the structure — keep the soul.',
  },
  {
    n: 7, tint: 'rose',
    eyebrow: 'Built for the arts',
    headline: [{ t: 'Drama. Dance. ' }, { t: 'Music.', accent: true }],
    sub: 'Designed by performing-arts teachers, for the rituals, vocabularies and rehearsal practices of every discipline.',
  },
  {
    n: 8, tint: 'amber', center: true,
    eyebrow: 'Curiosity, by design',
    headline: [{ t: 'Encourage ' }, { t: 'curiosity', accent: true }, { t: ' and imagination.' }],
    sub: 'Design moments of wonder, risk-taking, and play — woven into every learning sequence.',
  },
  {
    n: 9, tint: 'indigo',
    eyebrow: 'An assistant, not a replacement',
    headline: [{ t: 'AI that ' }, { t: 'amplifies', accent: true }, { t: ' your thinking.' }],
    sub: 'A creative thinking partner — never a replacement for the teacher in the room.',
  },
  {
    n: 10, tint: 'teal',
    eyebrow: 'Adaptive by design',
    headline: [{ t: 'Adapt instantly for ' }, { t: 'different learners.', accent: true }],
    sub: 'One lesson, many pathways — generated and refined at the speed of the room.',
  },
  {
    n: 11, tint: 'rose', center: true,
    eyebrow: 'Inclusion at the centre',
    headline: [{ t: 'Support every child ' }, { t: 'meaningfully.', accent: true }],
    sub: 'Sensory considerations, communication scaffolds, and movement-friendly options — built into the planning surface.',
  },
  {
    n: 12, tint: 'amber',
    eyebrow: 'Depth, not speed',
    headline: [{ t: 'Create ' }, { t: 'deeper', accent: true }, { t: ' learning opportunities.' }],
    sub: "Stretch tasks, metacognitive prompts, and challenge layers — woven naturally through every lesson.",
  },
  {
    n: 13, tint: 'plum',
    eyebrow: 'One thread, many subjects',
    headline: [{ t: 'Connect ' }, { t: 'subjects', accent: true }, { t: ' naturally.' }],
    sub: 'A single creative thread can run through drama, literacy, history, and beyond — designed deliberately, not by accident.',
  },
  {
    n: 14, tint: 'teal',
    eyebrow: 'A loop, not a line',
    headline: [{ t: 'Reflect. Adapt. ' }, { t: 'Improve.', accent: true }],
    sub: "Capture what worked. Refine what didn't. Each lesson becomes the seed of the next.",
  },
  {
    n: 15, tint: 'indigo',
    eyebrow: 'Skills, sequenced',
    headline: [{ t: 'Track ' }, { t: 'growth', accent: true }, { t: ' over time.' }],
    sub: 'Each skill builds on the last. Progress becomes visible — not assumed.',
  },
  {
    n: 16, tint: 'midnight',
    eyebrow: 'Knowledge, on purpose',
    headline: [{ t: 'Build knowledge ' }, { t: 'intentionally.', accent: true }],
    sub: 'Sequence what matters. Layer concepts so they hold. Nothing important left to chance.',
  },
  {
    n: 17, tint: 'amber',
    eyebrow: "Remix, don't restart",
    headline: [{ t: 'Inspiration that ' }, { t: 'grows with you.', accent: true }],
    sub: "Old ideas reconnect into new lessons. Your past teaching becomes the soil for what's next.",
  },
  {
    n: 18, tint: 'plum',
    eyebrow: 'A growing ecosystem',
    headline: [{ t: 'Powered by ' }, { t: 'creative', accent: true }, { t: ' communities.' }],
    sub: 'Theatres, orchestras, dance companies, universities and outreach teams — all contributing to a shared, evolving ecosystem of creative practice. Free to use, made together.',
  },
  {
    n: 19, tint: 'midnight',
    eyebrow: 'Bigger picture, on demand',
    headline: [{ t: 'See the ' }, { t: 'bigger', accent: true }, { t: ' learning picture.' }],
    sub: 'Zoom from a single activity to a whole-school view — and back again — without losing context.',
  },
  {
    n: 20, tint: 'teal',
    eyebrow: 'Share with confidence',
    headline: [{ t: 'Beautiful, ' }, { t: 'professional', accent: true }, { t: ' plans.' }],
    sub: 'Export, print, present — for parents, leadership, inspections, and the staffroom wall.',
  },
  {
    n: 21, tint: 'indigo',
    eyebrow: 'Plan from the rehearsal room',
    headline: [{ t: 'Plan ' }, { t: 'anywhere.', accent: true }],
    sub: 'Fully responsive on phone, tablet, and laptop — capture an idea the moment it lands.',
  },
  {
    n: 22, kind: 'closing',
    eyebrow: "What's next",
    headline: [{ t: 'CCDesigner', accent: true }],
    sub: 'creativecurriculumdesigner.com',
  },
];

// 16:9 widescreen, in inches
const W = 13.333;
const H = 7.5;

function addBackground(slide, kind) {
  if (kind === 'hero' || kind === 'closing') {
    slide.background = { color: 'FFFFFF' };
    // soft lavender wash band
    slide.addShape('rect', {
      x: 0, y: 0, w: W, h: H,
      fill: { color: 'F4F1FB' },
      line: { color: 'F4F1FB' },
    });
    slide.addShape('rect', {
      x: 0, y: H - 0.04, w: W, h: 0.04,
      fill: { color: '7C3AED' }, line: { color: '7C3AED' },
    });
  } else {
    // dark cinematic gradient (PptxGenJS doesn't support true gradients in
    // a single fill, so we layer two rectangles to fake it).
    slide.background = { color: '0B0820' };
    slide.addShape('rect', {
      x: 0, y: 0, w: W, h: H,
      fill: { color: '0B0820' }, line: { color: '0B0820' },
    });
    slide.addShape('rect', {
      x: 0, y: 0, w: W * 0.65, h: H,
      fill: { color: '120F2E', transparency: 25 },
      line: { color: '120F2E' },
    });
    slide.addShape('ellipse', {
      x: -2.5, y: H - 4, w: 8, h: 8,
      fill: { color: '7C3AED', transparency: 80 },
      line: { type: 'none' },
    });
    slide.addShape('ellipse', {
      x: W - 4, y: -3, w: 7, h: 7,
      fill: { color: '14B8A6', transparency: 85 },
      line: { type: 'none' },
    });
  }
}

function addCornerMark(slide, kind) {
  if (kind === 'hero' || kind === 'closing') return;
  if (fs.existsSync(LOGO_DARK)) {
    slide.addImage({ path: LOGO_DARK, x: 0.45, y: 0.4, w: 1.6, h: 0.42 });
  }
}

function addSlideNumber(slide, n) {
  slide.addText(`${String(n).padStart(2, '0')} / 22`, {
    x: W - 1.4, y: 0.4, w: 1.0, h: 0.3,
    fontSize: 9, fontFace: 'Calibri',
    color: '8B85A8', align: 'right', bold: true,
    charSpacing: 4,
  });
}

function buildHeadlineRuns(parts, accentHex, isLight) {
  return parts.map((p) => ({
    text: p.t,
    options: {
      color: p.accent ? accentHex : (isLight ? '1A1033' : 'FFFFFF'),
      bold: true,
    },
  }));
}

function addContentSlide(pptx, scene) {
  const slide = pptx.addSlide();
  const kind = scene.kind;
  const tint = TINTS[scene.tint] || TINTS.indigo;
  const isLight = kind === 'hero' || kind === 'closing';

  addBackground(slide, kind);

  if (kind === 'hero' || kind === 'closing') {
    // Big centered logo + tagline
    if (fs.existsSync(LOGO_MARK)) {
      slide.addImage({ path: LOGO_MARK, x: W / 2 - 1.4, y: 1.6, w: 2.8, h: 2.4 });
    }
    slide.addText(scene.eyebrow.toUpperCase(), {
      x: 1, y: 4.3, w: W - 2, h: 0.4,
      fontSize: 14, fontFace: 'Calibri', bold: true,
      color: '7C3AED', align: 'center', charSpacing: 6,
    });
    slide.addText(scene.headline.map((p) => p.t).join(''), {
      x: 1, y: 4.8, w: W - 2, h: 1.0,
      fontSize: 54, fontFace: 'Calibri', bold: true, italic: true,
      color: '1A1033', align: 'center',
    });
    slide.addText(scene.sub, {
      x: 1.5, y: 5.95, w: W - 3, h: 0.7,
      fontSize: 18, fontFace: 'Calibri',
      color: '4B4565', align: 'center',
    });
    addSlideNumber(slide, scene.n);
    return;
  }

  const center = !!scene.center;
  const padX = 0.9;
  const contentW = W - padX * 2;

  // Eyebrow
  slide.addText(scene.eyebrow.toUpperCase(), {
    x: padX, y: 1.95, w: contentW, h: 0.4,
    fontSize: 13, fontFace: 'Calibri', bold: true,
    color: tint.eyebrow, align: center ? 'center' : 'left',
    charSpacing: 8,
  });

  // Headline (rich runs so accent word gets its own color)
  slide.addText(buildHeadlineRuns(scene.headline, tint.accent, isLight), {
    x: padX, y: 2.5, w: contentW, h: 2.2,
    fontSize: center ? 60 : 56, fontFace: 'Calibri', bold: true,
    align: center ? 'center' : 'left',
    valign: 'top',
    paraSpaceAfter: 2,
  });

  // Subtitle / body
  slide.addText(scene.sub, {
    x: padX, y: center ? 5.2 : 5.4, w: center ? contentW : contentW * 0.78,
    h: 1.4,
    fontSize: 18, fontFace: 'Calibri',
    color: 'D7D3E8', align: center ? 'center' : 'left',
    paraSpaceBefore: 4,
  });

  addCornerMark(slide, kind);
  addSlideNumber(slide, scene.n);
}

async function build() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = 'Creative Curriculum Designer — Promo';
  pptx.subject = 'Editable pitch deck mirroring the 22-scene CCDesigner promo';
  pptx.company = 'Creative Curriculum Designer';
  pptx.author = 'Creative Curriculum Designer';

  for (const scene of SCENES) {
    addContentSlide(pptx, scene);
  }

  await pptx.writeFile({ fileName: OUT_FILE });
  console.log(`Wrote ${OUT_FILE}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
