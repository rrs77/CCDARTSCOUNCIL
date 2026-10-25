import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inflateSync } from 'node:zlib';
import {
  PLAN_LOGO_ASPECT,
  PLAN_LOGO_DATA_URI,
  PLAN_LOGO_HEIGHT_PX,
  PLAN_LOGO_WIDTH_PX,
  PLAN_LOGO_PATH,
  PLAN_LOGO_PRINT_CSS,
  PLAN_LOGO_SOURCE_HEIGHT,
  PLAN_LOGO_SOURCE_WIDTH,
  htmlHasColourPlanLogo,
  planDocxHeaderFooter,
  planLogoDocx,
  planLogoHtml,
  planLogoImg,
  planLogoHeaderTemplateHtml,
  planLogoPrintRunningCss,
  planLogoPrintTheadHtml,
  planLogoTagIsStandardSize,
  planLogoPngBytes,
  planLogoUrl,
  planSheetChrome,
  PLAN_LOGO_PRINT_HEIGHT_PX,
  PLAN_LOGO_PRINT_WIDTH_PX,
  PLAN_LOGO_COLOUR_DATA_URL,
} from './planLogo.ts';
import { PLAN_LOGO_PNG_HEIGHT, PLAN_LOGO_PNG_WIDTH } from './planLogoData.ts';

const W = PLAN_LOGO_WIDTH_PX;
const H = PLAN_LOGO_HEIGHT_PX;

/** Minimal PNG decoder (8-bit RGBA, non-interlaced) so the test can look at real pixels. */
function decodePng(bytes: Uint8Array) {
  const buf = Buffer.from(bytes);
  assert.deepEqual([...buf.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], 'PNG signature');
  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colourType = 0;
  const idat: Buffer[] = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colourType = data[9];
      assert.equal(data[12], 0, 'not interlaced');
    } else if (type === 'IDAT') idat.push(data);
    off += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x += 1) {
      const r = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      let v = r;
      if (f === 1) v = r + a;
      else if (f === 2) v = r + b;
      else if (f === 3) v = r + ((a + b) >> 1);
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v = r + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      px[y * stride + x] = v & 255;
    }
  }
  return { width, height, bitDepth, colourType, px };
}

describe('plan logo: one colour source of truth', () => {
  it('is an embedded PNG data URI (never a URL that can fail to load)', () => {
    assert.match(PLAN_LOGO_DATA_URI, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
    assert.equal(planLogoUrl(), PLAN_LOGO_DATA_URI);
    assert.equal(PLAN_LOGO_PATH, '/ccdesigner-logo-colour.png');
  });

  it('is genuinely in colour (truecolour RGBA with many saturated pixels)', () => {
    const png = decodePng(planLogoPngBytes());
    assert.equal(png.width, PLAN_LOGO_PNG_WIDTH);
    assert.equal(png.height, PLAN_LOGO_PNG_HEIGHT);
    assert.equal(png.bitDepth, 8);
    assert.equal(png.colourType, 6, 'RGBA truecolour, not greyscale (0/4)');
    let coloured = 0;
    let opaque = 0;
    for (let i = 0; i < png.px.length; i += 4) {
      const [r, g, b, a] = [png.px[i], png.px[i + 1], png.px[i + 2], png.px[i + 3]];
      if (a < 128) continue;
      opaque += 1;
      if (Math.max(r, g, b) - Math.min(r, g, b) > 60) coloured += 1;
    }
    assert.ok(opaque > 1000, `opaque pixels ${opaque}`);
    assert.ok(coloured / opaque > 0.2, `coloured share ${(coloured / opaque).toFixed(2)}`);
  });

  it('keeps the canonical artwork aspect (784×192)', () => {
    assert.ok(Math.abs(PLAN_LOGO_ASPECT - PLAN_LOGO_SOURCE_WIDTH / PLAN_LOGO_SOURCE_HEIGHT) < 0.01);
  });

  it('one size everywhere: ~140px wide / 34px tall (784×192 aspect)', () => {
    assert.equal(PLAN_LOGO_HEIGHT_PX, 34);
    assert.equal(PLAN_LOGO_WIDTH_PX, 139);
    assert.ok(Math.abs(PLAN_LOGO_WIDTH_PX / PLAN_LOGO_HEIGHT_PX - 784 / 192) < 0.05);
  });

  it('legacy planLogoHtml(height) ignores the height and renders the standard size', () => {
    for (const h of [undefined, 21, 28, 30, 40, 34]) assert.equal(planLogoHtml(h, 'margin:0'), planLogoImg('margin:0'));
  });

  it('renders with fixed width/height and print-colour-exact, no filter', () => {
    const html = planLogoImg();
    assert.ok(new RegExp(`width="${W}" height="${H}"`).test(html));
    assert.match(html, new RegExp(`height:${H}px;width:${W}px`));
    assert.match(html, /print-color-adjust:exact/);
    assert.match(html, /filter:none/);
    assert.ok(htmlHasColourPlanLogo(html));
    assert.match(PLAN_LOGO_PRINT_CSS, /print-color-adjust:exact!important/);
  });
});

describe('colour-logo guard', () => {
  it('fails when the logo is missing, greyscale, mono or not the canonical asset', () => {
    assert.equal(htmlHasColourPlanLogo('<html><body>No logo</body></html>'), false);
    assert.equal(htmlHasColourPlanLogo(planLogoHtml(30, 'filter:grayscale(1)')), false);
    assert.equal(htmlHasColourPlanLogo(planLogoHtml(30, 'filter: saturate(0)')), false);
    assert.equal(htmlHasColourPlanLogo(`<style>.ccd-plan-logo{filter:grayscale(100%)}</style>${planLogoHtml()}`), false);
    assert.equal(htmlHasColourPlanLogo('<img class="ccd-plan-logo" src="/ccdesigner-logo-black-v2.png">'), false);
    assert.equal(htmlHasColourPlanLogo('<img class="ccd-plan-logo" src="/cre-logo.png">'), false);
    assert.equal(htmlHasColourPlanLogo(`<img class="ccd-plan-logo mono" src="${PLAN_LOGO_DATA_URI}">`), false);
    assert.equal(htmlHasColourPlanLogo(`<style>${PLAN_LOGO_PRINT_CSS}</style>${planLogoHtml()}`), true);
  });
  it('fails when a logo is any other height or width', () => {
    for (const [w, h] of [[122, 30], [141, 40], [114, 28], [86, 21], [90, 34]]) {
      const tag = planLogoImg()
        .replace(`width="${W}" height="${H}"`, `width="${w}" height="${h}"`)
        .replace(`height:${H}px;width:${W}px`, `height:${h}px;width:${w}px`);
      assert.equal(planLogoTagIsStandardSize(tag), false, `${w}×${h}`);
      assert.equal(htmlHasColourPlanLogo(tag), false, `${w}×${h}`);
    }
    assert.equal(planLogoTagIsStandardSize(planLogoImg().replace(`height:${H}px`, 'height:40px')), false, 'style height');
    assert.equal(planLogoTagIsStandardSize(planLogoImg()), true);
  });
});

describe('sheet chrome (in-lesson sheet, later)', () => {
  it('logo top-left at standard size, body footer with © CCDesigner year, no @page box', () => {
    const c = planSheetChrome({ year: 2026 });
    assert.ok(htmlHasColourPlanLogo(c.headerHtml));
    assert.ok(new RegExp(`width="${W}" height="${H}"`).test(c.headerHtml));
    assert.match(c.footerHtml, /Page N · © CCDesigner 2026/);
    assert.doesNotMatch(c.css, /@page\s*\{/);
    assert.doesNotMatch(c.css, /@bottom-center\s*\{/);
    for (const m of c.css.matchAll(/font-size:(\d+)px/g)) assert.ok(Number(m[1]) >= 13);
  });
});

describe('Word (.docx) logo and header/footer spec', () => {
  it('gives colour PNG bytes at the standard PLAN_LOGO size (EMU)', () => {
    const logo = planLogoDocx();
    assert.equal(logo.type, 'png');
    assert.deepEqual([...logo.data.subarray(0, 4)], [137, 80, 78, 71]);
    assert.equal(decodePng(logo.data).colourType, 6);
    assert.equal(logo.width, W);
    assert.equal(logo.height, H);
    assert.equal(logo.widthEmu, W * 9525);
    assert.equal(logo.heightEmu, H * 9525);
    assert.equal(logo.altText, 'CCDesigner');
  });

  it('header: logo left; footer: centred "Page {n} · © CCDesigner <year>"', () => {
    const spec = planDocxHeaderFooter({ year: 2026 });
    assert.equal(spec.header.alignment, 'left');
    assert.equal(spec.header.logo.height, H);
    assert.equal(spec.footer.alignment, 'center');
    assert.ok(spec.footer.fontSizePt >= 10, '10pt ≈ 13px');
    assert.deepEqual(spec.footer.parts, [
      { kind: 'text', text: 'Page ' },
      { kind: 'pageNumber' },
      { kind: 'text', text: ' · © CCDesigner 2026' },
    ]);
    assert.equal(planDocxHeaderFooter().footer.parts[2].kind, 'text');
  });
});

describe('LessonPrintModal PDF header / print thead chrome', () => {
  it('header template and print HTML carry the colour standard-size logo', () => {
    assert.equal(PLAN_LOGO_PRINT_HEIGHT_PX, H);
    assert.equal(PLAN_LOGO_PRINT_WIDTH_PX, W);
    assert.equal(PLAN_LOGO_COLOUR_DATA_URL, PLAN_LOGO_DATA_URI);

    const header = planLogoHeaderTemplateHtml();
    assert.ok(header.includes(PLAN_LOGO_DATA_URI));
    assert.match(header, new RegExp(`height="${H}"`));
    assert.match(header, new RegExp(`width="${W}"`));
    assert.doesNotMatch(header, /grayscale/i);

    const thead = planLogoPrintTheadHtml();
    assert.match(thead, /ccd-export-print-logo-row/);
    assert.ok(thead.includes(PLAN_LOGO_DATA_URI));
    assert.match(thead, new RegExp(`height="${H}"`));
    assert.match(thead, /padding:0 0 16px 0/);

    assert.match(header, /padding:6px 20px 10px 20px/);

    const css = planLogoPrintRunningCss();
    assert.match(css, /table-header-group/);
    assert.match(css, new RegExp(`height:\\s*${H}px`));
    assert.match(css, new RegExp(`width:\\s*${W}px`));
    assert.doesNotMatch(css, /grayscale/i);
  });
});
