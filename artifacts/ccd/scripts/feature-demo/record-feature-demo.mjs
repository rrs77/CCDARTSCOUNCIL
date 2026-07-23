/**
 * CCDesigner feature demo recorder — 1920×1080 fixed canvas.
 *
 * Linear pathway:
 *   logo → context pressure → context response → disclaimer → live login →
 *   ideas → action → explore → free hubs → key dates → settings → create →
 *   calendar week → paid → org hub → closing contacts (not "thank you").
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  VIEWPORT,
  GATE_KEY,
  DEMO_MODE_KEY,
  hold,
  dismissIfVisible,
  ensureCursor,
  setCaption,
  clearCaption,
  logoIntroHtml,
  partnerDisclaimerSlideHtml,
  slideHtml,
  contextSlideHtml,
  contextPressureSlideHtml,
  contextResponseSlideHtml,
  ideasSlideHtml,
  closingSlideHtml,
  smoothClick,
  clickTab,
  snap,
  typeSlow,
} from './demo-helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.CCD_BASE_URL || 'http://127.0.0.1:5173';
const OUT_DIR = path.resolve(__dirname, '../../public/feature-demo');
const VIDEO_DIR = path.join(OUT_DIR, 'raw-video');
const FRAMES_DIR = path.join(OUT_DIR, 'frames');

export const CHAPTERS = [
  { id: '01-logo', title: 'CCDesigner', caption: 'Brand intro' },
  { id: '02-pressure', title: 'Performing arts under pressure', caption: 'Schools & FE — expertise harder to reach' },
  { id: '03-response', title: 'One place to plan and connect', caption: 'Music hubs · arts organisations · ideas kept alive' },
  { id: '04-disclaimer', title: 'Demonstration only', caption: 'For potential partners & funding — no endorsement implied' },
  { id: '05-landing', title: 'Exceptional lessons start with connection', caption: 'Live first page' },
  { id: '06-ideas', title: 'Keep every lightning moment', caption: 'Excellent ideas · melting pot for arts planning' },
  { id: '07-action', title: "Let's see the app in action", caption: 'Explore the working prototype' },
  { id: '08-explore', title: 'Inside the prototype', caption: 'Dashboard · Half-Term Designer' },
  { id: '09-lso', title: 'LSO Partner Hub', caption: 'Choose How to Build an Orchestra · Add to CCDesigner' },
  { id: '10-activities', title: 'Activity Library', caption: 'LSO topic activities in your library' },
  { id: '11-lesson', title: 'Lesson Builder → Library', caption: 'Build from LSO activities · same lesson appears in Library' },
  { id: '12-term', title: 'Term overview', caption: 'Lesson from Library placed on Half-Term Designer' },
  { id: '13-key-dates', title: 'Populate with key dates', caption: 'Partner dropdown · KS1/KS2 · Important dates' },
  { id: '14-settings', title: 'Customisable to key stage', caption: 'Settings · year-group folders' },
  { id: '15-create', title: 'Build your own', caption: 'Create activity & lesson · live links' },
  { id: '16-calendar', title: 'Calendar week & timetable', caption: 'Week view · add event · timetable' },
  { id: '17-paid', title: 'Paid partners', caption: 'We Teach Drama & iCompose — 10–20% cut' },
  { id: '18-orgs', title: 'For organisations', caption: 'Own hub + admin backend templates' },
  { id: '19-close', title: 'Get in touch', caption: 'rob@rhythmstix.co.uk · www.ccdesigner.co.uk' },
];

const WELCOME_DISMISS = [
  'button:has-text("I understand — continue")',
  'button:has-text("I understand")',
  'button:has-text("Got it")',
  'button:has-text("Continue")',
  '[aria-labelledby="activity-library-welcome-title"] button',
];

function ensureDirs() {
  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

async function recordSlide(page, html, holdMs, frameId) {
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts?.ready?.catch?.(() => {})).catch(() => {});
  await hold(page, holdMs);
  await snap(page, FRAMES_DIR, frameId);
}

async function dismissOverlays(page) {
  await dismissIfVisible(page, WELCOME_DISMISS);
  // Help guide / generic dialogs that block tab clicks
  const closeHelp = page.getByRole('button', { name: /^Close$/i }).first();
  if (await closeHelp.isVisible({ timeout: 400 }).catch(() => false)) {
    await closeHelp.click({ force: true }).catch(() => {});
    await hold(page, 200);
  }
  const dialogClose = page.locator('.fixed button:has-text("Close"), [role="dialog"] button:has-text("Close")').first();
  if (await dialogClose.isVisible({ timeout: 300 }).catch(() => false)) {
    await dialogClose.click({ force: true }).catch(() => {});
    await hold(page, 200);
  }
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape').catch(() => {});
    await hold(page, 140);
  }
}

async function selectYearGroup(page, nameRe) {
  const trigger = page.locator('[data-walkthrough="year-group-selector"] button').first();
  if (!(await trigger.isVisible({ timeout: 2000 }).catch(() => false))) return false;
  await smoothClick(page, trigger);
  await hold(page, 450);
  for (const sec of [/^EYFS/i, /^KS1/i, /^KS2/i, /^KS3/i]) {
    const btn = page.getByRole('button', { name: sec }).first();
    if (await btn.isVisible({ timeout: 400 }).catch(() => false)) {
      const text = await btn.textContent().catch(() => '');
      // expand sections that might contain the target
      await smoothClick(page, btn).catch(() => {});
      await hold(page, 280);
    }
  }
  const opt = page
    .locator('[data-walkthrough="year-group-selector"] button')
    .filter({ hasText: nameRe })
    .last();
  if (await opt.isVisible({ timeout: 2000 }).catch(() => false)) {
    await smoothClick(page, opt);
    await hold(page, 1100);
    return true;
  }
  await page.keyboard.press('Escape').catch(() => {});
  return false;
}

async function ensureInApp(page) {
  await page.goto(`${BASE_URL}/?demo=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-tab]', { timeout: 45000 }).catch(() => {});
  await ensureCursor(page);
  await dismissOverlays(page);
}

/** Enter demo with no password UI — session flags set before navigation. */
async function enterPrototypeFast(page) {
  await page.goto('about:blank');
  await page.evaluate(
    ({ gateKey, demoKey }) => {
      try {
        sessionStorage.setItem(gateKey, '1');
        sessionStorage.setItem(demoKey, '1');
        sessionStorage.setItem('ccd-prototype-welcome-seen', '1');
        sessionStorage.setItem('ccd-partners-funding-video-seen', '1');
        sessionStorage.setItem('ccd-activity-library-welcome-seen', '1');
      } catch {
        /* ignore */
      }
    },
    { gateKey: GATE_KEY, demoKey: DEMO_MODE_KEY },
  );
  await page.goto(`${BASE_URL}/?demo=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-tab="unit-viewer"], [data-walkthrough="year-group-selector"]', {
    timeout: 60000,
  });
  await ensureCursor(page);
  await dismissIfVisible(page, WELCOME_DISMISS);
  // Never focus login / password UI
  await page.locator('input[type="password"]').waitFor({ state: 'hidden', timeout: 500 }).catch(() => {});
  await hold(page, 900);
}

async function openPartnerHub(page, nameRe, slug) {
  await clickTab(page, 'our-partners');
  await hold(page, 1600);
  await page.mouse.wheel(0, 420);
  await hold(page, 1200);
  const btn = page.getByRole('button', { name: nameRe }).first();
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await smoothClick(page, btn);
  } else {
    await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForURL(new RegExp(`/${slug}`), { timeout: 15000 }).catch(() => {});
  await hold(page, 2800);
  await ensureCursor(page);
}

/** Scroll to featured HTBAO on LSO hub, dwell, then Add unit to CCDesigner. */
async function chooseAndAddLsoTopic(page) {
  await setCaption(
    page,
    'How to Build an Orchestra',
    'Featured LSO Discovery project — choose this topic, then add it',
  );
  const featured = page.getByRole('heading', { name: /How to Build an Orchestra/i }).first();
  await featured.waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
  await featured.scrollIntoViewIfNeeded().catch(() => {});
  await hold(page, 3200);

  // Emphasise the featured block on camera
  await page.evaluate(() => {
    const h = [...document.querySelectorAll('h1,h2,h3')].find((el) =>
      /How to Build an Orchestra/i.test(el.textContent || ''),
    );
    const block = h?.closest('section, article, div');
    if (block) {
      block.style.outline = '3px solid #B6FF7E';
      block.style.outlineOffset = '6px';
    }
  }).catch(() => {});
  await hold(page, 2800);
  await snap(page, FRAMES_DIR, '09-lso-topic');

  const add = page.getByRole('button', { name: /Add unit to CCDesigner|Add to CCDesigner/i }).first();
  await add.waitFor({ state: 'visible', timeout: 8000 });
  await add.scrollIntoViewIfNeeded().catch(() => {});
  await hold(page, 1600);
  await setCaption(page, 'Add to CCDesigner', 'Seed the LSO unit into Year 6 libraries');
  await smoothClick(page, add);
  await page
    .waitForURL((url) => !/\/lso/.test(url.pathname), { timeout: 25000 })
    .catch(() => {});
  await page.waitForSelector('[data-tab]', { timeout: 30000 }).catch(() => {});
  await ensureCursor(page);
  await dismissIfVisible(page, WELCOME_DISMISS);
  await dismissOverlays(page);
  await hold(page, 2200);
  return true;
}

/**
 * Core arc on camera:
 * Activity Library (LSO pack) → Lesson Builder (create) → Lesson Library (same lesson) → Term.
 * Long dwells — do not rush. Do not skip Builder → Library.
 */
async function showLsoActivitiesLessonAndTerm(page) {
  const CREATED_LESSON = 'LSO — How to Build an Orchestra';

  await dismissOverlays(page);
  await selectYearGroup(page, /Year 6 Music|Year 6|Year 5 Music/i).catch(() => {});
  await dismissOverlays(page);

  // ——— ACTIVITIES ———
  await setCaption(
    page,
    'Activity Library',
    'How to Build an Orchestra — LSO activities now in your library',
  );
  await clickTab(page, 'activity-library');
  await dismissOverlays(page);
  await dismissIfVisible(page, WELCOME_DISMISS);
  await hold(page, 2200);

  // Partner planning filter if present
  const partnerPlan = page.locator('[data-partner-planning]').first();
  if (await partnerPlan.isVisible({ timeout: 2000 }).catch(() => false)) {
    const openPlan = page.getByRole('button', { name: /Select partner planning|Partner planning/i }).first();
    if (await openPlan.isVisible({ timeout: 1200 }).catch(() => false)) {
      await smoothClick(page, openPlan);
      await hold(page, 1000);
      const lsoOpt = page.getByRole('button', { name: /London Symphony Orchestra/i }).first();
      if (await lsoOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
        await smoothClick(page, lsoOpt);
        await hold(page, 1200);
      }
      const htbao = page.getByRole('button', { name: /How to Build an Orchestra/i }).first();
      if (await htbao.isVisible({ timeout: 1500 }).catch(() => false)) {
        await smoothClick(page, htbao);
        await hold(page, 1600);
      }
    }
  }

  const listening = page.getByText(/How to Build an Orchestra — Listening/i).first();
  if (await listening.isVisible({ timeout: 4000 }).catch(() => false)) {
    await listening.scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('h2,h3,h4')].find((n) =>
        /How to Build an Orchestra — Listening/i.test(n.textContent || ''),
      );
      if (el) {
        el.style.outline = '3px solid #B6FF7E';
        el.style.outlineOffset = '4px';
      }
    }).catch(() => {});
  }
  await hold(page, 3200);
  await page.mouse.wheel(0, 360);
  await hold(page, 2400);
  await page.mouse.wheel(0, 360);
  await hold(page, 2200);
  await snap(page, FRAMES_DIR, '10-activities');

  // ——— LESSON BUILDER: create a named lesson from LSO activities ———
  await setCaption(
    page,
    'Lesson Builder',
    'Create a lesson from How to Build an Orchestra activities',
  );
  await clickTab(page, 'lesson-builder');
  await dismissOverlays(page);
  await hold(page, 2200);

  const lessonName = page.getByPlaceholder(/Lesson Name|Lesson Title/i).first();
  if (await lessonName.isVisible({ timeout: 2500 }).catch(() => false)) {
    await typeSlow(page, lessonName, CREATED_LESSON, { delay: 36 });
    await hold(page, 900);
  }

  // Expand partner planning / category so LSO activities show
  const planBtn = page.getByRole('button', { name: /Select partner planning|Partner planning/i }).first();
  if (await planBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await smoothClick(page, planBtn);
    await hold(page, 900);
    const lso = page.getByRole('button', { name: /London Symphony Orchestra/i }).first();
    if (await lso.isVisible({ timeout: 1500 }).catch(() => false)) {
      await smoothClick(page, lso);
      await hold(page, 1000);
    }
    const project = page.getByRole('button', { name: /How to Build an Orchestra|Select How to Build an Orchestra/i }).first();
    if (await project.isVisible({ timeout: 1500 }).catch(() => false)) {
      await smoothClick(page, project);
      await hold(page, 1600);
    }
  }

  // Tick several activity checkboxes
  const checks = page.locator('input[type="checkbox"]');
  const nCheck = Math.min(await checks.count(), 4);
  for (let i = 0; i < nCheck; i++) {
    if (await checks.nth(i).isVisible({ timeout: 400 }).catch(() => false)) {
      await smoothClick(page, checks.nth(i));
      await hold(page, 450);
    }
  }
  if (nCheck === 0) {
    const selectable = page.getByRole('checkbox');
    const m = Math.min(await selectable.count(), 4);
    for (let i = 0; i < m; i++) {
      await smoothClick(page, selectable.nth(i));
      await hold(page, 450);
    }
  }

  const addSelected = page.getByRole('button', { name: /Add \d+ Selected/i }).first();
  if (await addSelected.isVisible({ timeout: 3000 }).catch(() => false)) {
    await setCaption(page, 'Add selected activities', 'LSO activities drop into this lesson');
    await smoothClick(page, addSelected);
    await hold(page, 2200);
  }

  await page.mouse.wheel(0, 200);
  await hold(page, 1600);
  await setCaption(page, 'Save the lesson', `"${CREATED_LESSON}" — then open Lesson Library`);
  const saveLesson = page.getByRole('button', { name: /Save Lesson/i }).first();
  if (await saveLesson.isVisible({ timeout: 2000 }).catch(() => false)) {
    await smoothClick(page, saveLesson);
    await hold(page, 2400);
  }
  await dismissOverlays(page);
  await snap(page, FRAMES_DIR, '11-lesson');

  // ——— LESSON LIBRARY: must show the lesson just created in Builder ———
  await setCaption(
    page,
    'Lesson Library',
    `Same lesson you just built — "${CREATED_LESSON}"`,
  );
  await clickTab(page, 'lesson-library');
  await dismissOverlays(page);
  await hold(page, 2400);

  // Prefer the exact created title; fall back to HTBAO unit heading
  let createdLoc = page.getByText(CREATED_LESSON, { exact: false }).first();
  if (!(await createdLoc.isVisible({ timeout: 4000 }).catch(() => false))) {
    createdLoc = page.getByText(/LSO\s*[—–-]\s*How to Build an Orchestra/i).first();
  }
  if (!(await createdLoc.isVisible({ timeout: 2500 }).catch(() => false))) {
    createdLoc = page.getByText(/How to Build an Orchestra/i).first();
  }
  if (await createdLoc.isVisible({ timeout: 2000 }).catch(() => false)) {
    await createdLoc.scrollIntoViewIfNeeded().catch(() => {});
    await hold(page, 1200);
    await page.evaluate((title) => {
      const nodes = [...document.querySelectorAll('h2,h3,h4,p,span,div,button')];
      const hit =
        nodes.find((n) => (n.textContent || '').includes(title)) ||
        nodes.find((n) => /LSO\s*[—–-]\s*How to Build an Orchestra/i.test(n.textContent || '')) ||
        nodes.find((n) => /How to Build an Orchestra/i.test(n.textContent || ''));
      const card =
        hit?.closest('[class*="card"], [class*="Card"], article, li, section') ||
        hit?.parentElement;
      if (card) {
        card.style.outline = '3px solid #B6FF7E';
        card.style.outlineOffset = '4px';
        card.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }, CREATED_LESSON).catch(() => {});
    await hold(page, 3200);
  }
  await page.mouse.wheel(0, 200);
  await hold(page, 2000);

  // Assign the created lesson (card containing its title) to the term
  await setCaption(page, 'Assign to term', `Place "${CREATED_LESSON}" onto Half-Term Designer`);
  const lessonCard = page
    .locator('[class*="card"], [class*="Card"], article, li, section, div')
    .filter({ hasText: CREATED_LESSON })
    .first();
  let assignBtn = lessonCard
    .locator('button[title*="Assign to Half-Term"], button[title*="Reassign to Different Half-Term"]')
    .first();
  if (!(await assignBtn.isVisible({ timeout: 2500 }).catch(() => false))) {
    assignBtn = page
      .locator('button[title*="Assign to Half-Term"], button[title*="Reassign to Different Half-Term"]')
      .first();
  }
  if (await assignBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await smoothClick(page, assignBtn);
    await hold(page, 1400);
    const termChoice = page.locator('.fixed button').filter({ hasText: /Autumn 1/i }).first();
    if (await termChoice.isVisible({ timeout: 2500 }).catch(() => false)) {
      await smoothClick(page, termChoice);
      await hold(page, 900);
    }
    const confirmAssign = page.getByRole('button', { name: /Assign to Half-Term/i }).last();
    if (await confirmAssign.isVisible({ timeout: 2500 }).catch(() => false)) {
      await smoothClick(page, confirmAssign);
      await hold(page, 2000);
    }
  }

  // ——— TERM OVERVIEW ———
  await setCaption(
    page,
    'Half-Term Designer',
    'Term overview — your Library lesson sitting on Autumn 1',
  );
  await clickTab(page, 'unit-viewer');
  await dismissOverlays(page);
  await hold(page, 2800);
  await page.mouse.wheel(0, 160);
  await hold(page, 2400);
  // Highlight the created lesson / HTBAO card on the board
  await page.evaluate((title) => {
    const nodes = [...document.querySelectorAll('button, div, span, h3, h4')];
    const hit =
      nodes.find((n) => (n.textContent || '').includes(title)) ||
      nodes.find((n) =>
        /How to Build|Build an Orchestra|LSO|Building the Orchestra|Meet the Families/i.test(
          n.textContent || '',
        ),
      );
    const card = hit?.closest('[class*="card"], [class*="Card"], button, div');
    if (card) {
      card.style.outline = '3px solid #B6FF7E';
      card.style.outlineOffset = '4px';
    }
  }, CREATED_LESSON).catch(() => {});
  await hold(page, 3600);
  await snap(page, FRAMES_DIR, '12-term');
  await dismissOverlays(page);
}

async function chapterLsoPathway(page) {
  // Organisation list first
  await setCaption(page, 'Arts organisations', 'Partner Hubs — start with free resources · LSO');
  await clickTab(page, 'our-partners');
  await hold(page, 2000);
  await page.mouse.wheel(0, 380);
  await hold(page, 1600);

  const musicBtn = page.getByRole('button', { name: /Music hubs/i }).first();
  if (await musicBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    if ((await musicBtn.getAttribute('aria-expanded')) !== 'true') {
      await smoothClick(page, musicBtn);
      await hold(page, 1400);
    }
  }

  await setCaption(page, 'London Symphony Orchestra', 'Open the free LSO Partner Hub');
  await openPartnerHub(page, /London Symphony Orchestra/i, 'lso');
  await snap(page, FRAMES_DIR, '09-lso');

  await chooseAndAddLsoTopic(page);
  await ensureInApp(page);
  await showLsoActivitiesLessonAndTerm(page);

  // Brief ROH after the full LSO arc (do not steal the story)
  await setCaption(page, 'Royal Ballet and Opera', 'Another free hub — same Add pathway');
  await ensureInApp(page);
  await openPartnerHub(page, /Royal Ballet and Opera/i, 'roh');
  await snap(page, FRAMES_DIR, '09-roh');
  await hold(page, 2800);
  const rohAdd = page.getByRole('button', { name: /Add unit to CCDesigner|Add to CCDesigner/i }).first();
  if (await rohAdd.isVisible({ timeout: 2000 }).catch(() => false)) {
    await hold(page, 1200);
  }
  await ensureInApp(page);
}

async function fillRichEditors(page, introText, activityText) {
  const editors = page.locator('.ProseMirror, [contenteditable="true"]');
  const count = await editors.count();
  if (count >= 1) {
    await smoothClick(page, editors.nth(0));
    await page.keyboard.type(introText, { delay: 16 });
    await hold(page, 350);
  }
  if (count >= 2) {
    await smoothClick(page, editors.nth(1));
    await page.keyboard.type(activityText, { delay: 16 });
    await hold(page, 350);
  }
}

async function createFullActivity(page) {
  await setCaption(
    page,
    'Create an activity — KS2 example',
    'Every field populated, including live resource links',
  );
  await ensureInApp(page);
  await selectYearGroup(page, /Year 6 Music|Year 5 Music/i);
  await clickTab(page, 'activity-library');
  await dismissIfVisible(page, WELCOME_DISMISS);
  await dismissOverlays(page);
  await hold(page, 1200);

  const createBtn = page.getByRole('button', { name: /Create Activity/i }).first();
  if (!(await createBtn.isVisible({ timeout: 4000 }).catch(() => false))) {
    console.warn('Create Activity button not visible — skipping create chapter');
    return false;
  }
  await smoothClick(page, createBtn);
  await hold(page, 1400);

  let nameInput = page.getByPlaceholder(/Enter activity name/i).first();
  if (!(await nameInput.isVisible({ timeout: 5000 }).catch(() => false))) {
    // Retry open once
    await smoothClick(page, createBtn).catch(() => {});
    await hold(page, 1500);
    nameInput = page.getByPlaceholder(/Enter activity name/i).first();
  }
  if (!(await nameInput.isVisible({ timeout: 4000 }).catch(() => false))) {
    console.warn('Activity creator form did not open — skipping create chapter');
    return false;
  }

  await typeSlow(page, nameInput, 'KS2 Orchestra listening circle', {
    delay: 34,
  });

  const cat = page.getByPlaceholder(/Select a category/i).or(
    page.locator('button:has-text("Select a category")').first(),
  );
  if (await cat.first().isVisible({ timeout: 1200 }).catch(() => false)) {
    await smoothClick(page, cat.first());
    await hold(page, 450);
    const option = page
      .locator('[role="option"], [role="menuitem"], button, li, div')
      .filter({ hasText: /Listening|Music|Welcome|Rhythm|General/i })
      .first();
    if (await option.isVisible({ timeout: 1200 }).catch(() => false)) {
      await smoothClick(page, option);
    } else await page.keyboard.press('Escape');
  }

  const yg = page.locator('label').filter({ hasText: /Year 6|Year 5|KS2/i }).first();
  if (await yg.isVisible({ timeout: 1200 }).catch(() => false)) await smoothClick(page, yg);
  else {
    const any = page.locator('label:has(input[type="checkbox"])').first();
    if (await any.isVisible({ timeout: 600 }).catch(() => false)) await smoothClick(page, any);
  }

  const duration = page.getByPlaceholder(/Enter duration in minutes/i);
  if (await duration.isVisible({ timeout: 800 }).catch(() => false)) {
    await typeSlow(page, duration, '20', { delay: 50 });
  }

  const topic = page.getByPlaceholder(/Type a topic then click/i);
  if (await topic.isVisible({ timeout: 800 }).catch(() => false)) {
    await typeSlow(page, topic, 'Instrument families', { delay: 28 });
    const addTopic = page.locator('button[title="Add topic"]').first();
    if (await addTopic.isVisible({ timeout: 600 }).catch(() => false)) await smoothClick(page, addTopic);
    else await page.keyboard.press('Enter');
  }

  const formScroll = page.locator('form').first();
  if (await formScroll.isVisible({ timeout: 500 }).catch(() => false)) {
    await formScroll.evaluate((el) => { el.scrollTop = 300; }).catch(() => {});
  }
  await hold(page, 400);

  await fillRichEditors(
    page,
    'KS2 context: pupils prepare to meet the orchestra through short listening clips. Link to LSO Discovery where useful.',
    '1) Play extract. 2) Describe timbre and mood. 3) Sort families. 4) Partner share. Extension: KS3 compare two excerpts.',
  );

  const imageUrl = page.getByPlaceholder(/Or paste image URL/i);
  if (await imageUrl.isVisible({ timeout: 800 }).catch(() => false)) {
    await typeSlow(page, imageUrl, 'https://www.lso.co.uk/wp-content/themes/lso/images/logo.svg', {
      delay: 10,
    });
  }

  if (await formScroll.isVisible({ timeout: 400 }).catch(() => false)) {
    await formScroll.evaluate((el) => { el.scrollTop = el.scrollHeight; }).catch(() => {});
  } else await page.mouse.wheel(0, 900);
  await hold(page, 700);
  await setCaption(page, 'Live resource links', 'Video · music · backing · resource · additional URL');

  for (const [ph, val] of [
    [/Video URL/i, 'https://www.youtube.com/watch?v=ccd-demo-lso'],
    [/Music URL/i, 'https://www.lso.co.uk/learn-and-discover/'],
    [/Backing Track URL/i, 'https://example.org/demo/ks2-backing.mp3'],
    [/Resource URL/i, 'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/'],
  ]) {
    const input = page.getByPlaceholder(ph).first();
    if (await input.isVisible({ timeout: 700 }).catch(() => false)) {
      await typeSlow(page, input, val, { delay: 8 });
      await hold(page, 220);
    }
  }
  for (const name of ['videoLink', 'musicLink', 'backingLink', 'resourceLink', 'link']) {
    const input = page.locator(`input[name="${name}"]`).first();
    if (await input.isVisible({ timeout: 350 }).catch(() => false)) {
      const cur = await input.inputValue().catch(() => '');
      if (!cur) await typeSlow(page, input, `https://example.org/ccd-demo/${name}`, { delay: 6 });
    }
  }

  await hold(page, 800);
  await snap(page, FRAMES_DIR, '15-activity');
  const save = page.getByRole('button', { name: /^Create Activity$/i }).last();
  if (await save.isVisible({ timeout: 1200 }).catch(() => false)) {
    await smoothClick(page, save);
    await hold(page, 1600);
  }
  await dismissOverlays(page);
  return true;
}

async function buildFullLesson(page) {
  const CREATED_LESSON = 'KS3 — Film & stage crossover';
  await setCaption(page, 'Build a lesson — KS3 flavour', 'Title, notes, select activities, save');
  await selectYearGroup(page, /Year 9 Music|Year 9 Drama|KS3/i).catch(() => {});
  await clickTab(page, 'lesson-builder');
  await hold(page, 1400);

  const lessonName = page.getByPlaceholder(/Lesson Name|Lesson Title/i).first();
  if (await lessonName.isVisible({ timeout: 2200 }).catch(() => false)) {
    await typeSlow(page, lessonName, CREATED_LESSON, { delay: 32 });
  }

  const notes = page.getByPlaceholder(/Add notes, instructions/i).first();
  if (await notes.isVisible({ timeout: 1200 }).catch(() => false)) {
    await typeSlow(
      page,
      notes,
      'EYFS warm-up option optional. KS2 listening starter, then KS3 analysis. Use partner hub links where available.',
      { delay: 14 },
    );
  }

  const header = page.locator('.border.border-gray-200 button').filter({ hasText: /activit/i }).first();
  if (await header.isVisible({ timeout: 1800 }).catch(() => false)) {
    await smoothClick(page, header);
    await hold(page, 700);
  }

  const checks = page.locator('input[type="checkbox"]');
  const n = Math.min(await checks.count(), 3);
  for (let i = 0; i < n; i++) {
    if (await checks.nth(i).isVisible({ timeout: 400 }).catch(() => false)) {
      await smoothClick(page, checks.nth(i));
      await hold(page, 300);
    }
  }
  if (n === 0) {
    const selectable = page.getByRole('checkbox');
    const m = Math.min(await selectable.count(), 3);
    for (let i = 0; i < m; i++) {
      await smoothClick(page, selectable.nth(i));
      await hold(page, 300);
    }
  }

  const addSelected = page.getByRole('button', { name: /Add \d+ Selected/i }).first();
  if (await addSelected.isVisible({ timeout: 2000 }).catch(() => false)) {
    await smoothClick(page, addSelected);
    await hold(page, 1400);
  }

  await page.mouse.wheel(0, 240);
  await hold(page, 900);
  await snap(page, FRAMES_DIR, '15-create');

  const saveLesson = page.getByRole('button', { name: /Save Lesson/i }).first();
  if (await saveLesson.isVisible({ timeout: 1200 }).catch(() => false)) {
    await smoothClick(page, saveLesson);
    await hold(page, 1500);
  }
  await dismissOverlays(page);

  // Show Lesson Library populated with the lesson just created
  await setCaption(page, 'Lesson Library', `Saved lesson appears here — "${CREATED_LESSON}"`);
  await clickTab(page, 'lesson-library');
  await dismissOverlays(page);
  await hold(page, 1800);
  const created = page.getByText(CREATED_LESSON, { exact: false }).first();
  if (await created.isVisible({ timeout: 3000 }).catch(() => false)) {
    await created.scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate((title) => {
      const nodes = [...document.querySelectorAll('h2,h3,h4,p,span,div')];
      const hit = nodes.find((n) => (n.textContent || '').includes(title));
      const card = hit?.closest('[class*="card"], [class*="Card"], article, li, section') || hit?.parentElement;
      if (card) {
        card.style.outline = '3px solid #B6FF7E';
        card.style.outlineOffset = '4px';
      }
    }, CREATED_LESSON).catch(() => {});
    await hold(page, 2400);
  }
  await dismissOverlays(page);
}

async function showSettings(page) {
  await setCaption(page, 'Settings', 'Key-stage folders — customise year groups for your school');
  const settingsBtn = page.locator('[data-walkthrough="settings"]').first();
  if (await settingsBtn.isVisible({ timeout: 1800 }).catch(() => false)) {
    await smoothClick(page, settingsBtn);
  } else {
    await smoothClick(page, page.getByRole('button', { name: /Settings/i }).first());
  }
  await hold(page, 1200);
  const ygTab = page.getByRole('button', { name: /Year Groups/i }).first();
  if (await ygTab.isVisible({ timeout: 1800 }).catch(() => false)) {
    await smoothClick(page, ygTab);
    await hold(page, 2200);
  }
  await page.mouse.wheel(0, 180);
  await hold(page, 1000);
  await snap(page, FRAMES_DIR, '14-settings');
  await page.keyboard.press('Escape');
  await dismissOverlays(page);
}

async function chapterKeyDates(page) {
  await dismissOverlays(page);
  await selectYearGroup(page, /Year 6 Music|Year 5 Music|Year 4 Music|Year 2|KS2/i);
  await dismissOverlays(page);
  await setCaption(
    page,
    'Populate with key dates from',
    'Partner dropdown · tick KS1 & KS2 · Important dates',
  );
  await clickTab(page, 'calendar');
  await dismissOverlays(page);
  await hold(page, 1000);

  let keyDatesSelect = page.locator('[data-ccd-key-dates-select]').first();
  if (!(await keyDatesSelect.isVisible({ timeout: 3000 }).catch(() => false))) {
    await clickTab(page, 'calendar');
    await dismissOverlays(page);
    keyDatesSelect = page.locator('[data-ccd-key-dates-select]').first();
  }
  await keyDatesSelect.waitFor({ state: 'visible', timeout: 12000 });

  const monthBtn = page.getByRole('button', { name: /^Month$/i }).first();
  if (await monthBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await monthBtn.click({ force: true });
    await hold(page, 800);
  }

  const populateRow = page.locator('[data-ccd-key-dates-populate]').first();
  if (await populateRow.isVisible({ timeout: 2500 }).catch(() => false)) {
    await populateRow.scrollIntoViewIfNeeded().catch(() => {});
    await hold(page, 900);
  }

  await setCaption(page, 'LSO key dates', 'KS1 & KS2 examples across the year');
  await keyDatesSelect.selectOption({ value: 'lso' });
  await page.evaluate(() => {
    const el = document.querySelector('[data-ccd-key-dates-select]');
    if (!el) return;
    el.value = 'lso';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await hold(page, 1200);

  const modal = page.locator('[data-ccd-key-dates-modal]').first();
  await modal.waitFor({ state: 'visible', timeout: 8000 });
  if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
    const scrollArea = modal.locator('.overflow-y-auto').first();
    if (await scrollArea.isVisible({ timeout: 800 }).catch(() => false)) {
      await scrollArea.evaluate((el) => { el.scrollTop = 80; }).catch(() => {});
      await hold(page, 1100);
      await scrollArea.evaluate((el) => { el.scrollTop = 220; }).catch(() => {});
      await hold(page, 1100);
    }
    const ksRows = modal.locator('[data-ccd-key-date-row]');
    const rowCount = Math.min(await ksRows.count(), 3);
    for (let i = 0; i < rowCount; i++) {
      const row = ksRows.nth(i);
      if (await row.isVisible({ timeout: 400 }).catch(() => false)) {
        await row.click({ force: true });
        await hold(page, 350);
        await row.click({ force: true });
        await hold(page, 400);
      }
    }
    await hold(page, 900);

    const confirmKeyDates = page.locator('[data-ccd-key-dates-confirm]').first();
    await confirmKeyDates.click({ force: true });
    await hold(page, 1400);
    await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  const confirmPopup = page.locator('[data-ccd-important-dates-confirm]').first();
  await confirmPopup.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
  if (await confirmPopup.isVisible({ timeout: 800 }).catch(() => false)) {
    await setCaption(page, 'Suggested selections', 'Confirm list → Important dates in the app');
    await hold(page, 2200);
    await snap(page, FRAMES_DIR, '13-confirm-popup');
    await hold(page, 800);
    const donePopup = page.locator('[data-ccd-important-dates-confirm-done]').first();
    if (await donePopup.isVisible({ timeout: 2000 }).catch(() => false)) {
      await donePopup.click({ force: true });
      await hold(page, 1000);
    }
  }

  await setCaption(page, 'Important dates', 'Starred on the calendar · remind to go');
  const panel = page.locator('[data-ccd-important-dates-panel]').first();
  if (await panel.isVisible({ timeout: 2000 }).catch(() => false)) {
    await panel.scrollIntoViewIfNeeded().catch(() => {});
    await hold(page, 1800);
  }

  for (let i = 0; i < 3; i++) {
    const next = page.locator('button[aria-label="Next period"]').first();
    if (await next.isVisible({ timeout: 800 }).catch(() => false)) {
      await next.click({ force: true });
      await hold(page, 1100);
    }
  }
  const starred = page.locator('[data-ccd-calendar-key-date="1"]').first();
  if (await starred.isVisible({ timeout: 1500 }).catch(() => false)) {
    await starred.scrollIntoViewIfNeeded().catch(() => {});
    await hold(page, 1600);
  }
  await snap(page, FRAMES_DIR, '13-key-dates');
  await dismissOverlays(page);
}

async function chapterCalendarWeek(page) {
  await dismissOverlays(page);
  await setCaption(page, 'Calendar week', 'Week view · add an event · school timetable');
  await clickTab(page, 'calendar');
  await dismissOverlays(page);
  await hold(page, 900);

  const weekBtn = page.getByRole('button', { name: /^Week$/i }).first();
  if (await weekBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await weekBtn.click({ force: true });
    await hold(page, 1800);
  }

  const addEvent = page
    .getByRole('button', { name: /Add (event|Event)|New event|Create event/i })
    .first();
  if (await addEvent.isVisible({ timeout: 1500 }).catch(() => false)) {
    await setCaption(page, 'Add event', 'Drop a school or arts event onto the week');
    await smoothClick(page, addEvent);
    await hold(page, 1200);
    const titleInput = page
      .getByPlaceholder(/Title|Event name|Event title/i)
      .or(page.locator('input[name="title"], input[name="name"]').first())
      .first();
    if (await titleInput.isVisible({ timeout: 1500 }).catch(() => false)) {
      await typeSlow(page, titleInput, 'LSO Discovery visit', { delay: 28 });
      await hold(page, 600);
      const saveEvent = page.getByRole('button', { name: /Save|Add Event|Create|Confirm/i }).last();
      if (await saveEvent.isVisible({ timeout: 1200 }).catch(() => false)) {
        await smoothClick(page, saveEvent);
        await hold(page, 1200);
      } else {
        await page.keyboard.press('Escape').catch(() => {});
      }
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
  }

  const weekLessons = page.getByRole('button', { name: /Week Lessons|Timetable/i }).first();
  if (await weekLessons.isVisible({ timeout: 1200 }).catch(() => false)) {
    await setCaption(page, 'Timetable', 'School week lessons sitting alongside events');
    await weekLessons.click({ force: true });
    await hold(page, 2000);
  }

  await snap(page, FRAMES_DIR, '16-calendar');
  await dismissOverlays(page);
}

async function chapterPaid(page) {
  await setCaption(
    page,
    'Paid partners',
    'CCDesigner only takes a cut of 10–20% of paid resources',
  );

  // We Teach Drama
  await page.goto(`${BASE_URL}/weteachdrama`, { waitUntil: 'domcontentloaded' });
  await hold(page, 2000);
  await ensureCursor(page);
  await page.mouse.wheel(0, 300);
  await hold(page, 1000);
  const basket = page.getByRole('button', { name: /Add to basket/i }).first();
  if (await basket.isVisible({ timeout: 3000 }).catch(() => false)) {
    await smoothClick(page, basket);
    await hold(page, 1400);
  }
  await snap(page, FRAMES_DIR, '17-wtd');

  // iCompose
  await setCaption(page, 'iCompose', 'Paid courses available to purchase — 10–20% platform cut');
  await page.goto(`${BASE_URL}/icompose`, { waitUntil: 'domcontentloaded' });
  await hold(page, 2000);
  await ensureCursor(page);
  await page.mouse.wheel(0, 320);
  await hold(page, 1200);
  const iccBasket = page.getByRole('button', { name: /Add to basket/i }).first();
  if (await iccBasket.isVisible({ timeout: 2500 }).catch(() => false)) {
    await smoothClick(page, iccBasket);
    await hold(page, 1400);
  }
  const addFree = page.getByRole('button', { name: /Add unit to CCDesigner|Add to CCDesigner/i }).first();
  if (await addFree.isVisible({ timeout: 1500 }).catch(() => false)) {
    await hold(page, 800);
  }
  await snap(page, FRAMES_DIR, '17-paid');
  await hold(page, 1000);
}

function ffmpegBin() {
  const ff = path.join(__dirname, 'node_modules/ffmpeg-static/ffmpeg');
  return fs.existsSync(ff) ? ff : 'ffmpeg';
}

function probeDurationSeconds(mediaPath) {
  const r = spawnSync(ffmpegBin(), ['-i', mediaPath], { encoding: 'utf8' });
  const m = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(r.stderr || '');
  if (!m) return null;
  return +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]);
}

function resolveDemoMusicPath() {
  const candidates = [
    process.env.CCD_DEMO_MUSIC,
    path.join(OUT_DIR, 'audio/autumn-leaves-piano-improv.mp3'),
    '/Users/rfreich-storer/Music/4K YouTube to MP3/Autumn Leaves Piano Improv.mp3',
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || null;
}

/**
 * Encode webm → mp4 with tasteful looping piano underscore.
 * Volume ~20%; fade in/out at timeline ends only. Loop via PCM WAV — never
 * -stream_loop an MP3 (encoder delay/padding desyncs after the first pass).
 */
function encodeMp4(webmPath, outMp4) {
  const bin = ffmpegBin();
  const audioPath = resolveDemoMusicPath();
  const videoArgs = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];

  if (!audioPath) {
    console.warn('No demo music found — encoding silent MP4');
    const r = spawnSync(bin, ['-y', '-i', webmPath, ...videoArgs, '-an', outMp4], { encoding: 'utf8' });
    return r.status === 0 && fs.existsSync(outMp4) ? outMp4 : null;
  }

  const dur = probeDurationSeconds(webmPath) || 0;
  const fadeIn = Math.min(2, Math.max(1, dur * 0.03));
  const fadeOut = Math.min(2, Math.max(1, dur * 0.03));
  const fadeOutStart = Math.max(0, dur - fadeOut);
  const filter = `[1:a]volume=0.20,atrim=0:${dur.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${fadeIn.toFixed(2)},afade=t=out:st=${fadeOutStart.toFixed(2)}:d=${fadeOut.toFixed(2)}[aout]`;

  const tmpWav = path.join(os.tmpdir(), `ccd-demo-music-${process.pid}.wav`);
  const decode = spawnSync(bin, ['-y', '-i', audioPath, '-map', '0:a:0', '-c:a', 'pcm_s16le', tmpWav], {
    encoding: 'utf8',
  });
  if (decode.status !== 0 || !fs.existsSync(tmpWav)) {
    console.warn('Music decode failed — falling back to silent encode', decode.stderr?.slice(-400));
    const fallback = spawnSync(bin, ['-y', '-i', webmPath, ...videoArgs, '-an', outMp4], { encoding: 'utf8' });
    return fallback.status === 0 && fs.existsSync(outMp4) ? outMp4 : null;
  }

  console.log(`Muxing background music: ${audioPath} (PCM loop to ${dur.toFixed(1)}s, vol=0.20)`);
  const r = spawnSync(
    bin,
    [
      '-y',
      '-i',
      webmPath,
      '-stream_loop',
      '-1',
      '-i',
      tmpWav,
      '-filter_complex',
      filter,
      '-map',
      '0:v:0',
      '-map',
      '[aout]',
      ...videoArgs,
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-shortest',
      outMp4,
    ],
    { encoding: 'utf8' },
  );
  fs.rmSync(tmpWav, { force: true });
  if (r.status !== 0) {
    console.warn('Music mux failed — falling back to silent encode', r.stderr?.slice(-400));
    const fallback = spawnSync(bin, ['-y', '-i', webmPath, ...videoArgs, '-an', outMp4], { encoding: 'utf8' });
    return fallback.status === 0 && fs.existsSync(outMp4) ? outMp4 : null;
  }
  return fs.existsSync(outMp4) ? outMp4 : null;
}

async function main() {
  ensureDirs();
  console.log(`Recording ${BASE_URL} @ ${VIEWPORT.width}x${VIEWPORT.height}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir: VIDEO_DIR, size: VIEWPORT },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(24000);

  await page.addInitScript(({ gateKey }) => {
    try {
      sessionStorage.setItem(gateKey, '1');
      sessionStorage.setItem('ccd-prototype-welcome-seen', '1');
      sessionStorage.setItem('ccd-partners-funding-video-seen', '1');
      sessionStorage.setItem('ccd-activity-library-welcome-seen', '1');
    } catch { /* ignore */ }
  }, { gateKey: GATE_KEY });

  console.log('01 logo');
  await recordSlide(page, logoIntroHtml(), 3800, '01-logo');

  console.log('02 context pressure');
  await clearCaption(page);
  await recordSlide(page, contextPressureSlideHtml(), 6000, '02-pressure');

  console.log('03 context response');
  await recordSlide(page, contextResponseSlideHtml(), 6000, '03-response');

  console.log('04 disclaimer');
  await recordSlide(page, partnerDisclaimerSlideHtml(), 8000, '04-disclaimer');

  console.log('05 live landing');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await hold(page, 600);
  await dismissIfVisible(page, WELCOME_DISMISS);
  await ensureCursor(page);

  const disclaimerBand = page.locator('[aria-label="Demonstration disclaimer"]').first();
  const disclaimerText = page.getByText(/Organisations shown are examples for demonstration only/i).first();
  if (await disclaimerBand.isVisible({ timeout: 8000 }).catch(() => false)) {
    await disclaimerBand.scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(() => {
      const el = document.querySelector('[aria-label="Demonstration disclaimer"]');
      if (el) {
        el.style.outline = '3px solid #B6FF7E';
        el.style.outlineOffset = '4px';
        el.style.boxShadow = '0 0 0 10px rgba(182,255,126,0.2)';
      }
    }).catch(() => {});
  } else {
    await disclaimerText.waitFor({ state: 'visible', timeout: 12000 });
    await disclaimerText.scrollIntoViewIfNeeded().catch(() => {});
  }
  await setCaption(
    page,
    'Demonstration only',
    'For potential partners and for funding — no endorsement implied',
  );
  await hold(page, 5500);
  await snap(page, FRAMES_DIR, '05-landing');
  await clearCaption(page);

  await page.getByText(/Exceptional lessons start with/i).first().waitFor({ timeout: 10000 }).catch(() => {});
  await page.getByText(/Exceptional lessons start with/i).first().scrollIntoViewIfNeeded().catch(() => {});
  await hold(page, 4000);

  console.log('06 ideas');
  await recordSlide(page, ideasSlideHtml(), 7800, '06-ideas');

  console.log('07 action');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Feature demo',
      title: "Let's see the app in action",
      body: 'Free partner hubs first — then planning tools — then paid resources.',
    }),
    4500,
    '07-action',
  );

  console.log('08 explore → Half-Term');
  await enterPrototypeFast(page);
  await setCaption(page, 'Inside the prototype', 'Half-Term Designer — your planning home');
  await clickTab(page, 'unit-viewer');
  await hold(page, 3200);
  await page.mouse.wheel(0, 180);
  await hold(page, 2200);
  await snap(page, FRAMES_DIR, '08-explore');
  await clearCaption(page);

  // 09–12 LSO arc: Organisation → Activities → Lesson → Term (full pace)
  console.log('09–12 LSO org → activities → lesson → term');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Free resources',
      title: "Let's go to an arts organisation",
      body: 'Start with LSO — choose a topic, add it, then watch it flow into activities, Lesson Builder, Lesson Library, and the term.',
      compactTitle: true,
    }),
    5200,
    '09-lso-slide',
  );
  await ensureInApp(page);
  await chapterLsoPathway(page);

  console.log('13 key dates');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Calendar',
      title: 'Populate with key dates from partners',
      body: 'Pick a partner, tick KS1 and KS2 dates, confirm — they become Important dates.',
      compactTitle: true,
    }),
    4800,
    '13-key-dates-slide',
  );
  await ensureInApp(page);
  await chapterKeyDates(page);

  console.log('14 settings');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Your library',
      title: 'Customisable to your key stage',
      body: 'Manage year-group folders in Settings so the library matches your school.',
      compactTitle: true,
    }),
    4200,
    '14-settings-slide',
  );
  await ensureInApp(page);
  await showSettings(page);

  console.log('15 create');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Build your own',
      title: 'Create activities and lessons',
      body: 'Populate every field — including live resource links — for EYFS to A-level.',
      compactTitle: true,
    }),
    4200,
    '15-create-slide',
  );
  await ensureInApp(page);
  try {
    const created = await createFullActivity(page);
    if (created !== false) await buildFullLesson(page);
  } catch (err) {
    console.warn('Create/lesson chapter failed — continuing', err?.message || err);
    await dismissOverlays(page);
  }

  console.log('16 calendar week');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Planning',
      title: 'Week view, events and timetable',
      body: 'See the school week, add events, and keep lessons on the timetable.',
      compactTitle: true,
    }),
    4200,
    '16-calendar-slide',
  );
  await ensureInApp(page);
  await chapterCalendarWeek(page);

  console.log('17 paid');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Paid partners',
      title: "What's available to purchase",
      body: 'We Teach Drama and iCompose. CCDesigner only takes a cut of 10–20% of paid resources.',
      compactTitle: true,
    }),
    5200,
    '17-paid-slide',
  );
  await chapterPaid(page);

  console.log('18 org advert');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'For organisations',
      title: 'Your own hub. Your free resources.',
      body: 'Each organisation gets a hub with an admin backend to create template pages and share free resources.',
      compactTitle: true,
    }),
    5200,
    '18-orgs',
  );

  console.log('19 close');
  await clearCaption(page);
  await recordSlide(page, closingSlideHtml(), 6400, '19-close');

  // Close context first so Playwright finalizes the webm on disk.
  let videoPath = null;
  try {
    videoPath = await page.video()?.path();
  } catch {
    videoPath = null;
  }
  await context.close();
  await browser.close();

  if (!videoPath || !fs.existsSync(videoPath)) {
    const candidates = fs
      .readdirSync(VIDEO_DIR)
      .filter((f) => f.endsWith('.webm'))
      .map((f) => path.join(VIDEO_DIR, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    videoPath = candidates[0] || null;
  }
  if (!videoPath || !fs.existsSync(videoPath)) throw new Error('No video produced');

  const finalWebm = path.join(OUT_DIR, 'ccdesigner-feature-demo.webm');
  fs.copyFileSync(videoPath, finalWebm);
  const outMp4 = path.join(OUT_DIR, 'ccdesigner-feature-demo.mp4');
  const mp4Path = encodeMp4(finalWebm, outMp4);

  let durationSeconds = null;
  const probe = spawnSync(path.join(__dirname, 'node_modules/ffmpeg-static/ffmpeg'), ['-i', mp4Path || finalWebm], {
    encoding: 'utf8',
  });
  const m = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(probe.stderr || '');
  if (m) {
    durationSeconds = Math.round(+m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]));
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(
      {
        title: 'CCDesigner — Feature demo for external organisations',
        generatedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        canvas: VIEWPORT,
        palette: {
          bgDeep: '#05231e',
          bgForest: '#002D24',
          text: '#FFFFFF',
          textBody: '#F2F7F4',
          accent: '#B6FF7E',
        },
        contacts: {
          email: 'rob@rhythmstix.co.uk',
          web: 'https://www.ccdesigner.co.uk',
        },
        businessNote: 'CCDesigner only takes a cut of 10–20% of paid resources.',
        disclaimer:
          'Partners and logos are shown for demonstration only and do not imply endorsement.',
        music: {
          file: 'audio/autumn-leaves-piano-improv.mp3',
          title: 'Autumn Leaves Piano Improv',
          volume: 0.2,
          note: 'User-supplied underscore — clear rights/licence before public distribution.',
        },
        chapters: CHAPTERS,
        video: { webm: 'ccdesigner-feature-demo.webm', mp4: mp4Path ? 'ccdesigner-feature-demo.mp4' : null },
        frames: CHAPTERS.map((c) => `frames/${c.id}.png`),
        durationSeconds,
      },
      null,
      2,
    ),
  );

  console.log('Wrote', finalWebm);
  if (mp4Path) console.log('Wrote', mp4Path);
  if (durationSeconds) console.log(`Duration ~${durationSeconds}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
