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
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => {
      document.querySelectorAll('.fixed.inset-0').forEach((el) => {
        const z = Number(getComputedStyle(el).zIndex);
        if (z >= 50) el.remove();
      });
    });
    await page.waitForTimeout(150);
  }
}

async function unlock(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-mode', '1');
    sessionStorage.setItem('ccd-prototype-welcome-seen-v4', '1');
  });
  await page.goto(`${BASE}/?demo=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await dismiss(page);
  const expand = page.locator('button[aria-label="Expand menu"]').first();
  if (await expand.isVisible().catch(() => false)) await expand.click();
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await unlock(page);

// Planner views via VIEW dropdown
await page.locator('.ccd-studio-nav [data-tab="unit-viewer"]').first().click({ force: true });
await page.waitForTimeout(800);
await dismiss(page);
// Open VIEW select
const viewBtn = page.locator('button, select').filter({ hasText: /Week|VIEW/i }).first();
if (await viewBtn.isVisible().catch(() => false)) {
  await viewBtn.click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '03a-planner-view-menu.png');
  for (const label of ['Day', 'Month', 'Week']) {
    const opt = page.getByRole('option', { name: new RegExp(label, 'i') }).first();
    const btn = page.getByRole('menuitem', { name: new RegExp(label, 'i') }).first();
    const any = page.locator(`text=${label}`).first();
    if (await opt.isVisible().catch(() => false)) await opt.click();
    else if (await btn.isVisible().catch(() => false)) await btn.click();
    else if (await any.isVisible().catch(() => false)) await any.click().catch(() => {});
    await page.waitForTimeout(700);
    await shot(page, `03-planner-${label.toLowerCase()}.png`);
    // reopen
    await viewBtn.click().catch(() => {});
    await page.waitForTimeout(300);
  }
}

// Units tab under planner
await page.getByRole('button', { name: /^Units$/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(900);
await shot(page, '03b-planner-units.png');

// Half-term cell assign - click a cell with lessons
await page.locator('.ccd-studio-nav [data-tab="curriculum"]').first().click({ force: true });
await page.waitForTimeout(1000);
await dismiss(page);
// expand sidebar for consistency
const expand2 = page.locator('button[aria-label="Expand menu"]').first();
if (await expand2.isVisible().catch(() => false)) await expand2.click();
const lessonPill = page.locator('button, span, div').filter({ hasText: /\d+ lesson/ }).first();
if (await lessonPill.isVisible().catch(() => false)) {
  await lessonPill.click({ force: true });
  await page.waitForTimeout(1000);
  await shot(page, '05c-half-term-cell-open.png');
}

// Empty cell
const emptyCell = page.locator('td button, [role="gridcell"] button, button').filter({ hasText: /^$/ }).nth(5);
// Try clicking empty-looking cells in the map
const cells = page.locator('table tbody tr td button, [class*="cell"] button');
const n = await cells.count();
console.log('cells', n);
if (n > 10) {
  await cells.nth(8).click({ force: true }).catch(() => {});
  await page.waitForTimeout(1000);
  await shot(page, '05d-half-term-empty-or-assign.png');
}

// Slides editor more carefully
await page.locator('.ccd-studio-nav [data-tab="lesson-viewer"]').first().click({ force: true });
await page.waitForTimeout(1000);
await dismiss(page);
const edit = page.getByRole('button', { name: /^Edit$/i }).first();
if (await edit.isVisible().catch(() => false)) {
  await edit.click({ force: true });
  await page.waitForTimeout(1500);
  await shot(page, '09c-slides-editor.png');
  // library picker?
  const lib = page.getByRole('button', { name: /Library|Slides library|Media/i }).first();
  if (await lib.isVisible().catch(() => false)) {
    await lib.click({ force: true });
    await page.waitForTimeout(700);
    await shot(page, '09d-slides-library-in-editor.png');
  }
}

// Partner hubs: Music Hubs region via REGIONS list
await page.locator('.ccd-studio-nav [data-tab="our-partners"]').first().click({ force: true });
await page.waitForTimeout(1200);
await dismiss(page);
const expand3 = page.locator('button[aria-label="Expand menu"]').first();
if (await expand3.isVisible().catch(() => false)) await expand3.click();
await shot(page, '10-partner-hubs-map.png');
const london = page.getByRole('button', { name: /London/i }).first();
const londonLink = page.locator('button, a, li').filter({ hasText: /^London/ }).first();
if (await london.isVisible().catch(() => false)) await london.click({ force: true });
else if (await londonLink.isVisible().catch(() => false)) await londonLink.click({ force: true });
await page.waitForTimeout(1200);
await shot(page, '10b-partner-hubs-region.png');
const hubCard = page.locator('a, button, article').filter({ hasText: /Music Hub|Hub for|Education/i }).first();
if (await hubCard.isVisible().catch(() => false)) {
  await hubCard.click({ force: true });
  await page.waitForTimeout(1200);
  await shot(page, '10c-partner-hub-page.png');
}

// Arts orgs A-Z browse deeper
await page.locator('.ccd-studio-nav [data-tab="our-partners"]').first().click({ force: true });
await page.waitForTimeout(800);
await page.getByRole('button', { name: /Arts organisations/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(900);
await shot(page, '10d-arts-organisations.png');
await page.getByRole('button', { name: /Paid resources/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(900);
await shot(page, '10e-paid-resources.png');

// Export from lessons - open Copy Link / Export
await page.locator('.ccd-studio-nav [data-tab="lesson-library"]').first().click({ force: true });
await page.waitForTimeout(1000);
await dismiss(page);
const expand4 = page.locator('button[aria-label="Expand menu"]').first();
if (await expand4.isVisible().catch(() => false)) await expand4.click();
await shot(page, '07-lessons.png');
const copyLink = page.getByRole('button', { name: /Copy Link/i }).first();
if (await copyLink.isVisible().catch(() => false)) {
  await copyLink.click({ force: true });
  await page.waitForTimeout(800);
  await shot(page, '16b-copy-link.png');
}
// Try opening a lesson for Export PDF
const openLesson = page.locator('button, a').filter({ hasText: /For Parents|L1 New|Example/ }).first();
if (await openLesson.isVisible().catch(() => false)) {
  await openLesson.click({ force: true });
  await page.waitForTimeout(1000);
  await shot(page, '16-lesson-opened.png');
  const pdf = page.getByRole('button', { name: /Export PDF|PDF/i }).first();
  if (await pdf.isVisible().catch(() => false)) {
    await pdf.click({ force: true });
    await page.waitForTimeout(800);
    await shot(page, '16c-export-pdf.png');
  }
}

// Activity editor
await page.locator('.ccd-studio-nav [data-tab="activity-library"]').first().click({ force: true });
await page.waitForTimeout(1000);
await dismiss(page);
const create = page.getByRole('button', { name: /Create/i }).first();
if (await create.isVisible().catch(() => false)) {
  await create.click({ force: true });
  await page.waitForTimeout(1200);
  await shot(page, '08b-activity-editor.png');
}

// Class selector presence audit across tabs
const classPresence = {};
for (const tab of ['unit-viewer','curriculum','lesson-builder','lesson-library','activity-library','lesson-viewer','our-partners','more']) {
  await page.goto(`${BASE}/?demo=1&tab=${tab}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await dismiss(page);
  const header = await page.locator('body').innerText();
  // look for class dropdown near top
  const hasClassSelect = await page.locator('header select, header button, [class*="Header"] button, [class*="class"]').filter({ hasText: /Year|Kindergarten|Reception|Music|Drama|LKG|UKG|Rock/i }).count();
  const visibleClass = await page.getByRole('button', { name: /Lower Kindergarten|Reception|Year |LKG|UKG|Music|Drama|Rock Stars/i }).first().isVisible().catch(() => false);
  classPresence[tab] = { hasClassSelect, visibleClass };
}
fs.writeFileSync(path.join(OUT, '_class-context.json'), JSON.stringify(classPresence, null, 2));
console.log(classPresence);

await browser.close();
