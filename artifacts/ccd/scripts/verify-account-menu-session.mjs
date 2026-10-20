/**
 * Verifies that a real Supabase session wins over leftover demo mode
 * in the header AccountMenu (Rob, not Alex Morgan).
 *
 * Usage: node scripts/verify-account-menu-session.mjs
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const OUT = process.env.SCREENSHOT_PATH || '/opt/cursor/artifacts/screenshots/account-menu-real-session.png';
const PROJECT_REF = 'wiudrzdkbpyziaodqoog';
const AUTH_KEY = `sb-${PROJECT_REF}-auth-token`;
const ROB_ID = '11111111-2222-4333-8444-555555555555';
const ROB_EMAIL = 'rob.reichstorer@gmail.com';
const ROB_NAME = 'Rob Reichstorer';

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/** Minimal unsigned JWT — getSession() reads storage; we seed profile cache for display. */
function fakeJwt() {
  const header = b64url({ alg: 'none', typ: 'JWT' });
  const payload = b64url({
    sub: ROB_ID,
    email: ROB_EMAIL,
    role: 'authenticated',
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });
  return `${header}.${payload}.`;
}

mkdirSync('/opt/cursor/artifacts/screenshots', { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.addInitScript(
  ({ authKey, session, profileCache, demoKeys }) => {
    // Leftover demo flag — this is what previously overwrote the real user.
    sessionStorage.setItem(demoKeys.demo, '1');
    sessionStorage.setItem(demoKeys.gate, '1');
    sessionStorage.setItem(demoKeys.fromSchool, 'chelmsford-music-hub');

    localStorage.setItem(authKey, JSON.stringify(session));
    localStorage.setItem('rhythmstix_profile_cache', JSON.stringify(profileCache));
    localStorage.setItem('rhythmstix_user_id', session.user.id);
  },
  {
    authKey: AUTH_KEY,
    demoKeys: {
      demo: 'ccd-demo-mode',
      gate: 'ccd-prototype-gate',
      fromSchool: 'ccd-demo-from-school',
    },
    session: {
      access_token: fakeJwt(),
      refresh_token: 'verify-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      expires_in: 86400,
      token_type: 'bearer',
      user: {
        id: ROB_ID,
        email: ROB_EMAIL,
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: ROB_NAME },
      },
    },
    profileCache: {
      userId: ROB_ID,
      ts: Date.now(),
      profile: {
        id: ROB_ID,
        email: ROB_EMAIL,
        display_name: ROB_NAME,
        first_name: 'Rob',
        last_name: 'Reichstorer',
        role: 'super_admin',
        status: 'active',
        can_manage_users: true,
        can_edit_activities: true,
        can_edit_lessons: true,
        can_manage_year_groups: true,
      },
    },
  },
);

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

// Skip prototype gate if it somehow still shows (gate already unlocked in init).
const gateInput = page.locator('input[type="password"]').first();
if (await gateInput.isVisible({ timeout: 1500 }).catch(() => false)) {
  await gateInput.fill('artscouncil26');
  await page.getByRole('button', { name: /enter|continue|unlock/i }).first().click().catch(() => {});
  await page.waitForTimeout(1500);
}

const accountBtn = page.getByRole('button', { name: /Account menu/i }).first();
await accountBtn.waitFor({ state: 'visible', timeout: 20000 });
await accountBtn.click();
await page.waitForTimeout(500);

const menuText = await page.locator('[role="menu"]').innerText().catch(() => '');
const aria = (await accountBtn.getAttribute('aria-label')) || '';

const hasAlex = /Alex Morgan|admin@curriculum\.demo/i.test(menuText + ' ' + aria);
const hasRob =
  /Rob Reichstorer|rob\.reichstorer@gmail\.com|Super admin/i.test(menuText) ||
  /Rob Reichstorer/i.test(aria);

await page.screenshot({ path: OUT, fullPage: false });

const demoStill = await page.evaluate(() => sessionStorage.getItem('ccd-demo-mode'));

console.log(JSON.stringify({
  ok: hasRob && !hasAlex,
  hasRob,
  hasAlex,
  aria,
  menuText: menuText.slice(0, 400),
  demoCleared: demoStill !== '1',
  screenshot: OUT,
  consoleErrors: consoleErrors.slice(0, 8),
}, null, 2));

await browser.close();
process.exit(hasRob && !hasAlex ? 0 : 1);
