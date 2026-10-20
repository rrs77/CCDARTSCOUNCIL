/**
 * Capture Paid resources (and Music Hubs region grid) at 1280 & 1440
 * in grid / list / compact after Activity Library–style card sizing.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUT = process.env.OUT_DIR || '/opt/cursor/artifacts';
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
        await page.waitForTimeout(250);
        break;
      }
    }
    if (!hit) break;
  }
  await page.keyboard.press('Escape').catch(() => undefined);
}

async function boot(page, section) {
  await page.addInitScript(() => {
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-mode', '1');
    localStorage.setItem('ccd-prototype-welcome-seen-v4', '1');
    localStorage.removeItem('ccd-paid-directory-view');
    localStorage.removeItem('ccd-paid-directory-grid-cols-pinned');
  });
  await page.goto(`${BASE}/?demo=1&page=browse&section=${section}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForTimeout(2500);
  await dismiss(page);
}

async function setView(page, mode) {
  const title =
    mode === 'grid' ? 'Grid view' : mode === 'list' ? 'List view' : 'Compact view';
  const btn = page.locator(`button[title="${title}"]`).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(400);
    return true;
  }
  return false;
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
}

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const width of [1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await boot(page, 'paid-resources');

    const heading = page.locator('text=/paid resource/i').first();
    const paidReady = await heading.isVisible().catch(() => false);
    results.push({ check: `paid-ready-${width}`, ok: paidReady });

    for (const mode of ['grid', 'list', 'compact']) {
      const ok = await setView(page, mode);
      results.push({ check: `paid-view-${width}-${mode}`, ok });
      // Confirm size slider present for grid/compact
      if (mode !== 'list') {
        const slider = page.locator('input[aria-label="Paid resources per row"]').first();
        const hasSlider = await slider.isVisible().catch(() => false);
        results.push({ check: `paid-slider-${width}-${mode}`, ok: hasSlider });
      }
      await shot(page, `paid-${width}-${mode}.png`);
    }

    // Spot-check brand colours still present (logo banners / price)
    await setView(page, 'grid');
    const body = await page.locator('main, .ccd-partner-hubs').first().innerText().catch(() => '');
    results.push({
      check: `paid-content-${width}`,
      ok: /Drama Resource|iCompose|We Teach Drama/i.test(body),
    });

    await page.close();
  }

  // Music Hubs region grid — open a region then capture grid toolbar
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await boot(page, 'music-hubs');
  // Click first region in the regions list
  const regionBtn = page.locator('[aria-label="Music Hub regions"] button').first();
  if (await regionBtn.isVisible().catch(() => false)) {
    await regionBtn.click();
    await page.waitForTimeout(1500);
    await dismiss(page);
    const slider = page.locator('input[aria-label="Music Hubs per row"]').first();
    const hasSlider = await slider.isVisible().catch(() => false);
    results.push({ check: 'music-hubs-slider', ok: hasSlider });
    for (const mode of ['grid', 'list', 'compact']) {
      await setView(page, mode);
      await shot(page, `music-hubs-1280-${mode}.png`);
    }
  } else {
    results.push({ check: 'music-hubs-slider', ok: false, reason: 'no region button' });
  }
  await page.close();
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ results, failed: failed.length }, null, 2));
if (failed.length) process.exit(1);
