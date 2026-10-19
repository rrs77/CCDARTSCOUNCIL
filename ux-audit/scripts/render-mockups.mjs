import puppeteer from '/tmp/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import path from 'path';
import fs from 'fs';

const HTML = 'file:///workspace/ux-audit/mockups/render-mockups.html';
const OUT = '/workspace/ux-audit/images';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
    defaultViewport: { width: 1480, height: 1000, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await page.goto(HTML, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);

  const shots = [
    ['m01', '01-after.png'],
    ['m02', '02-after.png'],
    ['m03', '03-after.png'],
    ['m04', '04-after.png'],
    ['m05', '05-after.png'],
    ['m06', '06-after.png'],
    ['m07', '07-after.png'],
    ['m08', '08-after.png'],
    ['msitemap', '00-sitemap.png'],
  ];

  for (const [id, file] of shots) {
    const el = await page.$(`#${id}`);
    if (!el) throw new Error('missing ' + id);
    await el.screenshot({ path: path.join(OUT, file), type: 'png' });
    console.log('wrote', file);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
