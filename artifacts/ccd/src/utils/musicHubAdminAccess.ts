/**
 * Music Hub admin assignment + capability checks.
 * Extends existing Users / roles — no separate Hub login accounts.
 * Local overlay today; migrate → hub_memberships when merged.
 */

import type { MusicHubAdminAssignmentStore } from '../types/musicHubContent';
import type { Profile, ProfileRole, AppUser } from '../types/auth';
import {
  getMusicHubsDirectory,
  walkMusicHubNodes,
} from '../config/musicHubsDirectory';
import type { MusicHubDirectoryNode } from '../types/musicHubsDirectory';

export const MUSIC_HUB_ADMIN_ASSIGN_KEY = 'ccd-music-hub-admin-assignments-v1';
export const HUB_ADMIN_PERMISSION_DENIED =
  'You do not have permission to administer this page.';

const ADMINISTERABLE_KINDS = new Set([
  'music-hub',
  'service',
  'national-service',
  'district',
  'borough',
]);

function emptyAssignments(): MusicHubAdminAssignmentStore {
  return { version: 1, byUserId: {}, inheritChildrenByUserId: {} };
}

function readAssignments(): MusicHubAdminAssignmentStore {
  if (typeof window === 'undefined') return emptyAssignments();
  try {
    const raw = localStorage.getItem(MUSIC_HUB_ADMIN_ASSIGN_KEY);
    if (!raw) return emptyAssignments();
    const parsed = JSON.parse(raw) as MusicHubAdminAssignmentStore;
    if (!parsed || parsed.version !== 1 || typeof parsed.byUserId !== 'object') {
      return emptyAssignments();
    }
    return {
      version: 1,
      byUserId: parsed.byUserId,
      inheritChildrenByUserId: parsed.inheritChildrenByUserId || {},
    };
  } catch {
    return emptyAssignments();
  }
}

function writeAssignments(store: MusicHubAdminAssignmentStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MUSIC_HUB_ADMIN_ASSIGN_KEY, JSON.stringify(store));
  try {
    window.dispatchEvent(new CustomEvent('ccd:music-hub-admin-changed'));
  } catch {
    /* ignore */
  }
}

export function getMusicHubAdminAssignments(): MusicHubAdminAssignmentStore {
  return readAssignments();
}

export function findMusicHubNode(id: string): MusicHubDirectoryNode | null {
  let found: MusicHubDirectoryNode | null = null;
  walkMusicHubNodes(getMusicHubsDirectory().countries, (node) => {
    if (node.id === id) found = node;
  });
  return found;
}

/** Collect descendant node ids under a parent (for EMS → all Essex districts). */
export function collectDescendantNodeIds(parentId: string): string[] {
  const parent = findMusicHubNode(parentId);
  if (!parent) return [];
  const ids: string[] = [];
  const walk = (n: MusicHubDirectoryNode) => {
    for (const child of n.children || []) {
      if (ADMINISTERABLE_KINDS.has(child.kind)) ids.push(child.id);
      walk(child);
    }
  };
  walk(parent);
  return ids;
}

export function getAssignedHubNodeIdsForUser(userId: string): string[] {
  if (!userId) return [];
  const store = readAssignments();
  const explicit = [...(store.byUserId[userId] || [])];
  const inheritParents = store.inheritChildrenByUserId?.[userId] || [];
  const expanded = new Set(explicit);
  for (const parentId of inheritParents) {
    expanded.add(parentId);
    for (const id of collectDescendantNodeIds(parentId)) expanded.add(id);
  }
  // Also: if ems (organisation) assigned without inherit flag, still allow org-scoped
  // districts only when inherit includes ems — explicit list otherwise.
  return Array.from(expanded);
}

export function getInheritParentsForUser(userId: string): string[] {
  if (!userId) return [];
  return [...(readAssignments().inheritChildrenByUserId?.[userId] || [])];
}

export function setMusicHubAccessForUser(
  userId: string,
  nodeIds: string[],
  inheritParentIds: string[] = [],
): void {
  const store = readAssignments();
  const unique = Array.from(new Set(nodeIds.filter(Boolean)));
  const inherit = Array.from(new Set(inheritParentIds.filter(Boolean)));

  const byUserId = { ...store.byUserId };
  const inheritChildrenByUserId = { ...(store.inheritChildrenByUserId || {}) };

  if (unique.length === 0) delete byUserId[userId];
  else byUserId[userId] = unique;

  if (inherit.length === 0) delete inheritChildrenByUserId[userId];
  else inheritChildrenByUserId[userId] = inherit;

  writeAssignments({ version: 1, byUserId, inheritChildrenByUserId });
}

/** @deprecated Prefer setMusicHubAccessForUser */
export function setAssignedHubNodeIdsForUser(userId: string, nodeIds: string[]): void {
  setMusicHubAccessForUser(userId, nodeIds, getInheritParentsForUser(userId));
}

export function listAdministerableHubNodes(): {
  id: string;
  name: string;
  path: string;
  kind: string;
  organisationId?: string;
}[] {
  const list: {
    id: string;
    name: string;
    path: string;
    kind: string;
    organisationId?: string;
  }[] = [];
  walkMusicHubNodes(getMusicHubsDirectory().countries, (node) => {
    if (!ADMINISTERABLE_KINDS.has(node.kind)) return;
    list.push({
      id: node.id,
      name: node.name,
      path: node.path,
      kind: node.kind,
      organisationId: node.organisationId,
    });
  });
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export function isSystemMusicHubApprover(
  user: AppUser | null | undefined,
  profile?: Profile | null,
): boolean {
  const role = (profile?.role || user?.role || '') as ProfileRole | string;
  return (
    role === 'admin' ||
    role === 'superuser' ||
    role === 'super_admin' ||
    profile?.can_manage_users === true
  );
}

export function isMusicHubAdminForNode(
  userId: string | undefined,
  nodeId: string,
  user?: AppUser | null,
  profile?: Profile | null,
): boolean {
  if (!userId || !nodeId) return false;
  if (isSystemMusicHubApprover(user, profile)) return true;
  const assigned = getAssignedHubNodeIdsForUser(userId);
  return assigned.includes(nodeId);
}

export function canEditMusicHubNode(
  user: AppUser | null | undefined,
  profile: Profile | null | undefined,
  nodeId: string,
): boolean {
  if (!user?.id) return false;
  return isMusicHubAdminForNode(user.id, nodeId, user, profile);
}

/**
 * System admin / superuser may approve — but never their own submission.
 */
export function canApproveMusicHubContent(
  user: AppUser | null | undefined,
  profile: Profile | null | undefined,
  revisionEditedByUserId?: string,
): boolean {
  if (!isSystemMusicHubApprover(user, profile)) return false;
  if (revisionEditedByUserId && user?.id && revisionEditedByUserId === user.id) {
    return false;
  }
  return true;
}

export function listMyAdministeredHubs(userId: string | undefined): {
  id: string;
  name: string;
  path: string;
}[] {
  if (!userId) return [];
  const ids = new Set(getAssignedHubNodeIdsForUser(userId));
  if (ids.size === 0) return [];
  return listAdministerableHubNodes().filter((n) => ids.has(n.id));
}
