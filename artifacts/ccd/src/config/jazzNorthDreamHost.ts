/**
 * Jazz North classroom files hosted on DreamHost (rhythmstix.co.uk).
 *
 * Exact filenames match the user’s File Manager listing. Change ONE string
 * (`JN_DREAMHOST_BASE` or env `VITE_JN_DREAMHOST_BASE`) if the folder path differs.
 *
 * Default assumes files live flat under `/ccdesignerdocs/` on the public site.
 * If they sit in a subfolder (e.g. `ccdesignerdocs/partners/jazznorth/`), set the
 * base to that path including a trailing slash.
 */

/** Override with VITE_JN_DREAMHOST_BASE when the live folder path is confirmed. */
export const JN_DREAMHOST_BASE = normalizeBase(
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.VITE_JN_DREAMHOST_BASE) ||
    'https://www.rhythmstix.co.uk/ccdesignerdocs/',
);

function normalizeBase(raw: string): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return 'https://www.rhythmstix.co.uk/ccdesignerdocs/';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

/** Exact DreamHost filenames (spaces and spelling preserved). */
export const JN_DREAMHOST_FILES = {
  chantActivities: '2-and 4-chant-activities.pdf',
  chantAudio: '2-and-4-audio-files.zip',
  chantScore: '2-and-4-chant-score-both-versions.pdf',
  canYouSingActivities: 'Can-you-sing-your-song-activites.pdf',
  canYouSingAudio: 'Can-you-sing-your-song-audio-files.zip',
  canYouSingPiano: 'Can-you-sing-your-song-piano-accomp.pdf',
  helloScore: 'Hello song score.pdf',
  helloActivities: 'Hello-song-activities.pdf',
  helloAudio: 'Hello-song-audio-files.zip',
  improvGames: 'Not-quite-jazz-improvisation-games.pdf',
  waysIntoImprov: 'Ways-into-Improvisation.pdf',
} as const;

export type JnDreamHostFileKey = keyof typeof JN_DREAMHOST_FILES;

/** Build a direct download URL; encodes spaces and special characters. */
export function jnDreamHostUrl(filename: string): string {
  const encoded = filename
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${JN_DREAMHOST_BASE}${encoded}`;
}

export function jnDreamHostFileUrl(key: JnDreamHostFileKey): string {
  return jnDreamHostUrl(JN_DREAMHOST_FILES[key]);
}
