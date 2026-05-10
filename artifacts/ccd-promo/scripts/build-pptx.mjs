// Build a PowerPoint version of the CCDesigner promo video by embedding
// rendered still frames of each scene as full-bleed slide backgrounds.
// Frames live in ./frames/scene-NN.jpg and were captured from the live
// promo via the ?still=1&scene=N route.
import PptxGenJS from 'pptxgenjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FRAMES_DIR = join(__dirname, 'frames');
const OUT_DIR = join(ROOT, 'public', 'downloads');
const OUT_FILE = join(OUT_DIR, 'CCDesigner-Promo.pptx');

const SCENE_TITLES = [
  'CCDesigner — A Creative Studio for Educators',
  'Teaching is creative work.',
  'Never lose a brilliant idea.',
  'Build your creative archive.',
  'Build connected learning journeys.',
  'Rich lessons, built in minutes.',
  'Drama. Dance. Music.',
  'Encourage curiosity and imagination.',
  'AI that amplifies your thinking.',
  'Adapt instantly for different learners.',
  'Support every child meaningfully.',
  'Create deeper learning opportunities.',
  'Connect subjects naturally.',
  'Reflect. Adapt. Improve.',
  'Track growth over time.',
  'Build knowledge intentionally.',
  'Inspiration that grows with you.',
  'Powered by creative communities.',
  'See the bigger learning picture.',
  'Beautiful, professional plans.',
  'Plan anywhere.',
  'CCDesigner — What\u2019s next.',
];

async function build() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';   // 13.333 x 7.5 in (16:9)
  pptx.title = 'Creative Curriculum Designer — Promo';
  pptx.subject = 'Promo deck mirroring the 22-scene promo video';
  pptx.company = 'Creative Curriculum Designer';
  pptx.author = 'Creative Curriculum Designer';

  const W = 13.333;
  const H = 7.5;

  for (let i = 1; i <= 22; i++) {
    const num = String(i).padStart(2, '0');
    const framePath = join(FRAMES_DIR, `scene-${num}.jpg`);
    if (!fs.existsSync(framePath)) {
      throw new Error(`Missing frame: ${framePath}`);
    }
    const slide = pptx.addSlide();
    slide.background = { color: '000000' };
    slide.addImage({ path: framePath, x: 0, y: 0, w: W, h: H });

    // Speaker notes carry the scene title for accessibility / outline view.
    slide.addNotes(`Scene ${i} of 22 — ${SCENE_TITLES[i - 1] ?? ''}`);
  }

  await pptx.writeFile({ fileName: OUT_FILE });
  console.log(`Wrote ${OUT_FILE}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
