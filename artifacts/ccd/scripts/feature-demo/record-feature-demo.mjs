/**
 * CCDesigner feature demo recorder — 1920×1080 fixed canvas.
 *
 * Story: context → logo/action → free hubs (LSO, ROH) → create activity/lesson
 * (EYFS/KS2/KS3) → settings → calendar → paid (WTD, iCompose, 10–20% cut) →
 * org advert → closing with contact URLs (not "thank you").
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  VIEWPORT,
  GATE_KEY,
  DEMO_MODE_KEY,
  HERO_IMAGE_URL,
  hold,
  dismissIfVisible,
  ensureCursor,
  setCaption,
  clearCaption,
  logoIntroHtml,
  partnerDisclaimerSlideHtml,
  slideHtml,
  contextSlideHtml,
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
  { id: '01-logo', title: 'CCDesigner', caption: 'Forest & lime brand intro' },
  { id: '02-disclaimer', title: 'Demonstration only', caption: 'For potential partners & funding — no endorsement implied' },
  { id: '03-landing', title: 'Exceptional lessons start with connection', caption: 'Real CCDesigner first page + live disclaimer' },
  { id: '04-context', title: 'Arts organisations together', caption: 'One place for planning' },
  { id: '05-action', title: "Let's see the app in action", caption: 'Explore the working prototype' },
  { id: '06-free-hubs', title: 'Free partner resources', caption: 'LSO · ROH → libraries → term → calendar' },
  { id: '09-calendar', title: 'Populate with key dates from', caption: 'Partner dropdown · KS1/KS2 · Important dates' },
  { id: '07-create', title: 'Create activity & lesson', caption: 'EYFS / KS2 / KS3 — every field + live links' },
  { id: '08-settings', title: 'Customisable to key stage', caption: 'Settings → Year Groups' },
  { id: '10-paid', title: 'Paid partners', caption: 'We Teach Drama & iCompose — CCDesigner takes 10–20%' },
  { id: '11-orgs', title: 'Your organisation hub', caption: 'Admin backend + template pages for free resources' },
  { id: '12-close', title: 'Get in touch', caption: 'rob@rhythmstix.co.uk · www.ccdesigner.co.uk' },
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
  await hold(page, 1000);
  await page.mouse.wheel(0, 420);
  await hold(page, 700);
  const btn = page.getByRole('button', { name: nameRe }).first();
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await smoothClick(page, btn);
  } else {
    await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForURL(new RegExp(`/${slug}`), { timeout: 15000 }).catch(() => {});
  await hold(page, 2000);
  await ensureCursor(page);
}

async function addFromHub(page) {
  await page.mouse.wheel(0, 280);
  await hold(page, 900);
  const add = page.getByRole('button', { name: /Add unit to CCDesigner|Add to CCDesigner/i }).first();
  if (await add.isVisible({ timeout: 3500 }).catch(() => false)) {
    await smoothClick(page, add);
    await page.waitForURL((url) => !/\/(lso|roh|weteachdrama|icompose)/.test(url.pathname), {
      timeout: 20000,
    }).catch(() => {});
    await page.waitForSelector('[data-tab]', { timeout: 30000 }).catch(() => {});
    await ensureCursor(page);
    await dismissIfVisible(page, WELCOME_DISMISS);
    await hold(page, 1500);
    return true;
  }
  return false;
}

/** After hub Add: Activity Library → Lesson Library → Half-Term → Calendar peek. */
async function showHubContentThroughTermAndCalendar(page) {
  await setCaption(
    page,
    'Partner content in your libraries',
    'Activity sections → Lesson Library → Half-Term Designer → Calendar',
  );
  await dismissOverlays(page);
  await selectYearGroup(page, /Year 6 Music|Year 5 Music|Year 4 Music|KS2/i).catch(() => {});
  await dismissOverlays(page);

  // Activity Library sections populated
  await clickTab(page, 'activity-library');
  await dismissOverlays(page);
  await dismissIfVisible(page, WELCOME_DISMISS);
  await hold(page, 1600);
  await page.mouse.wheel(0, 320);
  await hold(page, 1400);
  await snap(page, FRAMES_DIR, '06-activity-from-hub');

  // Lesson Library populated
  await setCaption(page, 'Lesson Library', 'Partner hub lessons ready to plan');
  await clickTab(page, 'lesson-library');
  await dismissOverlays(page);
  await dismissIfVisible(page, WELCOME_DISMISS);
  await hold(page, 1600);
  await page.mouse.wheel(0, 240);
  await hold(page, 1200);
  await snap(page, FRAMES_DIR, '06-lesson-from-hub');

  // Assign to term (Half-Term Designer)
  await setCaption(page, 'Add to term', 'Assign a partner lesson into Half-Term Designer');
  const assignBtn = page
    .locator('button[title*="Assign to Half-Term"], button[title*="Reassign to Different Half-Term"]')
    .first();
  if (await assignBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await smoothClick(page, assignBtn);
    await hold(page, 900);
    const termChoice = page
      .locator('.fixed button')
      .filter({ hasText: /Autumn 1/i })
      .first();
    if (await termChoice.isVisible({ timeout: 2000 }).catch(() => false)) {
      await smoothClick(page, termChoice);
      await hold(page, 600);
    }
    const confirmAssign = page
      .getByRole('button', { name: /Assign to Half-Term/i })
      .last();
    if (await confirmAssign.isVisible({ timeout: 2000 }).catch(() => false)) {
      await smoothClick(page, confirmAssign);
      await hold(page, 1400);
    }
  }

  // Half-Term Designer shows the term
  await setCaption(page, 'Half-Term Designer', 'Partner lesson sitting in the term plan');
  await clickTab(page, 'unit-viewer');
  await hold(page, 1800);
  await page.mouse.wheel(0, 200);
  await hold(page, 1200);
  await snap(page, FRAMES_DIR, '06-term-from-hub');

  // Brief calendar land (key dates chapter expands this)
  await setCaption(page, 'Onto the calendar', 'Next — populate partner key dates');
  await clickTab(page, 'calendar');
  await hold(page, 1600);
  await snap(page, FRAMES_DIR, '06-calendar-peek');
}

async function chapterFreeHubs(page) {
  await setCaption(page, 'Free partner resources', 'LSO, Royal Ballet and Opera, music hubs & major arts orgs');
  await clickTab(page, 'our-partners');
  await hold(page, 1400);

  // Expand music hubs
  const musicBtn = page.getByRole('button', { name: /Music hubs/i }).first();
  if (await musicBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
    if ((await musicBtn.getAttribute('aria-expanded')) !== 'true') {
      await smoothClick(page, musicBtn);
      await hold(page, 1200);
    }
  }
  await page.mouse.wheel(0, 380);
  await hold(page, 1200);

  // LSO
  await setCaption(page, 'LSO Partner Hub', 'How to Build an Orchestra — free Discovery resources');
  await openPartnerHub(page, /London Symphony Orchestra/i, 'lso');
  await snap(page, FRAMES_DIR, '04-lso');
  await addFromHub(page);

  // ROH
  await setCaption(page, 'Royal Ballet and Opera', 'Free classroom resources from ROH');
  await ensureInApp(page);
  await openPartnerHub(page, /Royal Ballet and Opera/i, 'roh');
  await snap(page, FRAMES_DIR, '04-roh');
  await addFromHub(page);

  // Libraries → term → calendar (live path after free hub adds)
  await ensureInApp(page);
  await showHubContentThroughTermAndCalendar(page);

  // Back to hubs overview — free orgs strip
  await ensureInApp(page);
  await clickTab(page, 'our-partners');
  await hold(page, 1000);
  await page.mouse.wheel(0, 500);
  await hold(page, 1400);
  await snap(page, FRAMES_DIR, '06-free-hubs');
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
  await snap(page, FRAMES_DIR, '05-activity');
  const save = page.getByRole('button', { name: /^Create Activity$/i }).last();
  if (await save.isVisible({ timeout: 1200 }).catch(() => false)) {
    await smoothClick(page, save);
    await hold(page, 1600);
  }
  await dismissOverlays(page);
  return true;
}

async function buildFullLesson(page) {
  await setCaption(page, 'Build a lesson — KS3 flavour', 'Title, notes, select activities, save');
  await selectYearGroup(page, /Year 9 Music|Year 9 Drama|KS3/i).catch(() => {});
  await clickTab(page, 'lesson-builder');
  await hold(page, 1400);

  const lessonName = page.getByPlaceholder(/Lesson Name|Lesson Title/i).first();
  if (await lessonName.isVisible({ timeout: 2200 }).catch(() => false)) {
    await typeSlow(page, lessonName, 'KS3 — Film & stage crossover', { delay: 32 });
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
  await snap(page, FRAMES_DIR, '07-create');

  const saveLesson = page.getByRole('button', { name: /Save Lesson/i }).first();
  if (await saveLesson.isVisible({ timeout: 1200 }).catch(() => false)) {
    await smoothClick(page, saveLesson);
    await hold(page, 1500);
  }
  await dismissOverlays(page);

  // Brief EYFS glance
  await setCaption(page, 'EYFS example', 'Switch year group to show early years content');
  await selectYearGroup(page, /Reception|LKG|EYFS|Lower Kindergarten/i);
  await clickTab(page, 'activity-library');
  await hold(page, 1600);
}

async function showSettings(page) {
  await setCaption(page, 'Settings', 'Customisable year groups across EYFS, KS2 and KS3');
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
    await hold(page, 2000);
  }
  await page.mouse.wheel(0, 180);
  await hold(page, 1000);
  await snap(page, FRAMES_DIR, '08-settings');
  await page.keyboard.press('Escape');
  await dismissOverlays(page);
}

async function chapterCalendar(page) {
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

  // Hard-wait for key-dates UI — retry tab if needed
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

  // LSO — KS1 & KS2 examples across months
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
    await snap(page, FRAMES_DIR, '09-confirm-popup');
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
  await snap(page, FRAMES_DIR, '09-key-dates');

  // Optional second partner (ROH)
  await setCaption(page, 'More partners', 'Populate key dates from ROH too');
  if (await populateRow.isVisible({ timeout: 800 }).catch(() => false)) {
    await populateRow.scrollIntoViewIfNeeded().catch(() => {});
  }
  if (await keyDatesSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await keyDatesSelect.selectOption({ value: 'roh' }).catch(() => {});
    await page.evaluate(() => {
      const el = document.querySelector('[data-ccd-key-dates-select]');
      if (el) {
        el.value = 'roh';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }).catch(() => {});
    await hold(page, 900);
    const modal2 = page.locator('[data-ccd-key-dates-modal]').first();
    if (await modal2.isVisible({ timeout: 2500 }).catch(() => false)) {
      await hold(page, 1200);
      const confirm2 = page.locator('[data-ccd-key-dates-confirm]').first();
      if (await confirm2.isVisible({ timeout: 1500 }).catch(() => false)) {
        await confirm2.click({ force: true });
        await hold(page, 1000);
      }
      const done2 = page.locator('[data-ccd-important-dates-confirm-done]').first();
      if (await done2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await hold(page, 1600);
        await done2.click({ force: true });
        await hold(page, 800);
      }
    }
  }

  const weekBtn = page.getByRole('button', { name: /^Week$/i }).first();
  if (await weekBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await weekBtn.click({ force: true });
    await hold(page, 1600);
  }

  await snap(page, FRAMES_DIR, '09-calendar');
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
  await snap(page, FRAMES_DIR, '08-wtd');

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
    // show free seed option exists too, but don't redirect if paid focus
    await hold(page, 800);
  }
  await snap(page, FRAMES_DIR, '10-paid');
  await hold(page, 1000);
}

function encodeMp4(webmPath, outMp4) {
  const ff = path.join(__dirname, 'node_modules/ffmpeg-static/ffmpeg');
  const bin = fs.existsSync(ff) ? ff : 'ffmpeg';
  const r = spawnSync(
    bin,
    ['-y', '-i', webmPath, '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', outMp4],
    { encoding: 'utf8' },
  );
  return r.status === 0 && fs.existsSync(outMp4) ? outMp4 : null;
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
      // Unlock gate only — do NOT activate demo mode yet so the real login landing shows
      sessionStorage.setItem(gateKey, '1');
      sessionStorage.setItem('ccd-prototype-welcome-seen', '1');
      sessionStorage.setItem('ccd-partners-funding-video-seen', '1');
      sessionStorage.setItem('ccd-activity-library-welcome-seen', '1');
    } catch { /* ignore */ }
  }, { gateKey: GATE_KEY });

  // 01 Short logo mark
  console.log('01 logo');
  await recordSlide(page, logoIntroHtml(), 3200, '01-logo');

  // 02 Partner/funding disclaimer — large readable type (exact copy)
  console.log('02 disclaimer');
  await clearCaption(page);
  await recordSlide(page, partnerDisclaimerSlideHtml(), 7200, '02-disclaimer');

  // 03 REAL first page — disclaimer band at top, then hero
  console.log('03 live landing + disclaimer');
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
  // Hold so the live first-page disclaimer is clearly readable on camera
  await hold(page, 6500);
  await snap(page, FRAMES_DIR, '03-landing');
  await clearCaption(page);

  // Brief hero hold (connection + lightning) after disclaimer beat
  await page.getByText(/Exceptional lessons start with/i).first().waitFor({ timeout: 10000 }).catch(() => {});
  await page.getByText(/Exceptional lessons start with/i).first().scrollIntoViewIfNeeded().catch(() => {});
  await hold(page, 3500);

  // 04 Context (organisations together)
  console.log('04 context');
  await recordSlide(page, contextSlideHtml(), 4200, '04-context');

  // 05 Action
  console.log('05 action');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Feature demo',
      title: "Let's see the app in action",
      body: 'Free partner hubs first — then planning tools — then paid resources.',
    }),
    3800,
    '05-action',
  );

  // Explore from real landing — no password on camera
  console.log('explore prototype');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await hold(page, 700);
  await dismissIfVisible(page, WELCOME_DISMISS);
  await ensureCursor(page);
  const explore = page.getByRole('button', { name: /Explore the working prototype/i });
  await explore.waitFor({ state: 'visible', timeout: 12000 });
  await smoothClick(page, explore);
  const pwd = page.getByPlaceholder(/Access password/i);
  if (await pwd.isVisible({ timeout: 700 }).catch(() => false)) {
    // Hide prompt visually and unlock instantly (gate should already be set)
    await page.evaluate(() => {
      document.querySelectorAll('.fixed').forEach((el) => {
        if (el.textContent?.includes('password') || el.textContent?.includes('Working prototype')) {
          el.style.display = 'none';
        }
      });
    }).catch(() => {});
    await page.evaluate(({ demoKey }) => {
      try { sessionStorage.setItem(demoKey, '1'); } catch { /* */ }
    }, { demoKey: DEMO_MODE_KEY });
    await page.goto(`${BASE_URL}/?demo=1`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForSelector('[data-tab="unit-viewer"], [data-walkthrough="year-group-selector"]', {
    timeout: 60000,
  });
  await ensureCursor(page);
  await dismissIfVisible(page, WELCOME_DISMISS);
  await hold(page, 1000);

  // Free hubs — LSO + ROH
  console.log('06 free hubs LSO ROH');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Free resources',
      title: 'LSO and ROH Partner Hubs',
      body: 'See free activities from major arts organisations — then add them into CCDesigner.',
      compactTitle: true,
    }),
    4000,
    '06-free-slide',
  );
  await ensureInApp(page);
  await chapterFreeHubs(page);

  // Calendar + partner key dates (immediately after free hub → libraries → term)
  console.log('07 calendar + key dates');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Calendar',
      title: 'Populate with key dates from partners',
      body: 'Pick a partner, tick KS1 and KS2 dates to attend, confirm — they become Important dates on the calendar.',
      compactTitle: true,
    }),
    4200,
    '09-calendar-slide',
  );
  await ensureInApp(page);
  await chapterCalendar(page);

  // Create activity + lesson
  console.log('08 create activity + lesson');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Your library',
      title: 'Build your own resources too',
      body: 'Create activities and lessons for EYFS, KS2 and KS3 — every field, including live links.',
      compactTitle: true,
    }),
    3800,
    '07-create-slide',
  );
  await ensureInApp(page);
  try {
    const created = await createFullActivity(page);
    if (created !== false) await buildFullLesson(page);
  } catch (err) {
    console.warn('Create/lesson chapter failed — continuing', err?.message || err);
    await dismissOverlays(page);
  }

  // Settings
  console.log('09 settings');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Key stages',
      title: 'Customisable to your key stage',
      body: 'Manage EYFS, KS2 and KS3 in Settings so the library matches your school.',
      compactTitle: true,
    }),
    3800,
    '08-settings-slide',
  );
  await ensureInApp(page);
  await showSettings(page);

  // Paid — end
  console.log('10 paid WTD + iCompose');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'Paid partners',
      title: "What's available to purchase",
      body: 'We Teach Drama and iCompose. CCDesigner only takes a cut of 10–20% of paid resources.',
      compactTitle: true,
    }),
    4500,
    '10-paid-slide',
  );
  await chapterPaid(page);

  // Org advert
  console.log('11 org advert');
  await recordSlide(
    page,
    slideHtml({
      eyebrow: 'For organisations',
      title: 'Your own hub. Your free resources.',
      body: 'Each organisation gets a hub with an admin backend to create template pages and share free resources.',
      compactTitle: true,
    }),
    4800,
    '11-orgs',
  );

  // Closing — NOT thank you
  console.log('12 close');
  await clearCaption(page);
  await recordSlide(page, closingSlideHtml(), 5600, '12-close');

  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

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
