/**
 * Combined API router smoke tests.
 * Proves Forum / Hub / Music Hub handlers load and __route dispatch works.
 * Run: node --test api/__tests__/routerSmoke.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GET, POST, OPTIONS } from '../router.js';

const apiRoot = fileURLToPath(new URL('..', import.meta.url));

function listDeployableFunctions(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules' || name === '__tests__') {
      continue;
    }
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      listDeployableFunctions(full, acc);
      continue;
    }
    if (!name.endsWith('.js')) continue;
    if (name.startsWith('_')) continue;
    acc.push(relative(apiRoot, full));
  }
  return acc;
}

async function routed(method, route, extraSearch = '') {
  const url = `https://ccd.example/api/router?__route=${route}${extraSearch}`;
  const request = new Request(url, { method });
  const fn = method === 'POST' ? POST : method === 'OPTIONS' ? OPTIONS : GET;
  return fn(request);
}

async function jsonStatus(response) {
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

describe('deployable Vercel function count', () => {
  it('keeps /api at 12 or fewer deployable functions', () => {
    const files = listDeployableFunctions(apiRoot).sort();
    assert.ok(
      files.length <= 12,
      `expected <= 12 deployable /api files, found ${files.length}: ${files.join(', ')}`,
    );
    assert.ok(files.includes('router.js'), 'api/router.js must remain the combined function');
  });
});

describe('router module load', () => {
  it('imports Forum, Hub and Music Hub handlers without missing shared modules', () => {
    assert.equal(typeof GET, 'function');
    assert.equal(typeof POST, 'function');
    assert.equal(typeof OPTIONS, 'function');
  });
});

describe('request reconstruction', () => {
  it('returns 404 when __route is missing', async () => {
    const res = await GET(new Request('https://ccd.example/api/router'));
    const { status, body } = await jsonStatus(res);
    assert.equal(status, 404);
    assert.equal(body.error, 'API route not found.');
  });

  it('returns 404 for an unknown forum path', async () => {
    const { status, body } = await jsonStatus(await routed('GET', 'forum/not-a-real-route'));
    assert.equal(status, 404);
    assert.equal(body.error, 'API route not found.');
  });

  it('rejects path traversal in __route', async () => {
    const { status } = await jsonStatus(await routed('GET', 'forum/../../secret'));
    assert.equal(status, 404);
  });
});

describe('forum routes', () => {
  it('dispatches GET /api/forum/categories', async () => {
    const { status, body } = await jsonStatus(await routed('GET', 'forum/categories'));
    assert.notEqual(status, 404, JSON.stringify(body));
    assert.notEqual(body.error, 'API route not found.');
  });

  it('dispatches OPTIONS /api/forum/categories', async () => {
    const res = await routed('OPTIONS', 'forum/categories');
    assert.ok(res.status === 204 || res.status === 200, `unexpected ${res.status}`);
  });

  it('dispatches GET /api/forum/me', async () => {
    const { status, body } = await jsonStatus(await routed('GET', 'forum/me'));
    assert.notEqual(status, 404, JSON.stringify(body));
  });

  it('dispatches GET /api/forum/topics', async () => {
    const { status, body } = await jsonStatus(await routed('GET', 'forum/topics'));
    assert.notEqual(status, 404, JSON.stringify(body));
  });
});

describe('hub routes', () => {
  it('dispatches GET /api/hubs', async () => {
    const { status, body } = await jsonStatus(await routed('GET', 'hubs'));
    assert.notEqual(status, 404, JSON.stringify(body));
  });

  it('dispatches GET /api/hubs/public/:slug', async () => {
    const { body } = await jsonStatus(await routed('GET', 'hubs/public/demo-org'));
    assert.notEqual(body.error, 'API route not found.');
  });

  it('dispatches GET /api/hubs/:hubId/resources', async () => {
    const { status, body } = await jsonStatus(
      await routed('GET', 'hubs/00000000-0000-0000-0000-000000000000/resources'),
    );
    assert.notEqual(status, 404, JSON.stringify(body));
  });
});

describe('music hub routes', () => {
  it('dispatches POST /api/music-hubs/unlock', async () => {
    const { status, body } = await jsonStatus(await routed('POST', 'music-hubs/unlock'));
    assert.notEqual(status, 404, JSON.stringify(body));
  });

  it('dispatches GET /api/music-hubs/resource', async () => {
    const { status, body } = await jsonStatus(await routed('GET', 'music-hubs/resource'));
    assert.notEqual(status, 404, JSON.stringify(body));
  });

  it('dispatches POST /api/music-hubs/admin/password', async () => {
    const { status, body } = await jsonStatus(await routed('POST', 'music-hubs/admin/password'));
    assert.notEqual(status, 404, JSON.stringify(body));
  });
});

describe('shop routes', () => {
  it('dispatches GET /api/shop/products', async () => {
    const { status, body } = await jsonStatus(await routed('GET', 'shop/products'));
    assert.notEqual(status, 404, JSON.stringify(body));
    assert.notEqual(body.error, 'API route not found.');
  });

  it('dispatches OPTIONS /api/shop/checkout', async () => {
    const res = await routed('OPTIONS', 'shop/checkout');
    assert.ok(res.status === 204 || res.status === 200, `unexpected ${res.status}`);
  });

  it('dispatches GET /api/hubs/:hubId/sales', async () => {
    const { status, body } = await jsonStatus(await routed('GET', 'hubs/ems/sales'));
    assert.notEqual(status, 404, JSON.stringify(body));
  });

  it('dispatches GET /api/hubs/:hubId/products', async () => {
    const { status, body } = await jsonStatus(await routed('GET', 'hubs/ems/products'));
    assert.notEqual(status, 404, JSON.stringify(body));
  });
});
