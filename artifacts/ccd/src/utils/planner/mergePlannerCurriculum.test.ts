/**
 * School + personal curriculum merge.
 * Run: node --experimental-strip-types --test artifacts/ccd/src/utils/planner/mergePlannerCurriculum.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  PersonalCurriculumData,
  PlannerCurriculumState,
} from '../../types/plannerCurriculum.ts';
import {
  mergePlannerCurriculum,
  personalAddStatement,
  personalFromLegacySchoolState,
  personalHideStatement,
  personalOverrideStatement,
  personalResetToSchool,
  selectMergedCurriculumStatements,
} from './mergePlannerCurriculum.ts';

const school: PlannerCurriculumState = {
  frameworks: [{ id: 'fw-school', name: 'National Curriculum' }],
  strands: [
    {
      id: 'strand-school',
      frameworkId: 'fw-school',
      name: 'Performing',
      subjectId: 'Music',
      keyStage: 'ks2',
    },
  ],
  statements: [
    { id: 'st-school-1', strandId: 'strand-school', text: 'Sing in unison' },
    { id: 'st-school-2', strandId: 'strand-school', text: 'Keep a steady pulse' },
  ],
  sectionTypes: [],
  planTemplates: [],
  terms: [],
};

const emptyPersonal: PersonalCurriculumData = {
  frameworks: [],
  strands: [],
  statements: [],
  overrides: {},
  hiddenIds: [],
};

describe('mergePlannerCurriculum', () => {
  it('shows school statements with School source when personal is empty', () => {
    const merged = mergePlannerCurriculum(school, emptyPersonal);
    assert.equal(merged.statements.length, 2);
    assert.ok(merged.statements.every((s) => s.source === 'school'));
    assert.deepEqual(
      selectMergedCurriculumStatements(school, emptyPersonal).map((s) => s.id),
      ['st-school-1', 'st-school-2'],
    );
  });

  it('applies a personal override and marks Mine + overridden', () => {
    const personal = personalOverrideStatement(
      emptyPersonal,
      'st-school-1',
      'Sing in two parts',
    );
    const merged = mergePlannerCurriculum(school, personal);
    const st = merged.statements.find((s) => s.id === 'st-school-1');
    assert.ok(st);
    assert.equal(st.text, 'Sing in two parts');
    assert.equal(st.source, 'mine');
    assert.equal(st.overridden, true);
    assert.equal(st.schoolText, 'Sing in unison');
    // School set unchanged
    assert.equal(school.statements[0].text, 'Sing in unison');
  });

  it('hides a school statement for the teacher only', () => {
    const personal = personalHideStatement(emptyPersonal, 'st-school-2');
    const merged = mergePlannerCurriculum(school, personal);
    assert.equal(merged.statements.length, 1);
    assert.equal(merged.statements[0].id, 'st-school-1');
    assert.equal(school.statements.length, 2);
  });

  it('adds a personal statement marked Mine', () => {
    const personal = personalAddStatement(emptyPersonal, {
      id: 'st-mine-1',
      strandId: 'strand-school',
      text: 'Improvise a ostinato',
    });
    const merged = mergePlannerCurriculum(school, personal);
    assert.equal(merged.statements.length, 3);
    const mine = merged.statements.find((s) => s.id === 'st-mine-1');
    assert.ok(mine);
    assert.equal(mine.source, 'mine');
    assert.equal(mine.overridden, undefined);
  });

  it('reset-to-school clears override and unhides', () => {
    let personal = personalOverrideStatement(
      emptyPersonal,
      'st-school-1',
      'Reworded',
    );
    personal = personalHideStatement(personal, 'st-school-2');
    personal = personalResetToSchool(personal, 'st-school-1');
    personal = personalResetToSchool(personal, 'st-school-2');
    const merged = mergePlannerCurriculum(school, personal);
    assert.equal(merged.statements.length, 2);
    const st = merged.statements.find((s) => s.id === 'st-school-1');
    assert.equal(st?.text, 'Sing in unison');
    assert.equal(st?.source, 'school');
    assert.equal(st?.overridden, undefined);
  });

  it('imports legacy localStorage school shape into personal adds', () => {
    const personal = personalFromLegacySchoolState(school);
    assert.equal(personal.statements.length, 2);
    assert.equal(Object.keys(personal.overrides).length, 0);
    const merged = mergePlannerCurriculum(
      { ...school, statements: [], frameworks: [], strands: [] },
      personal,
    );
    assert.equal(merged.statements.length, 2);
    assert.ok(merged.statements.every((s) => s.source === 'mine'));
  });

  it('merged IDs come only from the merged list (no phantom school-hidden ids)', () => {
    const personal = personalHideStatement(
      personalAddStatement(emptyPersonal, {
        id: 'st-mine-2',
        strandId: 'strand-school',
        text: 'Compose a rhythm',
      }),
      'st-school-1',
    );
    const ids = selectMergedCurriculumStatements(school, personal).map((s) => s.id);
    assert.deepEqual(ids.sort(), ['st-mine-2', 'st-school-2'].sort());
    assert.equal(ids.includes('st-school-1'), false);
  });
});
