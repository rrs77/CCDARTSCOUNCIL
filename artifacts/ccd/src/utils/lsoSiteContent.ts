/**
 * LSO Partner Hub site content — prototype CMS backed by localStorage.
 * Password gate is client-side only (Arts Council demo).
 */

export const LSO_SITE_STORAGE_KEY = 'ccd-lso-site-content-v1';
export const LSO_EDITOR_SESSION_KEY = 'ccd-lso-editor-unlocked';
/** Prototype editor password — plain compare is intentional for this demo. */
export const LSO_EDITOR_PASSWORD = 'lso';
/** Soft limit for base64 images stored in localStorage (~750KB raw file). */
export const LSO_IMAGE_MAX_BYTES = 750_000;

export type LsoTemplateId =
  | 'hero-intro-cta'
  | 'two-column-story'
  | 'resources-list'
  | 'programme-grid'
  | 'event-spotlight';

export interface LsoTemplateMeta {
  id: LsoTemplateId;
  name: string;
  description: string;
}

export const LSO_TEMPLATES: LsoTemplateMeta[] = [
  {
    id: 'hero-intro-cta',
    name: 'Hero + intro + CTA',
    description: 'Full-width hero image, intro copy, and a call-to-action button.',
  },
  {
    id: 'two-column-story',
    name: 'Two-column story',
    description: 'Side-by-side text and image for a project or story feature.',
  },
  {
    id: 'resources-list',
    name: 'Resources / link list',
    description: 'Heading plus a rich list of resource links and notes.',
  },
  {
    id: 'programme-grid',
    name: 'Programme / cards grid',
    description: 'Three programme cards with titles, blurbs, and optional images.',
  },
  {
    id: 'event-spotlight',
    name: 'Event / date spotlight',
    description: 'Date badge, event title, details, and a supporting image.',
  },
];

export interface LsoImageField {
  src: string;
  alt: string;
}

export interface LsoCustomPage {
  id: string;
  slug: string;
  title: string;
  template: LsoTemplateId;
  /** Rich-text HTML keyed by field id */
  fields: Record<string, string>;
  /** Image slots keyed by slot id */
  images: Record<string, LsoImageField>;
  /** Plain strings (CTA labels/URLs, event date, etc.) */
  meta: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface LsoHubContent {
  /** Optional supplementary intro under the standard LSO description */
  bannerHtml: string;
  heroImage: LsoImageField | null;
  featuredEyebrow: string;
  featuredTitle: string;
  featuredDescriptionHtml: string;
}

export interface LsoSiteContent {
  version: 1;
  hub: LsoHubContent;
  pages: LsoCustomPage[];
  updatedAt: string;
}

export function defaultHubContent(): LsoHubContent {
  return {
    bannerHtml:
      '<p>Welcome to the LSO Discovery partner space. Explore classroom projects, then add How to Build an Orchestra to CCDesigner.</p>',
    heroImage: null,
    featuredEyebrow: 'Featured · KS2',
    featuredTitle: 'How to Build an Orchestra',
    featuredDescriptionHtml:
      '<p>Year 6 classroom unit based on the Hachette / LSO project packs and Mary Auld’s book. Instrument families, classroom film, Beethoven storm and Ravel Boléro.</p>',
  };
}

export function emptySiteContent(): LsoSiteContent {
  return {
    version: 1,
    hub: defaultHubContent(),
    pages: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadLsoSiteContent(): LsoSiteContent {
  if (typeof window === 'undefined') return emptySiteContent();
  try {
    const raw = localStorage.getItem(LSO_SITE_STORAGE_KEY);
    if (!raw) return emptySiteContent();
    const parsed = JSON.parse(raw) as LsoSiteContent;
    if (!parsed || parsed.version !== 1 || !parsed.hub || !Array.isArray(parsed.pages)) {
      return emptySiteContent();
    }
    return {
      ...emptySiteContent(),
      ...parsed,
      hub: { ...defaultHubContent(), ...parsed.hub },
      pages: parsed.pages,
    };
  } catch {
    return emptySiteContent();
  }
}

export function saveLsoSiteContent(content: LsoSiteContent): void {
  if (typeof window === 'undefined') return;
  const next: LsoSiteContent = {
    ...content,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LSO_SITE_STORAGE_KEY, JSON.stringify(next));
}

export function isLsoEditorUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(LSO_EDITOR_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function setLsoEditorUnlocked(unlocked: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (unlocked) sessionStorage.setItem(LSO_EDITOR_SESSION_KEY, '1');
    else sessionStorage.removeItem(LSO_EDITOR_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function verifyLsoEditorPassword(password: string): boolean {
  return password.trim() === LSO_EDITOR_PASSWORD;
}

export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'page';
}

export function uniquePageSlug(desired: string, pages: LsoCustomPage[], excludeId?: string): string {
  let slug = slugifyTitle(desired);
  const taken = (s: string) =>
    pages.some((p) => p.slug === s && p.id !== excludeId);
  if (!taken(slug)) return slug;
  let n = 2;
  while (taken(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}

export function defaultFieldsForTemplate(template: LsoTemplateId): {
  fields: Record<string, string>;
  images: Record<string, LsoImageField>;
  meta: Record<string, string>;
} {
  switch (template) {
    case 'hero-intro-cta':
      return {
        fields: {
          headline: '<h2>Discover the orchestra</h2>',
          intro:
            '<p>Invite your class into LSO Discovery with a short introduction and a clear next step.</p>',
        },
        images: {
          hero: { src: '', alt: 'Hero image' },
        },
        meta: {
          ctaLabel: 'Explore resources',
          ctaUrl: 'https://www.lso.co.uk/learn-and-discover/',
        },
      };
    case 'two-column-story':
      return {
        fields: {
          title: '<h2>A classroom story</h2>',
          body: '<p>Share the journey of a project — what pupils heard, made, and discovered with the orchestra.</p>',
        },
        images: {
          side: { src: '', alt: 'Story image' },
        },
        meta: {},
      };
    case 'resources-list':
      return {
        fields: {
          title: '<h2>Teacher resources</h2>',
          intro: '<p>Curated links and notes for planning.</p>',
          list: '<ul><li><a href="https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/">Digital activities</a> — films and classroom packs</li><li><a href="https://www.lso.co.uk/learn-and-discover/activities-for-schools-and-teachers/">Schools &amp; teachers</a></li></ul>',
        },
        images: {},
        meta: {},
      };
    case 'programme-grid':
      return {
        fields: {
          title: '<h2>This term’s programme</h2>',
          card1Title: '<h3>Listening</h3>',
          card1Body: '<p>Focused listening activities for key stages.</p>',
          card2Title: '<h3>Making</h3>',
          card2Body: '<p>Creative tasks inspired by orchestral colour.</p>',
          card3Title: '<h3>Sharing</h3>',
          card3Body: '<p>Performance and reflection ideas.</p>',
        },
        images: {
          card1: { src: '', alt: 'Programme card 1' },
          card2: { src: '', alt: 'Programme card 2' },
          card3: { src: '', alt: 'Programme card 3' },
        },
        meta: {},
      };
    case 'event-spotlight':
      return {
        fields: {
          title: '<h2>Upcoming spotlight</h2>',
          details:
            '<p>Add date, venue, and booking notes for schools. Link out to the official LSO page for tickets.</p>',
        },
        images: {
          poster: { src: '', alt: 'Event image' },
        },
        meta: {
          dateLabel: 'Date TBC',
          venue: 'Barbican Centre, London',
        },
      };
    default:
      return { fields: {}, images: {}, meta: {} };
  }
}

export function createLsoPage(
  title: string,
  template: LsoTemplateId,
  existing: LsoCustomPage[],
): LsoCustomPage {
  const now = new Date().toISOString();
  const defaults = defaultFieldsForTemplate(template);
  return {
    id: `lso-page-${Date.now().toString(36)}`,
    slug: uniquePageSlug(title, existing),
    title: title.trim() || 'Untitled page',
    template,
    fields: defaults.fields,
    images: defaults.images,
    meta: defaults.meta,
    createdAt: now,
    updatedAt: now,
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (PNG, JPG, GIF, or WebP).'));
      return;
    }
    if (file.size > LSO_IMAGE_MAX_BYTES) {
      reject(
        new Error(
          `Image is too large (max ~${Math.round(LSO_IMAGE_MAX_BYTES / 1000)}KB for this prototype).`,
        ),
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

export function exportLsoSiteJson(content: LsoSiteContent): string {
  return JSON.stringify(content, null, 2);
}

export function importLsoSiteJson(raw: string): LsoSiteContent {
  const parsed = JSON.parse(raw) as LsoSiteContent;
  if (!parsed || parsed.version !== 1 || !parsed.hub || !Array.isArray(parsed.pages)) {
    throw new Error('Invalid LSO site JSON');
  }
  return {
    version: 1,
    hub: { ...defaultHubContent(), ...parsed.hub },
    pages: parsed.pages,
    updatedAt: new Date().toISOString(),
  };
}

export type LsoSitePath =
  | { view: 'hub'; editing: boolean }
  | { view: 'edit' }
  | { view: 'page'; pageSlug: string; editing: boolean };

/** Parse `/lso`, `/lso/edit`, `/lso/p/:slug` (and edit variants). */
export function parseLsoSitePath(pathname: string): LsoSitePath | null {
  if (!pathname) return null;
  const trimmed = pathname.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
  if (!trimmed.startsWith('lso')) return null;
  if (trimmed === 'lso') return { view: 'hub', editing: false };
  if (trimmed === 'lso/edit') return { view: 'edit' };
  const publicPage = trimmed.match(/^lso\/p\/([a-z0-9-]+)$/);
  if (publicPage) return { view: 'page', pageSlug: publicPage[1], editing: false };
  const editPage = trimmed.match(/^lso\/edit\/p\/([a-z0-9-]+)$/);
  if (editPage) return { view: 'page', pageSlug: editPage[1], editing: true };
  return null;
}

export function lsoPagePath(slug: string, editing = false): string {
  return editing ? `/lso/edit/p/${slug}` : `/lso/p/${slug}`;
}
