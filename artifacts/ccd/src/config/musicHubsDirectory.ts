/**
 * Music Hubs directory accessors — seed JSON + optional local admin overlay.
 *
 * Migration path: replace seed load with Supabase `hub_pages` / organisations tree
 * when hub-admin APIs from feature/user-mgmt-download-tracking are merged.
 * Featured flag lives on the node — do not duplicate org records for FEATURED PARTNER.
 */

import seed from '../data/musicHubsDirectory.seed.json';
import type {
  MusicHubBreadcrumb,
  MusicHubDirectoryIndex,
  MusicHubDirectoryNode,
  MusicHubPublishStatus,
} from '../types/musicHubsDirectory';

const OVERLAY_KEY = 'ccd-music-hubs-directory-overlay';

type NodeOverlay = {
  status?: MusicHubPublishStatus;
  featured?: boolean;
  draftName?: string;
};

type DirectoryOverlay = Record<string, NodeOverlay>;

function readOverlay(): DirectoryOverlay {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERLAY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DirectoryOverlay;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveMusicHubOverlay(overlay: DirectoryOverlay): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OVERLAY_KEY, JSON.stringify(overlay));
}

export function getMusicHubOverlay(): DirectoryOverlay {
  return readOverlay();
}

function applyOverlay(node: MusicHubDirectoryNode, overlay: DirectoryOverlay): MusicHubDirectoryNode {
  const patch = overlay[node.id];
  const children = node.children?.map((c) => applyOverlay(c, overlay));
  if (!patch && !children) return node;
  return {
    ...node,
    ...(patch?.status ? { status: patch.status } : {}),
    ...(typeof patch?.featured === 'boolean' ? { featured: patch.featured } : {}),
    ...(patch?.draftName ? { name: patch.draftName } : {}),
    ...(children ? { children } : {}),
  };
}

export function getMusicHubsDirectory(): MusicHubDirectoryIndex {
  const base = seed as MusicHubDirectoryIndex;
  const overlay = readOverlay();
  return {
    ...base,
    countries: base.countries.map((c) => applyOverlay(c, overlay)),
  };
}

export function walkMusicHubNodes(
  nodes: MusicHubDirectoryNode[],
  visit: (node: MusicHubDirectoryNode, parents: MusicHubDirectoryNode[]) => void,
  parents: MusicHubDirectoryNode[] = [],
): void {
  for (const node of nodes) {
    visit(node, parents);
    if (node.children?.length) {
      walkMusicHubNodes(node.children, visit, [...parents, node]);
    }
  }
}

export function findMusicHubNodeByPath(path: string): {
  node: MusicHubDirectoryNode;
  parents: MusicHubDirectoryNode[];
} | null {
  const normalised = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!normalised) return null;
  let found: { node: MusicHubDirectoryNode; parents: MusicHubDirectoryNode[] } | null = null;
  walkMusicHubNodes(getMusicHubsDirectory().countries, (node, parents) => {
    if (node.path === normalised) found = { node, parents };
  });
  return found;
}

export function findMusicHubNodeById(id: string): MusicHubDirectoryNode | null {
  let found: MusicHubDirectoryNode | null = null;
  walkMusicHubNodes(getMusicHubsDirectory().countries, (node) => {
    if (node.id === id) found = node;
  });
  return found;
}

/** Featured partner for main page — first featured service/hub, prefer EMS. */
export function getFeaturedMusicHub(): MusicHubDirectoryNode | null {
  let featured: MusicHubDirectoryNode | null = null;
  walkMusicHubNodes(getMusicHubsDirectory().countries, (node) => {
    if (!node.featured) return;
    if (node.id === 'ems') {
      featured = node;
      return;
    }
    if (!featured) featured = node;
  });
  return featured;
}

export function getMusicHubBreadcrumbs(
  node: MusicHubDirectoryNode,
  parents: MusicHubDirectoryNode[],
): MusicHubBreadcrumb[] {
  return [
    { name: 'Music Hubs', path: '' },
    ...parents.map((p) => ({ name: p.name, path: p.path })),
    { name: node.name, path: node.path },
  ];
}

/** Skip empty hierarchy: nodes with no children and coming-soon stay visible as placeholders. */
export function visibleChildren(node: MusicHubDirectoryNode): MusicHubDirectoryNode[] {
  return (node.children || []).filter((c) => c.status !== 'draft');
}

export function musicHubPageHref(path: string): string {
  if (!path) return '/music-hubs';
  return `/music-hubs/${path}`;
}

export function openMusicHubPath(path: string): void {
  if (typeof window === 'undefined') return;
  window.location.assign(musicHubPageHref(path));
}

/** Search hubs / services / areas by name or path. */
export function searchMusicHubs(query: string): MusicHubDirectoryNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: MusicHubDirectoryNode[] = [];
  walkMusicHubNodes(getMusicHubsDirectory().countries, (node) => {
    if (node.status === 'draft') return;
    const hay = `${node.name} ${node.slug} ${node.path} ${node.tagline || ''}`.toLowerCase();
    if (hay.includes(q)) hits.push(node);
  });
  return hits.slice(0, 40);
}

export function parseMusicHubsPathname(pathname: string): string | null {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (trimmed === 'music-hubs') return '';
  if (trimmed.startsWith('music-hubs/')) {
    return trimmed.slice('music-hubs/'.length);
  }
  return null;
}

/** Legacy partner slug → directory path (preserve bookmarks). */
export const LEGACY_PARTNER_TO_MUSIC_HUB_PATH: Record<string, string> = {
  ems: 'england/east-of-england/greater-essex/essex-music-service',
  triborough: 'england/london/london-west/tri-borough',
  tbmh: 'england/london/london-west/tri-borough',
  'tri-borough': 'england/london/london-west/tri-borough',
};

export const ESSEX_DISTRICT_SLUGS = [
  'basildon',
  'braintree',
  'brentwood',
  'castle-point',
  'chelmsford',
  'colchester',
  'epping-forest',
  'harlow',
  'maldon',
  'rochford',
  'tendring',
  'uttlesford',
] as const;

export type EssexDistrictSlug = (typeof ESSEX_DISTRICT_SLUGS)[number];

const EMS_SERVICE_PATH = 'england/east-of-england/greater-essex/essex-music-service';

/**
 * Clean public aliases → full directory path.
 * Prefer `/essex/chelmsford` and `/ems` over long `/music-hubs/...` URLs.
 * Note: bare `/ems` and `/triborough` stay on Partner Hub chrome; aliases
 * below are used for `/essex/...` and for admin path resolution.
 */
export function buildMusicHubPathAliases(): Record<string, string> {
  const aliases: Record<string, string> = {
    ...LEGACY_PARTNER_TO_MUSIC_HUB_PATH,
    essex: EMS_SERVICE_PATH,
  };
  for (const slug of ESSEX_DISTRICT_SLUGS) {
    aliases[`essex/${slug}`] = `${EMS_SERVICE_PATH}/${slug}`;
  }
  return aliases;
}

export function resolveMusicHubDirectoryPath(rawPath: string): string | null {
  const normalised = rawPath.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!normalised) return '';
  const aliases = buildMusicHubPathAliases();
  if (aliases[normalised]) return aliases[normalised];
  if (findMusicHubNodeByPath(normalised)) return normalised;
  return null;
}

export type MusicHubResolvedRoute =
  | { kind: 'directory' }
  | { kind: 'page'; path: string; admin: false }
  | { kind: 'admin'; path: string; admin: true; nodeId: string };

/**
 * Resolve `/music-hubs…`, `/essex/chelmsford`, `/essex/chelmsford/admin`, `/ems/admin`.
 * Bare partner slugs (`/ems`) are left to Partner Hub routing (returns null).
 */
export function resolveMusicHubRoute(pathname: string): MusicHubResolvedRoute | null {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!trimmed) return null;

  const isAdminSuffix = trimmed.endsWith('/admin') || trimmed === 'admin';
  const withoutAdmin = isAdminSuffix
    ? trimmed === 'admin'
      ? ''
      : trimmed.slice(0, -'/admin'.length).replace(/\/$/, '')
    : trimmed;

  // /music-hubs and /music-hubs/*
  if (withoutAdmin === 'music-hubs' || withoutAdmin.startsWith('music-hubs/')) {
    const inner =
      withoutAdmin === 'music-hubs' ? '' : withoutAdmin.slice('music-hubs/'.length);
    if (!inner) {
      return isAdminSuffix ? null : { kind: 'directory' };
    }
    const path = resolveMusicHubDirectoryPath(inner);
    if (path === null) return null;
    if (isAdminSuffix) {
      const match = findMusicHubNodeByPath(path);
      if (!match) return null;
      return { kind: 'admin', path, admin: true, nodeId: match.node.id };
    }
    return { kind: 'page', path, admin: false };
  }

  // Clean aliases: /essex/chelmsford[/admin], /ems/admin (not bare /ems)
  const aliases = buildMusicHubPathAliases();
  if (isAdminSuffix) {
    const path = aliases[withoutAdmin] || resolveMusicHubDirectoryPath(withoutAdmin);
    if (!path) return null;
    const match = findMusicHubNodeByPath(path);
    if (!match) return null;
    return { kind: 'admin', path, admin: true, nodeId: match.node.id };
  }

  // Public clean paths with a slash (e.g. essex/chelmsford) — not partner single segments
  if (trimmed.includes('/') && aliases[trimmed]) {
    return { kind: 'page', path: aliases[trimmed], admin: false };
  }

  return null;
}

export function musicHubAdminHref(path: string): string {
  const aliases = buildMusicHubPathAliases();
  const entry = Object.entries(aliases).find(([, full]) => full === path);
  if (entry) {
    // Prefer short essex/* and ems aliases for admin URLs
    const short = entry[0];
    if (short === 'ems' || short.startsWith('essex/')) {
      return `/${short}/admin`;
    }
  }
  return `/music-hubs/${path}/admin`;
}

export function musicHubPublicHref(path: string): string {
  const aliases = buildMusicHubPathAliases();
  const essexAlias = Object.entries(aliases).find(
    ([alias, full]) => full === path && alias.startsWith('essex/'),
  );
  if (essexAlias) return `/${essexAlias[0]}`;
  return musicHubPageHref(path);
}
