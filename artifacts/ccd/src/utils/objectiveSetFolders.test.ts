/**
 * Nested KS → Subject → set folders for Learning objectives.
 * Run: cd scripts && node --import tsx --test ../artifacts/ccd/src/utils/objectiveSetFolders.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildObjectiveSetFolderTree,
  inferObjectiveSetKeyStageId,
  inferObjectiveSetSubject,
} from './objectiveSetFolders.ts';

describe('inferObjectiveSetSubject', () => {
  it('detects Drama / Dance / Music / Art', () => {
    assert.equal(inferObjectiveSetSubject('Year 7 Drama'), 'Drama');
    assert.equal(inferObjectiveSetSubject('Reception Dance'), 'Dance');
    assert.equal(inferObjectiveSetSubject('KS2 Music'), 'Music');
    assert.equal(inferObjectiveSetSubject('Year 4 Art'), 'Art');
  });

  it('falls back to General when no subject token', () => {
    assert.equal(inferObjectiveSetSubject('EYFS Early Learning Goals'), 'General');
  });
});

describe('inferObjectiveSetKeyStageId', () => {
  it('places EYFS Early Learning Goals under eyfs from the name', () => {
    assert.equal(
      inferObjectiveSetKeyStageId(
        { id: '1', name: 'EYFS Early Learning Goals' },
        { sections: [], customYearGroups: [] },
      ),
      'eyfs',
    );
  });

  it('places Year 7 Drama under ks3', () => {
    assert.equal(
      inferObjectiveSetKeyStageId(
        { id: '2', name: 'Year 7 Drama' },
        { sections: [], customYearGroups: [] },
      ),
      'ks3',
    );
  });
});

describe('buildObjectiveSetFolderTree', () => {
  it('nests sets under KS → subject and keeps unmatched in Other', () => {
    const tree = buildObjectiveSetFolderTree([
      { id: 'a', name: 'EYFS Early Learning Goals' },
      { id: 'b', name: 'Reception Drama' },
      { id: 'c', name: 'Year 7 Drama' },
      { id: 'd', name: 'Mystery Pack XYZ' },
    ]);

    const eyfs = tree.find((f) => f.id === 'eyfs');
    assert.ok(eyfs);
    assert.ok(eyfs.subjects.some((s) => s.label === 'General' && s.items.some((i) => i.id === 'a')));
    assert.ok(eyfs.subjects.some((s) => s.label === 'Drama' && s.items.some((i) => i.id === 'b')));

    const ks3 = tree.find((f) => f.id === 'ks3');
    assert.ok(ks3);
    assert.ok(ks3.subjects.some((s) => s.label === 'Drama' && s.items.some((i) => i.id === 'c')));

    const other = tree.find((f) => f.id === 'other');
    assert.ok(other);
    assert.ok(other.subjects.some((s) => s.items.some((i) => i.id === 'd')));
  });

  it('does not dump EYFS sets into a lone Other folder', () => {
    const tree = buildObjectiveSetFolderTree([
      { id: 'a', name: 'EYFS Early Learning Goals' },
      { id: 'b', name: 'Reception Dance' },
    ]);
    assert.equal(tree.some((f) => f.id === 'other'), false);
    assert.ok(tree.some((f) => f.id === 'eyfs'));
  });
});
