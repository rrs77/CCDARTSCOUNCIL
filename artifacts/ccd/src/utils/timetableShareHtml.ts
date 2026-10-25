import { PLAN_LOGO_PRINT_CSS, planLogoImg } from './planLogo.ts';
import { escapeHtmlText as esc } from './escapeHtml.ts';
import { safeColour } from './safeColour.ts';

/** Fallback when a class colour is missing or not a plain colour value. */
const DEFAULT_CLASS_COLOUR = '#14b8a6';

export interface TimetableClass {
  id: string;
  day: number; // 0-6 for Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  className: string;
  location: string;
  color: string;
  recurringUnitId?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** HTML + footer for the shared timetable PDF (inline styles, CCDesigner logo; no CDN). */
export const buildTimetableShareHtml = (timetableClasses: TimetableClass[], className: string): [string, string] => {
  // Every user-supplied string is HTML-escaped (class names, locations, times, colours).
  const safeClassName = esc(className);
  // Group classes by day
  const classesByDay: { [day: number]: TimetableClass[] } = {};
  DAY_NAMES.forEach((_, dayIndex) => {
    classesByDay[dayIndex] = timetableClasses.filter(tClass => tClass.day === dayIndex);
  });

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Class Timetable - ${safeClassName}</title>
      <style>
        ${PLAN_LOGO_PRINT_CSS}
        /* Utilities used below, inlined so the page never waits on a CDN (was the Tailwind CDN script). */
        body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#111827}
        .flex{display:flex}.items-center{align-items:center}.justify-between{justify-content:space-between}
        .space-y-2>*+*{margin-top:8px}
        .mb-2{margin-bottom:8px}.mb-3{margin-bottom:12px}.mb-6{margin-bottom:24px}.mt-1{margin-top:4px}.ml-3{margin-left:12px}.pb-2{padding-bottom:8px}
        .w-4{width:16px}.h-4{height:16px}.rounded-full{border-radius:9999px}
        .border-b-2{border-bottom:2px solid}.border-teal-500{border-color:#14b8a6}
        .font-bold{font-weight:700}.font-semibold{font-weight:600}
        .text-3xl{font-size:30px;line-height:36px}.text-xl{font-size:20px;line-height:28px}.text-lg{font-size:18px;line-height:28px}.text-sm{font-size:14px;line-height:20px}
        .text-gray-600{color:#4b5563}.text-gray-900{color:#111827}
        h1,h2,p{margin-top:0}

        /* No @page margin rule — PDFBolt / print callers set margins outside the HTML. */
        
        .timetable-page {
          width: 21cm;
          min-height: 29.7cm;
          padding: 1cm;
          margin: 0 auto 2cm auto;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          page-break-after: always;
          break-after: always;
        }
        
        .timetable-page:last-child {
          margin-bottom: 0;
        }
        
        @media print {
          .timetable-page {
            box-shadow: none;
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: auto;
          }
          
          .timetable-page:not(:last-child) {
            page-break-after: always;
            break-after: always;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        .day-section {
          margin-bottom: 1.5rem;
          page-break-inside: avoid;
        }

        .class-item {
          border-left: 4px solid;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: #f9fafb;
          border-radius: 0.25rem;
        }
      </style>
    </head>
    <body>
      <div class="timetable-page">
        <div class="mb-6">
          ${planLogoImg('margin:0 0 12px 0;')}
          <h1 class="text-3xl font-bold mb-2">Class Timetable</h1>
          <p class="text-gray-600 text-lg">${safeClassName}</p>
        </div>
  `;

  // Add classes grouped by day
  DAY_NAMES.forEach((dayName, dayIndex) => {
    const classesForDay = classesByDay[dayIndex];
    if (classesForDay && classesForDay.length > 0) {
      // Sort by start time
      const sortedClasses = [...classesForDay].sort((a, b) => {
        const aTime = a.startTime.split(':').map(Number);
        const bTime = b.startTime.split(':').map(Number);
        const aMinutes = aTime[0] * 60 + aTime[1];
        const bMinutes = bTime[0] * 60 + bTime[1];
        return aMinutes - bMinutes;
      });

      htmlContent += `
        <div class="day-section">
          <h2 class="text-xl font-semibold mb-3 pb-2 border-b-2 border-teal-500">
            ${dayName}
          </h2>
          <div class="space-y-2">
      `;
      
      sortedClasses.forEach((tClass) => {
        htmlContent += `
          <div class="class-item" style="border-left-color: ${safeColour(tClass.color, DEFAULT_CLASS_COLOUR)};">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold text-gray-900">${esc(tClass.className)}</div>
                <div class="text-sm text-gray-600 mt-1">
                  <span>${esc(tClass.startTime)} - ${esc(tClass.endTime)}</span>
                  ${tClass.location ? `<span class="ml-3">📍 ${esc(tClass.location)}</span>` : ''}
                </div>
              </div>
              <div 
                class="w-4 h-4 rounded-full"
                style="background-color: ${safeColour(tClass.color, DEFAULT_CLASS_COLOUR)};"
              ></div>
            </div>
          </div>
        `;
      });
      
      htmlContent += `
          </div>
        </div>
      `;
    }
  });

  htmlContent += `
      </div>
    </body>
    </html>
  `;

  // Footer content
  const footerContent = `
    <div style="font-size: 13px; text-align: center; width: 100%; padding: 10px 0; color: #666;">
      <span>${safeClassName} - Class Timetable</span>
      <span style="margin: 0 10px;">|</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;

  return [htmlContent, footerContent];
};
