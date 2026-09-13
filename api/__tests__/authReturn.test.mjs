/**
 * Post-login return URL preservation (Forum admin and other gated actions).
 * Run: node --test api/__tests__/authReturn.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const {
  safeReturnPath,
  buildSignInHref,
  isMidFlowSignIn,
  queryReturnPath,
  resolvePostAuthReturn,
  shouldNavigateToReturn,
} = await import('../../artifacts/ccd/src/utils/authReturn.ts');

describe('safeReturnPath', () => {
  it('accepts in-app forum admin path', () => {
    assert.equal(safeReturnPath('/forum/admin'), '/forum/admin');
  });

  it('accepts path with query', () => {
    assert.equal(safeReturnPath('/forum/c/introductions?compose=1'), '/forum/c/introductions?compose=1');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    assert.equal(safeReturnPath('https://evil.example/phish'), null);
    assert.equal(safeReturnPath('//evil.example/phish'), null);
    assert.equal(safeReturnPath('javascript:alert(1)'), null);
  });

  it('rejects missing leading slash', () => {
    assert.equal(safeReturnPath('forum/admin'), null);
  });
});

describe('buildSignInHref', () => {
  it('preserves /forum/admin on a relative same-origin href', () => {
    const href = buildSignInHref('/forum/admin');
    assert.equal(href.startsWith('/?'), true);
    const params = new URLSearchParams(href.slice(2));
    assert.equal(params.get('return'), '/forum/admin');
    assert.equal(params.get('signin'), '1');
  });

  it('does not hard-code a hostname', () => {
    assert.equal(buildSignInHref('/forum/admin').includes('vercel.app'), false);
    assert.equal(buildSignInHref('/forum/admin').includes('ccdesigner'), false);
  });
});

describe('isMidFlowSignIn / queryReturnPath', () => {
  it('detects signin=1 and return query', () => {
    assert.equal(isMidFlowSignIn('?return=/forum/admin&signin=1'), true);
    assert.equal(isMidFlowSignIn('?foo=1'), false);
    assert.equal(queryReturnPath('?return=/forum/admin&signin=1'), '/forum/admin');
  });
});

describe('resolvePostAuthReturn', () => {
  it('lets explicit query return win over a stale download return', () => {
    assert.equal(
      resolvePostAuthReturn({
        search: '?return=/forum/admin&signin=1',
        forumReturn: '/forum',
        downloadReturn: '/',
      }),
      '/forum/admin',
    );
  });

  it('uses forum session stash when query is absent', () => {
    assert.equal(
      resolvePostAuthReturn({
        search: '',
        forumReturn: '/forum/admin',
        downloadReturn: '/',
      }),
      '/forum/admin',
    );
  });

  it('falls back to download return only when nothing else is set', () => {
    assert.equal(
      resolvePostAuthReturn({
        search: '',
        forumReturn: null,
        downloadReturn: '/partners/jazz-north',
      }),
      '/partners/jazz-north',
    );
  });
});

describe('shouldNavigateToReturn', () => {
  it('navigates when the return path differs from the login URL', () => {
    assert.equal(
      shouldNavigateToReturn('/forum/admin', '/?return=/forum/admin&signin=1'),
      true,
    );
    assert.equal(shouldNavigateToReturn('/forum/admin', '/forum/admin'), false);
  });
});
