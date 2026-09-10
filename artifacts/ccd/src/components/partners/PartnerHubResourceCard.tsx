/**
 * Shared Partner Hub resource / info card.
 * Used by Jazz North, LSO, and other orgs via PartnerOrgHubTemplate.
 */

import type { ReactNode } from 'react';
import {
  Check,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  PlusCircle,
} from 'lucide-react';

export interface PartnerHubResourceCardProps {
  title: string;
  meta?: string;
  description?: ReactNode;
  /** Accent border / link colour classes */
  accentBorderClassName?: string;
  linkClassName?: string;
  siteUrl?: string;
  openUrl?: string;
  openLabel?: string;
  downloadUrl?: string;
  downloadFilename?: string;
  downloadLabel?: string;
  onAddActivities?: () => void;
  onAddLessonPlan?: () => void;
  addingActivities?: boolean;
  addingLesson?: boolean;
  addedActivities?: boolean;
  addedLesson?: boolean;
  disabled?: boolean;
  extraActions?: ReactNode;
}

export function PartnerHubResourceCard({
  title,
  meta,
  description,
  accentBorderClassName = 'border-gray-200',
  linkClassName = 'text-teal-800',
  siteUrl,
  openUrl,
  openLabel = 'Open',
  downloadUrl,
  downloadFilename,
  downloadLabel = 'Download',
  onAddActivities,
  onAddLessonPlan,
  addingActivities,
  addingLesson,
  addedActivities,
  addedLesson,
  disabled,
  extraActions,
}: PartnerHubResourceCardProps) {
  return (
    <li
      className={`flex h-full flex-col justify-between rounded-xl border bg-white p-4 shadow-sm ${accentBorderClassName}`}
    >
      <div>
        {meta && <p className="text-xs font-medium text-gray-500">{meta}</p>}
        <h4 className="mt-0.5 font-semibold text-gray-900">{title}</h4>
        {description && (
          <div className="mt-1 text-sm leading-relaxed text-gray-600">{description}</div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-sm font-medium hover:underline ${linkClassName}`}
          >
            View on site
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        )}
        {openUrl && (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 rounded-md border border-current/20 bg-white px-2.5 py-1 text-sm font-medium hover:bg-gray-50 ${linkClassName}`}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {openLabel}
          </a>
        )}
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadFilename}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-2.5 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            {downloadLabel}
          </a>
        )}
        {onAddActivities && (
          <button
            type="button"
            onClick={onAddActivities}
            disabled={disabled || addingActivities}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {addingActivities ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : addedActivities ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <PlusCircle className="h-3.5 w-3.5" aria-hidden />
            )}
            {addedActivities ? 'Activities added' : 'Add Activities'}
          </button>
        )}
        {onAddLessonPlan && (
          <button
            type="button"
            onClick={onAddLessonPlan}
            disabled={disabled || addingLesson}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {addingLesson ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : addedLesson ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <PlusCircle className="h-3.5 w-3.5" aria-hidden />
            )}
            {addedLesson ? 'Lesson added' : 'Add Lesson Plan'}
          </button>
        )}
        {extraActions}
      </div>
    </li>
  );
}
