/**
 * Lightweight node tests for Music Hubs directory accessors.
 * Run: node --experimental-vm-modules --test artifacts/ccd/src/config/musicHubsDirectory.test.mjs
 * (Also imported logic mirrored here so CI can run without Vite JSON transform.)
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(
  readFileSync(join(__dirname, '../data/musicHubsDirectory.seed.json'), 'utf8'),
);

function walk(nodes, visit, parents = []) {
  for (const node of nodes) {
    visit(node, parents);
    if (node.children?.length) walk(node.children, visit, [...parents, node]);
  }
}

function findByPath(path) {
  let found = null;
  walk(seed.countries, (node, parents) => {
    if (node.path === path) found = { node, parents };
  });
  return found;
}

test('seed has four UK countries', () => {
  assert.equal(seed.countries.length, 4);
  assert.deepEqual(
    seed.countries.map((c) => c.slug),
    ['england', 'wales', 'scotland', 'northern-ireland'],
  );
});

test('EMS is featured once and Greater Essex has three services', () => {
  const featured = [];
  walk(seed.countries, (n) => {
    if (n.featured) featured.push(n.id);
  });
  assert.ok(featured.includes('ems'));
  const greater = findByPath('england/east-of-england/greater-essex');
  assert.ok(greater);
  assert.equal(greater.node.children.length, 3);
});

test('Essex Music Service has twelve districts and map flag', () => {
  const ems = findByPath('england/east-of-england/greater-essex/essex-music-service');
  assert.ok(ems);
  assert.equal(ems.node.showEssexMap, true);
  assert.equal(ems.node.children.length, 12);
  assert.equal(ems.node.partnerHubSlug, 'ems');
});

test('Tri-Borough reparented under London West with three boroughs', () => {
  const tbmh = findByPath('england/london/london-west/tri-borough');
  assert.ok(tbmh);
  assert.equal(tbmh.node.partnerHubSlug, 'triborough');
  assert.equal(tbmh.node.children.length, 3);
});

test('subscriber example resource has no client href', () => {
  const ems = findByPath('england/east-of-england/greater-essex/essex-music-service');
  const sub = ems.node.content.resources.find((r) => r.access === 'SUBSCRIBER');
  assert.ok(sub);
  assert.equal(sub.href, undefined);
});
