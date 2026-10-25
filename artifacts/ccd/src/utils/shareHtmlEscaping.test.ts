/**
 * User-supplied strings in share / print HTML are escaped (security: HTML injection in
 * the timetable share and the lesson share fallback). Payloads: <b>x</b>, an onerror
 * <img>, and a double quote.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { escapeHtmlText } from './escapeHtml.ts';
import { safeColour } from './safeColour.ts';
import { sanitizeUrl } from './safeUrl.ts';
import { buildTimetableShareHtml } from './timetableShareHtml.ts';

const PAYLOADS = ['<b>x</b>', '<img src=x onerror=alert(1)>', 'say "hi"'];

describe('escapeHtmlText (shared helper)', () => {
  it('escapes & < > " \'', () => {
    assert.equal(escapeHtmlText('<b>x</b>'), '&lt;b&gt;x&lt;/b&gt;');
    assert.equal(escapeHtmlText('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
    assert.equal(escapeHtmlText(`a"b'c&`), 'a&quot;b&#39;c&amp;');
    assert.equal(escapeHtmlText(undefined), '');
    assert.equal(escapeHtmlText(45), '45');
  });
});

describe('timetable share HTML escapes every user string', () => {
  for (const bad of PAYLOADS) {
    it(JSON.stringify(bad), () => {
      const [html, footer] = buildTimetableShareHtml(
        [{ id: '1', day: 1, startTime: '09:00', endTime: '10:00', className: bad, location: bad, color: `#14b8a6${bad.includes('"') ? '"' : ''}` }],
        bad,
      );
      for (const out of [html, footer]) {
        assert.ok(!out.includes('<b>x</b>'), 'no raw <b>');
        assert.ok(!/<img src=x/i.test(out), 'no raw <img onerror>');
        assert.ok(!out.includes('say "hi"'), 'no raw double quote');
        assert.ok(out.includes(escapeHtmlText(bad)), 'escaped text present');
      }
      // title, header and the class row all carry the escaped name
      assert.ok(html.includes(`<title>Class Timetable - ${escapeHtmlText(bad)}</title>`));
      assert.ok(!html.includes('#14b8a6"'), 'colour attribute cannot break out');
    });
  }
  it('plain names are unchanged', () => {
    const [html] = buildTimetableShareHtml(
      [{ id: '1', day: 1, startTime: '09:00', endTime: '10:00', className: 'Year 3 Music', location: 'Hall', color: '#14b8a6' }],
      'Year 3',
    );
    assert.match(html, /Year 3 Music/);
    assert.match(html, /border-left-color: #14b8a6;/);
  });
});

/**
 * The share fallback HTML is built inside a React hook (useShareLesson), so it is
 * guarded at source level: every interpolation in its HTML goes through the shared
 * escape, sanitizeHtml (rich text) or safeHref (links), or is the shared logo.
 */
describe('share fallback (useShareLesson) escapes every user string', () => {
  const src = readFileSync(fileURLToPath(new URL('../hooks/useShareLesson.ts', import.meta.url)), 'utf8');
  const start = src.indexOf('<!DOCTYPE html>');
  const end = src.indexOf('const footerContent');
  const body = src.slice(start, src.indexOf('`;', src.indexOf('</p>', end)) + 2);
  it('uses the shared helper', () => {
    assert.match(src, /import \{ escapeHtmlText, sanitizeHtml, sanitizeUrl \} from '\.\.\/utils\/sanitize'/);
    assert.match(src, /const escapeShareText = escapeHtmlText;/);
  });
  it('no raw ${...} interpolation of user data in the HTML or footer', () => {
    const SAFE = /^\$\{(escapeShareText|sanitizeHtml|safeHref|planLogoHtml|planLogoImg|PLAN_LOGO_PRINT_CSS)\(|^\$\{PLAN_LOGO_PRINT_CSS\}/;
    const raw: string[] = [];
    // Only interpolations that land in markup (inside the html/footer template literals).
    for (const m of body.matchAll(/\$\{[^}]*\}?/g)) {
      const s = m[0];
      if (SAFE.test(s)) continue;
      // conditionals that wrap escaped parts, e.g. ${x ? `<p>${sanitizeHtml(..)}</p>` : ''}
      if (/^\$\{(activity\.time > 0|activity\.activityText|resources\.length|onDismiss) \?/.test(s)) continue;
      raw.push(s);
    }
    assert.deepEqual(raw.filter((s) => !/^\$\{(sectionName|areaName|termSpecificNumber|halfTermName \|\| 'Autumn 1'|currentSheetInfo\.display|footerCompany|footerYear|categoryColor)\}/.test(s)), []);
  });
});

describe('safeColour (CSS injection in style attributes)', () => {
  const BAD = ['red;background:url(https://x/..)', '#fff;background:url(//x)', 'url(https://x)', 'expression(alert(1))', 'red', '#12', '#1234567890', 'rgb(1,2,3);x:y', '', undefined, null, 42];
  it('allows #hex and simple rgb()/hsl()', () => {
    for (const ok of ['#fff', '#14b8a6', '#14B8A6CC', 'rgb(20, 184, 166)', 'rgba(20,184,166,0.5)', 'hsl(173 80% 40%)', 'hsla(173, 80%, 40%, .5)']) {
      assert.equal(safeColour(ok, '#000000'), ok, ok);
    }
  });
  it('falls back to the default for anything else', () => {
    for (const bad of BAD) assert.equal(safeColour(bad, '#000000'), '#000000', String(bad));
  });
  it('timetable share: a malicious class colour falls back to the default', () => {
    const [html] = buildTimetableShareHtml(
      [{ id: '1', day: 1, startTime: '09:00', endTime: '10:00', className: 'Y3', location: '', color: 'red;background:url(https://x/..)' }],
      'Y3',
    );
    assert.ok(!/url\(https:\/\/x/.test(html), 'no injected CSS');
    assert.match(html, /border-left-color: #14b8a6;/);
    assert.match(html, /background-color: #14b8a6;/);
  });
  it('share fallback, Planner print and calendar export route colours through safeColour', () => {
    const read = (f: string) => readFileSync(fileURLToPath(new URL(f, import.meta.url)), 'utf8');
    const share = read('../hooks/useShareLesson.ts');
    assert.match(share, /const categoryColor = safeColour\(getCategoryColor\(category\), '#6B7280'\);/);
    assert.match(read('../components/planner/Planner.tsx'), /const color = safeColour\(c\?\.color, '#475569'\);/);
    const cal = read('../components/LessonPlannerCalendar.tsx');
    assert.doesNotMatch(cal, /(background|color|border-left-color):\$\{escape\(/, 'calendar colours use safeColour');
    assert.match(cal, /safeColour\(e\.color, '#64748b'\)/);
  });
});

describe('sanitizeUrl', () => {
  it('rejects protocol-relative and other unsafe URLs', () => {
    for (const bad of ['//evil.com', '//evil.com/x', '/\\evil.com', 'javascript:alert(1)', 'data:text/html,x', ' //evil.com']) {
      assert.equal(sanitizeUrl(bad), '#', bad);
    }
  });
  it('keeps http(s), same-origin paths, ./ and #', () => {
    for (const ok of ['https://a.example/x', 'http://a.example', '/lessons/1', './x', '#top']) assert.equal(sanitizeUrl(ok), ok, ok);
  });
});
