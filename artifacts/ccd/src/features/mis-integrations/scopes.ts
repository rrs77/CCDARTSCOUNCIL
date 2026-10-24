import type { MisAppDataRow, MisAppId, MisScopeId } from './types';

/** Scopes each app may request. CCDesigner: year_groups.read only. */
export const MIS_APP_ALLOWED_SCOPES: Record<MisAppId, readonly MisScopeId[]> = {
  ccdesigner: ['year_groups.read'],
  assessify: ['pupils.read', 'classes.read', 'year_groups.read'],
  perifeedback: [
    'pupils.read',
    'year_groups.read',
    'lesson_assignments.read',
    'parent_contacts.read',
  ],
  periplanner: ['pupils.read', 'timetables.read', 'activities.read', 'year_groups.read'],
} as const;

/** Scopes that must never be granted to CCDesigner (enforced in code + DB). */
export const MIS_SCOPES_EXCLUDED_FROM_CCDESIGNER: readonly MisScopeId[] = [
  'pupils.read',
  'classes.read',
  'lesson_assignments.read',
  'parent_contacts.read',
  'timetables.read',
  'activities.read',
] as const;

export const MIS_SCOPE_DESCRIPTIONS: Record<MisScopeId, string> = {
  'year_groups.read':
    'Year-group / phase structure (Nursery, Reception, Y1–13, custom names, EYFS/KS1–KS5).',
  'pupils.read': 'Pupil names and IDs.',
  'classes.read': 'Teaching groups, class membership, teacher assignments.',
  'lesson_assignments.read': 'Instrumental/vocal lesson assignments and peri teachers.',
  'parent_contacts.read': 'Parent contacts only where school-authorised (restricted).',
  'timetables.read': 'Timetables, scheduling and rooms.',
  'activities.read': 'Co-curricular activities and clubs (possibly SOCS).',
};

/** Mockup “Which app uses what” table (permission names are internal, not provider scopes). */
export const MIS_APP_DATA_TABLE: readonly MisAppDataRow[] = [
  {
    appId: 'ccdesigner',
    displayName: 'CCDesigner',
    dataItCanReceive: 'Year groups only (names, phases, school configuration)',
    scopes: ['year_groups.read'],
    neverReceives:
      'No pupil data of any kind: no names, IDs, classes, parents, attendance, medical or safeguarding',
    highlightCcd: true,
  },
  {
    appId: 'assessify',
    displayName: 'Assessify',
    dataItCanReceive: 'Pupils, classes, teacher assignments',
    scopes: ['pupils.read', 'classes.read'],
  },
  {
    appId: 'perifeedback',
    displayName: 'PeriFeedback',
    dataItCanReceive:
      'Pupils, lesson assignments, parent contacts (restricted, only where authorised)',
    scopes: ['pupils.read', 'lesson_assignments.read', 'parent_contacts.read'],
    scopesNote: '(restricted)',
  },
  {
    appId: 'periplanner',
    displayName: 'PeriPlanner',
    dataItCanReceive: 'Pupils, timetables, activities and clubs',
    scopes: ['pupils.read', 'timetables.read', 'activities.read'],
  },
];

export function appAllowsScope(appId: MisAppId, scopeId: MisScopeId): boolean {
  return (MIS_APP_ALLOWED_SCOPES[appId] as readonly string[]).includes(scopeId);
}

export function isScopeForbiddenForCcd(scopeId: MisScopeId): boolean {
  return (MIS_SCOPES_EXCLUDED_FROM_CCDESIGNER as readonly string[]).includes(scopeId);
}
