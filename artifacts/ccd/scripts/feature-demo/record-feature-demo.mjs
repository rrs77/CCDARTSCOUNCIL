/**
 * Records a ~3 min CCDesigner feature walkthrough video for external orgs.
 *
 * Usage (app must be running on BASE_URL):
 *   node record-feature-demo.mjs
 *
 * Outputs:
 *   ../../public/feature-demo/ccdesigner-feature-demo.webm
 *   ../../public/feature-demo/frames/*.png (optional stills)
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.CCD_BASE_URL || 'http://127.0.0.1:5173';
const OUT_DIR = path.resolve(__dirname, '../../public/feature-demo');
const VIDEO_DIR = path.join(OUT_DIR, 'raw-video');
const FRAMES_DIR = path.join(OUT_DIR, 'frames');
const GATE_PASSWORD = 'artscouncil26';

const CHAPTERS = [
  { id: '01-login', title: 'Welcome to CCDesigner', caption: 'Forest/lime creative curriculum studio for schools & arts partners' },
  { id: '02-prototype', title: 'Explore the working prototype', caption: 'Password-gated demo for Arts Council & partner consultation' },
  { id: '03-dashboard', title: 'Half-Term Designer', caption: 'Plan Autumn–Summer half-terms and assign lessons to units' },
  { id: '04-activity', title: 'Activity Library', caption: 'Browse, star, and reuse classroom activities — including recently added partner picks' },
  { id: '05-builder', title: 'Lesson Builder', caption: 'Compose lessons from the Activity Library into ready-to-teach sequences' },
  { id: '06-lessons', title: 'Lesson Library', caption: 'Store, open, and assign finished lessons across your curriculum' },
  { id: '07-calendar-month', title: 'Calendar — Month', caption: 'See the term at a glance with lessons, events, and school days' },
  { id: '08-calendar-week', title: 'Calendar — Week grid', caption: 'Timed week view for timetable-style planning' },
  { id: '09-hubs', title: 'Partner Hubs', caption: 'Music hubs, premium partners, and free cultural organisations' },
  { id: '10-hub-open', title: 'Inside a Partner Hub', caption: 'Open a hub and add resources into CCDesigner (local prototype)' },
  { id: '11-planning', title: 'Partner Planning', caption: 'Accordion of partner packs linked into Activity Library planning' },
  { id: '12-close', title: 'Share & next steps', caption: 'Partners & logos shown for demonstration only — contact rob@rhythmstix.co.uk' },
];

function ensureDirs() {
  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

async function setCaption(page, title, caption) {
  await page.evaluate(
    ({ title, caption }) => {
      let el = document.getElementById('ccd-demo-caption');
      if (!el) {
        el = document.createElement('div');
        el.id = 'ccd-demo-caption';
        el.setAttribute(
          'style',
          [
            'position:fixed',
            'left:24px',
            'right:24px',
            'bottom:28px',
            'z-index:2147483647',
            'pointer-events:none',
            'font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif',
          ].join(';'),
        );
        document.body.appendChild(el);
      }
      el.innerHTML = `
        <div style="
          max-width:720px;
          margin:0 auto;
          background:rgba(0,45,36,0.92);
          color:#fff;
          border:1px solid rgba(182,255,126,0.45);
          border-radius:16px;
          padding:14px 18px;
          box-shadow:0 18px 50px rgba(0,0,0,0.35);
          backdrop-filter:blur(8px);
        ">
          <div style="
            display:inline-block;
            font-size:11px;
            letter-spacing:0.14em;
            text-transform:uppercase;
            color:#B6FF7E;
            font-weight:700;
            margin-bottom:6px;
          ">CCDesigner · Feature demo</div>
          <div style="font-size:20px;font-weight:700;line-height:1.2;margin-bottom:4px;">${title}</div>
          <div style="font-size:14px;line-height:1.4;color:rgba(255,255,255,0.88);">${caption}</div>
        </div>
      `;
    },
    { title, caption },
  );
}

async function hold(page, ms) {
  await page.waitForTimeout(ms);
}

async function dismissIfVisible(page, selectors) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout: 800 }).catch(() => false)) {
      await loc.click({ timeout: 2000 }).catch(() => {});
      await hold(page, 400);
    }
  }
}

async function clickTab(page, tab) {
  await page.locator(`[data-tab="${tab}"]`).first().click({ timeout: 8000 });
  await hold(page, 900);
}

async function snap(page, id) {
  await page.screenshot({
    path: path.join(FRAMES_DIR, `${id}.png`),
    type: 'png',
  });
}

async function chapter(page, chapterMeta, action) {
  await setCaption(page, chapterMeta.title, chapterMeta.caption);
  await action();
  await snap(page, chapterMeta.id);
  await hold(page, 1600);
}

async function main() {
  ensureDirs();
  console.log(`Recording against ${BASE_URL}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  // Pre-seed gate + welcome dismissals so the story starts cleanly on login.
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('ccd-prototype-welcome-seen', '1');
      sessionStorage.setItem('ccd-activity-library-welcome-seen', '1');
    } catch {
      /* ignore */
    }
  });

  // 1) Login / landing
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await hold(page, 1200);
  await dismissIfVisible(page, [
    'button:has-text("I understand — continue")',
    'button:has-text("I understand")',
  ]);

  await chapter(page, CHAPTERS[0], async () => {
    await hold(page, 2200);
  });

  // 2) Enter prototype
  await chapter(page, CHAPTERS[1], async () => {
    await page.getByRole('button', { name: /Explore the working prototype/i }).click();
    await hold(page, 600);
    const pwd = page.getByPlaceholder(/Access password/i);
    if (await pwd.isVisible({ timeout: 2500 }).catch(() => false)) {
      await pwd.fill(GATE_PASSWORD);
      await page.getByRole('button', { name: /Enter prototype/i }).click();
    }
    await page.waitForURL(/demo=1|\/$/, { timeout: 30000 }).catch(() => {});
    // Demo seed can take a few seconds
    await page.waitForSelector('[data-tab="unit-viewer"], [data-walkthrough="year-group-selector"]', {
      timeout: 45000,
    });
    await dismissIfVisible(page, [
      'button:has-text("I understand — continue")',
      '[aria-labelledby="activity-library-welcome-title"] button:has-text("Continue")',
      '[aria-labelledby="activity-library-welcome-title"] button:has-text("Got it")',
      '[aria-labelledby="activity-library-welcome-title"] button',
    ]);
    await hold(page, 1800);
  });

  // 3) Half-Term Designer (Unit Viewer)
  await chapter(page, CHAPTERS[2], async () => {
    await clickTab(page, 'unit-viewer');
    await hold(page, 2500);
    // Try opening a half-term card if present
    const halfTerm = page.locator('text=/Autumn 1|Spring 1|Summer 1/i').first();
    if (await halfTerm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await halfTerm.click({ timeout: 3000 }).catch(() => {});
      await hold(page, 1500);
    }
  });

  // 4) Activity Library
  await chapter(page, CHAPTERS[3], async () => {
    await clickTab(page, 'activity-library');
    await dismissIfVisible(page, [
      'button:has-text("I understand — continue")',
      'button:has-text("Got it")',
      'button:has-text("Continue")',
      '[aria-labelledby="activity-library-welcome-title"] button',
    ]);
    await hold(page, 2200);
    // Scroll to show recently added / content
    await page.mouse.wheel(0, 400);
    await hold(page, 1200);
    await page.mouse.wheel(0, -200);
  });

  // 5) Lesson Builder
  await chapter(page, CHAPTERS[4], async () => {
    await clickTab(page, 'lesson-builder');
    await hold(page, 2800);
  });

  // 6) Lesson Library
  await chapter(page, CHAPTERS[5], async () => {
    await clickTab(page, 'lesson-library');
    await hold(page, 2500);
  });

  // 7) Calendar month
  await chapter(page, CHAPTERS[6], async () => {
    await clickTab(page, 'calendar');
    await hold(page, 2200);
    const monthBtn = page.getByRole('button', { name: /^Month$/i }).first();
    if (await monthBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await monthBtn.click().catch(() => {});
    }
    await hold(page, 1500);
  });

  // 8) Calendar week timed grid
  await chapter(page, CHAPTERS[7], async () => {
    const weekBtn = page.getByRole('button', { name: /^Week$/i }).first();
    const weekLessons = page.getByRole('button', { name: /Week Lessons|Timed/i }).first();
    if (await weekBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await weekBtn.click().catch(() => {});
      await hold(page, 2200);
    } else if (await weekLessons.isVisible({ timeout: 1000 }).catch(() => false)) {
      await weekLessons.click().catch(() => {});
      await hold(page, 2200);
    } else {
      // Fallback: click any control containing Week
      await page.locator('button', { hasText: /Week/i }).first().click().catch(() => {});
      await hold(page, 2200);
    }
  });

  // 9) Partner Hubs overview
  await chapter(page, CHAPTERS[8], async () => {
    await clickTab(page, 'our-partners');
    await hold(page, 1800);
    await page.mouse.wheel(0, 350);
    await hold(page, 1200);
    // Expand a music hub accordion if present
    const musicRow = page.locator('button[aria-expanded]').first();
    if (await musicRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await musicRow.click().catch(() => {});
      await hold(page, 1400);
    }
  });

  // 10) Open a partner hub + Add
  await chapter(page, CHAPTERS[9], async () => {
    // Prefer We Teach Drama / iCompose / LSO / EMS
    const openHub = page.getByRole('button', { name: /Open hub/i }).first();
    if (await openHub.isVisible({ timeout: 2000 }).catch(() => false)) {
      await openHub.click();
    } else {
      await page.goto(`${BASE_URL}/weteachdrama`, { waitUntil: 'domcontentloaded' });
    }
    await hold(page, 2500);
    const addBtn = page
      .getByRole('button', { name: /Add to CCDesigner|Add to basket|Add pack|Add to app/i })
      .first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click().catch(() => {});
      await hold(page, 1800);
    }
    // If still on hub, scroll to show content
    await page.mouse.wheel(0, 400);
    await hold(page, 1200);
  });

  // 11) Partner Planning accordion (back in app)
  await chapter(page, CHAPTERS[10], async () => {
    await page.goto(`${BASE_URL}/?demo=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-tab="activity-library"]', { timeout: 30000 });
    await clickTab(page, 'activity-library');
    await dismissIfVisible(page, [
      'button:has-text("I understand — continue")',
      '[aria-labelledby="activity-library-welcome-title"] button',
    ]);
    const planning = page.locator('[data-partner-planning]').first();
    if (await planning.isVisible({ timeout: 3000 }).catch(() => false)) {
      await planning.click();
      await hold(page, 1800);
      // Expand first org accordion if nested
      const nested = page.locator('[data-partner-planning] button[aria-expanded="false"]').first();
      if (await nested.isVisible({ timeout: 1500 }).catch(() => false)) {
        await nested.click().catch(() => {});
        await hold(page, 1400);
      }
    } else {
      await hold(page, 2000);
    }
  });

  // 12) Closing caption
  await chapter(page, CHAPTERS[11], async () => {
    await clickTab(page, 'our-partners');
    await hold(page, 2800);
  });

  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error('Playwright did not produce a video file');
  }

  const finalWebm = path.join(OUT_DIR, 'ccdesigner-feature-demo.webm');
  fs.copyFileSync(videoPath, finalWebm);

  // Prefer ffmpeg-static (full libx264); Playwright's ffmpeg cannot encode H.264.
  const { spawnSync } = await import('node:child_process');
  const ffmpegCandidates = [
    process.env.FFMPEG_PATH,
    path.join(__dirname, 'node_modules/ffmpeg-static/ffmpeg'),
    process.env.PLAYWRIGHT_FFMPEG_PATH,
    'ffmpeg',
  ].filter(Boolean);

  let mp4Path = null;
  const outMp4 = path.join(OUT_DIR, 'ccdesigner-feature-demo.mp4');
  for (const ff of ffmpegCandidates) {
    if (!fs.existsSync(ff) && ff !== 'ffmpeg') continue;
    const r = spawnSync(
      ff,
      [
        '-y',
        '-i',
        finalWebm,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-an',
        outMp4,
      ],
      { encoding: 'utf8' },
    );
    if (r.status === 0 && fs.existsSync(outMp4)) {
      mp4Path = outMp4;
      break;
    }
  }

  // Manifest for the interactive player
  const manifest = {
    title: 'CCDesigner — Feature demo for external organisations',
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    disclaimer:
      'Partners and logos are shown for demonstration only and do not imply endorsement.',
    chapters: CHAPTERS,
    video: {
      webm: 'ccdesigner-feature-demo.webm',
      mp4: mp4Path ? 'ccdesigner-feature-demo.mp4' : null,
    },
    frames: CHAPTERS.map((c) => `frames/${c.id}.png`),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('Wrote', finalWebm);
  if (mp4Path) console.log('Wrote', mp4Path);
  else console.log('MP4 conversion skipped (no usable ffmpeg)');
  console.log('Frames in', FRAMES_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
