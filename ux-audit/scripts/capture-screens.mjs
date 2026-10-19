/**
 * Full CCD teacher-app screenshot walk for UX audit (1440×900).
 * Requires Vite at BASE_URL and optionally API on :8080.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUT = process.env.OUT_DIR || '/workspace/ux-audit/screenshots';
const PASSWORD = 'artscouncil26';

fs.mkdirSync(OUT, { recursive: true });

const consoleErrors = [];
const notes = [];

function log(msg) {
  notes.push(msg);
  console.log(msg);
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  log(`SHOT ${name}`);
  return file;
}

async function dismissModals(page) {
  for (let i = 0; i < 8; i++) {
    const candidates = [
      'button:has-text("I understand")',
      'button:has-text("I understand — continue")',
      'button:has-text("continue")',
      'button:has-text("Continue to prototype")',
      'button:has-text("Continue")',
      'button:has-text("Got it")',
      'button:has-text("Skip")',
      'button:has-text("Not now")',
      'button:has-text("Maybe later")',
      '[aria-label="Close"]',
      'button:has-text("Close")',
    ];
    let clicked = false;
    for (const sel of candidates) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ timeout: 1500 }).catch(() => undefined);
        clicked = true;
        await page.waitForTimeout(350);
        break;
      }
    }
    if (!clicked) break;
  }
}

async function expandSidebar(page) {
  const collapse = page.locator('button[aria-label="Expand menu"]').first();
  if (await collapse.isVisible().catch(() => false)) {
    await collapse.click().catch(() => undefined);
    await page.waitForTimeout(400);
  }
}

async function goTab(page, dataTab) {
  await expandSidebar(page);
  const btn = page.locator(`[data-tab="${dataTab}"]`).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(900);
    return true;
  }
  return false;
}

async function unlockDemo(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await shot(page, '00-landing.png');
  await dismissModals(page);
  await shot(page, '00b-landing-after-modals.png');

  const preview = page.getByRole('button', { name: /preview|demo|full app|enter prototype|try/i }).first();
  if (await preview.isVisible().catch(() => false)) {
    await preview.click();
    await page.waitForTimeout(600);
  }

  const pwd = page.locator('input[type="password"]').first();
  if (await pwd.isVisible().catch(() => false)) {
    await shot(page, '00c-prototype-gate.png');
    await pwd.fill(PASSWORD);
    await page
      .locator('button[type="submit"], button:has-text("Enter prototype"), button:has-text("Unlock")')
      .first()
      .click();
    await page.waitForTimeout(1200);
  }

  await page.evaluate(() => {
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-mode', '1');
    try {
      sessionStorage.setItem('ccd-prototype-welcome-seen-v4', '1');
      sessionStorage.setItem('ccd-partners-funding-video-v1', '1');
    } catch {}
  });
  await page.goto(`${BASE}/?demo=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  await dismissModals(page);
  await expandSidebar(page);
  await shot(page, '01-app-home.png');
}

async function clickText(page, re) {
  const el = page.getByRole('button', { name: re }).first();
  if (await el.isVisible().catch(() => false)) {
    await el.click();
    await page.waitForTimeout(800);
    return true;
  }
  const alt = page.locator('button, a, [role="tab"]').filter({ hasText: re }).first();
  if (await alt.isVisible().catch(() => false)) {
    await alt.click();
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  await unlockDemo(page);

  // Planner week
  await goTab(page, 'unit-viewer');
  await dismissModals(page);
  await shot(page, '02-planner-week.png');

  // Day view
  if (await clickText(page, /^Day$/i) || await clickText(page, /Day view/i)) {
    await shot(page, '03-planner-day.png');
  } else {
    const dayToggle = page.locator('[data-view="day"], button:has-text("Day")').first();
    if (await dayToggle.isVisible().catch(() => false)) {
      await dayToggle.click();
      await page.waitForTimeout(700);
      await shot(page, '03-planner-day.png');
    } else {
      log('NOTE: day view toggle not found');
    }
  }

  // Timetable builder
  if (await clickText(page, /Timetable builder/i) || await clickText(page, /^Timetable$/i)) {
    await shot(page, '04-timetable-builder.png');
  } else {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('ccd:open-timetable')));
    await page.waitForTimeout(1000);
    await shot(page, '04-timetable-builder.png');
  }

  // Try open class side panel if visible
  const classChip = page.locator('button, [role="button"]').filter({ hasText: /Year|Class|Y[0-9]|Reception|KS/i }).first();
  if (await classChip.isVisible().catch(() => false)) {
    await classChip.click().catch(() => undefined);
    await page.waitForTimeout(600);
    await shot(page, '04b-timetable-class-panel.png');
  }

  // Half-terms
  await goTab(page, 'curriculum');
  await dismissModals(page);
  await shot(page, '05-half-terms-map.png');

  // Open assign / cell if possible
  const cell = page.locator('button, [role="button"], td, .ht-cell, [data-half-term]').filter({ hasText: /.+/ }).nth(3);
  if (await cell.isVisible().catch(() => false)) {
    await cell.click().catch(() => undefined);
    await page.waitForTimeout(900);
    await shot(page, '05b-half-term-assign.png');
    // back if overlay
    await page.keyboard.press('Escape').catch(() => undefined);
    const back = page.locator('button:has-text("Back"), button:has-text("Year map"), button:has-text("Half-term")').first();
    if (await back.isVisible().catch(() => false)) await back.click().catch(() => undefined);
  }

  // Lesson Builder
  await goTab(page, 'lesson-builder');
  await dismissModals(page);
  await shot(page, '06-lesson-builder.png');

  // Lessons
  await goTab(page, 'lesson-library');
  await dismissModals(page);
  await shot(page, '07-lessons.png');

  // Activity Library
  await goTab(page, 'activity-library');
  await dismissModals(page);
  await shot(page, '08-activity-library.png');

  // Create activity editor
  if (await clickText(page, /Create activity|New activity|Add activity|\+ Create/i)) {
    await page.waitForTimeout(1000);
    await shot(page, '08b-activity-editor.png');
    const cancel = page.locator('button:has-text("Cancel"), button:has-text("Back"), button[aria-label="Close"]').first();
    if (await cancel.isVisible().catch(() => false)) await cancel.click().catch(() => undefined);
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(500);
  }

  // Slides
  await goTab(page, 'lesson-viewer');
  await dismissModals(page);
  await shot(page, '09-slides-landing.png');

  // Slides library tabs
  if (await clickText(page, /Hubs|Partner|Library|Mine|Published/i)) {
    await shot(page, '09b-slides-library-tab.png');
  }

  // Open editor
  if (await clickText(page, /New slides|Edit|Create/i)) {
    await page.waitForTimeout(1200);
    await shot(page, '09c-slides-editor.png');
    const close = page.locator('button:has-text("Close"), button[aria-label="Close"], button:has-text("Back")').first();
    if (await close.isVisible().catch(() => false)) await close.click().catch(() => undefined);
    await page.waitForTimeout(600);
  }

  // Partner Hubs
  await goTab(page, 'our-partners');
  await dismissModals(page);
  await shot(page, '10-partner-hubs-map.png');

  // Region click — try England / a region path
  const region = page.locator('button, a, path, [data-region]').filter({ hasText: /London|East|South|North|Midlands|Wales|Scotland|England/i }).first();
  if (await region.isVisible().catch(() => false)) {
    await region.click().catch(() => undefined);
    await page.waitForTimeout(1000);
    await shot(page, '10b-partner-hubs-region.png');
  } else {
    // SVG path click heuristic
    const paths = page.locator('svg path');
    const count = await paths.count();
    if (count > 2) {
      await paths.nth(Math.min(5, count - 1)).click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(1000);
      await shot(page, '10b-partner-hubs-region.png');
    }
  }

  // Hub page
  const hubLink = page.locator('a, button').filter({ hasText: /Music Hub|Hub|Royal|ROH|Arts/i }).first();
  if (await hubLink.isVisible().catch(() => false)) {
    await hubLink.click().catch(() => undefined);
    await page.waitForTimeout(1200);
    await shot(page, '10c-partner-hub-page.png');
  }

  // Arts organisations / Paid resources tabs
  await goTab(page, 'our-partners');
  await page.waitForTimeout(600);
  if (await clickText(page, /Arts organisations|Organisations/i)) {
    await shot(page, '10d-arts-organisations.png');
  }
  if (await clickText(page, /Paid resources/i)) {
    await shot(page, '10e-paid-resources.png');
  }

  // More tools
  await goTab(page, 'more');
  await dismissModals(page);
  await shot(page, '11-more-tools.png');

  // Settings
  if (await clickText(page, /^Settings$/i)) {
    await page.waitForTimeout(900);
    await shot(page, '12-settings.png');
    if (await clickText(page, /My classes|Classes|Year groups/i)) {
      await shot(page, '12b-settings-classes.png');
    }
    await page.keyboard.press('Escape').catch(() => undefined);
    const closeSettings = page.locator('button[aria-label="Close"], button:has-text("Close")').first();
    if (await closeSettings.isVisible().catch(() => false)) await closeSettings.click().catch(() => undefined);
  } else {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('ccd:open-settings')));
    await page.waitForTimeout(900);
    await shot(page, '12-settings.png');
    await page.keyboard.press('Escape').catch(() => undefined);
  }

  // Class calendar via more tools
  await goTab(page, 'more');
  if (await clickText(page, /Class calendar/i)) {
    await page.waitForTimeout(900);
    await shot(page, '13-class-calendar.png');
  }

  // Bolt-ons
  await goTab(page, 'bolt-ons');
  await page.waitForTimeout(800);
  await shot(page, '14-bolt-ons.png');

  // Forum
  await page.goto(`${BASE}/forum`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(1200);
  await shot(page, '15-forum.png');

  // Export / share — reopen planner or lessons
  await page.goto(`${BASE}/?demo=1&tab=lesson-library`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await dismissModals(page);
  const lessonCard = page.locator('button, article, [role="button"], .ss-lesson-card').first();
  if (await lessonCard.isVisible().catch(() => false)) {
    await lessonCard.click().catch(() => undefined);
    await page.waitForTimeout(900);
    await shot(page, '16-lesson-detail-export.png');
    if (await clickText(page, /Export PDF|Copy Link|Share/i)) {
      await page.waitForTimeout(700);
      await shot(page, '16b-export-share.png');
    }
  }

  // Capture page text samples for naming audit
  await page.goto(`${BASE}/?demo=1&tab=unit-viewer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await dismissModals(page);
  await expandSidebar(page);
  const bodyText = await page.locator('body').innerText();
  const namingHits = [
    'Interactive lesson',
    'Interactive Lesson',
    'Lesson Viewer',
    'Karaoke',
    'Curriculum',
    'preview mode',
    'Preview mode',
    'unit-viewer',
  ].filter((t) => bodyText.includes(t));
  log(`NAMING_ON_PLANNER: ${namingHits.join(', ') || '(none)'}`);

  // Sidebar labels
  const navText = await page.locator('.ccd-studio-nav').innerText().catch(() => '');
  log(`SIDEBAR:\n${navText}`);

  // Header / class context
  const headerText = await page.locator('header, .ccd-studio-topbar, .ccd-header').first().innerText().catch(() => '');
  log(`HEADER:\n${headerText.slice(0, 500)}`);

  fs.writeFileSync(
    path.join(OUT, '_notes.json'),
    JSON.stringify({ notes, consoleErrors: [...new Set(consoleErrors)].slice(0, 80) }, null, 2),
  );
  log(`Wrote notes; ${consoleErrors.length} console errors captured`);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
