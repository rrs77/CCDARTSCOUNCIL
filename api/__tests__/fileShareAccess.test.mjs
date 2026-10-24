/**
 * Decision 2 — share links are signed-in users only via in-app /shared/...
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
import {
  buildFileProxyApiPath,
  buildShareAppPath,
  parseShareAppPath,
  shareAppPathFromApiOrShare,
} from '../_dreamhost.js';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const FILE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const STORAGE = `${OWNER}/${FILE_ID}.pdf`;
const SHARE = `/shared/${OWNER}/${FILE_ID}`;
const API = `/api/files/${STORAGE}`;

describe('buildShareAppPath / parseShareAppPath', () => {
  it('maps storage paths to in-app share routes (no JWT)', () => {
    assert.equal(buildShareAppPath(STORAGE), SHARE);
    assert.equal(parseShareAppPath(SHARE), STORAGE);
    assert.equal(parseShareAppPath(`${SHARE}.pdf`), STORAGE);
    assert.equal(buildFileProxyApiPath(STORAGE), API);
  });

  it('rewrites legacy API file URLs to /shared/...', () => {
    assert.equal(shareAppPathFromApiOrShare(API), SHARE);
    assert.equal(shareAppPathFromApiOrShare(`https://ccd.example${API}`), SHARE);
    assert.equal(shareAppPathFromApiOrShare(SHARE), SHARE);
  });
});

describe('safeInAppReturnPath (share return)', () => {
  it('accepts in-app share paths', () => {
    assert.equal(safeInAppReturnPath(SHARE), SHARE);
  });

  it('rejects absolute and protocol-relative URLs', () => {
    assert.equal(safeInAppReturnPath('https://evil.example/x'), null);
    assert.equal(safeInAppReturnPath('//evil.example/x'), null);
  });

  it('rejects control characters', () => {
    assert.equal(safeInAppReturnPath('/shared/\n' + OWNER), null);
    assert.equal(safeInAppReturnPath(SHARE + '\u0000'), null);
  });
});

describe('buildSignInRedirectLocation', () => {
  it('returns to the in-app share path after sign-in', () => {
    const loc = buildSignInRedirectLocation(SHARE);
    assert.equal(loc.startsWith('/?'), true);
    const params = new URLSearchParams(loc.slice(2));
    assert.equal(params.get('return'), SHARE);
    assert.equal(params.get('signin'), '1');
    assert.equal(loc.includes('access_token='), false);
  });
});

describe('prefersHtmlNavigation', () => {
  it('detects browser navigations', () => {
    assert.equal(
      prefersHtmlNavigation(
        new Request('https://ccd.example' + API, {
          headers: { Accept: 'text/html', 'Sec-Fetch-Mode': 'navigate' },
        }),
      ),
      true,
    );
  });

  it('treats JSON API clients as non-HTML', () => {
    assert.equal(
      prefersHtmlNavigation(
        new Request('https://ccd.example' + API, {
          headers: { Accept: 'application/json' },
        }),
      ),
      false,
    );
  });
});

describe('unauthenticatedFileShareResponse', () => {
  it('redirects HTML navigations to sign-in with return=/shared/...', async () => {
    const res = unauthenticatedFileShareResponse(
      new Request('https://ccd.example' + API, {
        headers: { Accept: 'text/html', 'Sec-Fetch-Mode': 'navigate' },
      }),
      SHARE,
    );
    assert.equal(res.status, 302);
    const loc = res.headers.get('Location');
    assert.ok(loc);
    const params = new URLSearchParams(loc.slice(2));
    assert.equal(params.get('return'), SHARE);
    assert.equal(params.get('signin'), '1');
    assert.equal(loc.includes('share_token='), false);
    assert.equal(loc.includes('access_token='), false);
    assert.equal(loc.includes('signed='), false);
  });

  it('returns 401 JSON for API clients (no anonymous access)', async () => {
    const res = unauthenticatedFileShareResponse(
      new Request('https://ccd.example' + API, {
        headers: { Accept: 'application/json' },
      }),
      SHARE,
    );
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.error, /sign in/i);
  });

  it('returns 401 when Accept is missing (no silent public access)', async () => {
    const res = unauthenticatedFileShareResponse(
      new Request('https://ccd.example' + API),
      SHARE,
    );
    assert.equal(res.status, 401);
  });
});

describe('client file share helpers', () => {
  it('maps share and legacy API paths without putting JWT in the URL', async () => {
    const {
      isFileShareAppPath,
      isFileShareApiPath,
      toFileShareAppPath,
      storagePathFromShareAppPath,
      fileProxyApiPathFromStorage,
    } = await import('../../artifacts/ccd/src/utils/fileShareAccessHelpers.mjs');

    assert.equal(isFileShareAppPath(SHARE), true);
    assert.equal(isFileShareApiPath(API), true);
    assert.equal(toFileShareAppPath(API), SHARE);
    assert.equal(toFileShareAppPath(SHARE), SHARE);
    assert.equal(storagePathFromShareAppPath(SHARE), STORAGE);
    assert.equal(fileProxyApiPathFromStorage(STORAGE), API);

    // Share URLs must never carry access_token / share_token.
    assert.equal(SHARE.includes('access_token='), false);
    assert.equal(toFileShareAppPath(`${API}?access_token=leak`), SHARE);
  });
});
