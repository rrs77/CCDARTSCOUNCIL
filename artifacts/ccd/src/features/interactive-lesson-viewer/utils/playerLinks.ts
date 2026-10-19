/** Read-only classroom player deep links. */

export function buildPlayerPath(
  lessonId: string,
  opts?: { scene?: number },
): string {
  const scene =
    opts?.scene != null && opts.scene > 0 ? `&scene=${encodeURIComponent(String(opts.scene))}` : '';
  return `/?tab=lesson-viewer&play=${encodeURIComponent(lessonId)}&mode=player${scene}`;
}

export function buildPlayerUrl(
  lessonId: string,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
  opts?: { scene?: number },
): string {
  return `${origin}${buildPlayerPath(lessonId, opts)}`;
}

export function buildPlayerEmbedSnippet(
  lessonId: string,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  const src = buildPlayerUrl(lessonId, origin);
  return `<iframe src="${src}" title="Slides" width="960" height="540" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="border:0;border-radius:12px;max-width:100%;aspect-ratio:16/9;"></iframe>`;
}

export function readPlayerLaunchFromLocation(search = typeof window !== 'undefined' ? window.location.search : ''): {
  playId: string | null;
  playerOnly: boolean;
  sceneIndex: number;
} {
  try {
    const params = new URLSearchParams(search);
    const play = params.get('play');
    const mode = params.get('mode');
    const sceneRaw = params.get('scene');
    const sceneNum = sceneRaw != null ? Number(sceneRaw) : 0;
    // scene query is 1-based for teachers; convert to 0-based index
    const sceneIndex =
      Number.isFinite(sceneNum) && sceneNum >= 1 ? Math.floor(sceneNum) - 1 : 0;
    return {
      playId: play,
      playerOnly: mode === 'player' || Boolean(play && mode !== 'edit'),
      sceneIndex,
    };
  } catch {
    return { playId: null, playerOnly: false, sceneIndex: 0 };
  }
}
