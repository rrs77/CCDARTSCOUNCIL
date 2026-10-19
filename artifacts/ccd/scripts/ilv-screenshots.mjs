/**
 * Capture Interactive Lesson Viewer PR screenshots via Playwright.
 * App must be running at BASE_URL (default http://127.0.0.1:5173).
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
  for (let i = 0; i < 6; i++) {
    const candidates = [
      'button:has-text("I understand")',
      'button:has-text("continue")',
      'button:has-text("Continue")',
      'button:has-text("Got it")',
      'button:has-text("Close")',
      '[aria-label="Close"]',
    ];
    let clicked = false;
    for (const sel of candidates) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => undefined);
        clicked = true;
        await page.waitForTimeout(400);
        break;
      }
    }
    if (!clicked) break;
  }
}

async function unlockDemo(page) {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);

  // Preview / demo entry
  const preview = page.getByRole('button', { name: /preview|demo|full app/i }).first();
  if (await preview.isVisible().catch(() => false)) {
    await preview.click();
  } else {
    // Fallback: click any button mentioning Preview
    const alt = page.locator('button').filter({ hasText: /Preview|Demo/i }).first();
    if (await alt.isVisible().catch(() => false)) await alt.click();
  }
  await page.waitForTimeout(600);

  // Password gate
  const pwd = page.locator('input[type="password"]').first();
  if (await pwd.isVisible().catch(() => false)) {
    await pwd.fill(PASSWORD);
    await page.locator('button[type="submit"], button:has-text("Unlock"), button:has-text("Continue")').first().click();
    await page.waitForTimeout(1500);
  }

  // If still on login, force demo flags and reload with ?demo=1
  await page.evaluate(() => {
    sessionStorage.setItem('ccd-prototype-gate', '1');
    sessionStorage.setItem('ccd-demo-mode', '1');
  });
  await page.goto(`${BASE}/?demo=1&tab=lesson-viewer`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  await dismissModals(page);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await unlockDemo(page);
  await dismissModals(page);

  // Ensure Lesson Viewer tab
  const lvTab = page.locator('[data-tab="lesson-viewer"], button:has-text("Lesson Viewer")').first();
  if (await lvTab.isVisible().catch(() => false)) {
    await lvTab.click();
    await page.waitForTimeout(1000);
  }
  await dismissModals(page);
  await shot(page, 'sidebar-lesson-viewer-tab.png');

  // Edit demo / create
  const editBtn = page.locator('button:has-text("Edit")').first();
  const newBtn = page.locator('button:has-text("New interactive lesson")').first();
  if (await editBtn.isVisible().catch(() => false)) {
    await editBtn.click();
  } else if (await newBtn.isVisible().catch(() => false)) {
    await newBtn.click();
  }
  await page.waitForTimeout(1500);
  await shot(page, 'editor-timeline.png');

  // Transitions
  const transRail = page.locator('button.ilv-rail-btn:has-text("Trans")').first();
  if (await transRail.isVisible().catch(() => false)) {
    await transRail.click();
    await page.waitForTimeout(500);
  } else {
    await page.locator('button:has-text("Transitions")').first().click().catch(() => undefined);
    await page.waitForTimeout(500);
  }
  await shot(page, 'editor-transition-picker.png');

  // Title tool
  const textRail = page.locator('button.ilv-rail-btn:has-text("Text")').first();
  if (await textRail.isVisible().catch(() => false)) {
    await textRail.click();
    await page.waitForTimeout(400);
  }
  await shot(page, 'editor-title-tool.png');

  // Lyrics scene + panel
  const lyricsClip = page.locator('.ilv-scene-typebar:has-text("Lyrics")').first();
  if (await lyricsClip.isVisible().catch(() => false)) {
    await lyricsClip.click();
    await page.waitForTimeout(400);
  }
  const lyricsRail = page.locator('button.ilv-rail-btn:has-text("Lyrics")').first();
  if (await lyricsRail.isVisible().catch(() => false)) {
    await lyricsRail.click();
    await page.waitForTimeout(500);
  }
  await shot(page, 'editor-lyrics-track.png');

  // Player with lyrics on
  const playTop = page.locator('button.ilv-btn:has-text("Play")').first();
  if (await playTop.isVisible().catch(() => false)) {
    await playTop.click();
    await page.waitForTimeout(800);
  }
  // Jump toward karaoke if possible via next
  for (let i = 0; i < 2; i++) {
    const next = page.locator('.ilv-player-controls button[aria-label="Next scene"]').first();
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(400);
    }
  }
  // Ensure lyrics on
  const lyricsToggle = page.locator('.ilv-player-controls button:has-text("Lyrics")').first();
  if (await lyricsToggle.isVisible().catch(() => false)) {
    const pressed = await lyricsToggle.getAttribute('aria-pressed');
    if (pressed === 'false') await lyricsToggle.click();
  }
  await page.waitForTimeout(600);
  await shot(page, 'player-lyrics-on.png');

  if (await lyricsToggle.isVisible().catch(() => false)) {
    await lyricsToggle.click();
    await page.waitForTimeout(400);
  }
  await shot(page, 'player-lyrics-off.png');

  // Close player
  const closePlayer = page.locator('.ilv-player button[aria-label="Close player"]').first();
  if (await closePlayer.isVisible().catch(() => false)) await closePlayer.click();
  await page.waitForTimeout(500);

  // Close editor
  const closeEd = page.locator('.ilv-editor-header button:has-text("Close")').first();
  if (await closeEd.isVisible().catch(() => false)) await closeEd.click();
  await page.waitForTimeout(800);

  // Lesson library → open a lesson → attach section
  const libTab = page.locator('[data-tab="lesson-library"], button:has-text("Lesson Library"), button:has-text("Lessons")').first();
  if (await libTab.isVisible().catch(() => false)) {
    await libTab.click();
    await page.waitForTimeout(1200);
  }
  // Click first lesson card-ish
  const card = page.locator('button, [role="button"], .cursor-pointer').filter({ hasText: /Lesson|Week|Welcome/i }).first();
  if (await card.isVisible().catch(() => false)) {
    await card.click();
    await page.waitForTimeout(1000);
  } else {
    // try any clickable lesson
    await page.locator('main button').nth(3).click().catch(() => undefined);
    await page.waitForTimeout(1000);
  }

  // Scroll attach into view
  const attach = page.locator('text=Add interactive lesson, text=Interactive lesson').first();
  if (await attach.isVisible().catch(() => false)) {
    await attach.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }
  await shot(page, 'in-lesson-attach.png');

  await browser.close();
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
