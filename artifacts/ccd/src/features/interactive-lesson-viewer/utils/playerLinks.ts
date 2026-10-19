/** Read-only classroom player deep links. */

export function buildPlayerPath(lessonId: string): string {
  return `/?tab=lesson-viewer&play=${encodeURIComponent(lessonId)}&mode=player`;
}

export function buildPlayerUrl(lessonId: string, origin = typeof window !== 'undefined' ? window.location.origin : ''): string {
  return `${origin}${buildPlayerPath(lessonId)}`;
}

export function buildPlayerEmbedSnippet(lessonId: string, origin = typeof window !== 'undefined' ? window.location.origin : ''): string {
  const src = buildPlayerUrl(lessonId, origin);
  return `<iframe src="${src}" title="Interactive lesson" width="960" height="540" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="border:0;border-radius:12px;max-width:100%;aspect-ratio:16/9;"></iframe>`;
}

export function readPlayerLaunchFromLocation(search = typeof window !== 'undefined' ? window.location.search : ''): {
  playId: string | null;
  playerOnly: boolean;
} {
  try {
    const params = new URLSearchParams(search);
    // Also support /play/<id> baked into search via rewrite helpers
    const play = params.get('play');
    const mode = params.get('mode');
    return {
      playId: play,
      playerOnly: mode === 'player' || Boolean(play && mode !== 'edit'),
    };
  } catch {
    return { playId: null, playerOnly: false };
  }
}
