/**
 * Headless walkthrough of CCDesigner for the Oct 19 UX audit.
 * Viewport: 1440x900. Demo mode via prototype gate + ?demo=1.
 */
import puppeteer from '/tmp/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const BASE = process.env.CCD_URL || 'http://localhost:5173';
const OUT = '/workspace/ux-audit/screens';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';

fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name, fullPage = false) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage, type: 'png' });
  console.log('shot', name);
  return file;
}

async function dismissOverlays(page) {
  // Close common modals / dialogs
  for (let i = 0; i < 6; i++) {
    const closed = await page.evaluate(() => {
      const candidates = [
        ...document.querySelectorAll('[role="dialog"] button'),
        ...document.querySelectorAll('button'),
      ];
      const labels = ['got it', 'close', 'continue', 'dismiss', 'skip', 'not now', 'ok', "let's go", 'start exploring'];
      for (const b of candidates) {
        const t = (b.textContent || '').trim().toLowerCase();
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        if (labels.some((l) => t === l || t.includes(l) || aria === l || aria.includes('close'))) {
          // Avoid closing the whole app chrome accidentally
          if (t.includes('collapse')) continue;
          b.click();
          return t || aria;
        }
      }
      // X buttons in dialogs
      const x = document.querySelector('[role="dialog"] button[aria-label="Close"], [role="dialog"] button[aria-label="close"]');
      if (x) {
        x.click();
        return 'aria-close';
      }
      return null;
    });
    if (!closed) break;
    console.log('dismissed', closed);
    await sleep(400);
  }
}

async function expandSidebar(page) {
  await page.evaluate(() => {
    const btn = document.querySelector('.ccd-studio-collapse');
    if (!btn) return;
    const collapsed = document.documentElement.classList.contains('ccd-studio-nav-collapsed')
      || document.querySelector('.ccd-studio-app.is-collapsed');
    if (collapsed) btn.click();
  });
  await sleep(300);
}

async function clickNav(page, dataTab) {
  await expandSidebar(page);
  const clicked = await page.evaluate((tab) => {
    const el = document.querySelector(`.ccd-studio-sidebar [data-tab="${tab}"]`);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }, dataTab);
  if (!clicked) console.warn('nav miss', dataTab);
  await sleep(900);
  await dismissOverlays(page);
}

async function clickText(page, text, opts = {}) {
  const found = await page.evaluate((t, exact) => {
    const nodes = [...document.querySelectorAll('button, a, [role="button"], [role="tab"]')];
    const lower = t.toLowerCase();
    for (const n of nodes) {
      const label = (n.textContent || '').replace(/\s+/g, ' ').trim();
      if (exact ? label.toLowerCase() === lower : label.toLowerCase().includes(lower)) {
        n.click();
        return label;
      }
    }
    return null;
  }, text, !!opts.exact);
  if (found) {
    console.log('clicked', found);
    await sleep(opts.wait || 800);
  } else {
    console.warn('click miss', text);
  }
  return found;
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
    ],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // --- Login / landing ---
  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  await shot(page, '01-login-landing');

  // Unlock gate + activate demo via school preview path if present, else inject
  await page.evaluate(() => {
    sessionStorage.setItem('ccd-prototype-gate', '1');
  });

  // School homepage → prototype password → demo visitor
  await page.goto(BASE + '/oakhill', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1000);
  await shot(page, '01b-school-homepage');
  await clickText(page, 'Explore the working prototype') || (await clickText(page, 'Preview'));
  await sleep(600);
  const needsPw = await page.$('input[type="password"]');
  if (needsPw) {
    await needsPw.click({ clickCount: 3 });
    await needsPw.type('artscouncil26');
    await page.keyboard.press('Enter');
    await sleep(2500);
  }

  // Ensure demo mode
  await page.evaluate(() => {
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-mode', '1');
  });
  await page.goto(BASE + '/?demo=1', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(2500);
  await dismissOverlays(page);
  await sleep(800);
  await dismissOverlays(page);
  await expandSidebar(page);
  await shot(page, '02-planner-week');

  // Planner day view
  await clickText(page, 'Day');
  await sleep(700);
  await shot(page, '03-planner-day');

  // Week again then Timetable
  await clickText(page, 'Week');
  await sleep(400);
  const tt = (await clickText(page, 'Timetable')) || (await clickText(page, 'Timetable builder'));
  await sleep(1000);
  await shot(page, '04-timetable-builder');

  // Class calendar if present
  await clickText(page, 'Class calendar');
  await sleep(700);
  await shot(page, '04b-class-calendar');

  // Half-terms
  await clickNav(page, 'curriculum');
  await sleep(1000);
  await shot(page, '05-half-terms-map');

  // Try open a cell / assign scheme
  await page.evaluate(() => {
    const cell = document.querySelector('[data-half-term], .half-term-cell, button[aria-label*="Autumn"], td button, .ht-cell');
    if (cell) cell.click();
    else {
      // click first interactive cell-like button in map
      const btns = [...document.querySelectorAll('button, [role="button"]')].filter((b) => {
        const t = (b.textContent || '').toLowerCase();
        return /autumn|spring|summer|assign|scheme|empty|plan/i.test(t) || (b.getAttribute('aria-label') || '').match(/term/i);
      });
      if (btns[0]) btns[0].click();
    }
  });
  await sleep(1000);
  await shot(page, '06-half-terms-assign-scheme');

  // Close assign panel if open
  await page.keyboard.press('Escape');
  await sleep(400);
  await dismissOverlays(page);

  // Lesson Builder
  await clickNav(page, 'lesson-builder');
  await sleep(1000);
  await shot(page, '07-lesson-builder');

  // Lessons
  await clickNav(page, 'lesson-library');
  await sleep(1000);
  await shot(page, '08-lessons');

  // Activity Library
  await clickNav(page, 'activity-library');
  await sleep(1200);
  await shot(page, '09-activity-library');

  // Create activity editor
  const created =
    (await clickText(page, 'Create activity')) ||
    (await clickText(page, 'New activity')) ||
    (await clickText(page, 'Add activity')) ||
    (await clickText(page, 'Create'));
  await sleep(1200);
  await shot(page, '10-activity-editor');
  // Back if possible
  await page.keyboard.press('Escape');
  await sleep(300);
  await clickText(page, 'Back');
  await sleep(500);
  await dismissOverlays(page);

  // Slides
  await clickNav(page, 'lesson-viewer');
  await sleep(1200);
  await shot(page, '11-slides-landing');

  await clickText(page, 'Create new slides');
  await sleep(1500);
  await shot(page, '12-slides-editor');
  await page.keyboard.press('Escape');
  await sleep(400);
  await clickText(page, 'Back');
  await sleep(500);
  await dismissOverlays(page);

  // Try library tab on slides
  await clickText(page, 'Slides library');
  await sleep(600);
  await clickText(page, 'My slides');
  await sleep(400);
  await shot(page, '13-slides-library');

  // Partner Hubs
  await clickNav(page, 'our-partners');
  await sleep(1500);
  await shot(page, '14-partner-hubs');

  // Music Hubs / map interactions
  await clickText(page, 'Music Hubs');
  await sleep(1000);
  await shot(page, '15-music-hubs-map');

  // Try click a region on SVG/map
  await page.evaluate(() => {
    const paths = [...document.querySelectorAll('svg path, svg polygon, button[aria-label]')];
    const interesting = paths.find((p) => {
      const a = (p.getAttribute('aria-label') || '') + (p.getAttribute('title') || '');
      return /england|london|essex|region|hub|yorkshire|midlands|west/i.test(a);
    });
    if (interesting) interesting.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    else if (paths[5]) paths[5].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await sleep(1200);
  await shot(page, '16-music-hubs-region');

  await clickText(page, 'Explore');
  await sleep(1000);
  // Open a hub card if present
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('a, button')].filter((n) =>
      /hub|open|view|visit/i.test(n.textContent || ''),
    );
    if (cards[0]) cards[0].click();
  });
  await sleep(1200);
  await shot(page, '17-music-hub-page');

  // Arts organisations
  await clickNav(page, 'our-partners');
  await sleep(800);
  await clickText(page, 'Arts organisations');
  await sleep(1000);
  await shot(page, '18-arts-organisations');

  // Paid resources
  await clickText(page, 'Paid resources');
  await sleep(1000);
  await shot(page, '19-paid-resources');

  // More tools
  await clickNav(page, 'more');
  await sleep(900);
  await shot(page, '20-more-tools');

  // Settings
  await clickText(page, 'Settings');
  await sleep(1200);
  await shot(page, '21-settings');
  await clickText(page, 'My classes');
  await sleep(700);
  await shot(page, '22-settings-my-classes');
  await page.keyboard.press('Escape');
  await sleep(400);
  await dismissOverlays(page);

  // Timetable via More tools
  await clickNav(page, 'more');
  await sleep(500);
  await clickText(page, 'Timetable builder');
  await sleep(1200);
  await shot(page, '23-timetable-from-more');

  // Contact
  await clickNav(page, 'more');
  await sleep(400);
  await clickText(page, 'Contact');
  await sleep(900);
  await shot(page, '24-contact');

  // Bolt-ons
  await clickNav(page, 'bolt-ons');
  await sleep(1000);
  await shot(page, '25-bolt-ons');
  await clickNav(page, 'assessify');
  await sleep(900);
  await shot(page, '26-assessify');
  await clickNav(page, 'perifeedback');
  await sleep(900);
  await shot(page, '27-perifeedback');

  // Export / Copy link — go to lessons and open a lesson if any
  await clickNav(page, 'lesson-library');
  await sleep(1000);
  await page.evaluate(() => {
    const card = document.querySelector('[data-lesson-id], .lesson-card, article button, .group button');
    if (card) card.click();
    else {
      const open = [...document.querySelectorAll('button,a')].find((n) =>
        /open|view|details|edit/i.test(n.textContent || ''),
      );
      open?.click();
    }
  });
  await sleep(1200);
  await shot(page, '28-lesson-detail-export');

  // Capture page titles / nav labels for audit notes
  const auditDump = await page.evaluate(() => {
    const nav = [...document.querySelectorAll('.ccd-studio-nav-item span')].map((s) => s.textContent.trim());
    const h1 = document.querySelector('h1')?.textContent?.trim();
    const eyebrow = document.querySelector('.ccd-studio-eyebrow')?.textContent?.trim();
    return { nav, h1, eyebrow, title: document.title, tab: document.documentElement.dataset.ccdTab };
  });

  fs.writeFileSync(
    path.join(OUT, '_audit-meta.json'),
    JSON.stringify({ auditDump, consoleErrors: consoleErrors.slice(0, 80) }, null, 2),
  );
  console.log('console errors', consoleErrors.length);
  console.log('done', OUT);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
