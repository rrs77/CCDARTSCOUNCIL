/**
 * Verify paid Partner Hub back button → Paid resources (label + restore).
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUT = process.env.OUT_DIR || '/opt/cursor/artifacts';
fs.mkdirSync(OUT, { recursive: true });

const PAID_SLUGS = ['dramaresource', 'icompose', 'weteachdrama'];

async function dismiss(page) {
  for (let i = 0; i < 8; i++) {
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

async function bootPaidListing(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-mode', '1');
    localStorage.setItem('ccd-prototype-welcome-seen-v4', '1');
  });
  await page.goto(`${BASE}/?demo=1&page=browse&section=paid-resources`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForTimeout(2500);
  await dismiss(page);
  const heading = page.locator('text=/paid resource/i').first();
  if (!(await heading.isVisible().catch(() => false))) {
    await page.evaluate(() => window.dispatchEvent(new Event('ccd:open-our-partners')));
    await page.waitForTimeout(800);
    const tab = page.locator('button:has-text("Paid resources")').first();
    if (await tab.isVisible().catch(() => false)) await tab.click();
    await page.waitForTimeout(800);
  }
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const results = [];

try {
  await bootPaidListing(page);
  await shot(page, 'paid-resources-listing-before.png');

  // Apply Drama subject filter so restore is observable
  const dramaFacet = page.locator('aside button:has-text("Drama"), aside [role="button"]:has-text("Drama")').first();
  if (await dramaFacet.isVisible().catch(() => false)) {
    await dramaFacet.click();
    await page.waitForTimeout(400);
  } else {
    // FacetRow is a button with label text
    const alt = page.getByRole('button', { name: /^Drama/i }).first();
    if (await alt.isVisible().catch(() => false)) await alt.click();
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => window.scrollTo(0, 420));
  await page.waitForTimeout(200);

  // Open Drama Resource card
  const openDr = page.locator('button[aria-label*="Drama Resource"]').first();
  if (!(await openDr.isVisible().catch(() => false))) {
    // Fallback: any arrow on first card
    await page.locator('article button[aria-label^="Open"]').first().click();
  } else {
    await openDr.click();
  }
  await page.waitForURL(/\/dramaresource/, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await dismiss(page);

  const backBtn = page.getByRole('button', { name: /Back to Paid resources/i }).first();
  const backVisible = await backBtn.isVisible().catch(() => false);
  const backText = backVisible ? (await backBtn.innerText()).trim() : '';
  results.push({
    check: 'dramaresource-back-label',
    ok: backVisible && /Back to Paid resources/i.test(backText),
    backText,
  });
  await shot(page, 'paid-hub-dramaresource-back-button.png');

  await backBtn.click();
  await page.waitForTimeout(2500);
  await dismiss(page);

  const url = page.url();
  const onPaid =
    /section=paid-resources/.test(url) ||
    (await page.locator('text=/paid resource/i').first().isVisible().catch(() => false));
  const dramaActive = await page
    .locator('aside button:has-text("Drama"), aside [aria-pressed="true"]:has-text("Drama")')
    .first()
    .evaluate((el) => {
      const cls = el.className || '';
      return /bg-\[#B45309\]|text-white|ring-\[#B45309\]/.test(cls) || el.getAttribute('aria-current') === 'true';
    })
    .catch(() => false);
  const scrollY = await page.evaluate(() => window.scrollY);
  results.push({
    check: 'back-lands-on-paid-resources',
    ok: onPaid,
    url,
  });
  results.push({
    check: 'filters-or-scroll-restored',
    ok: dramaActive || scrollY > 100,
    dramaActive,
    scrollY,
  });
  await shot(page, 'paid-resources-after-back.png');

  // Direct visits to all paid hubs — label must be Back to Paid resources
  for (const slug of PAID_SLUGS) {
    await page.goto(`${BASE}/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1200);
    await dismiss(page);
    const btn = page.getByRole('button', { name: /Back to Paid resources/i }).first();
    const ok = await btn.isVisible().catch(() => false);
    const old = await page.getByRole('button', { name: /Back to CCDesigner/i }).first().isVisible().catch(() => false);
    results.push({ check: `${slug}-back-label`, ok: ok && !old });
    await shot(page, `paid-hub-${slug}-back.png`);
    if (ok) {
      await btn.click();
      await page.waitForTimeout(1500);
      const landed =
        /section=paid-resources/.test(page.url()) ||
        (await page.locator('text=/paid resource/i').first().isVisible().catch(() => false));
      results.push({ check: `${slug}-back-destination`, ok: landed, url: page.url() });
    }
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ results, failed: failed.length }, null, 2));
if (failed.length) process.exit(1);
