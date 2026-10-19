/**
 * Display name / initials for the header account control.
 * Never surfaces the literal "Demo Visitor" label.
 */

import type { AppUser, Profile, ProfileRole } from '../types/auth';

const BANNED_DEMO_LABEL = /^demo\s*visitor$/i;

export function resolveDisplayName(
  user: AppUser | null | undefined,
  profile: Profile | null | undefined,
): string {
  const fromParts = [profile?.first_name, profile?.last_name]
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(' ');
  const candidates = [
    profile?.display_name?.trim(),
    fromParts,
    user?.name?.trim(),
    user?.email?.split('@')[0]?.trim(),
    profile?.email?.split('@')[0]?.trim(),
  ].filter((v): v is string => Boolean(v && v.length > 0));

  for (const c of candidates) {
    if (!BANNED_DEMO_LABEL.test(c)) return c;
  }
  return 'Teacher';
}

export function initialsFromDisplayName(name: string, email?: string | null): string {
  const cleaned = (name || '').trim();
  if (cleaned && !BANNED_DEMO_LABEL.test(cleaned)) {
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    }
    const alnum = cleaned.replace(/[^a-zA-Z0-9]/g, '');
    if (alnum.length >= 2) return alnum.slice(0, 2).toUpperCase();
    if (alnum.length === 1) return `${alnum}${alnum}`.toUpperCase();
  }
  const local = (email || '').split('@')[0] || '';
  const letters = local.replace(/[^a-zA-Z0-9]/g, '');
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
  if (letters.length === 1) return `${letters}${letters}`.toUpperCase();
  return '??';
}

export function roleLabelShort(role: ProfileRole | string | undefined | null): string {
  switch (role) {
    case 'super_admin':
      return 'Super admin';
    case 'superuser':
      return 'Superuser';
    case 'admin':
      return 'Admin';
    case 'organisation':
      return 'Organisation';
    case 'creator':
      return 'Creator';
    case 'teacher':
      return 'Teacher';
    case 'viewer':
      return 'Viewer';
    case 'student':
      return 'Student';
    default:
      return role ? String(role) : 'Teacher';
  }
}

/** Title-case a school slug for demo display (oaklands-primary → Oaklands Primary). */
export function titleCaseSlug(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null;
  return slug
    .trim()
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
