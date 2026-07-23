/**
 * Partner “key dates / important dates” — demo catalogue + localStorage.
 * Selecting a partner on Calendar suggests KS1/KS2 events across the year;
 * ticking “remind me” stores Important dates for the session (no cloud sync).
 */

import { PARTNER_HUBS, type PartnerHubConfig } from '../config/partnerHubs';

export const IMPORTANT_DATES_KEY = 'ccd-important-dates-v1';
export const CCD_IMPORTANT_DATES_UPDATED_EVENT = 'ccd-important-dates-updated';

export type PartnerKeyDateKeyStage = 'EYFS' | 'KS1' | 'KS2' | 'KS3' | 'All';

export type PartnerKeyDateKind =
  | 'performance'
  | 'workshop'
  | 'inset'
  | 'visit'
  | 'open-day'
  | 'festival';

/** Catalogue entry (before user selects / stores). */
export type PartnerKeyDateSuggestion = {
  id: string;
  orgId: string;
  title: string;
  /** ISO date YYYY-MM-DD (single-day demo events) */
  date: string;
  keyStage: PartnerKeyDateKeyStage;
  kind: PartnerKeyDateKind;
  description?: string;
  venue?: string;
};

/** Persisted selection — appears as Important dates + calendar key-date. */
export type ImportantDate = PartnerKeyDateSuggestion & {
  attendReminder: boolean;
  addedAt: string;
  /** Calendar event id when mirrored onto calendar-events-* */
  calendarEventId?: string;
};

export const KEY_DATE_COLOR = '#0F766E'; // teal-700 — distinct from holiday/inset/amber event

function academicYearStart(): number {
  // Align with demo seed academic year 2026-2027
  return 2026;
}

function d(month: number, day: number, yearOffset = 0): string {
  const y = academicYearStart() + yearOffset;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/** Demo key dates spanning autumn → summer for each partner hub. */
const CATALOGUE: PartnerKeyDateSuggestion[] = [
  // —— LSO ——
  {
    id: 'lso-ks1-family-sep',
    orgId: 'lso',
    title: 'LSO Discovery Family Concert (KS1)',
    date: d(9, 24),
    keyStage: 'KS1',
    kind: 'performance',
    description: 'Barbican — shorter Discovery concert for KS1. Demo date only.',
    venue: 'Barbican Hall',
  },
  {
    id: 'lso-ks2-htbao-oct',
    orgId: 'lso',
    title: 'How to Build an Orchestra schools workshop (KS2)',
    date: d(10, 15),
    keyStage: 'KS2',
    kind: 'workshop',
    description: 'Classroom / visit workshop linked to HTBAO. Demo only.',
    venue: 'LSO St Luke’s',
  },
  {
    id: 'lso-inset-nov',
    orgId: 'lso',
    title: 'LSO Discovery teacher CPD / inset',
    date: d(11, 6),
    keyStage: 'All',
    kind: 'inset',
    description: 'Teacher inset day — music curriculum CPD. Demo only.',
  },
  {
    id: 'lso-ks2-bolero-mar',
    orgId: 'lso',
    title: 'Beethoven & Boléro schools concert (KS2)',
    date: d(3, 12, 1),
    keyStage: 'KS2',
    kind: 'performance',
    description: 'Schools concert window. Demo only.',
    venue: 'Barbican Hall',
  },
  {
    id: 'lso-ks1-sing-may',
    orgId: 'lso',
    title: 'LSO Sing primary sharing (KS1)',
    date: d(5, 14, 1),
    keyStage: 'KS1',
    kind: 'festival',
    description: 'Primary singing sharing day. Demo only.',
  },

  // —— ROH ——
  {
    id: 'roh-ks2-rj-oct',
    orgId: 'roh',
    title: 'Create & Dance — Romeo & Juliet schools workshop (KS2)',
    date: d(10, 8),
    keyStage: 'KS2',
    kind: 'workshop',
    description: 'Create & Dance classroom / studio day. Demo only.',
  },
  {
    id: 'roh-ks1-ballet-nov',
    orgId: 'roh',
    title: 'Primary ballet schools matinee (KS1)',
    date: d(11, 19),
    keyStage: 'KS1',
    kind: 'performance',
    description: 'Age-appropriate schools matinee. Demo only.',
    venue: 'Royal Opera House',
  },
  {
    id: 'roh-inset-jan',
    orgId: 'roh',
    title: 'RBO Schools teacher inset / CPD',
    date: d(1, 8, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'Teacher CPD day. Demo only.',
  },
  {
    id: 'roh-ks2-create-mar',
    orgId: 'roh',
    title: 'Create & Dance sharing rehearsal (KS2)',
    date: d(3, 25, 1),
    keyStage: 'KS2',
    kind: 'workshop',
    description: 'Class sharing / rehearsal visit. Demo only.',
  },
  {
    id: 'roh-ks1-open-jun',
    orgId: 'roh',
    title: 'Schools open day — primary trail (KS1)',
    date: d(6, 10, 1),
    keyStage: 'KS1',
    kind: 'open-day',
    description: 'Backstage / foyer primary trail. Demo only.',
  },

  // —— EMS ——
  {
    id: 'ems-ks1-sing-sep',
    orgId: 'ems',
    title: 'Greater Essex singing day (KS1)',
    date: d(9, 30),
    keyStage: 'KS1',
    kind: 'festival',
    description: 'County singing day for KS1. Demo only.',
  },
  {
    id: 'ems-ks2-workshop-nov',
    orgId: 'ems',
    title: 'EMS curriculum workshop day (KS2)',
    date: d(11, 12),
    keyStage: 'KS2',
    kind: 'workshop',
    description: 'Hub curriculum workshop. Demo only.',
  },
  {
    id: 'ems-inset-feb',
    orgId: 'ems',
    title: 'EMS teacher inset / CPD',
    date: d(2, 12, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'Music hub inset. Demo only.',
  },
  {
    id: 'ems-ks2-concert-may',
    orgId: 'ems',
    title: 'EMS schools showcase concert (KS2)',
    date: d(5, 20, 1),
    keyStage: 'KS2',
    kind: 'performance',
    description: 'End-of-year showcase. Demo only.',
  },

  // —— Drama Resource ——
  {
    id: 'dr-ks1-games-oct',
    orgId: 'dramaresource',
    title: 'Drama games twilight for primary (KS1)',
    date: d(10, 22),
    keyStage: 'KS1',
    kind: 'workshop',
    description: 'Teacher + class games twilight. Demo only.',
  },
  {
    id: 'dr-ks2-unit-jan',
    orgId: 'dramaresource',
    title: 'Just Add Drama unit launch workshop (KS2)',
    date: d(1, 21, 1),
    keyStage: 'KS2',
    kind: 'workshop',
    description: 'KS2 unit workshop. Demo only.',
  },
  {
    id: 'dr-inset-apr',
    orgId: 'dramaresource',
    title: 'Drama Resource teacher CPD / inset',
    date: d(4, 16, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'Drama CPD day. Demo only.',
  },

  // —— We Teach Drama ——
  {
    id: 'wtd-ks3-bb-oct',
    orgId: 'weteachdrama',
    title: 'Blood Brothers set-text twilight (KS3/4)',
    date: d(10, 29),
    keyStage: 'KS3',
    kind: 'workshop',
    description: 'GCSE / KS3 set-text twilight. Demo only.',
  },
  {
    id: 'wtd-inset-jan',
    orgId: 'weteachdrama',
    title: 'We Teach Drama teacher inset',
    date: d(1, 15, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'Drama schemes CPD. Demo only.',
  },
  {
    id: 'wtd-ks2-primary-mar',
    orgId: 'weteachdrama',
    title: 'Primary drama schemes taster (KS2)',
    date: d(3, 5, 1),
    keyStage: 'KS2',
    kind: 'workshop',
    description: 'KS2 drama schemes taster. Demo only.',
  },

  // —— iCompose ——
  {
    id: 'icc-ks3-compose-nov',
    orgId: 'icompose',
    title: 'iCompose Getting Started live clinic (KS3)',
    date: d(11, 26),
    keyStage: 'KS3',
    kind: 'workshop',
    description: 'Online composing clinic. Demo only.',
  },
  {
    id: 'icc-inset-feb',
    orgId: 'icompose',
    title: 'iCompose teacher CPD / inset',
    date: d(2, 25, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'Composition CPD. Demo only.',
  },

  // —— Sadler's Wells ——
  {
    id: 'sw-ks1-dance-oct',
    orgId: 'sadlerswells',
    title: "Sadler's Wells schools dance workshop (KS1)",
    date: d(10, 14),
    keyStage: 'KS1',
    kind: 'workshop',
    description: 'Primary dance workshop. Demo only.',
  },
  {
    id: 'sw-ks2-matinee-feb',
    orgId: 'sadlerswells',
    title: "Schools matinee — contemporary dance (KS2)",
    date: d(2, 4, 1),
    keyStage: 'KS2',
    kind: 'performance',
    description: 'Schools matinee. Demo only.',
  },
  {
    id: 'sw-inset-may',
    orgId: 'sadlerswells',
    title: "Sadler's Wells teacher inset",
    date: d(5, 7, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'Dance in schools CPD. Demo only.',
  },

  // —— Tate ——
  {
    id: 'tate-ks1-art-sep',
    orgId: 'tate',
    title: 'Tate Artist Stories classroom visit window (KS1)',
    date: d(9, 18),
    keyStage: 'KS1',
    kind: 'visit',
    description: 'Gallery / classroom visit window. Demo only.',
  },
  {
    id: 'tate-ks2-workshop-jan',
    orgId: 'tate',
    title: 'Art Makes schools workshop (KS2)',
    date: d(1, 28, 1),
    keyStage: 'KS2',
    kind: 'workshop',
    description: 'KS2 making workshop. Demo only.',
  },
  {
    id: 'tate-inset-mar',
    orgId: 'tate',
    title: 'Tate Teachers’ Spotlight CPD / inset',
    date: d(3, 18, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'Teacher CPD. Demo only.',
  },

  // —— National Theatre ——
  {
    id: 'nt-ks2-collection-nov',
    orgId: 'nationaltheatre',
    title: 'NT Collection schools screening (KS2)',
    date: d(11, 5),
    keyStage: 'KS2',
    kind: 'performance',
    description: 'Streamed production classroom screening. Demo only.',
  },
  {
    id: 'nt-ks1-workshop-feb',
    orgId: 'nationaltheatre',
    title: 'Primary theatre games workshop (KS1)',
    date: d(2, 18, 1),
    keyStage: 'KS1',
    kind: 'workshop',
    description: 'KS1 drama workshop. Demo only.',
  },
  {
    id: 'nt-inset-apr',
    orgId: 'nationaltheatre',
    title: 'National Theatre Learning teacher inset',
    date: d(4, 22, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'Learning Hub CPD. Demo only.',
  },

  // —— BBC Ten Pieces ——
  {
    id: 'bbc-ks1-pieces-oct',
    orgId: 'bbctenpieces',
    title: 'Ten Pieces Early Years / KS1 film day',
    date: d(10, 1),
    keyStage: 'KS1',
    kind: 'festival',
    description: 'Classroom film + activity day. Demo only.',
  },
  {
    id: 'bbc-ks2-pieces-mar',
    orgId: 'bbctenpieces',
    title: 'Ten Pieces KS2 creative response day',
    date: d(3, 11, 1),
    keyStage: 'KS2',
    kind: 'workshop',
    description: 'Creative response / performance day. Demo only.',
  },
  {
    id: 'bbc-inset-jun',
    orgId: 'bbctenpieces',
    title: 'Ten Pieces teacher CPD / inset',
    date: d(6, 4, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'BBC Teach CPD. Demo only.',
  },

  // —— National Gallery ——
  {
    id: 'ng-ks1-look-sep',
    orgId: 'nationalgallery',
    title: 'Take One Picture look & talk session (KS1)',
    date: d(9, 25),
    keyStage: 'KS1',
    kind: 'visit',
    description: 'Gallery / classroom look & talk. Demo only.',
  },
  {
    id: 'ng-ks2-top-feb',
    orgId: 'nationalgallery',
    title: 'Take One Picture schools day (KS2)',
    date: d(2, 11, 1),
    keyStage: 'KS2',
    kind: 'workshop',
    description: 'TOP schools day. Demo only.',
  },
  {
    id: 'ng-inset-may',
    orgId: 'nationalgallery',
    title: 'National Gallery teachers’ CPD / inset',
    date: d(5, 13, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'Teachers’ notes CPD. Demo only.',
  },

  // —— Tri-Borough ——
  {
    id: 'tbmh-ks1-sing-oct',
    orgId: 'triborough',
    title: 'TBMH borough singing day (KS1)',
    date: d(10, 16),
    keyStage: 'KS1',
    kind: 'festival',
    description: 'Borough singing day. Demo only.',
  },
  {
    id: 'tbmh-ks2-workshop-jan',
    orgId: 'triborough',
    title: 'TBMH instrumental workshop day (KS2)',
    date: d(1, 22, 1),
    keyStage: 'KS2',
    kind: 'workshop',
    description: 'Instrumental workshop. Demo only.',
  },
  {
    id: 'tbmh-inset-mar',
    orgId: 'triborough',
    title: 'Tri-Borough Music Hub teacher inset',
    date: d(3, 19, 1),
    keyStage: 'All',
    kind: 'inset',
    description: 'Hub CPD day. Demo only.',
  },
];

export function getPartnerHubsForKeyDates(): PartnerHubConfig[] {
  return PARTNER_HUBS;
}

export function getKeyDateSuggestionsForOrg(orgId: string): PartnerKeyDateSuggestion[] {
  const id = String(orgId || '').toLowerCase();
  return CATALOGUE.filter((d) => d.orgId === id).sort((a, b) => a.date.localeCompare(b.date));
}

export function getPartnerShortName(orgId: string): string {
  const hub = PARTNER_HUBS.find((h) => h.slug === orgId || h.aliases?.includes(orgId));
  return hub?.shortName || orgId;
}

export function getPartnerDisplayName(orgId: string): string {
  const hub = PARTNER_HUBS.find((h) => h.slug === orgId || h.aliases?.includes(orgId));
  return hub?.displayName || orgId;
}

export function readImportantDates(): ImportantDate[] {
  try {
    const raw = localStorage.getItem(IMPORTANT_DATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeImportantDates(dates: ImportantDate[]): void {
  localStorage.setItem(IMPORTANT_DATES_KEY, JSON.stringify(dates));
  try {
    window.dispatchEvent(new CustomEvent(CCD_IMPORTANT_DATES_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Merge newly selected suggestions into Important dates (attendReminder true).
 * Returns the list of dates that were newly added or updated.
 */
export function upsertImportantDatesFromSuggestions(
  suggestions: PartnerKeyDateSuggestion[],
  options?: { attendReminder?: boolean },
): ImportantDate[] {
  const attendReminder = options?.attendReminder !== false;
  const existing = readImportantDates();
  const byId = new Map(existing.map((d) => [d.id, d]));
  const touched: ImportantDate[] = [];
  const now = new Date().toISOString();

  for (const s of suggestions) {
    const prev = byId.get(s.id);
    const next: ImportantDate = {
      ...s,
      attendReminder,
      addedAt: prev?.addedAt || now,
      calendarEventId: prev?.calendarEventId || `key-date-${s.id}`,
    };
    byId.set(s.id, next);
    touched.push(next);
  }

  writeImportantDates([...byId.values()].sort((a, b) => a.date.localeCompare(b.date)));
  return touched;
}

export function removeImportantDate(id: string): void {
  writeImportantDates(readImportantDates().filter((d) => d.id !== id));
}

export function toggleImportantDateReminder(id: string, attendReminder: boolean): void {
  const next = readImportantDates().map((d) =>
    d.id === id ? { ...d, attendReminder } : d,
  );
  writeImportantDates(next);
}

export function parseKeyDateToLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export type CalendarKeyDateEvent = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'key-date';
  description?: string;
  color: string;
  orgId?: string;
  keyStage?: PartnerKeyDateKeyStage;
  importantDateId?: string;
  attendReminder?: boolean;
};

export function importantDateToCalendarEvent(date: ImportantDate): CalendarKeyDateEvent {
  const start = parseKeyDateToLocalDate(date.date);
  return {
    id: date.calendarEventId || `key-date-${date.id}`,
    title: date.title,
    startDate: start,
    endDate: start,
    type: 'key-date',
    description: [
      date.description,
      date.venue ? `Venue: ${date.venue}` : '',
      date.keyStage !== 'All' ? `Key stage: ${date.keyStage}` : '',
      date.attendReminder ? 'Reminder: attend' : '',
      'Demo key date — partner names for demonstration only.',
    ]
      .filter(Boolean)
      .join('\n'),
    color: KEY_DATE_COLOR,
    orgId: date.orgId,
    keyStage: date.keyStage,
    importantDateId: date.id,
    attendReminder: date.attendReminder,
  };
}

/** Kind label for UI chips */
export function keyDateKindLabel(kind: PartnerKeyDateKind): string {
  switch (kind) {
    case 'performance':
      return 'Performance';
    case 'workshop':
      return 'Workshop';
    case 'inset':
      return 'Inset / CPD';
    case 'visit':
      return 'Visit';
    case 'open-day':
      return 'Open day';
    case 'festival':
      return 'Festival';
    default:
      return 'Event';
  }
}
