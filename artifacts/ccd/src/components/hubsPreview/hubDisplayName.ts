/**
 * Single source for a Music Hub's display name, used by both the hub cards
 * and the map pins so they always match.
 */
/** Friendly card title — e.g. "Essex Music Hub", "Cambridgeshire Music". */
export function musicHubCardTitle(id: string, fullName: string, lead?: string) {
  if (id === 'cambridgeshire-and-peterborough') return 'Cambridgeshire Music';
  if (id.includes('essex') || /essex/i.test(fullName)) return 'Greater Essex Music Hub';
  if (id === 'tri-borough' || id === 'triborough' || /tri-?borough/i.test(fullName)) return 'Tri-borough Music Hub';
  if (/suffolk/i.test(fullName) || id.includes('suffolk')) return 'Suffolk Music Hub';
  if (lead && /music$/i.test(lead) && lead.length < 40) return lead;
  return fullName
    .replace(/ Music Education Hub$/i, ' Music Hub')
    .replace(/ and Peterborough/i, '')
    .replace(/ \(BLMK\)/, '');
}
