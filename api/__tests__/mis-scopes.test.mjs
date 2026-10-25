import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MIS_APP_ALLOWED_SCOPES,
  assertScopeAllowedForApp,
  filterScopesForApp,
} from '../../server/misIntegrationScopes.js';

test('CCDesigner allow-list is year_groups.read only', () => {
  assert.deepEqual([...MIS_APP_ALLOWED_SCOPES.ccdesigner], ['year_groups.read']);
});

test('CCDesigner cannot receive pupil scopes', () => {
  assert.throws(() => assertScopeAllowedForApp('ccdesigner', 'pupils.read'));
  assert.throws(() => assertScopeAllowedForApp('ccdesigner', 'classes.read'));
  assert.throws(() => assertScopeAllowedForApp('ccdesigner', 'parent_contacts.read'));
});

test('filterScopesForApp strips forbidden CCD scopes', () => {
  assert.deepEqual(
    filterScopesForApp('ccdesigner', ['year_groups.read', 'pupils.read', 'timetables.read']),
    ['year_groups.read'],
  );
});

test('Assessify and Peri apps keep their allow-lists', () => {
  assert.doesNotThrow(() => assertScopeAllowedForApp('assessify', 'pupils.read'));
  assert.doesNotThrow(() => assertScopeAllowedForApp('perifeedback', 'parent_contacts.read'));
  assert.doesNotThrow(() => assertScopeAllowedForApp('periplanner', 'activities.read'));
});
