import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const baseMigrationPath = join(
  root,
  'supabase/migrations/20261024205000_mis_integrations.sql',
);
const fixMigrationPath = join(
  root,
  'supabase/migrations/20261024210000_mis_integrations_super_admin_scope.sql',
);

const baseMigration = readFileSync(baseMigrationPath, 'utf8');
const fixMigration = readFileSync(fixMigrationPath, 'utf8');

function extractFunction(sql, name) {
  const re = new RegExp(
    `CREATE OR REPLACE FUNCTION public\\.${name}[\\s\\S]*?^\\$\\$;`,
    'm',
  );
  const m = sql.match(re);
  assert.ok(m, `expected function ${name} in migration`);
  return m[0];
}

test('MIS migrations sort after 20261024200000', () => {
  assert.ok(existsSync(baseMigrationPath));
  assert.ok(existsSync(fixMigrationPath));
  assert.ok('20261024205000' > '20261024200000');
  assert.ok('20261024210000' > '20261024205000');
});

test('mis_user_in_org does not use school_or_org or full_user_admin', () => {
  for (const sql of [baseMigration, fixMigration]) {
    const fn = extractFunction(sql, 'mis_user_in_org');
    assert.equal(fn.includes('school_or_org'), false);
    assert.equal(fn.includes('current_user_is_full_user_admin'), false);
    assert.equal(fn.includes('is_super_admin'), true);
    assert.equal(fn.includes('organisation_id'), true);
  }
});

test('mis_user_can_manage_org is scoped to own organisation_id', () => {
  for (const sql of [baseMigration, fixMigration]) {
    const fn = extractFunction(sql, 'mis_user_can_manage_org');
    assert.equal(fn.includes('school_or_org'), false);
    assert.equal(fn.includes('current_user_is_full_user_admin'), false);
    assert.equal(fn.includes('current_user_org_ids'), false);
    assert.equal(fn.includes('is_super_admin'), true);
    assert.match(fn, /p\.organisation_id = p_org_id/);
  }
});

test('helpers revoke PUBLIC/anon execute', () => {
  assert.match(baseMigration, /REVOKE ALL ON FUNCTION public\.mis_user_in_org\(text\) FROM PUBLIC/);
  assert.match(baseMigration, /REVOKE ALL ON FUNCTION public\.mis_user_in_org\(text\) FROM anon/);
  assert.match(fixMigration, /REVOKE ALL ON FUNCTION public\.mis_user_can_manage_org\(text\) FROM PUBLIC/);
});

test('protected gates require is_super_admin or service_role (not school admin)', () => {
  for (const sql of [baseMigration, fixMigration]) {
    const fn = extractFunction(sql, 'mis_protect_provider_gates');
    assert.match(fn, /is_super_admin/);
    assert.equal(fn.includes('current_user_is_full_user_admin'), false);
    assert.match(fn, /provider_approval_confirmed/);
    assert.match(fn, /commercial_terms_confirmed/);
  }
});

test('config secrets policy uses is_super_admin only', () => {
  for (const sql of [baseMigration, fixMigration]) {
    assert.match(sql, /mis_org_connection_secrets_admin/);
    const policy = sql.match(
      /CREATE POLICY mis_org_connection_secrets_admin[\s\S]*?;/,
    );
    assert.ok(policy, 'expected secrets admin policy');
    assert.match(policy[0], /USING \(public\.is_super_admin\(\)\)/);
    assert.match(policy[0], /WITH CHECK \(public\.is_super_admin\(\)\)/);
    assert.equal(policy[0].includes('current_user_is_full_user_admin'), false);
  }
});

test('SQL security test covers school admin role=admin repro', () => {
  const sqlTest = readFileSync(
    join(root, 'supabase/tests/mis_integrations_security.sql'),
    'utf8',
  );
  assert.match(sqlTest, /repro: school admin is full_user_admin/);
  assert.match(sqlTest, /repro: school admin is NOT is_super_admin/);
  assert.match(sqlTest, /school admin cannot manage other org-b/);
  assert.match(sqlTest, /school admin cannot read any connection secrets/);
  assert.match(sqlTest, /school admin blocked from provider_approval gate/);
  assert.match(sqlTest, /super-admin can set provider_approval gate/);
});
