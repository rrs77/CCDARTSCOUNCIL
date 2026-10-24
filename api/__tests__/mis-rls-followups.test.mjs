/**
 * Static checks for 20261024235000 / 20261024235500 security migrations.
 * Run: node --test api/__tests__/mis-rls-followups.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  GLOBAL_ANALYTICS_ROLES,
  ORG_ADMIN_ROLES,
  canViewGlobalAnalytics,
  isFullUserAdmin,
} from '../_authShared.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const misFollowups = join(
  root,
  'supabase/migrations/20261024235000_mis_rls_followups.sql',
);
const fullAdmin = join(
  root,
  'supabase/migrations/20261024235500_full_user_admin_super_only.sql',
);

test('follow-up migrations use 24235000/24235500 (after 24220000, not 24220000)', () => {
  assert.ok(existsSync(misFollowups));
  assert.ok(existsSync(fullAdmin));
  assert.ok('20261024235000' > '20261024220000');
  assert.ok('20261024235500' > '20261024235000');
  assert.equal(existsSync(join(root, 'supabase/migrations/20261024250000_mis_rls_followups.sql')), false);
  assert.equal(existsSync(join(root, 'supabase/migrations/20261024260000_full_user_admin_super_only.sql')), false);
});

test('1) gate DELETE is super-admin only', () => {
  const sql = readFileSync(misFollowups, 'utf8');
  assert.match(sql, /mis_activation_gates_delete/);
  assert.match(sql, /FOR DELETE TO authenticated/);
  assert.match(sql, /USING \(public\.is_super_admin\(\)\)/);
  assert.match(sql, /mis_protect_gate_delete/);
  assert.match(sql, /BEFORE DELETE ON public\.mis_activation_gates/);
});

test('2) connection_id must match organisation_id', () => {
  const sql = readFileSync(misFollowups, 'utf8');
  assert.match(sql, /mis_connection_belongs_to_org/);
  assert.match(sql, /mis_enforce_connection_org_match/);
  assert.match(sql, /mis_integration_requests_connection_org/);
  assert.match(sql, /mis_year_group_mappings_connection_org/);
});

test('M1) INSERT forces status=submitted and requested_by=auth.uid() for non-super', () => {
  const sql = readFileSync(misFollowups, 'utf8');
  assert.match(sql, /mis_force_integration_request_insert/);
  assert.match(sql, /BEFORE INSERT ON public\.mis_integration_requests/);
  assert.match(sql, /NEW\.status := 'submitted'/);
  assert.match(sql, /NEW\.requested_by := auth\.uid\(\)/);
});

test('M2) UPDATE immutable includes requester_name/email and school_name', () => {
  const sql = readFileSync(misFollowups, 'utf8');
  assert.match(sql, /mis_protect_integration_request_update/);
  assert.match(sql, /NEW\.requester_name IS DISTINCT FROM OLD\.requester_name/);
  assert.match(sql, /NEW\.requester_email IS DISTINCT FROM OLD\.requester_email/);
  assert.match(sql, /NEW\.school_name IS DISTINCT FROM OLD\.school_name/);
  assert.match(sql, /withdrawn/);
});

test('4) current_user_is_full_user_admin is super_admin/superuser only', () => {
  const sql = readFileSync(fullAdmin, 'utf8');
  const fn = sql.match(
    /CREATE OR REPLACE FUNCTION public\.current_user_is_full_user_admin\(\)[\s\S]*?\$\$;/,
  );
  assert.ok(fn);
  assert.match(fn[0], /role IN \('super_admin', 'superuser'\)/);
  assert.equal(/\brole IN \('admin'/.test(fn[0]), false);
  assert.match(sql, /current_user_is_org_scoped_admin/);
  assert.match(sql, /current_user_manages_organisation/);
});

test('4b) JS isFullUserAdmin comment + behaviour match SQL', () => {
  const src = readFileSync(join(root, 'api/_authShared.js'), 'utf8');
  assert.match(src, /School role=admin is intentionally false/);
  assert.equal(isFullUserAdmin({ role: 'admin', status: 'active' }), false);
  assert.equal(isFullUserAdmin({ role: 'super_admin', status: 'active' }), true);
});

test('5) GLOBAL_ANALYTICS_ROLES excludes school admin; ORG_ADMIN_ROLES keeps it', () => {
  assert.equal(GLOBAL_ANALYTICS_ROLES.has('admin'), false);
  assert.equal(GLOBAL_ANALYTICS_ROLES.has('super_admin'), true);
  assert.equal(canViewGlobalAnalytics({ role: 'admin', status: 'active' }), false);
  assert.equal(ORG_ADMIN_ROLES.has('admin'), true);
  const src = readFileSync(join(root, 'api/_authShared.js'), 'utf8');
  assert.match(src, /export const ORG_ADMIN_ROLES/);
  assert.equal(/export const ADMIN_ROLES\b/.test(src), false);
});

test('6) forum_is_moderator and interactive lessons drop blanket admin', () => {
  const sql = readFileSync(fullAdmin, 'utf8');
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.forum_is_moderator/);
  const forum = sql.match(
    /CREATE OR REPLACE FUNCTION public\.forum_is_moderator[\s\S]*?\$\$;/,
  );
  assert.ok(forum);
  assert.equal(forum[0].includes("role IN ('admin'"), false);
  assert.match(forum[0], /is_super_admin/);

  const lessons = sql.match(
    /CREATE OR REPLACE FUNCTION public\.can_edit_interactive_lessons[\s\S]*?\$\$;/,
  );
  assert.ok(lessons);
  assert.match(lessons[0], /organisation_id IS NOT NULL/);
  assert.match(sql, /Admins can manage branding/);
  assert.match(sql, /USING \(public\.is_super_admin\(\)\)/);
});

test('6b) forum reports notify supers / forum_can_moderate only', () => {
  const src = readFileSync(join(root, 'server/api/forum/reports.js'), 'utf8');
  assert.match(src, /role\.in\.\(superuser,super_admin\)/);
  assert.match(src, /forum_can_moderate\.eq\.true/);
  assert.equal(src.includes(".in('role', ['admin', 'superuser', 'super_admin'])"), false);
});

test('6c) users/list last-admin count scoped to caller organisation_id', () => {
  const src = readFileSync(join(root, 'api/users/list.js'), 'utf8');
  assert.match(src, /in\('role', \['superuser', 'super_admin'\]\)/);
  assert.match(src, /callerOrg/);
  assert.match(src, /\.eq\('organisation_id', callerOrg\)/);
  // last-admin block must not reuse hub-wide resolveActorScopeUserIds
  const lastAdminBlock = src.slice(src.indexOf('Protect-last-admin'));
  assert.equal(lastAdminBlock.includes('resolveActorScopeUserIds'), false);
});

test('no duplicate migration prefixes including new files', () => {
  const names = readdirSync(join(root, 'supabase/migrations'));
  const prefixes = names.map((n) => n.split('_')[0]);
  const dupes = prefixes.filter((p, i) => prefixes.indexOf(p) !== i);
  assert.deepEqual([...new Set(dupes)], []);
});
