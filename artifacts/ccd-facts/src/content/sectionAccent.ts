/**
 * Shared Map ↔ canvas accent colours (Studio Score palette).
 */
export const SECTION_ACCENT: Record<string, string> = {
  overview: '#FFC93C',
  title: '#FFC93C',
  eyfs: '#FFC93C',
  'enrichment-framework': '#A9A3FF',
  'primary-ks1-ks2': '#4338E8',
  secondary: '#4338E8',
  gcse: '#A9A3FF',
  'a-level': '#4338E8',
  'cold-spots-place-and-income': '#E97451',
  'university-he': '#FFC93C',
  'music-hubs-and-national-centre': '#A9A3FF',
  'national-plans-and-free-resources': '#4338E8',
  'a-solution': '#FFC93C',
  sources: '#77738F',
};

export function sectionAccent(id: string | null | undefined): string {
  if (!id) return SECTION_ACCENT.overview!;
  return SECTION_ACCENT[id] ?? '#FFC93C';
}
