/**
 * Detect & normalise cloud share links (Drive, Dropbox, OneDrive, Box, iCloud)
 * into direct-stream / embed URLs where possible. Client-side only — no new
 * serverless functions.
 */

export type CloudProvider =
  | 'gdrive'
  | 'dropbox'
  | 'onedrive'
  | 'sharepoint'
  | 'box'
  | 'icloud'
  | 'generic';

export type CloudMediaKind = 'video' | 'audio' | 'image' | 'document' | 'unknown';

export interface CloudLinkResult {
  provider: CloudProvider;
  /** Original pasted URL (trimmed). */
  sourceUrl: string;
  /** Best URL for <video>/<audio>/<img> src or direct download. */
  streamUrl: string;
  /** Best URL for iframe embed / preview when stream isn't possible. */
  embedUrl?: string;
  /** Human-facing open URL (Drive/Dropbox UI). */
  openUrl: string;
  /** Short label for library badge. */
  badge: string;
  /** True when we believe the file can play as media without an iframe. */
  canDirectPlay: boolean;
  /** True when an iframe preview is preferred (video docs, etc.). */
  preferEmbed: boolean;
  /** Hint when sharing may block anonymous access. */
  shareHint?: string;
  /** True when we couldn't reliably convert — use gracefully. */
  fallback: boolean;
  message?: string;
}

const SHARE_HINT = 'Set sharing to Anyone with the link (viewer) so classrooms can play it.';

function safeUrl(input: string): URL | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

function hostOf(u: URL): string {
  return u.hostname.replace(/^www\./, '').toLowerCase();
}

export function detectCloudProvider(input: string): CloudProvider {
  const u = safeUrl(input);
  if (!u) return 'generic';
  const h = hostOf(u);
  if (h === 'drive.google.com' || h === 'docs.google.com' || h.endsWith('.googleusercontent.com')) {
    return 'gdrive';
  }
  if (h === 'dropbox.com' || h.endsWith('.dropbox.com') || h === 'dl.dropboxusercontent.com') {
    return 'dropbox';
  }
  if (h === '1drv.ms' || h === 'onedrive.live.com' || h.endsWith('.onedrive.live.com')) {
    return 'onedrive';
  }
  if (h.endsWith('.sharepoint.com') || h === 'sharepoint.com') {
    return 'sharepoint';
  }
  if (h === 'box.com' || h.endsWith('.box.com') || h === 'app.box.com') {
    return 'box';
  }
  if (h === 'icloud.com' || h.endsWith('.icloud.com') || h === 'www.icloud.com') {
    return 'icloud';
  }
  return 'generic';
}

export function cloudProviderBadge(provider: CloudProvider): string {
  switch (provider) {
    case 'gdrive':
      return 'Drive';
    case 'dropbox':
      return 'Dropbox';
    case 'onedrive':
      return 'OneDrive';
    case 'sharepoint':
      return 'SharePoint';
    case 'box':
      return 'Box';
    case 'icloud':
      return 'iCloud';
    default:
      return 'Link';
  }
}

export function cloudProviderOpenLabel(provider: CloudProvider): string {
  switch (provider) {
    case 'gdrive':
      return 'Open in Drive';
    case 'dropbox':
      return 'Open in Dropbox';
    case 'onedrive':
    case 'sharepoint':
      return 'Open in OneDrive';
    case 'box':
      return 'Open in Box';
    case 'icloud':
      return 'Open in iCloud';
    default:
      return 'Open link';
  }
}

function guessKindFromPath(path: string): CloudMediaKind {
  if (/\.(mp4|webm|mov|m4v|mkv)(\?|$)/i.test(path)) return 'video';
  if (/\.(mp3|wav|m4a|aac|ogg|flac)(\?|$)/i.test(path)) return 'audio';
  if (/\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(path)) return 'image';
  if (/\.(pptx?|docx?|pdf|xlsx?)(\?|$)/i.test(path)) return 'document';
  return 'unknown';
}

function extractDriveId(u: URL): string | null {
  const fileMatch = u.pathname.match(/\/file\/d\/([^/]+)/);
  if (fileMatch?.[1]) return fileMatch[1];
  const openMatch = u.pathname.match(/\/open/);
  if (openMatch) {
    const id = u.searchParams.get('id');
    if (id) return id;
  }
  const ucId = u.searchParams.get('id');
  if (ucId && (u.pathname.includes('/uc') || u.pathname.includes('/thumbnail'))) return ucId;
  const folders = u.pathname.match(/\/folders\/([^/]+)/);
  if (folders?.[1]) return folders[1];
  return u.searchParams.get('id');
}

function normaliseGoogleDrive(u: URL, kind: CloudMediaKind): CloudLinkResult {
  const id = extractDriveId(u);
  const sourceUrl = u.toString();
  const openUrl = id ? `https://drive.google.com/file/d/${id}/view` : sourceUrl;
  if (!id) {
    return {
      provider: 'gdrive',
      sourceUrl,
      streamUrl: sourceUrl,
      openUrl,
      badge: 'Drive',
      canDirectPlay: false,
      preferEmbed: false,
      shareHint: SHARE_HINT,
      fallback: true,
      message: 'Could not find a Drive file id — paste a file share link.',
    };
  }

  const streamUrl = `https://drive.google.com/uc?export=download&id=${id}`;
  const embedUrl = `https://drive.google.com/file/d/${id}/preview`;
  const preferEmbed = kind === 'video' || kind === 'document' || kind === 'unknown';

  return {
    provider: 'gdrive',
    sourceUrl,
    streamUrl,
    embedUrl,
    openUrl,
    badge: 'Drive',
    canDirectPlay: kind === 'audio' || kind === 'image',
    preferEmbed,
    shareHint: SHARE_HINT,
    fallback: false,
    message: preferEmbed
      ? 'Videos use Drive preview embed when direct stream is blocked.'
      : undefined,
  };
}

function normaliseDropbox(u: URL): CloudLinkResult {
  const sourceUrl = u.toString();
  const openUrl = sourceUrl;
  const host = hostOf(u);
  let streamUrl = sourceUrl;

  if (host === 'dl.dropboxusercontent.com') {
    streamUrl = sourceUrl;
  } else {
    const next = new URL(sourceUrl);
    next.searchParams.delete('dl');
    next.searchParams.set('raw', '1');
    // Prefer content CDN form
    streamUrl = next
      .toString()
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace('dropbox.com', 'dl.dropboxusercontent.com');
    if (!streamUrl.includes('raw=1') && !streamUrl.includes('dl=1')) {
      streamUrl += (streamUrl.includes('?') ? '&' : '?') + 'raw=1';
    }
  }

  return {
    provider: 'dropbox',
    sourceUrl,
    streamUrl,
    openUrl,
    badge: 'Dropbox',
    canDirectPlay: true,
    preferEmbed: false,
    shareHint: SHARE_HINT,
    fallback: false,
  };
}

function normaliseOneDrive(u: URL): CloudLinkResult {
  const sourceUrl = u.toString();
  const openUrl = sourceUrl;
  // 1drv.ms short links and sharepoint — prefer embed for docs/video; download for media when possible
  let embedUrl: string | undefined;
  let streamUrl = sourceUrl;
  let fallback = false;

  if (hostOf(u) === '1drv.ms') {
    // Best-effort: append embed=1 / download redirect isn't resolvable client-side without follow
    embedUrl = sourceUrl.includes('?') ? `${sourceUrl}&embed=1` : `${sourceUrl}?embed=1`;
    streamUrl = sourceUrl.includes('?') ? `${sourceUrl}&download=1` : `${sourceUrl}?download=1`;
    fallback = true;
  } else if (u.pathname.includes('/embed') || u.searchParams.get('em') === '2') {
    embedUrl = sourceUrl;
    streamUrl = sourceUrl;
  } else if (hostOf(u).includes('sharepoint.com')) {
    // SharePoint: use download.aspx when present, else keep + offer embed
    if (u.pathname.toLowerCase().includes('/download.aspx') || u.searchParams.has('download')) {
      streamUrl = sourceUrl;
    } else {
      embedUrl = sourceUrl;
      fallback = true;
    }
  } else {
    // onedrive.live.com resid links
    const resid = u.searchParams.get('resid') || u.searchParams.get('id');
    if (resid) {
      embedUrl = `https://onedrive.live.com/embed?resid=${encodeURIComponent(resid)}&authkey=${encodeURIComponent(u.searchParams.get('authkey') || '')}`;
      streamUrl = `https://onedrive.live.com/download?resid=${encodeURIComponent(resid)}&authkey=${encodeURIComponent(u.searchParams.get('authkey') || '')}`;
    } else {
      fallback = true;
    }
  }

  return {
    provider: hostOf(u).includes('sharepoint') ? 'sharepoint' : 'onedrive',
    sourceUrl,
    streamUrl,
    embedUrl,
    openUrl,
    badge: hostOf(u).includes('sharepoint') ? 'SharePoint' : 'OneDrive',
    canDirectPlay: !fallback,
    preferEmbed: Boolean(embedUrl) && fallback,
    shareHint: SHARE_HINT,
    fallback,
    message: fallback
      ? 'OneDrive/SharePoint short links may need “Anyone with the link”. Use Open if playback fails.'
      : undefined,
  };
}

function normaliseBox(u: URL): CloudLinkResult {
  const sourceUrl = u.toString();
  // app.box.com/s/<shared_name> — direct stream not reliably public without API
  const shared = u.pathname.match(/\/s\/([^/]+)/)?.[1];
  return {
    provider: 'box',
    sourceUrl,
    streamUrl: sourceUrl,
    embedUrl: shared ? `https://app.box.com/embed/s/${shared}` : undefined,
    openUrl: sourceUrl,
    badge: 'Box',
    canDirectPlay: false,
    preferEmbed: Boolean(shared),
    shareHint: SHARE_HINT,
    fallback: true,
    message: 'Box links usually need embed mode or a publicly shared file.',
  };
}

function normaliseICloud(u: URL): CloudLinkResult {
  const sourceUrl = u.toString();
  return {
    provider: 'icloud',
    sourceUrl,
    streamUrl: sourceUrl,
    openUrl: sourceUrl,
    badge: 'iCloud',
    canDirectPlay: false,
    preferEmbed: false,
    shareHint: 'iCloud public share links are limited in browsers — prefer Drive, Dropbox, or a direct file URL.',
    fallback: true,
    message: 'iCloud Drive has no reliable anonymous stream URL. Open the link, or re-host as a public file.',
  };
}

/**
 * Normalise a pasted cloud / generic URL for media library + scene playback.
 * `kindHint` helps choose Drive preview vs download.
 */
export function normaliseCloudLink(
  input: string,
  kindHint: CloudMediaKind = 'unknown',
): CloudLinkResult {
  const u = safeUrl(input);
  const sourceUrl = input.trim();
  if (!u) {
    return {
      provider: 'generic',
      sourceUrl,
      streamUrl: sourceUrl,
      openUrl: sourceUrl,
      badge: 'Link',
      canDirectPlay: Boolean(sourceUrl),
      preferEmbed: false,
      fallback: true,
      message: 'Enter a full https:// link.',
    };
  }

  const provider = detectCloudProvider(sourceUrl);
  const kind = kindHint === 'unknown' ? guessKindFromPath(u.pathname + u.search) : kindHint;

  switch (provider) {
    case 'gdrive':
      return normaliseGoogleDrive(u, kind);
    case 'dropbox':
      return normaliseDropbox(u);
    case 'onedrive':
    case 'sharepoint':
      return normaliseOneDrive(u);
    case 'box':
      return normaliseBox(u);
    case 'icloud':
      return normaliseICloud(u);
    default:
      return {
        provider: 'generic',
        sourceUrl: u.toString(),
        streamUrl: u.toString(),
        openUrl: u.toString(),
        badge: 'Link',
        canDirectPlay: true,
        preferEmbed: false,
        fallback: false,
      };
  }
}

/** Map scene / rail type to cloud media kind for better Drive normalisation. */
export function sceneTypeToCloudKind(
  type?: string | null,
): CloudMediaKind {
  switch (type) {
    case 'video':
    case 'youtube':
    case 'vimeo':
      return 'video';
    case 'audio':
    case 'lyrics':
      return 'audio';
    case 'image':
      return 'image';
    case 'powerpoint':
    case 'googleslides':
    case 'canva':
      return 'document';
    default:
      return 'unknown';
  }
}

export function isCloudShareUrl(input: string): boolean {
  const p = detectCloudProvider(input);
  return p !== 'generic';
}
