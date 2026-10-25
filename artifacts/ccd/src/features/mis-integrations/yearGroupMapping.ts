import type {
  MisMappingAction,
  MisMappingActionLabel,
  MisYearGroupMappingPreview,
} from './types';

export const MIS_MAPPING_ACTIONS: {
  value: MisMappingAction;
  label: MisMappingActionLabel;
}[] = [
  { value: 'match', label: 'Match' },
  { value: 'rename_to_mis', label: 'Rename to MIS name' },
  { value: 'keep_existing', label: 'Keep existing' },
];

export function mappingActionLabel(action: MisMappingAction): MisMappingActionLabel {
  return MIS_MAPPING_ACTIONS.find((a) => a.value === action)?.label ?? 'Keep existing';
}

/**
 * Example-only preview rows for the Settings mockup.
 * Labelled in the UI as "Example data · preview only".
 * Never applied, never implies a live MIS connection.
 */
export const MIS_YEAR_GROUP_MAPPING_PREVIEW: readonly MisYearGroupMappingPreview[] = [
  { externalName: 'Reception', localName: 'Reception', action: 'match' },
  { externalName: 'Year 1', localName: 'Year 1', action: 'match' },
  { externalName: 'Yr 2', localName: 'Year 2', action: 'rename_to_mis' },
  { externalName: 'Year 7 (Senior)', localName: null, action: 'keep_existing' },
  { externalName: 'Upper Sixth', localName: 'Year 13', action: 'rename_to_mis' },
];

/**
 * Org-level year-group sync model (planned):
 * 1. Provider returns year/phase groups only (e.g. Wonde groups type=YEAR).
 * 2. Admin reviews mappings — Match / Rename to MIS name / Keep existing.
 * 3. Accepted mappings update local year-group labels/structure.
 * 4. Manual year-group editor in My classes remains available for schools without an MIS.
 * 5. Curricula (lessons, units, schemes) stay linked to year-group ids — never overwritten.
 */
export const YEAR_GROUP_SYNC_NOTES = {
  ccdOnlyScope: 'year_groups.read',
  neverImport: [
    'pupil names',
    'pupil IDs',
    'pupil records',
    'parents',
    'class memberships',
    'attendance',
    'medical data',
    'safeguarding data',
  ],
  preserve: [
    'year-group editor (MIS enhances it)',
    'lesson / activity / unit / scheme planning',
    'org hubs',
    'personal libraries',
    'existing auth and permissions',
  ],
} as const;
