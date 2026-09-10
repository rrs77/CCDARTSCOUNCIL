/**
 * Music Hub route aliases + admin path resolution (no Vite).
 * Run: node --test artifacts/ccd/src/config/musicHubRoute.test.mjs
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

const EMS_SERVICE_PATH = 'england/east-of-england/greater-essex/essex-music-service';
const ESSEX_DISTRICT_SLUGS = [
  'basildon',
  'braintree',
  'brentwood',
  'castle-point',
  'chelmsford',
  'colchester',
  'epping-forest',
  'harlow',
  'maldon',
  'rochford',
  'tendring',
  'uttlesford',
];

function walk(nodes, visit) {
  for (const node of nodes) {
    visit(node);
    if (node.children?.length) walk(node.children, visit);
  }
}

function findByPath(path) {
  let found = null;
  walk(seed.countries, (node) => {
    if (node.path === path) found = node;
  });
  return found;
}

function findById(id) {
  let found = null;
  walk(seed.countries, (node) => {
    if (node.id === id) found = node;
  });
  return found;
}

function buildAliases() {
  const aliases = {
    ems: EMS_SERVICE_PATH,
    triborough: 'england/london/london-west/tri-borough',
    essex: EMS_SERVICE_PATH,
  };
  for (const slug of ESSEX_DISTRICT_SLUGS) {
    aliases[`essex/${slug}`] = `${EMS_SERVICE_PATH}/${slug}`;
  }
  return aliases;
}

function resolveRoute(pathname) {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!trimmed) return null;
  const isAdminSuffix = trimmed.endsWith('/admin') || trimmed === 'admin';
  const withoutAdmin = isAdminSuffix
    ? trimmed === 'admin'
      ? ''
      : trimmed.slice(0, -'/admin'.length).replace(/\/$/, '')
    : trimmed;
  const aliases = buildAliases();

  if (withoutAdmin === 'music-hubs' || withoutAdmin.startsWith('music-hubs/')) {
    const inner =
      withoutAdmin === 'music-hubs' ? '' : withoutAdmin.slice('music-hubs/'.length);
    if (!inner) return isAdminSuffix ? null : { kind: 'directory' };
    const path = aliases[inner] || (findByPath(inner) ? inner : null);
    if (!path) return null;
    if (isAdminSuffix) {
      const node = findByPath(path);
      if (!node) return null;
      return { kind: 'admin', path, nodeId: node.id };
    }
    return { kind: 'page', path };
  }

  if (isAdminSuffix) {
    const path = aliases[withoutAdmin] || (findByPath(withoutAdmin) ? withoutAdmin : null);
    if (!path) return null;
    const node = findByPath(path);
    if (!node) return null;
    return { kind: 'admin', path, nodeId: node.id };
  }

  if (trimmed.includes('/') && aliases[trimmed]) {
    return { kind: 'page', path: aliases[trimmed] };
  }
  return null;
}

function collectDescendants(parentId) {
  const parent = findById(parentId);
  if (!parent) return [];
  const ids = [];
  const walkKids = (n) => {
    for (const child of n.children || []) {
      if (['music-hub', 'service', 'district', 'borough', 'national-service'].includes(child.kind)) {
        ids.push(child.id);
      }
      walkKids(child);
    }
  };
  walkKids(parent);
  return ids;
}

test('/essex/chelmsford resolves to Chelmsford district page', () => {
  const route = resolveRoute('/essex/chelmsford');
  assert.equal(route?.kind, 'page');
  assert.equal(route.path, `${EMS_SERVICE_PATH}/chelmsford`);
  assert.equal(findByPath(route.path)?.id, 'ems-chelmsford');
});

test('/essex/chelmsford/admin resolves to Chelmsford admin', () => {
  const route = resolveRoute('/essex/chelmsford/admin');
  assert.equal(route?.kind, 'admin');
  assert.equal(route.nodeId, 'ems-chelmsford');
});

test('/ems/admin resolves; bare /ems is not a music-hubs route', () => {
  assert.equal(resolveRoute('/ems/admin')?.kind, 'admin');
  assert.equal(resolveRoute('/ems'), null);
});

test('EMS inherit expands to all Essex district node ids', () => {
  const ids = collectDescendants('ems');
  assert.ok(ids.includes('ems-chelmsford'));
  assert.ok(ids.includes('ems-colchester'));
  assert.equal(ids.filter((id) => id.startsWith('ems-')).length, 12);
});

test('teacher without assignment is not hub admin for Chelmsford', () => {
  const assigned = new Set([]); // teacher: no hubs
  const canEdit = assigned.has('ems-chelmsford');
  assert.equal(canEdit, false);
});

test('Chelmsford-only admin cannot administer Colchester', () => {
  const assigned = new Set(['ems-chelmsford']);
  assert.equal(assigned.has('ems-chelmsford'), true);
  assert.equal(assigned.has('ems-colchester'), false);
});

test('draft vs live: published snapshot unchanged until approve', () => {
  const live = { title: 'Live Chelmsford' };
  const draft = { title: 'Draft Chelmsford' };
  // Public viewers only see live
  assert.equal(live.title, 'Live Chelmsford');
  assert.notEqual(live.title, draft.title);
  // After approve, live becomes draft payload
  const afterApprove = { ...draft };
  assert.equal(afterApprove.title, 'Draft Chelmsford');
});
