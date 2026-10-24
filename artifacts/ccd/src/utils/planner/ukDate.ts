/**
 * UK date helpers — parse ISO calendar dates as local (avoid UTC off-by-one)
 * and format as dd/mm/yyyy.
 */

/** Parse `YYYY-MM-DD` (or Date) as local calendar date — never UTC midnight. */
export function parseLocalDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]) - 1;
    const d = Number(iso[3]);
    const dt = new Date(y, m, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Format as dd/mm/yyyy (UK). */
export function formatUkDate(value: string | Date | null | undefined): string {
  const dt = parseLocalDate(value);
  if (!dt) return value ? String(value) : '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Parse typed UK `dd/mm/yyyy` (also accepts `d/m/yyyy`) → `YYYY-MM-DD`, or null. */
export function parseUkDateInput(raw: string): string | null {
  const s = String(raw || '').trim();
  if (!s) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return s;
  const uk = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (!uk) return null;
  const d = Number(uk[1]);
  const m = Number(uk[2]);
  const y = Number(uk[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Store value for Settings term fields: keep ISO when valid, else empty. */
export function toIsoDateInput(value: string | Date | null | undefined): string {
  const dt = parseLocalDate(value);
  if (!dt) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Short range for planners: "1 Sep – 31 Oct" using local parse. */
export function formatUkDateRangeShort(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
): string {
  const a = parseLocalDate(start);
  const b = parseLocalDate(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (a && b) {
    return `${a.toLocaleDateString('en-GB', opts)} – ${b.toLocaleDateString('en-GB', opts)}`;
  }
  if (a) return a.toLocaleDateString('en-GB', opts);
  return `${start || ''} – ${end || ''}`.trim();
}
