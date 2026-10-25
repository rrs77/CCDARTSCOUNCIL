/**
 * Source + scratch-Postgres checks for organisations.ai_addon protect trigger.
 * Run: node --test api/__tests__/organisationsAiAddonProtect.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../..', import.meta.url));
const migration = join(root, 'supabase/migrations/20261025131000_organisations_ai_addon_protect.sql');
const sqlTest = join(root, 'supabase/tests/organisations_ai_addon_protect.sql');
const runner = join(root, 'supabase/tests/run_organisations_ai_addon_protect.sh');

describe('organisations.ai_addon protect migration', () => {
  it('defines SECURITY INVOKER trigger with 42501 for non-super writers', () => {
    const sql = readFileSync(migration, 'utf8');
    assert.match(sql, /protect_organisations_ai_addon/);
    assert.match(sql, /SECURITY INVOKER/);
    assert.match(sql, /SET search_path = public, pg_temp/);
    assert.match(sql, /BEFORE INSERT OR UPDATE ON public\.organisations/);
    assert.match(sql, /is_super_admin\(\)/);
    assert.match(sql, /service_role/);
    assert.match(sql, /current_user IN \('postgres', 'supabase_admin', 'service_role'\)/);
    assert.match(sql, /ERRCODE = '42501'/);
    assert.match(sql, /NEW\.ai_addon IS DISTINCT FROM OLD\.ai_addon/);
  });

  it('keeps readable-flag note and scratch cases for ordinary / org admin / super / postgres', () => {
    const base = readFileSync(
      join(root, 'supabase/migrations/20261025130000_organisations_ai_addon.sql'),
      'utf8',
    );
    assert.match(base, /not a secret/i);
    const testSql = readFileSync(sqlTest, 'utf8');
    assert.match(testSql, /ordinary user cannot set ai_addon/);
    assert.match(testSql, /org admin cannot set ai_addon/);
    assert.match(testSql, /super admin can set ai_addon/);
    assert.match(testSql, /postgres current_user can set ai_addon/);
    assert.equal(existsSync(runner), true);
  });

  it('scratch Postgres: ordinary user, org admin, super admin', () => {
    const result = spawnSync('bash', [runner], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env },
      timeout: 60_000,
    });
    if (result.status !== 0) {
      assert.fail(
        `scratch protect failed (status ${result.status}):\n${result.stdout || ''}\n${result.stderr || ''}`,
      );
    }
    assert.match(result.stdout || '', /organisations_ai_addon_protect: OK/);
  });
});
