const KEY = 'ccd-ilv-recent-colors-v1';
const MAX = 8;

export function readRecentColors(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecentColor(color: string): string[] {
  const next = [color, ...readRecentColors().filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(
    0,
    MAX,
  );
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
