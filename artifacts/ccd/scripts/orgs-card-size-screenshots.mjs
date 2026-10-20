/**
 * Capture Arts organisations directory at 1280 & 1440 in grid/list/compact.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUT = process.env.OUT_DIR || '/opt/cursor/artifacts/screenshots';
fs.mkdirSync(OUT, { recursive: true });

async function dismiss(page) {
  for (let i = 0; i < 6; i++) {
    const sels = [
      'button:has-text("I understand")',
      'button:has-text("Got it")',
      'button:has-text("Continue")',
      '[aria-label="Close"]',
      'button:has-text("Not now")',
    ];
    let hit = false;
    for (const s of sels) {
      const b = page.locator(s).first();
      if (await b.isVisible().catch(() => false)) {
        await b.click().catch(() => undefined);
        hit = true;
        await page.waitForTimeout(300);
        break;
      }
    }
    if (!hit) break;
  }
  await page.keyboard.press('Escape').catch(() => undefined);
}

async function openOrgs(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-mode', '1');
    localStorage.setItem('ccd-prototype-welcome-seen-v4', '1');
    localStorage.removeItem('ccd-orgs-directory-view');
    localStorage.removeItem('ccd-orgs-directory-grid-cols-pinned');
  });
  // Deep-link Partner Hubs → Arts organisations
  await page.goto(`${BASE}/?demo=1&page=browse&section=organisations`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForTimeout(3000);
  await dismiss(page);

  // Ensure partners tab if still on login/other
  const orgHeading = page.locator('text=/arts organisation/i').first();
  if (!(await orgHeading.isVisible().catch(() => false))) {
    await page.evaluate(() => {
      window.dispatchEvent(new Event('ccd:open-our-partners'));
    });
    await page.waitForTimeout(1000);
    const tab = page.locator('button:has-text("Arts organisations")').first();
    if (await tab.isVisible().catch(() => false)) await tab.click();
    await page.waitForTimeout(800);
  }
}

async function setView(page, mode) {
  const title =
    mode === 'grid' ? 'Grid view' : mode === 'list' ? 'List view' : 'Compact view';
  const btn = page.locator(`button[title="${title}"]`).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
}

async function captureAtWidth(browser, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.setDefaultTimeout(20000);
  await openOrgs(page);

  // Scroll to org grid
  const countHeading = page.locator('text=/\\d+ arts organisation/i').first();
  if (await countHeading.isVisible().catch(() => false)) {
    await countHeading.scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(400);

  for (const mode of ['grid', 'list', 'compact']) {
    const ok = await setView(page, mode);
    console.log(`width=${width} mode=${mode} toggled=${ok}`);
    await page.waitForTimeout(400);
    await shot(page, `orgs-${width}-${mode}.png`);
  }
  await page.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  await captureAtWidth(browser, 1280);
  await captureAtWidth(browser, 1440);
  await browser.close();
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
