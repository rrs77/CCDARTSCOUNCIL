import type { MisProviderDef, MisProviderId, MisUiStatus } from './types';

/**
 * Configurable provider catalogue.
 * Every provider is UNVERIFIED until official docs + commercial/provider approval.
 * Research note (Wonde public docs only): https://docs.wonde.com/docs/api/sync/
 * Year groups: GET /v1.0/schools/{school_id}/groups with type=YEAR.
 * No live endpoints, tokens, or connected states are invented here.
 */
export const MIS_PROVIDERS: readonly MisProviderDef[] = [
  {
    id: 'wonde',
    displayName: 'Wonde',
    kind: 'hub',
    subtitle: 'Central MIS provider',
    availability: 'requestable',
    approvalStatus: 'unverified',
    uiStatus: 'unverified',
    isCentralHub: true,
    recommendedFirst: true,
    requiresSeparateIntegration: false,
    flag: '★ Recommended first: central provider',
    docsUrl: 'https://docs.wonde.com/docs/api/sync/',
    notes:
      'Central hub covering many UK MIS systems via one API. Live auth/sync pending external approval.',
    sortOrder: 10,
  },
  {
    id: 'isams',
    displayName: 'iSAMS',
    kind: 'mis',
    subtitle: 'MIS',
    availability: 'catalogue',
    approvalStatus: 'unverified',
    uiStatus: 'unverified',
    isCentralHub: false,
    recommendedFirst: false,
    requiresSeparateIntegration: false,
    notes: 'Often reachable via Wonde. Direct integration unverified.',
    sortOrder: 20,
  },
  {
    id: 'sims',
    displayName: 'SIMS',
    kind: 'mis',
    subtitle: 'MIS',
    availability: 'catalogue',
    approvalStatus: 'unverified',
    uiStatus: 'unverified',
    isCentralHub: false,
    recommendedFirst: false,
    requiresSeparateIntegration: false,
    notes: 'Often reachable via Wonde. Direct integration unverified.',
    sortOrder: 30,
  },
  {
    id: 'arbor',
    displayName: 'Arbor',
    kind: 'mis',
    subtitle: 'MIS',
    availability: 'catalogue',
    approvalStatus: 'unverified',
    uiStatus: 'unverified',
    isCentralHub: false,
    recommendedFirst: false,
    requiresSeparateIntegration: false,
    notes: 'Often reachable via Wonde. Direct integration unverified.',
    sortOrder: 40,
  },
  {
    id: 'bromcom',
    displayName: 'Bromcom',
    kind: 'mis',
    subtitle: 'MIS',
    availability: 'catalogue',
    approvalStatus: 'unverified',
    uiStatus: 'unverified',
    isCentralHub: false,
    recommendedFirst: false,
    requiresSeparateIntegration: false,
    notes: 'Often reachable via Wonde. Direct integration unverified.',
    sortOrder: 50,
  },
  {
    id: 'engage',
    displayName: 'Engage',
    kind: 'mis',
    subtitle: 'MIS',
    availability: 'catalogue',
    approvalStatus: 'unverified',
    uiStatus: 'unverified',
    isCentralHub: false,
    recommendedFirst: false,
    requiresSeparateIntegration: false,
    notes: 'Often reachable via Wonde. Direct integration unverified.',
    sortOrder: 60,
  },
  {
    id: 'wcbs',
    displayName: 'WCBS',
    kind: 'mis',
    subtitle: 'MIS',
    availability: 'catalogue',
    approvalStatus: 'unverified',
    uiStatus: 'unverified',
    isCentralHub: false,
    recommendedFirst: false,
    requiresSeparateIntegration: false,
    notes: 'Direct integration unverified until official docs + approval.',
    sortOrder: 70,
  },
  {
    id: 'schoolbase',
    displayName: 'SchoolBase',
    kind: 'mis',
    subtitle: 'MIS',
    availability: 'catalogue',
    approvalStatus: 'unverified',
    uiStatus: 'unverified',
    isCentralHub: false,
    recommendedFirst: false,
    requiresSeparateIntegration: false,
    notes: 'Direct integration unverified until official docs + approval.',
    sortOrder: 80,
  },
  {
    id: 'socs',
    displayName: 'SOCS',
    kind: 'co_curricular',
    subtitle: 'Co-curricular scheduling',
    availability: 'catalogue',
    approvalStatus: 'unverified',
    uiStatus: 'unverified',
    isCentralHub: false,
    recommendedFirst: false,
    requiresSeparateIntegration: true,
    softFlag: 'Co-curricular scheduling · separate integration',
    notes: 'May need a separate co-curricular integration from MIS hubs. Unverified.',
    sortOrder: 90,
  },
] as const;

export const MIS_STATUS_KEY: {
  status: MisUiStatus;
  label: string;
  detail?: string;
}[] = [
  { status: 'unverified', label: 'Unverified', detail: 'awaiting provider approval' },
  { status: 'requested', label: 'Requested' },
  { status: 'approved', label: 'Approved', detail: 'ready to configure' },
  { status: 'connected', label: 'Connected' },
];

export function getMisProvider(id: MisProviderId): MisProviderDef | undefined {
  return MIS_PROVIDERS.find((p) => p.id === id);
}

export function uiStatusLabel(status: MisUiStatus): string {
  switch (status) {
    case 'unverified':
      return 'Unverified · awaiting provider approval';
    case 'requested':
      return 'Requested';
    case 'approved':
      return 'Approved · ready to configure';
    case 'connected':
      return 'Connected';
    default:
      return 'Unverified · awaiting provider approval';
  }
}

/** Providers that need external commercial / API approval before anything goes live. */
export const PROVIDERS_NEEDING_EXTERNAL_APPROVAL: readonly MisProviderId[] = MIS_PROVIDERS.map(
  (p) => p.id,
);
