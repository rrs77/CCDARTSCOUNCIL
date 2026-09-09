/**
 * Unit tests for download/CSV helpers (no Supabase credentials required).
 * Run: node --test api/__tests__/downloadShared.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowListedUrl,
  sanitizeSpreadsheetCell,
  toCsv,
  userMayDownload,
} from '../_downloadShared.js';

describe('isAllowListedUrl', () => {
  it('allows rhythmstix https', () => {
    assert.equal(
      isAllowListedUrl(
        'https://www.rhythmstix.co.uk/uploads/ccd/partners/jazznorth/jn-hello-song-score.pdf',
      ),
      true,
    );
  });

  it('rejects non-allowlisted hosts', () => {
    assert.equal(isAllowListedUrl('https://evil.example/file.pdf'), false);
  });

  it('rejects javascript urls', () => {
    assert.equal(isAllowListedUrl('javascript:alert(1)'), false);
  });
});

describe('sanitizeSpreadsheetCell', () => {
  it('prefixes formula-like cells', () => {
    assert.equal(sanitizeSpreadsheetCell('=cmd|'), "'=cmd|");
    assert.equal(sanitizeSpreadsheetCell('+1234'), "'+1234");
    assert.equal(sanitizeSpreadsheetCell('-1+1'), "'-1+1");
    assert.equal(sanitizeSpreadsheetCell('@SUM(A1)'), "'@SUM(A1)");
  });

  it('leaves normal text', () => {
    assert.equal(sanitizeSpreadsheetCell('Hello Song'), 'Hello Song');
  });
});

describe('toCsv', () => {
  it('escapes commas and quotes', () => {
    const csv = toCsv(
      [{ title: 'a,b', note: 'say "hi"' }],
      [
        { header: 'Title', key: 'title' },
        { header: 'Note', key: 'note' },
      ],
    );
    assert.match(csv, /"a,b"/);
    assert.match(csv, /""hi""/);
  });
});

describe('userMayDownload', () => {
  it('blocks suspended and anonymised', () => {
    assert.equal(
      userMayDownload({ status: 'suspended' }, { requires_auth: true }),
      false,
    );
    assert.equal(
      userMayDownload({ status: 'active', anonymised_at: '2026-01-01' }, { requires_auth: true }),
      false,
    );
  });

  it('allows active users for auth resources', () => {
    assert.equal(
      userMayDownload({ status: 'active' }, { requires_auth: true }),
      true,
    );
  });

  it('blocks invited for auth resources', () => {
    assert.equal(
      userMayDownload({ status: 'invited' }, { requires_auth: true }),
      false,
    );
  });
});
