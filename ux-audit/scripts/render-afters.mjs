import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const HTML = path.resolve('/workspace/ux-audit/mockups/afters.html');
const OUT = '/workspace/ux-audit/images';
fs.mkdirSync(OUT, { recursive: true });

const ids = [
  ['after-01', '01-after.png'],
  ['after-02', '02-after.png'],
  ['after-03', '03-after.png'],
  ['after-04', '04-after.png'],
  ['after-05', '05-after.png'],
  ['after-06', '06-after.png'],
  ['after-07', '07-after.png'],
  ['after-08', '08-after.png'],
  ['sitemap', '00-sitemap.png'],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1480, height: 980 }, deviceScaleFactor: 1 });
await page.goto('file://' + HTML, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

for (const [id, file] of ids) {
  const loc = page.locator('#' + id);
  await loc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await loc.screenshot({ path: path.join(OUT, file) });
  console.log('saved', file);
}

await browser.close();
