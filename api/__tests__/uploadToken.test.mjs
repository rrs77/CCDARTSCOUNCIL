/**
 * Direct-upload token mint/verify + Vercel size helpers.
 * Run: node --test api/__tests__/uploadToken.test.mjs
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

const SECRET = 'test-upload-token-secret-do-not-use-in-prod';
const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PATH = `${OWNER}/dddddddd-dddd-4ddd-8ddd-dddddddddddd.pdf`;

describe('upload token helpers', () => {
  let prevSecret;
  let prevUploadUrl;
  let mod;

  before(async () => {
    prevSecret = process.env.DREAMHOST_UPLOAD_TOKEN_SECRET;
    prevUploadUrl = process.env.DREAMHOST_PDF_UPLOAD_URL;
    process.env.DREAMHOST_UPLOAD_TOKEN_SECRET = SECRET;
    process.env.DREAMHOST_PDF_UPLOAD_URL = 'https://example.test/api/upload-pdf.php';
    mod = await import('../_uploadToken.js');
  });

  after(() => {
    if (prevSecret === undefined) delete process.env.DREAMHOST_UPLOAD_TOKEN_SECRET;
    else process.env.DREAMHOST_UPLOAD_TOKEN_SECRET = prevSecret;
    if (prevUploadUrl === undefined) delete process.env.DREAMHOST_PDF_UPLOAD_URL;
    else process.env.DREAMHOST_PDF_UPLOAD_URL = prevUploadUrl;
  });

  it('exports honest size caps (3 MB Vercel / 100 MB direct)', () => {
    assert.equal(mod.MAX_VERCEL_BODY_UPLOAD_BYTES, 3 * 1024 * 1024);
    assert.equal(mod.MAX_DIRECT_UPLOAD_BYTES, 100 * 1024 * 1024);
    assert.ok(mod.VERCEL_JSON_CONTENT_LENGTH_LIMIT > mod.MAX_VERCEL_BODY_UPLOAD_BYTES);
    assert.equal(mod.UPLOAD_TOKEN_TTL_SEC, 300);
  });

  it('signs and verifies a token bound to user, org, path, max, nonce', () => {
    const exp = Math.floor(Date.now() / 1000) + 300;
    const claims = {
      u: OWNER,
      o: 'ems',
      p: PATH,
      m: 12_345,
      e: exp,
      n: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      v: 'org',
    };
    const token = mod.signUploadToken(claims);
    const verified = mod.verifyUploadToken(token);
    assert.ok(verified);
    assert.equal(verified.userId, OWNER);
    assert.equal(verified.orgId, 'ems');
    assert.equal(verified.path, PATH);
    assert.equal(verified.maxBytes, 12_345);
    assert.equal(verified.exp, exp);
    assert.equal(verified.nonce, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    assert.equal(verified.visibility, 'org');
  });

  it('rejects tampered signatures (timing-safe)', () => {
    const token = mod.signUploadToken({
      u: OWNER,
      o: '',
      p: PATH,
      m: 100,
      e: Math.floor(Date.now() / 1000) + 60,
      n: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      v: 'org',
    });
    const [body] = token.split('.');
    const badSig = createHmac('sha256', 'wrong-secret').update(body).digest('base64url');
    assert.equal(mod.verifyUploadToken(`${body}.${badSig}`), null);
    assert.equal(mod.verifyUploadToken(`${body}.${'a'.repeat(43)}`), null);
    assert.equal(mod.verifyUploadToken('not-a-token'), null);
  });

  it('rejects invalid paths and oversized max in claims', () => {
    const exp = Math.floor(Date.now() / 1000) + 60;
    const nonce = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    assert.equal(
      mod.verifyUploadToken(
        mod.signUploadToken({
          u: OWNER,
          o: '',
          p: '../etc/passwd',
          m: 100,
          e: exp,
          n: nonce,
          v: 'org',
        }),
      ),
      null,
    );
    assert.equal(
      mod.verifyUploadToken(
        mod.signUploadToken({
          u: OWNER,
          o: '',
          p: PATH,
          m: mod.MAX_DIRECT_UPLOAD_BYTES + 1,
          e: exp,
          n: nonce,
          v: 'org',
        }),
      ),
      null,
    );
  });

  it('estimateBase64DecodedBytes tracks decoded size', () => {
    // "AAAA" decodes to 3 zero bytes
    assert.equal(mod.estimateBase64DecodedBytes('AAAA'), 3);
    assert.equal(mod.estimateBase64DecodedBytes(''), 0);
    const threeMbish = 'A'.repeat(Math.ceil((3 * 1024 * 1024 * 4) / 3));
    assert.ok(mod.estimateBase64DecodedBytes(threeMbish) >= 3 * 1024 * 1024);
  });

  it('isUploadTokenConfigured requires secret + upload URL', () => {
    assert.equal(mod.isUploadTokenConfigured(), true);
  });

  it('vercelUploadContentLengthGate returns 411 when Content-Length is missing', () => {
    assert.equal(mod.vercelUploadContentLengthGate(null)?.status, 411);
    assert.equal(mod.vercelUploadContentLengthGate(undefined)?.status, 411);
    assert.equal(mod.vercelUploadContentLengthGate('')?.status, 411);
    assert.equal(mod.vercelUploadContentLengthGate('  ')?.status, 411);
    assert.equal(mod.vercelUploadContentLengthGate('nope')?.status, 411);
  });

  it('vercelUploadContentLengthGate returns 413 when over the JSON limit', () => {
    const over = String(mod.VERCEL_JSON_CONTENT_LENGTH_LIMIT + 1);
    assert.equal(mod.vercelUploadContentLengthGate(over)?.status, 413);
    assert.equal(mod.vercelUploadContentLengthGate(over)?.code, 'USE_DIRECT_UPLOAD');
  });

  it('vercelUploadContentLengthGate allows a valid Content-Length', () => {
    assert.equal(mod.vercelUploadContentLengthGate('1024'), null);
    assert.equal(
      mod.vercelUploadContentLengthGate(String(mod.VERCEL_JSON_CONTENT_LENGTH_LIMIT)),
      null,
    );
  });
});
