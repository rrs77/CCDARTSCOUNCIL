/**
 * School-specific public homepage configuration.
 *
 * Each entry maps a URL slug (e.g. `/oakhill`) to a branded
 * split-screen homepage. To add a new school, append an entry here —
 * no other code changes are needed.
 *
 * Slugs must:
 *  - be lowercase
 *  - contain only letters, numbers, and dashes
 *  - not collide with existing top-level routes (`reset-password`)
 */

export interface SchoolHomepageConfig {
  /** URL slug, served at `/<slug>`. */
  slug: string;
  /** Full display name shown on the homepage and in the page title. */
  displayName: string;
  /** Optional short tagline displayed under the name. */
  tagline?: string;
  /** Optional URL to the school's logo. If omitted, a clean placeholder is shown. */
  logoUrl?: string;
  /** Primary brand color (hex or rgb) — used for the left panel background. */
  primaryColor: string;
  /** Accent color used for highlights, buttons, and decorative shapes. */
  accentColor: string;
  /** Optional welcome heading shown on the right-hand login card. */
  welcomeHeading?: string;
  /** Optional welcome body shown under the heading. */
  welcomeBody?: string;
}

export const SCHOOL_HOMEPAGES: SchoolHomepageConfig[] = [
  {
    slug: 'oakhill',
    displayName: 'Oakhill School',
    tagline: 'Inspiring curiosity, nurturing creativity',
    primaryColor: '#0F4C5C',
    accentColor: '#E5B25D',
    welcomeHeading: 'Welcome back',
    welcomeBody: 'Sign in to plan, deliver, and review your curriculum.',
  },
  {
    slug: 'oaklands',
    displayName: 'Oaklands School',
    tagline: 'Where every child grows',
    primaryColor: '#2F5D3A',
    accentColor: '#F4B860',
    welcomeHeading: 'Welcome back',
    welcomeBody: 'Sign in to plan, deliver, and review your curriculum.',
  },
];

import { PARTNER_HUB_SLUGS } from './partnerHubs';

/**
 * Reserved top-level paths that must never be treated as a school slug.
 * Includes app routes, partner hub slugs, and well-known static asset names
 * that can appear as a single path segment.
 */
const RESERVED_SLUGS = new Set<string>([
  'reset-password',
  'api',
  'auth',
  'admin',
  'login',
  'logout',
  'signup',
  'register',
  ...PARTNER_HUB_SLUGS,
  'manifest.json',
  'manifest.webmanifest',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'service-worker.js',
  'sw.js',
  'index.html',
  'assets',
  'static',
  'public',
]);

/**
 * Returns the school config matching the current pathname (e.g. `/oaklands`),
 * or `null` if the path is not a school homepage.
 */
export function getSchoolForPath(pathname: string): SchoolHomepageConfig | null {
  if (!pathname) return null;
  const trimmed = pathname.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
  if (!trimmed || trimmed.includes('/')) return null;
  if (RESERVED_SLUGS.has(trimmed)) return null;
  return SCHOOL_HOMEPAGES.find((s) => s.slug === trimmed) ?? null;
}
