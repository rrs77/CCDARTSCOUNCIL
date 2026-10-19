import { chromium } from 'playwright';
import path from 'path';
const BASE='http://127.0.0.1:5173';
const OUT='/workspace/ux-audit/screenshots';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto(BASE,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>{sessionStorage.setItem('ccd-prototype-gate','1');sessionStorage.setItem('ccd-demo-mode','1');});
await page.goto(`${BASE}/?demo=1&tab=our-partners&page=hub&at=england/london/london-east`,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(2000);
await page.evaluate(()=>document.querySelectorAll('.fixed.inset-0').forEach(e=>e.remove()));
const expand=page.locator('button[aria-label="Expand menu"]').first();
if(await expand.isVisible().catch(()=>false)) await expand.click();
await page.screenshot({path:path.join(OUT,'10c-partner-hub-page.png')});
console.log('url', page.url(), 'h1', await page.locator('h1').first().innerText().catch(()=>''));
// try area page
await page.goto(`${BASE}/?demo=1&tab=our-partners&page=area&at=england/london`,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1500);
await page.evaluate(()=>document.querySelectorAll('.fixed.inset-0').forEach(e=>e.remove()));
await page.screenshot({path:path.join(OUT,'10b-partner-hubs-region.png')});
console.log('area', await page.locator('h1').first().innerText().catch(()=>''));
// export from lesson selection - open builder saved lesson
await page.goto(`${BASE}/?demo=1&tab=lesson-library`,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1500);
await page.evaluate(()=>document.querySelectorAll('.fixed.inset-0').forEach(e=>e.remove()));
if(await expand.isVisible().catch(()=>false)) await expand.click();
// click Copy Link by text content on any element
await page.locator('text=Copy Link').first().click({force:true}).catch(async()=>{
  await page.locator('button').filter({hasText:/Copy/}).first().click({force:true}).catch(()=>{});
});
await page.waitForTimeout(800);
await page.screenshot({path:path.join(OUT,'16b-copy-link.png')});
await browser.close();
