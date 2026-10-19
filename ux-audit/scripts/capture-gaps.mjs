import puppeteer from '/tmp/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:5173';
const OUT = '/workspace/ux-audit/screens';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), type: 'png' });
  console.log('shot', name);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-mode', '1');
    // Skip welcome modals
    localStorage.setItem('ccd-prototype-welcome-seen-v4', '1');
    localStorage.setItem('ccd-partners-funding-start-seen', '1');
  });
  await page.goto(BASE + '/?demo=1', { waitUntil: 'networkidle2' });
  await sleep(2500);

  // Expand sidebar
  await page.evaluate(() => {
    const btn = document.querySelector('.ccd-studio-collapse');
    if (btn && document.querySelector('.ccd-studio-app.is-collapsed')) btn.click();
  });
  await sleep(400);

  // Close any open sheets/modals
  await page.keyboard.press('Escape');
  await sleep(300);
  await page.keyboard.press('Escape');
  await sleep(500);
  await shot(page, '02b-planner-week-clean');

  // Day view via Schedule view dropdown
  await page.evaluate(() => {
    const selects = [...document.querySelectorAll('select, button')];
    const weekBtn = selects.find((b) => /^(Week|Day|Month)$/i.test((b.textContent || '').trim()) || (b.textContent || '').includes('Week'));
    weekBtn?.click();
  });
  await sleep(300);
  await page.evaluate(() => {
    const opt = [...document.querySelectorAll('[role="option"], button, [role="menuitem"]')].find((n) =>
      /^Day$/i.test((n.textContent || '').trim()),
    );
    opt?.click();
  });
  await sleep(800);
  await shot(page, '03b-planner-day-clean');

  // Units tab inside planner
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((n) => /^Units$/i.test((n.textContent || '').trim()));
    b?.click();
  });
  await sleep(900);
  await shot(page, '04c-planner-units');

  // Half-terms map clean
  await page.evaluate(() => document.querySelector('[data-tab="curriculum"]')?.click());
  await sleep(1000);
  await shot(page, '05b-half-terms-clean');

  // Click a map cell carefully
  await page.evaluate(() => {
    // Prefer a cell with role/button inside the map grid
    const map = document.querySelector('main') || document.body;
    const cells = [...map.querySelectorAll('button')].filter((b) => {
      const t = (b.textContent || '').trim();
      return /^\d+\s*lesson/i.test(t) || t === '+' || /add/i.test(t) || t === '';
    });
    const target = cells.find((c) => /\d+\s*lesson/i.test(c.textContent || '')) || cells[0];
    target?.click();
  });
  await sleep(900);
  await shot(page, '06b-assign-scheme-clean');
  await page.keyboard.press('Escape');
  await sleep(400);

  // Lessons page - Copy Link visible
  await page.evaluate(() => document.querySelector('[data-tab="lesson-library"]')?.click());
  await sleep(1000);
  await shot(page, '08b-lessons-actions');

  // Partner hubs - try list view region
  await page.evaluate(() => document.querySelector('[data-tab="our-partners"]')?.click());
  await sleep(1200);
  await page.evaluate(() => {
    const list = [...document.querySelectorAll('button,a')].find((n) => /List view/i.test(n.textContent || ''));
    list?.click();
  });
  await sleep(800);
  await shot(page, '15b-music-hubs-list');

  // Click a region from REGIONS list
  await page.evaluate(() => {
    const mapBtn = [...document.querySelectorAll('button,a')].find((n) => /Browse map|Music Hubs/i.test(n.textContent || ''));
    // Prefer region name buttons
    const region = [...document.querySelectorAll('button,a,[role="button"]')].find((n) =>
      /^(East Midlands|London|South West|North West|East of England|Yorkshire)/i.test((n.textContent || '').trim()),
    );
    region?.click();
  });
  await sleep(1200);
  await shot(page, '16b-region-page');

  // Click into a hub if listed
  await page.evaluate(() => {
    const hub = [...document.querySelectorAll('a,button')].find((n) =>
      /Music Hub|Explore|Open hub|View hub/i.test(n.textContent || ''),
    );
    hub?.click();
  });
  await sleep(1500);
  await shot(page, '17b-hub-detail');

  // Paid resources
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button,[role="tab"]')].find((n) => /Paid resources/i.test(n.textContent || ''));
    b?.click();
  });
  await sleep(900);
  await shot(page, '19b-paid-resources');

  // Bolt-ons catalogue
  await page.evaluate(() => document.querySelector('[data-tab="bolt-ons"]')?.click());
  await sleep(900);
  await shot(page, '25b-bolt-ons-catalogue');

  // Login landing again clean
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await shot(page, '01c-login-clean');

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
