/**
 * Capture Activity Library hierarchy screenshots (EYFS / KS2 / KS5).
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUT = process.env.OUT_DIR || '/opt/cursor/artifacts/screenshots';
const PASSWORD = 'artscouncil26';

fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
  return file;
}

async function dismissModals(page) {
  for (let i = 0; i < 8; i++) {
    const candidates = [
      'button:has-text("I understand")',
      'button:has-text("Got it")',
      'button:has-text("Continue")',
      'button:has-text("continue")',
      'button:has-text("Close")',
      '[aria-label="Close"]',
      'button:has-text("Skip")',
      'button:has-text("Not now")',
    ];
    let clicked = false;
    for (const sel of candidates) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => undefined);
        clicked = true;
        await page.waitForTimeout(350);
        break;
      }
    }
    if (!clicked) break;
  }
}

async function unlockDemo(page) {
  // Seed gate/demo flags before first paint so password + funding modals are skipped.
  // Do NOT clear ccd-demo-seeded on every navigation — that re-seeds and resets the class.
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('ccd-prototype-gate', '1');
      sessionStorage.setItem('ccd-demo-mode', '1');
      localStorage.setItem('ccd-prototype-welcome-seen-v4', '1');
      localStorage.setItem('ccd-prototype-welcome-seen', '1');
    } catch {
      /* ignore */
    }
  });

  await page.goto(`${BASE}/?demo=1`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  // Fresh seed once for this browser context
  await page.evaluate(() => {
    sessionStorage.removeItem('ccd-demo-seeded');
    sessionStorage.removeItem('ccd-library-hierarchy-expanded');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  await dismissModals(page);

  // Funding / partners start modal
  const fundingClose = page.locator('[aria-labelledby="partners-funding-start-title"] button, [aria-labelledby="partners-funding-start-title"] [aria-label="Close"]').first();
  if (await fundingClose.isVisible().catch(() => false)) {
    await fundingClose.click().catch(() => undefined);
    await page.waitForTimeout(400);
  }
  // Click outside / Escape via Escape
  await page.keyboard.press('Escape').catch(() => undefined);
  await dismissModals(page);

  const pwd = page.locator('input[type="password"]').first();
  if (await pwd.isVisible().catch(() => false)) {
    await pwd.fill(PASSWORD);
    await page.locator('button:has-text("Enter prototype")').first().click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(1000);
  }

  await page.waitForTimeout(2500);
  await dismissModals(page);
}

async function openLibrary(page) {
  const candidates = [
    'button:has-text("Activity Library")',
    '[data-tab="library"]',
    'button:has-text("Library")',
    'a:has-text("Library")',
    'button:has-text("Activities")',
  ];
  for (const sel of candidates) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      await el.click();
      await page.waitForTimeout(1200);
      await dismissModals(page);
      return;
    }
  }
  // Studio shell may already be on library
  console.log('Library tab not found — assuming already visible');
}

async function selectClass(page, names) {
  // Demo year groups use name-as-id in custom-year-groups. Ensure KS5 classes
  // sit in the ks5 section (demo seed demotes secondary stages to Other).
  for (const name of names) {
    await page.evaluate((className) => {
      const groups = JSON.parse(localStorage.getItem('custom-year-groups') || '[]');
      const match =
        groups.find((g) => g.name === className || g.id === className) ||
        groups.find((g) => String(g.name).includes(className));
      const sheetId = match?.id || className;
      const display = match?.name || className;

      const sections = JSON.parse(localStorage.getItem('year-group-sections') || '[]');
      if (Array.isArray(sections) && sections.length) {
        const lower = display.toLowerCase();
        let target = 'other';
        if (/reception|kindergarten|lkg|ukg|eyfs/.test(lower)) target = 'eyfs';
        else if (/year\s*1[23]|a\s*level|ks5/.test(lower)) target = 'ks5';
        else if (/year\s*1[01]|gcse|ks4/.test(lower)) target = 'ks4';
        else if (/year\s*[7-9]|ks3/.test(lower)) target = 'ks3';
        else if (/year\s*[3-6]|ks2/.test(lower)) target = 'ks2';
        else if (/year\s*[12]\b|ks1/.test(lower)) target = 'ks1';

        for (const s of sections) {
          s.yearGroupIds = (s.yearGroupIds || []).filter((id) => id !== sheetId && id !== display);
        }
        const dest = sections.find((s) => s.id === target);
        if (dest && !(dest.yearGroupIds || []).includes(sheetId)) {
          dest.yearGroupIds = [...(dest.yearGroupIds || []), sheetId];
        }
        localStorage.setItem('year-group-sections', JSON.stringify(sections));
      }

      localStorage.setItem(
        'currentSheetInfo',
        JSON.stringify({ sheet: sheetId, display, eyfs: `${sheetId} Statements` }),
      );
      sessionStorage.removeItem('ccd-library-hierarchy-expanded');
    }, name);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await dismissModals(page);
    await openLibrary(page);
    const label = await page.locator('button[aria-label^="Class:"]').first().textContent().catch(() => '');
    console.log('forced class', name, 'header=', (label || '').trim());
    return name;
  }
  return names[0];
}

async function expandFirstMatching(page, labelRe) {
  const btn = page.getByRole('button', { name: labelRe }).first();
  if (await btn.isVisible().catch(() => false)) {
    const expanded = await btn.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await btn.click();
      await page.waitForTimeout(500);
    }
    return true;
  }
  return false;
}

async function captureStage(page, slug, classNames, ksLabel, subjectLabel) {
  await page.evaluate(() => sessionStorage.removeItem('ccd-library-hierarchy-expanded'));
  await selectClass(page, classNames);
  await openLibrary(page);
  await page.waitForTimeout(800);

  // Ensure we're looking at library content
  await shot(page, `library-${slug}-collapsed.png`);

  // Close any open header dropdowns before expanding library headings
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.mouse.click(700, 400).catch(() => undefined);
  await page.waitForTimeout(300);

  // Expand key stage → subject → first leaf category so activities are visible
  const main = page.locator('main, [class*="ActivityLibrary"], body');
  const ksBtn = main.locator('button[aria-expanded]').filter({ hasText: new RegExp(ksLabel) }).first();
  if (await ksBtn.isVisible().catch(() => false)) {
    if ((await ksBtn.getAttribute('aria-expanded')) !== 'true') await ksBtn.click();
    await page.waitForTimeout(450);
  }
  const subBtn = main.locator('button[aria-expanded]').filter({ hasText: new RegExp(`^${subjectLabel}$`) }).first();
  if (await subBtn.isVisible().catch(() => false)) {
    if ((await subBtn.getAttribute('aria-expanded')) !== 'true') await subBtn.click();
    await page.waitForTimeout(450);
  }
  const catHead = main.locator('div[role="button"][aria-expanded="false"]').first();
  if (await catHead.isVisible().catch(() => false)) {
    await catHead.click();
    await page.waitForTimeout(700);
  }
  await shot(page, `library-${slug}-expanded.png`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(20000);

  await unlockDemo(page);
  await openLibrary(page);
  await shot(page, 'library-hierarchy-initial.png');

  await captureStage(page, 'eyfs', ['Lower Kindergarten', 'Reception Music', 'Reception', 'Upper Kindergarten Music'], 'EYFS', 'Music');
  await captureStage(page, 'ks2', ['Year 5 Music', 'Year 6 Music', 'Year 4 Music', 'Year 3 Music'], 'KS2', 'Music');
  await captureStage(page, 'ks5', ['Year 12 Music (A level)', 'Year 12 Drama (A level)', 'Year 12 Photography (A level)', 'Year 13 Music (A level)'], 'KS5', 'Music');

  await browser.close();
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
