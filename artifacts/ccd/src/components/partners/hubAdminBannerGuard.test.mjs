/**
 * Open Hub admin banner must stay hidden for demo / non-admin visitors.
 * Run: node --test artifacts/ccd/src/components/partners/hubAdminBannerGuard.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'PartnerHubPage.tsx'),
  'utf8',
);

describe('Open Hub admin banner gating', () => {
  it('excludes demo mode and demo-visitor from canManageHub', () => {
    assert.match(src, /isDemoModeActive/);
    assert.match(src, /!isDemoModeActive\(\)/);
    assert.match(src, /profile\?\.id !== 'demo-visitor'/);
    assert.match(src, /Open Hub admin/);
  });
});
