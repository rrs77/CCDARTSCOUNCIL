/**
 * Capture deliverable screenshots for PR #44 at 1280 and 1440.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const OUT = '/opt/cursor/artifacts/screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

async function withDemo(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('ccd-demo-mode', '1');
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-from-school', 'chelmsford-music-hub');
  });
}

async function openSettingsUsers(page) {
  await page.goto(BASE + '/settings/users', { waitUntil: 'networkidle', timeout: 60000 }).catch(async () => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  });
  await page.waitForTimeout(1500);
  // Prototype gate
  const gate = page.locator('input[placeholder*="Access" i], input[type="password"]').first();
  if (await gate.isVisible({ timeout: 1200 }).catch(() => false)) {
    const label = await page.locator('text=/working prototype|access password/i').count();
    if (label > 0) {
      await gate.fill('artscouncil26');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
    }
  }
  // Ensure we're on users — hash or in-app nav
  if (!page.url().includes('users')) {
    await page.evaluate(() => {
      window.history.pushState({}, '', '/settings/users');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(800);
    // Click Settings → Users if still needed
    const usersNav = page.getByRole('button', { name: /^Users$/i }).or(page.getByRole('link', { name: /^Users$/i }));
    if (await usersNav.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await usersNav.first().click();
      await page.waitForTimeout(1000);
    }
  }
  await page.waitForTimeout(1500);
}

async function searchUsers(page, q) {
  const search = page.getByPlaceholder(/search/i).first();
  if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
    await search.fill('');
    await search.fill(q);
    await page.waitForTimeout(800);
  }
}

const results = [];

// --- Users Rob @1440 ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await withDemo(page);
  await openSettingsUsers(page);
  await searchUsers(page, 'rob.reichstorer');
  const path = `${OUT}/settings-users-rob-1440.png`;
  await page.screenshot({ path, fullPage: false });
  const body = await page.locator('body').innerText();
  results.push({
    shot: 'users-rob-1440',
    path,
    hasRob: /Rob|rob\.reichstorer/i.test(body),
    hasSuper: /Super admin/i.test(body),
  });
  await ctx.close();
}

// --- Users Rob @1280 ---
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await withDemo(page);
  await openSettingsUsers(page);
  await searchUsers(page, 'rob');
  const path = `${OUT}/settings-users-rob-1280.png`;
  await page.screenshot({ path, fullPage: false });
  const body = await page.locator('body').innerText();
  results.push({
    shot: 'users-rob-1280',
    path,
    hasRob: /Rob|rob\.reichstorer/i.test(body),
    hasSuper: /Super admin/i.test(body),
  });
  await ctx.close();
}

// --- Org Chelmsford filter ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await withDemo(page);
  await openSettingsUsers(page);
  // Try school/org filter or search
  const schoolSelect = page.locator('select').filter({ hasText: /school|organisation|hub|all/i }).first();
  const allSelects = page.locator('select');
  const count = await allSelects.count();
  let filtered = false;
  for (let i = 0; i < count; i++) {
    const opts = await allSelects.nth(i).locator('option').allTextContents();
    const chelm = opts.find((o) => /chelmsford/i.test(o));
    if (chelm) {
      await allSelects.nth(i).selectOption({ label: chelm.trim() });
      filtered = true;
      await page.waitForTimeout(800);
      break;
    }
  }
  if (!filtered) {
    await searchUsers(page, 'Chelmsford');
  }
  const path = `${OUT}/settings-users-org-chelmsford.png`;
  await page.screenshot({ path, fullPage: false });
  const body = await page.locator('body').innerText();
  results.push({
    shot: 'users-org-chelmsford',
    path,
    hasChelmsford: /Chelmsford/i.test(body),
  });
  await ctx.close();
}

// --- Set password gate ---
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    sessionStorage.setItem('ccd-demo-mode', '1');
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-must-change-password', '1');
  });
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  const path = `${OUT}/set-password-flow.png`;
  await page.screenshot({ path, fullPage: false });
  const body = await page.locator('body').innerText();
  results.push({
    shot: 'set-password',
    path,
    hasGate: /Choose a new password|new password|Confirm password/i.test(body),
  });
  await ctx.close();
}

// --- Account change password ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await withDemo(page);
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  const accountBtn = page.getByRole('button', { name: /Account menu/i }).first();
  if (await accountBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await accountBtn.click();
    await page.waitForTimeout(400);
    await page.getByRole('menuitem', { name: /Change password/i }).click();
    await page.waitForTimeout(500);
  }
  const path = `${OUT}/account-change-password.png`;
  await page.screenshot({ path, fullPage: false });
  const body = await page.locator('body').innerText();
  results.push({
    shot: 'change-password',
    path,
    hasModal: /Change password|New password|Confirm password/i.test(body),
  });
  await ctx.close();
}

// --- Help home @1440 ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await withDemo(page);
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const helpBtn = page.getByRole('button', { name: /help/i }).or(page.locator('[aria-label*="Help" i]')).first();
  if (await helpBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await helpBtn.click();
  } else {
    // Try question mark / known help trigger
    await page.locator('button').filter({ has: page.locator('svg') }).nth(0).click().catch(() => {});
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ccd-open-help'));
    });
  }
  await page.waitForTimeout(1200);
  // Look for help dialog
  const helpRoot = page.locator('[role="dialog"], .fixed').filter({ hasText: /Help|Getting started|Activity/i }).first();
  await helpRoot.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  const path = `${OUT}/help-home-1440.png`;
  await page.screenshot({ path, fullPage: false });
  const body = await page.locator('body').innerText();
  results.push({
    shot: 'help-home',
    path,
    hasHelp: /Help|Settings|Users|Half-term|Planner|Slides/i.test(body),
  });

  // Help Users section — click Users card if present
  const usersCard = page.getByRole('button', { name: /Users/i }).or(page.locator('button, a').filter({ hasText: /^Users$/i })).first();
  if (await usersCard.isVisible({ timeout: 2000 }).catch(() => false)) {
    await usersCard.click();
    await page.waitForTimeout(600);
  }
  const pathUsers = `${OUT}/help-users-section.png`;
  await page.screenshot({ path: pathUsers, fullPage: false });
  results.push({ shot: 'help-users', path: pathUsers });

  // Help Settings
  const settingsCard = page.getByRole('button', { name: /^Settings$/i }).first();
  if (await settingsCard.isVisible({ timeout: 2000 }).catch(() => false)) {
    await settingsCard.click();
    await page.waitForTimeout(600);
  }
  const pathSettings = `${OUT}/help-settings-section.png`;
  await page.screenshot({ path: pathSettings, fullPage: false });
  results.push({ shot: 'help-settings', path: pathSettings });

  await ctx.close();
}

// --- Account menu real session (regression) ---
{
  // reuse verify script logic lightly via spawning is overkill — call separate if needed
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
const failed = results.filter((r) => r.hasRob === false || r.hasGate === false || r.hasModal === false);
process.exit(failed.length ? 1 : 0);
