/**
 * UK public / bank holidays by nation for school calendar import.
 * Easter is computed (Anonymous Gregorian); fixed dates use the civil calendar.
 */

export type UkNation = 'england' | 'wales' | 'scotland';

export type PublicHoliday = {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  nations: UkNation[];
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Easter Sunday (Gregorian) for year y. */
function easterSunday(y: number): { m: number; d: number } {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { m: month, d: day };
}

function addDaysIso(y: number, m: number, d: number, delta: number): string {
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function holidaysForYear(y: number): PublicHoliday[] {
  const e = easterSunday(y);
  const goodFriday = addDaysIso(y, e.m, e.d, -2);
  const easterMonday = addDaysIso(y, e.m, e.d, 1);
  const earlyMay = nthWeekdayOfMonth(y, 5, 1, 1); // first Monday May
  const spring = lastWeekdayOfMonth(y, 5, 1); // last Monday May
  const summer = lastWeekdayOfMonth(y, 8, 1); // last Monday August (E&W)

  const list: PublicHoliday[] = [
    { id: `${y}-nyd`, date: iso(y, 1, 1), name: 'New Year’s Day', nations: ['england', 'wales', 'scotland'] },
    { id: `${y}-nyd2`, date: iso(y, 1, 2), name: '2 January', nations: ['scotland'] },
    { id: `${y}-gf`, date: goodFriday, name: 'Good Friday', nations: ['england', 'wales', 'scotland'] },
    { id: `${y}-em`, date: easterMonday, name: 'Easter Monday', nations: ['england', 'wales'] },
    { id: `${y}-emay`, date: earlyMay, name: 'Early May bank holiday', nations: ['england', 'wales', 'scotland'] },
    { id: `${y}-spring`, date: spring, name: 'Spring bank holiday', nations: ['england', 'wales', 'scotland'] },
    { id: `${y}-summer`, date: summer, name: 'Summer bank holiday', nations: ['england', 'wales'] },
    { id: `${y}-st-andrew`, date: iso(y, 11, 30), name: 'St Andrew’s Day', nations: ['scotland'] },
    { id: `${y}-xmas`, date: iso(y, 12, 25), name: 'Christmas Day', nations: ['england', 'wales', 'scotland'] },
    { id: `${y}-boxing`, date: iso(y, 12, 26), name: 'Boxing Day', nations: ['england', 'wales', 'scotland'] },
  ];
  return list;
}

function nthWeekdayOfMonth(y: number, month: number, weekday: number, n: number): string {
  // weekday: 0=Sun … 1=Mon
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(Date.UTC(y, month - 1, d));
    if (dt.getUTCMonth() !== month - 1) break;
    if (dt.getUTCDay() === weekday) {
      count += 1;
      if (count === n) return iso(y, month, d);
    }
  }
  return iso(y, month, 1);
}

function lastWeekdayOfMonth(y: number, month: number, weekday: number): string {
  const last = new Date(Date.UTC(y, month, 0)).getUTCDate();
  for (let d = last; d >= 1; d--) {
    const dt = new Date(Date.UTC(y, month - 1, d));
    if (dt.getUTCDay() === weekday) return iso(y, month, d);
  }
  return iso(y, month, last);
}

/** Holidays overlapping an academic year (Sep Y → Aug Y+1). */
export function publicHolidaysForAcademicYear(
  academicYear: string,
  nation: UkNation,
): PublicHoliday[] {
  const startY = Number(academicYear.split('-')[0]);
  if (!Number.isFinite(startY)) return [];
  const years = [startY, startY + 1];
  const seen = new Set<string>();
  const out: PublicHoliday[] = [];
  for (const y of years) {
    for (const h of holidaysForYear(y)) {
      if (!h.nations.includes(nation)) continue;
      if (seen.has(h.date)) continue;
      const [hy, hm] = h.date.split('-').map(Number);
      const inWindow =
        (hy === startY && hm >= 9) || (hy === startY + 1 && hm <= 8);
      if (!inWindow) continue;
      seen.add(h.date);
      out.push(h);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export const UK_NATION_LABELS: Record<UkNation, string> = {
  england: 'England',
  wales: 'Wales',
  scotland: 'Scotland',
};
