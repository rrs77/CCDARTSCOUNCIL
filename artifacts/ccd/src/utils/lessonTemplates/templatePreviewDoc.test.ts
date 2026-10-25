import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { templatePreviewDoc } from './templatePreviewDoc.ts';
import { htmlHasColourPlanLogo } from '../planLogo.ts';
import { RHYTHMSTIX_TEMPLATES, buildRhythmstixDoc, renderRhythmstixHtml } from './rhythmstixTemplates.ts';

const lesson = {
  grouped: {},
  categoryOrder: [],
  totalTime: 45,
  title: 'Preview lesson',
  sections: Array.from({ length: 5 }, (_, i) => ({ id: String(i), kind: 'free_text', title: `Step ${i + 1}`, durationMins: 5, bodyHtml: 'Do it.' })),
};

describe('template preview document', () => {
  it('wraps the PDF renderer output unchanged, page 1 only when asked', () => {
    const html = renderRhythmstixHtml(buildRhythmstixDoc(lesson, { templateId: 'ks3' }));
    const p1 = templatePreviewDoc(html, { pageOne: true, baseHref: 'https://example.test/' });
    assert.ok(p1.includes(html));
    assert.match(p1, /\.rx-cont,\.rx-cont~\*,\.rx-ref,\.rx-ref~\*\{display:none!important\}/);
    assert.match(p1, /<base href="https:\/\/example.test\/" target="_blank">/);
    const full = templatePreviewDoc(html);
    assert.doesNotMatch(full, /display:none!important/);
  });
  it('escapes the base href', () => {
    assert.match(templatePreviewDoc('', { baseHref: 'https://x.test/"><script>' }), /href="https:\/\/x.test\/&quot;><script>"/);
  });
});

describe('logo', () => {
  it('every template shows the CCDesigner logo and never a Rhythmstix logo or wordmark', () => {
    for (const t of RHYTHMSTIX_TEMPLATES) {
      const html = renderRhythmstixHtml(buildRhythmstixDoc(lesson, { templateId: t.id }));
      assert.ok(/data-logo-slot="top-left"><img class="ccd-plan-logo" data-ccd-plan-logo="colour" src="data:image\/png;base64,/.test(html), t.id);
      assert.ok(htmlHasColourPlanLogo(html), t.id);
      assert.doesNotMatch(html, /rx-wordmark|R H Y T H M S T I X|RHYTHMSTIX/, t.id);
    }
  });
});

describe('footer', () => {
  it('every template footer is CCDesigner, not Rhythmstix', () => {
    const year = new Date().getFullYear();
    for (const t of RHYTHMSTIX_TEMPLATES) {
      const html = renderRhythmstixHtml(buildRhythmstixDoc(lesson, { templateId: t.id }));
      assert.match(html, new RegExp(`@bottom-left\\{content:"© CCDesigner ${year}"`), t.id);
      assert.match(html, /@bottom-center\{content:"www\.ccdesigner\.co\.uk"/, t.id);
      assert.match(html, new RegExp(`<footer class="rx-foot"><span>© CCDesigner ${year}</span><span>www.ccdesigner.co.uk</span>`), t.id);
      assert.doesNotMatch(html, /© Rhythmstix|www\.rhythmstix\.co\.uk/, t.id);
    }
  });
});
