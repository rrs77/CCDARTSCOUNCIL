/** Accent colours for key-stage section cards in Settings → My classes. */
export type KeyStageAccent = {
  bar: string;
  tint: string;
  badge: string;
  badgeText: string;
  label: string;
};

const FALLBACK: KeyStageAccent = {
  bar: '#77738F',
  tint: '#F4F3FA',
  badge: '#E2E0EF',
  badgeText: '#1F1B4D',
  label: '#1F1B4D',
};

const BY_ID: Record<string, KeyStageAccent> = {
  eyfs: {
    bar: '#0D9488',
    tint: '#E6F7F4',
    badge: '#99E6D8',
    badgeText: '#0F5C55',
    label: '#0F5C55',
  },
  ks1: {
    bar: '#4338E8',
    tint: '#E9E6FF',
    badge: '#C7C2F7',
    badgeText: '#2A2299',
    label: '#2A2299',
  },
  ks2: {
    bar: '#7C3AED',
    tint: '#F1E9FF',
    badge: '#D8C6FF',
    badgeText: '#4C1D95',
    label: '#4C1D95',
  },
  ks3: {
    bar: '#D97706',
    tint: '#FFF4E5',
    badge: '#FBD9A5',
    badgeText: '#92400E',
    label: '#92400E',
  },
  ks4: {
    bar: '#DC2626',
    tint: '#FEECEC',
    badge: '#F8B4B4',
    badgeText: '#991B1B',
    label: '#991B1B',
  },
  ks5: {
    bar: '#DB2777',
    tint: '#FCE7F3',
    badge: '#F9A8D4',
    badgeText: '#9D174D',
    label: '#9D174D',
  },
  other: {
    bar: '#6B7280',
    tint: '#F3F4F6',
    badge: '#D1D5DB',
    badgeText: '#374151',
    label: '#374151',
  },
};

export function keyStageAccent(sectionId: string, label?: string): KeyStageAccent {
  const id = (sectionId || '').trim().toLowerCase();
  if (BY_ID[id]) return BY_ID[id];
  const name = (label || '').trim().toLowerCase();
  if (name.includes('eyfs') || name.includes('early')) return BY_ID.eyfs;
  if (/\bks\s*1\b|key stage 1/.test(name)) return BY_ID.ks1;
  if (/\bks\s*2\b|key stage 2/.test(name)) return BY_ID.ks2;
  if (/\bks\s*3\b|key stage 3/.test(name)) return BY_ID.ks3;
  if (/\bks\s*4\b|key stage 4|gcse/.test(name)) return BY_ID.ks4;
  if (/\bks\s*5\b|key stage 5|a-?level|sixth/.test(name)) return BY_ID.ks5;
  if (name === 'other') return BY_ID.other;
  return FALLBACK;
}
