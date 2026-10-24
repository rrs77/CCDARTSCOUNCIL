/**
 * Decision 2 — share links are signed-in users only.
 * Run: node --test api/__tests__/fileShareAccess.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSignInRedirectLocation,
  prefersHtmlNavigation,
  safeInAppReturnPath,
  unauthenticatedFileShareResponse,
} from '../_authShared.js';

const FILE = '/api/files/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.pdf';

describe('safeInAppReturnPath (share return)', () => {
  it('accepts file proxy share paths', () => {
    assert.equal(safeInAppReturnPath(FILE), FILE);
  });

  it('rejects absolute and protocol-relative URLs', () => {
    assert.equal(safeInAppReturnPath('https://evil.example/x'), null);
    assert.equal(safeInAppReturnPath('//evil.example/x'), null);
  });
});

describe('buildSignInRedirectLocation', () => {
  it('returns to the shared file after sign-in', () => {
    const loc = buildSignInRedirectLocation(FILE);
    assert.equal(loc.startsWith('/?'), true);
    const params = new URLSearchParams(loc.slice(2));
    assert.equal(params.get('return'), FILE);
    assert.equal(params.get('signin'), '1');
  });
});

describe('prefersHtmlNavigation', () => {
  it('detects browser navigations', () => {
    assert.equal(
      prefersHtmlNavigation(
        new Request('https://ccd.example' + FILE, {
          headers: { Accept: 'text/html', 'Sec-Fetch-Mode': 'navigate' },
        }),
      ),
      true,
    );
  });

  it('treats JSON API clients as non-HTML', () => {
    assert.equal(
      prefersHtmlNavigation(
        new Request('https://ccd.example' + FILE, {
          headers: { Accept: 'application/json' },
        }),
      ),
      false,
    );
  });
});

describe('unauthenticatedFileShareResponse', () => {
  it('redirects HTML navigations to sign-in with return= share path', async () => {
    const res = unauthenticatedFileShareResponse(
      new Request('https://ccd.example' + FILE, {
        headers: { Accept: 'text/html', 'Sec-Fetch-Mode': 'navigate' },
      }),
      FILE,
    );
    assert.equal(res.status, 302);
    const loc = res.headers.get('Location');
    assert.ok(loc);
    const params = new URLSearchParams(loc.slice(2));
    assert.equal(params.get('return'), FILE);
    assert.equal(params.get('signin'), '1');
    // No expiring signed share token in the redirect.
    assert.equal(loc.includes('share_token='), false);
    assert.equal(loc.includes('signed='), false);
  });

  it('returns 401 JSON for API clients (no anonymous access)', async () => {
    const res = unauthenticatedFileShareResponse(
      new Request('https://ccd.example' + FILE, {
        headers: { Accept: 'application/json' },
      }),
      FILE,
    );
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.error, /sign in/i);
  });

  it('returns 401 when Accept is missing (no silent public access)', async () => {
    const res = unauthenticatedFileShareResponse(
      new Request('https://ccd.example' + FILE),
      FILE,
    );
    assert.equal(res.status, 401);
  });
});

describe('client file share helpers', () => {
  it('recognises proxy share paths and appends session token only', async () => {
    const {
      isFileShareApiPath,
      appendSessionTokenToFileShareUrl,
    } = await import('../../artifacts/ccd/src/utils/fileShareAccess.ts');

    assert.equal(isFileShareApiPath(FILE), true);
    assert.equal(isFileShareApiPath('/api/files/../etc/passwd'), false);
    assert.equal(isFileShareApiPath('/forum'), false);

    const withToken = appendSessionTokenToFileShareUrl(FILE, 'session-jwt');
    assert.equal(withToken.startsWith('/api/files/'), true);
    assert.equal(withToken.includes('access_token=session-jwt'), true);
    // No separate expiring share-token parameter.
    assert.equal(withToken.includes('share_token='), false);
    assert.equal(withToken.includes('signed='), false);
  });
});
