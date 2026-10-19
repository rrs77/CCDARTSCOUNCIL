import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const BASE='http://127.0.0.1:5173';
const OUT='/workspace/ux-audit/screenshots';
fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto(BASE,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>{sessionStorage.setItem('ccd-prototype-gate','1');sessionStorage.setItem('ccd-demo-mode','1');sessionStorage.setItem('ccd-prototype-welcome-seen-v4','1');});
await page.goto(`${BASE}/?demo=1&tab=unit-viewer`,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(2000);
await page.evaluate(()=>document.querySelectorAll('.fixed.inset-0').forEach(e=>e.remove()));
const expand=page.locator('button[aria-label="Expand menu"]').first();
if(await expand.isVisible().catch(()=>false)) await expand.click();

async function shot(n){await page.screenshot({path:path.join(OUT,n)});console.log(n);}

// VIEW dropdown - look for native select or custom
const viewSelect = page.locator('select').filter({hasText:/Week|Day|Month/}).first();
if(await viewSelect.isVisible().catch(()=>false)){
  await viewSelect.selectOption({label:'Day'});
  await page.waitForTimeout(800);
  await shot('03-planner-day.png');
  await viewSelect.selectOption({label:'Month'});
  await page.waitForTimeout(800);
  await shot('03-planner-month.png');
  await viewSelect.selectOption({label:'Week'});
} else {
  // custom dropdown near VIEW label
  const near = page.locator('text=VIEW').locator('..').locator('button,select,[role="combobox"]').first();
  console.log('near view visible', await near.isVisible().catch(()=>false));
  // dump HTML around view
  const html = await page.evaluate(()=>{
    const el=[...document.querySelectorAll('*')].find(e=>e.childNodes && [...e.childNodes].some(n=>n.nodeType===3 && /VIEW/.test(n.textContent||'')));
    return el?el.parentElement?.innerHTML?.slice(0,1500):'none';
  });
  console.log('VIEW HTML', html?.slice(0,800));
  await near.click().catch(()=>{});
  await page.waitForTimeout(400);
  await page.getByText(/^Day$/).last().click().catch(()=>{});
  await page.waitForTimeout(800);
  await shot('03-planner-day.png');
}

// Units tab - force click the room tab
const units = page.locator('button').filter({hasText:/^Units$/}).first();
console.log('units', await units.isVisible());
await units.click({force:true});
await page.waitForTimeout(1200);
await shot('03b-planner-units.png');
const title = await page.locator('h1,h2').first().innerText().catch(()=>'');
console.log('after units title', title);

// Timetable again with save empty state
await page.locator('button').filter({hasText:/^Timetable builder$/}).first().click({force:true});
await page.waitForTimeout(1000);
await shot('04-timetable-builder.png');

// Hub page drill
await page.locator('.ccd-studio-nav [data-tab="our-partners"]').first().click({force:true});
await page.waitForTimeout(1000);
await page.evaluate(()=>document.querySelectorAll('.fixed.inset-0').forEach(e=>e.remove()));
await page.locator('button, a, li').filter({hasText:/^London$/}).first().click({force:true}).catch(()=>{});
await page.waitForTimeout(1000);
// click first hub card arrow / title
const hub = page.locator('article, a, button').filter({hasText:/Music Hub/}).first();
await hub.click({force:true}).catch(()=>{});
await page.waitForTimeout(1500);
await shot('10c-partner-hub-page.png');
console.log('hub url', page.url());
console.log('hub h1', await page.locator('h1').first().innerText().catch(()=>''));

// Slides editor
await page.locator('.ccd-studio-nav [data-tab="lesson-viewer"]').first().click({force:true});
await page.waitForTimeout(1000);
await page.evaluate(()=>document.querySelectorAll('.fixed.inset-0').forEach(e=>e.remove()));
await page.getByRole('button',{name:/^Edit$/}).first().click({force:true}).catch(()=>{});
await page.waitForTimeout(1500);
await shot('09c-slides-editor.png');

// Lessons dense actions closeup - already have 07
await page.locator('.ccd-studio-nav [data-tab="lesson-library"]').first().click({force:true});
await page.waitForTimeout(1000);
await page.evaluate(()=>document.querySelectorAll('.fixed.inset-0').forEach(e=>e.remove()));
const expand2=page.locator('button[aria-label="Expand menu"]').first();
if(await expand2.isVisible().catch(()=>false)) await expand2.click();
await shot('07-lessons.png');
// Copy link modal
await page.getByRole('button',{name:/Copy Link/i}).first().click({force:true});
await page.waitForTimeout(800);
await shot('16b-copy-link.png');
await page.keyboard.press('Escape');
// Export PDF - often in lesson selection modal
await page.locator('button, a, div').filter({hasText:/For Parents/}).first().click({force:true}).catch(()=>{});
await page.waitForTimeout(1000);
await shot('16-lesson-opened.png');
const pdf=page.getByRole('button',{name:/Export PDF/i}).first();
if(await pdf.isVisible().catch(()=>false)){await pdf.click({force:true});await page.waitForTimeout(800);await shot('16c-export-pdf.png');}
else {
  // look for any Export
  const any=page.locator('button').filter({hasText:/Export|PDF|Share/}).first();
  console.log('export visible', await any.isVisible().catch(()=>false), await any.innerText().catch(()=>''));
  if(await any.isVisible().catch(()=>false)){await any.click({force:true});await page.waitForTimeout(800);await shot('16c-export-pdf.png');}
}

await browser.close();
