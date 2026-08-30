import { format } from 'date-fns';
import type { LessonPlan } from '../contexts/DataContext';

function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatIcalLocalDateTime(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

function formatIcalDateOnly(date: Date): string {
  return format(date, 'yyyyMMdd');
}

function buildDescription(plan: LessonPlan): string {
  const parts: string[] = [];
  if (plan.notes) parts.push(plan.notes);
  if (plan.lessonNumber) parts.push(`Lesson: ${plan.lessonNumber}`);
  if (plan.unitName) parts.push(`Unit: ${plan.unitName}`);
  if (plan.duration) parts.push(`Duration: ${plan.duration} min`);
  if (plan.className) parts.push(`Class: ${plan.className}`);
  if (plan.status) parts.push(`Status: ${plan.status}`);
  return parts.join('\n');
}

function buildSummary(plan: LessonPlan): string {
  if (plan.title) return plan.title;
  if (plan.unitName) return plan.unitName;
  if (plan.lessonNumber) return `Lesson ${plan.lessonNumber}`;
  return 'Lesson';
}

function buildVevent(plan: LessonPlan, dtstamp: string): string {
  const uid = `${plan.id}@ccdesigner`;
  const date = plan.date instanceof Date ? plan.date : new Date(plan.date);
  const summary = escapeIcalText(buildSummary(plan));
  const description = escapeIcalText(buildDescription(plan));
  const status = plan.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';

  if (plan.time && /^\d{1,2}:\d{2}$/.test(plan.time)) {
    const [hours, minutes] = plan.time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (plan.duration > 0 ? plan.duration : 60));

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Europe/London:${formatIcalLocalDateTime(start)}`,
      `DTEND;TZID=Europe/London:${formatIcalLocalDateTime(end)}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : '',
      `STATUS:${status}`,
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');
  }

  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${formatIcalDateOnly(date)}`,
    `DTEND;VALUE=DATE:${formatIcalDateOnly(nextDay)}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : '',
    `STATUS:${status}`,
    'END:VEVENT',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export function generateIcsFromLessonPlans(
  plans: LessonPlan[],
  calendarName: string
): string {
  const dtstamp = formatIcalLocalDateTime(new Date());
  const events = plans.map((plan) => buildVevent(plan, dtstamp));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Creative Curriculum Designer//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcalText(calendarName)}`,
    'BEGIN:VTIMEZONE',
    'TZID:Europe/London',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0000',
    'TZOFFSETTO:+0100',
    'TZNAME:BST',
    'DTSTART:19700329T010000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0000',
    'TZNAME:GMT',
    'DTSTART:19701025T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
