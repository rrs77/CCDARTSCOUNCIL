/**
 * Music Hub admin assignment + capability checks.
 * Extends User Management with a local overlay (migrate → hub_memberships).
 */

import type { MusicHubAdminAssignmentStore } from '../types/musicHubContent';
import type { Profile, ProfileRole } from '../types/auth';
import type { AppUser } from '../types/auth';
import {
  getMusicHubsDirectory,
  walkMusicHubNodes,
} from '../config/musicHubsDirectory';
import type { MusicHubDirectoryNode } from '../types/musicHubsDirectory';

export const MUSIC_HUB_ADMIN_ASSIGN_KEY = 'ccd-music-hub-admin-assignments-v1';

const ADMINISTERABLE_KINDS = new Set([
  'music-hub',
  'service',
  'national-service',
  'district',
  'borough',
]);

function emptyAssignments(): MusicHubAdminAssignmentStore {
  return { version: 1, byUserId: {} };
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
    return parsed;
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

export function getAssignedHubNodeIdsForUser(userId: string): string[] {
  if (!userId) return [];
  return [...(readAssignments().byUserId[userId] || [])];
}

export function setAssignedHubNodeIdsForUser(userId: string, nodeIds: string[]): void {
  const store = readAssignments();
  const unique = Array.from(new Set(nodeIds.filter(Boolean)));
  if (unique.length === 0) {
    const { [userId]: _, ...rest } = store.byUserId;
    writeAssignments({ version: 1, byUserId: rest });
    return;
  }
  writeAssignments({
    version: 1,
    byUserId: { ...store.byUserId, [userId]: unique },
  });
}

export function listAdministerableHubNodes(): {
  id: string;
  name: string;
  path: string;
  kind: string;
}[] {
  const list: { id: string; name: string; path: string; kind: string }[] = [];
  walkMusicHubNodes(getMusicHubsDirectory().countries, (node) => {
    if (!ADMINISTERABLE_KINDS.has(node.kind)) return;
    list.push({ id: node.id, name: node.name, path: node.path, kind: node.kind });
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
  if (assigned.includes(nodeId)) return true;
  // Org-scoped: EMS district admins also cover parent org when assigned to ems
  const node = findNode(nodeId);
  if (node?.organisationId && assigned.includes(node.organisationId)) return true;
  return false;
}

function findNode(id: string): MusicHubDirectoryNode | null {
  let found: MusicHubDirectoryNode | null = null;
  walkMusicHubNodes(getMusicHubsDirectory().countries, (node) => {
    if (node.id === id) found = node;
  });
  return found;
}

export function canEditMusicHubNode(
  user: AppUser | null | undefined,
  profile: Profile | null | undefined,
  nodeId: string,
): boolean {
  if (!user?.id) return false;
  return isMusicHubAdminForNode(user.id, nodeId, user, profile);
}

export function canApproveMusicHubContent(
  user: AppUser | null | undefined,
  profile: Profile | null | undefined,
): boolean {
  return isSystemMusicHubApprover(user, profile);
}
