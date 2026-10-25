import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTimetableShareHtml } from './timetableShareHtml.ts';
import { htmlHasColourPlanLogo } from './planLogo.ts';

describe('timetable share HTML', () => {
  it('has the CCDesigner logo, no Tailwind CDN, and footer text at 13px+', () => {
    const [html, footer] = buildTimetableShareHtml(
      [{ id: '1', day: 1, startTime: '09:00', endTime: '10:00', className: 'Year 3 Music', location: 'Hall', color: '#14b8a6' }],
      'Year 3',
    );
    assert.ok(htmlHasColourPlanLogo(html), 'colour CCDesigner logo');
    assert.doesNotMatch(html, /<script|cdn\.tailwindcss/);
    assert.match(html, /Monday/);
    assert.match(footer, /font-size: 13px/);
  });
});
