import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const migration = readFileSync(
  join(root, 'supabase/migrations/20261024_mis_integrations.sql'),
  'utf8',
);

function extractFunction(sql, name) {
  const re = new RegExp(
    `CREATE OR REPLACE FUNCTION public\\.${name}[\\s\\S]*?^\\$\\$;`,
    'm',
  );
  const m = sql.match(re);
  assert.ok(m, `expected function ${name} in migration`);
  return m[0];
}

test('mis_user_in_org does not use school_or_org', () => {
  const fn = extractFunction(migration, 'mis_user_in_org');
  assert.equal(fn.includes('school_or_org'), false);
  assert.equal(fn.includes('organisation_id'), true);
  assert.equal(fn.includes('suspended'), true);
  assert.equal(fn.includes('anonymised_at'), true);
});

test('mis_user_can_manage_org does not use school_or_org', () => {
  const fn = extractFunction(migration, 'mis_user_can_manage_org');
  assert.equal(fn.includes('school_or_org'), false);
  assert.equal(fn.includes('organisation_id'), true);
});

test('helpers revoke PUBLIC/anon execute', () => {
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.mis_user_in_org\(text\) FROM PUBLIC/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.mis_user_in_org\(text\) FROM anon/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.mis_user_can_manage_org\(text\) FROM PUBLIC/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.mis_user_can_manage_org\(text\) FROM anon/);
});

test('protected gates require super-admin or service_role', () => {
  assert.match(migration, /mis_protect_provider_gates/);
  assert.match(migration, /commercial_terms_confirmed/);
  assert.match(migration, /provider_approval_confirmed/);
  assert.match(migration, /current_user_is_full_user_admin/);
});

test('config secrets are in a separate super-admin-only table', () => {
  assert.match(migration, /mis_org_connection_secrets/);
  assert.match(migration, /mis_org_connection_secrets_admin/);
  assert.equal(/config_placeholder jsonb NOT NULL DEFAULT '\{\}'::jsonb,\s*school_authorised/.test(migration), false);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.mis_org_connection_secrets/);
});

test('SQL security test file exists', () => {
  const sqlTest = readFileSync(
    join(root, 'supabase/tests/mis_integrations_security.sql'),
    'utf8',
  );
  assert.match(sqlTest, /spoof school_or_org/);
  assert.match(sqlTest, /org manager blocked from commercial_terms gate/);
  assert.match(sqlTest, /super-admin can read connection secrets/);
});
