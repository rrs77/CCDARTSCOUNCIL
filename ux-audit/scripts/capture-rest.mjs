/** Continue UX audit screenshots from Partner Hubs onward. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUT = process.env.OUT_DIR || path.resolve('ux-audit/images/screens');
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name, label) {
  const file = path.join(OUT, `${name}.png`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', name, '—', label);
}

async function dismiss(page) {
  for (const sel of [
    'button:has-text("I understand — continue")',
    'button:has-text("I understand")',
    'button:has-text("Continue to sign in")',
    'button:has-text("Got it")',
    'button:has-text("Close")',
    '[aria-label="Close"]',
  ]) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => undefined);
      await page.waitForTimeout(300);
    }
  }
}

async function boot(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-mode', '1');
    sessionStorage.setItem('ccd-prototype-welcome-seen-v4', '1');
    sessionStorage.setItem('ccd-partners-funding-walkthrough-seen-v4', '1');
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await boot(page);

  // Better slides capture
  await page.goto(`${BASE}/?demo=1&tab=lesson-viewer`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2000);
  await dismiss(page);
  await shot(page, '10-slides-landing', 'Slides landing');

  // Open first editable lesson or create
  const edit = page.locator('button:has-text("Edit")').first();
  const create = page.locator('button:has-text("New"), button:has-text("Create")').first();
  if (await edit.isVisible().catch(() => false)) {
    await edit.click();
  } else if (await create.isVisible().catch(() => false)) {
    await create.click();
  }
  await page.waitForTimeout(1500);
  await shot(page, '11-slides-editor', 'Slides editor');
  // Close
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const still = page.locator('[aria-label="Slides editor"]');
    if (!(await still.isVisible().catch(() => false))) break;
    await page.locator('[aria-label="Slides editor"] button[aria-label="Close"]').first().click({ force: true }).catch(() => undefined);
  }
  await page.goto(`${BASE}/?demo=1&tab=lesson-viewer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const libBtn = page.locator('button:has-text("Library"), button:has-text("Slides library"), a:has-text("Library")').first();
  if (await libBtn.isVisible().catch(() => false)) {
    await libBtn.click();
    await page.waitForTimeout(800);
  }
  await shot(page, '12-slides-library', 'Slides library / hub');

  // Partner hubs
  await page.goto(`${BASE}/?demo=1&tab=our-partners`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1500);
  await dismiss(page);
  await shot(page, '13-partner-hubs', 'Partner Hubs landing');

  // Tabs inside partner hubs
  for (const [name, file] of [
    [/Music Hub/i, '14-music-hubs-tab'],
    [/Arts/i, '17-arts-orgs'],
    [/Paid/i, '18-paid-resources'],
  ]) {
    const tab = page.locator('button, a, [role="tab"]').filter({ hasText: name }).first();
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(1000);
      await shot(page, file, String(name));
    }
  }

  // Dedicated music hubs routes
  for (const route of ['/music-hubs', '/music-hubs/', '/hubs/music', '/partners/music-hubs']) {
    const res = await page.goto(`${BASE}${route}?demo=1`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);
    if (res && res.ok()) {
      await page.waitForTimeout(1500);
      await shot(page, '14-music-hubs-map', `Music hubs route ${route}`);
      break;
    }
  }
  // Try click into map from partner hubs if dedicated route failed
  if (!fs.existsSync(path.join(OUT, '14-music-hubs-map.png'))) {
    await page.goto(`${BASE}/?demo=1&tab=our-partners`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const mh = page.locator('button, a').filter({ hasText: /Music Hub/i }).first();
    if (await mh.isVisible().catch(() => false)) {
      await mh.click();
      await page.waitForTimeout(1500);
      await shot(page, '14-music-hubs-map', 'Music Hubs from Partner Hubs');
    }
  }

  // Click a region / card
  const regionCard = page.locator('a, button, [role="link"]').filter({ hasText: /Yorkshire|London|North East|Midlands|Explore/i }).first();
  if (await regionCard.isVisible().catch(() => false)) {
    await regionCard.click();
    await page.waitForTimeout(1200);
    await shot(page, '15-music-hubs-region', 'Music Hubs region');
  } else {
    const pathEl = page.locator('svg path[fill]:not([fill="none"])').nth(3);
    if (await pathEl.isVisible().catch(() => false)) {
      await pathEl.click({ force: true });
      await page.waitForTimeout(1200);
      await shot(page, '15-music-hubs-region', 'Music Hubs region (svg)');
    }
  }

  const hub = page.locator('a, button').filter({ hasText: /View hub|Open hub|Explore hub|Music Service|Hub page/i }).first();
  if (await hub.isVisible().catch(() => false)) {
    await hub.click();
    await page.waitForTimeout(1500);
    await shot(page, '16-music-hub-page', 'Hub page');
  } else {
    // try any hub link
    const anyHub = page.locator('a[href*="hub"], a[href*="music"]').nth(1);
    if (await anyHub.isVisible().catch(() => false)) {
      await anyHub.click();
      await page.waitForTimeout(1500);
      await shot(page, '16-music-hub-page', 'Hub page (link)');
    }
  }

  // More tools
  await page.goto(`${BASE}/?demo=1&tab=more`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await dismiss(page);
  await shot(page, '19-more-tools', 'More tools');

  // Settings
  await page.evaluate(() => {
    try {
      sessionStorage.setItem('ccd-open-settings-tab', 'yeargroups');
    } catch {}
    window.dispatchEvent(new CustomEvent('ccd:open-settings'));
  });
  await page.waitForTimeout(1200);
  await shot(page, '20-settings', 'Settings My classes');

  // Settings other tabs
  for (const label of ['Objectives', 'Branding', 'Account', 'Admin']) {
    const t = page.locator('[role="tab"], button, a').filter({ hasText: new RegExp(`^${label}$`, 'i') }).first();
    if (await t.isVisible().catch(() => false)) {
      await t.click();
      await page.waitForTimeout(600);
      await shot(page, `20-settings-${label.toLowerCase()}`, `Settings ${label}`);
    }
  }
  await page.keyboard.press('Escape');

  // Bolt-ons
  await page.goto(`${BASE}/?demo=1&tab=bolt-ons`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await shot(page, '21-bolt-ons', 'Bolt-ons');

  // Forum
  await page.goto(`${BASE}/forum`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await shot(page, '22-forum', 'Forum');

  // Export from planner
  await page.goto(`${BASE}/?demo=1&tab=unit-viewer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await dismiss(page);
  // print icon / export
  const printBtn = page.locator('button[aria-label*="Print"], button[aria-label*="Export"], button[title*="Print"], button[title*="Export"]').first();
  if (await printBtn.isVisible().catch(() => false)) {
    await printBtn.click();
    await page.waitForTimeout(800);
    await shot(page, '23-export-share', 'Export / print');
  } else {
    // header chat/forum or share
    const share = page.locator('button, a').filter({ hasText: /Copy link|Share|Export PDF|PDF/i }).first();
    if (await share.isVisible().catch(() => false)) {
      await share.click();
      await page.waitForTimeout(800);
      await shot(page, '23-export-share', 'Export / share');
    } else {
      await shot(page, '23-export-share', 'Planner (export affordance search)');
    }
  }

  // Contact
  await page.goto(`${BASE}/?demo=1&tab=contact-us`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await shot(page, '24-contact', 'Contact');

  // Class calendar
  await page.goto(`${BASE}/?demo=1&tab=unit-viewer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('ccd:open-class-calendar')));
  await page.waitForTimeout(1000);
  await shot(page, '25-class-calendar', 'Class calendar');

  // Day view
  await page.goto(`${BASE}/?demo=1&tab=unit-viewer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await dismiss(page);
  const view = page.locator('button:has-text("Week"), select, [aria-label*="View"]').first();
  if (await view.isVisible().catch(() => false)) {
    await view.click().catch(() => undefined);
    await page.waitForTimeout(300);
    const day = page.locator('button:has-text("Day"), [role="option"]:has-text("Day")').first();
    if (await day.isVisible().catch(() => false)) {
      await day.click();
      await page.waitForTimeout(800);
      await shot(page, '02-planner-day', 'Planner day view');
    }
  }

  // Half-term assign panel — open a cell with lessons
  await page.goto(`${BASE}/?demo=1&tab=curriculum`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const lessonPill = page.locator('button, [role="button"]').filter({ hasText: /\d+\s*lesson/i }).first();
  if (await lessonPill.isVisible().catch(() => false)) {
    await lessonPill.click();
    await page.waitForTimeout(1000);
    await shot(page, '05-halfterms-assign', 'Half-term assign panel');
  }

  // Activity editor via Create
  await page.goto(`${BASE}/?demo=1&tab=activity-library`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await dismiss(page);
  const createAct = page.locator('button:has-text("Create")').first();
  if (await createAct.isVisible().catch(() => false)) {
    await createAct.click();
    await page.waitForTimeout(1200);
    await shot(page, '09-activity-editor', 'Activity create/edit');
  }

  // Units tab inside planner
  await page.goto(`${BASE}/?demo=1&tab=unit-viewer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const units = page.locator('button:has-text("Units")').first();
  if (await units.isVisible().catch(() => false)) {
    await units.click();
    await page.waitForTimeout(1000);
    await shot(page, '26-planner-units', 'Planner Units tab');
  }

  // Lessons detail / empty
  await page.goto(`${BASE}/?demo=1&tab=lesson-library`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await shot(page, '07-lessons', 'Lessons library');

  fs.writeFileSync(
    path.resolve('ux-audit/capture-notes-rest.json'),
    JSON.stringify({ consoleErrors: consoleErrors.slice(0, 40) }, null, 2),
  );
  console.log('done; console errors', consoleErrors.length);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
