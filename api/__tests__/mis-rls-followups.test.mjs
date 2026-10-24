/**
 * Static checks for 20261024250000 / 20261024260000 security migrations.
 * Run: node --test api/__tests__/mis-rls-followups.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  GLOBAL_ANALYTICS_ROLES,
  ADMIN_ROLES,
  canViewGlobalAnalytics,
  isFullUserAdmin,
} from '../_authShared.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const misFollowups = join(
  root,
  'supabase/migrations/20261024250000_mis_rls_followups.sql',
);
const fullAdmin = join(
  root,
  'supabase/migrations/20261024260000_full_user_admin_super_only.sql',
);

test('follow-up migrations exist after 20261024220000 and avoid 24220000', () => {
  assert.ok(existsSync(misFollowups));
  assert.ok(existsSync(fullAdmin));
  assert.ok('20261024250000' > '20261024220000');
  assert.ok('20261024260000' > '20261024250000');
  assert.equal(existsSync(join(root, 'supabase/migrations/20261024220000_mis_rls_followups.sql')), false);
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

test('3) non-super request updates limited to withdrawn / message', () => {
  const sql = readFileSync(misFollowups, 'utf8');
  assert.match(sql, /mis_protect_integration_request_update/);
  assert.match(sql, /withdrawn/);
  assert.match(sql, /School managers may only set integration request status to withdrawn/);
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

test('5) GLOBAL_ANALYTICS_ROLES excludes school admin', () => {
  assert.equal(GLOBAL_ANALYTICS_ROLES.has('admin'), false);
  assert.equal(GLOBAL_ANALYTICS_ROLES.has('super_admin'), true);
  assert.equal(canViewGlobalAnalytics({ role: 'admin', status: 'active' }), false);
  assert.equal(ADMIN_ROLES.has('admin'), true); // org-scoped manage still OK
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

test('6c) users/list activeAdminCount scopes school admins', () => {
  const src = readFileSync(join(root, 'api/users/list.js'), 'utf8');
  assert.match(src, /in\('role', \['superuser', 'super_admin'\]\)/);
  assert.match(src, /resolveActorScopeUserIds/);
});

test('no duplicate migration prefixes including new files', () => {
  const names = readdirSync(join(root, 'supabase/migrations'));
  const prefixes = names.map((n) => n.split('_')[0]);
  const dupes = prefixes.filter((p, i) => prefixes.indexOf(p) !== i);
  assert.deepEqual([...new Set(dupes)], []);
});
