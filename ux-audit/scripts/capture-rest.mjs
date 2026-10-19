import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:5173';
const OUT = '/workspace/ux-audit/screenshots';
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log('SHOT', name);
}

async function dismiss(page) {
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(200);
    const close = page.locator('[aria-label="Close"], button:has-text("Close"), button:has-text("I understand"), button:has-text("continue"), button:has-text("Cancel")').first();
    if (await close.isVisible().catch(() => false)) {
      await close.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
      continue;
    }
    // force-remove overlays that trap clicks
    await page.evaluate(() => {
      document.querySelectorAll('.fixed.inset-0').forEach((el) => {
        const z = getComputedStyle(el).zIndex;
        if (Number(z) >= 50) el.remove();
      });
    });
    break;
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  sessionStorage.setItem('ccd-prototype-gate', '1');
  sessionStorage.setItem('ccd-demo-mode', '1');
  sessionStorage.setItem('ccd-prototype-welcome-seen-v4', '1');
});
await page.goto(`${BASE}/?demo=1`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await dismiss(page);

// Expand sidebar
const expand = page.locator('button[aria-label="Expand menu"]').first();
if (await expand.isVisible().catch(() => false)) await expand.click();

// Day view - explore planner chrome
await page.locator('[data-tab="unit-viewer"]').first().click({ force: true });
await page.waitForTimeout(800);
await dismiss(page);
// Look for week/day/month toggles
const toggles = await page.locator('button, [role="tab"]').allTextContents();
console.log('PLANNER BUTTONS:', toggles.filter(t => /week|day|month|schedule|timetable|unit/i.test(t)).slice(0, 30));
for (const label of ['Day', 'Week', 'Month']) {
  const b = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first();
  if (await b.isVisible().catch(() => false)) {
    await b.click();
    await page.waitForTimeout(600);
    await shot(page, `03-planner-${label.toLowerCase()}.png`);
  }
}

// More tools / class calendar / forum / bolt-ons / export
await dismiss(page);
await page.locator('[data-tab="more"]').first().click({ force: true });
await page.waitForTimeout(600);
await shot(page, '11-more-tools.png');

const cal = page.getByRole('button', { name: /Class calendar/i }).first();
if (await cal.isVisible().catch(() => false)) {
  await cal.click({ force: true });
  await page.waitForTimeout(900);
  await shot(page, '13-class-calendar.png');
}

await dismiss(page);
await page.locator('[data-tab="bolt-ons"]').first().click({ force: true });
await page.waitForTimeout(800);
await shot(page, '14-bolt-ons.png');

await page.goto(`${BASE}/forum`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);
await shot(page, '15-forum.png');

await page.goto(`${BASE}/?demo=1&tab=lesson-library`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await dismiss(page);
// open first lesson-like card
const cards = page.locator('button:has-text("Open"), button:has-text("View"), button:has-text("Edit"), .ss-lesson-card, [data-lesson]');
if (await cards.first().isVisible().catch(() => false)) {
  await cards.first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, '16-lesson-detail-export.png');
}
const exportBtn = page.getByRole('button', { name: /Export PDF|Copy Link|Share|Copy link/i }).first();
if (await exportBtn.isVisible().catch(() => false)) {
  await exportBtn.click({ force: true });
  await page.waitForTimeout(700);
  await shot(page, '16b-export-share.png');
}

// Half-term assign panel more carefully
await page.goto(`${BASE}/?demo=1&tab=curriculum`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await dismiss(page);
await shot(page, '05-half-terms-map.png');
// click a map cell
const cells = page.locator('[data-term], [data-half-term], button.ht-cell, .half-term-cell, table button, [class*="HalfTerm"] button');
console.log('half-term cell count heuristic', await cells.count());
const anyCell = page.locator('main button, .ccd-studio-workspace button').filter({ hasText: /Autumn|Spring|Summer|HT|Term|empty|Add|plan/i }).first();
if (await anyCell.isVisible().catch(() => false)) {
  await anyCell.click({ force: true });
  await page.waitForTimeout(1000);
  await shot(page, '05b-half-term-assign.png');
}

// Activity create editor
await page.goto(`${BASE}/?demo=1&tab=activity-library`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await dismiss(page);
const create = page.getByRole('button', { name: /Create|New activity|Add activity/i }).first();
if (await create.isVisible().catch(() => false)) {
  await create.click({ force: true });
  await page.waitForTimeout(1000);
  await shot(page, '08b-activity-editor.png');
}

// Partner hubs drill: Music Hubs tab then region
await page.goto(`${BASE}/?demo=1&tab=our-partners`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await dismiss(page);
await shot(page, '10-partner-hubs-map.png');
const music = page.getByRole('button', { name: /Music Hubs|Music hubs/i }).first();
if (await music.isVisible().catch(() => false)) await music.click({ force: true });
await page.waitForTimeout(800);
// click first clickable region label/card
const reg = page.locator('button, a').filter({ hasText: /London|Greater|East of England|South East|South West|North East|North West|Yorkshire|Midlands|Wales|Scotland|Northern Ireland/i }).first();
if (await reg.isVisible().catch(() => false)) {
  await reg.click({ force: true });
  await page.waitForTimeout(1000);
  await shot(page, '10b-partner-hubs-region.png');
  const hub = page.locator('a, button').filter({ hasText: /Hub|Music/i }).nth(1);
  if (await hub.isVisible().catch(() => false)) {
    await hub.click({ force: true });
    await page.waitForTimeout(1200);
    await shot(page, '10c-partner-hub-page.png');
  }
}

// Collect visible text for naming across key tabs
const naming = {};
for (const [tab, file] of [
  ['unit-viewer', 'planner'],
  ['curriculum', 'halfterms'],
  ['lesson-builder', 'builder'],
  ['lesson-library', 'lessons'],
  ['activity-library', 'activities'],
  ['lesson-viewer', 'slides'],
  ['more', 'more'],
]) {
  await page.goto(`${BASE}/?demo=1&tab=${tab}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await dismiss(page);
  const text = await page.locator('body').innerText();
  naming[file] = ['Interactive lesson','Interactive Lesson','Lesson Viewer','Karaoke','Curriculum','preview mode','Preview mode','unit viewer','Unit viewer']
    .filter(t => text.includes(t));
}
fs.writeFileSync(path.join(OUT, '_naming.json'), JSON.stringify({ naming, consoleErrors: [...new Set(consoleErrors)].slice(0, 100) }, null, 2));
console.log(JSON.stringify(naming, null, 2));
console.log('errors', consoleErrors.length);
await browser.close();
