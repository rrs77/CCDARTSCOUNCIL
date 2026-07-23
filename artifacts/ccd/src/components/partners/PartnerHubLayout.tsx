/**
 * Shared partner-hub content primitives.
 *
 * Page chrome (logo + org description + continuous scroll) lives in
 * PartnerHubPage. These helpers keep featured / resource / add actions
 * visually consistent across ROH, LSO, We Teach Drama, EMS, iCompose, Drama Resource, stubs.
 */

import type { ReactNode } from 'react';
import {
  Check,
  ExternalLink,
  FileText,
  Loader2,
  PlusCircle,
} from 'lucide-react';

export function PartnerHubFeaturedSection({
  eyebrow,
  title,
  description,
  links,
  accentClassName = 'border-teal-200 bg-teal-50/60',
  eyebrowClassName = 'text-teal-800',
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  links?: { href: string; label: string; icon?: 'external' | 'file' }[];
  accentClassName?: string;
  eyebrowClassName?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={`rounded-xl border px-5 py-5 sm:px-6 ${accentClassName}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wide ${eyebrowClassName}`}>
            {eyebrow}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900 sm:text-xl">{title}</h3>
          {description && (
            <div className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{description}</div>
          )}
          {links && links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {links.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 font-medium hover:underline ${eyebrowClassName}`}
                >
                  {link.icon === 'file' && <FileText className="h-3.5 w-3.5" aria-hidden />}
                  {link.label}
                  {link.icon !== 'file' && <ExternalLink className="h-3.5 w-3.5" aria-hidden />}
                </a>
              ))}
            </div>
          )}
          {children}
        </div>
        {action}
      </div>
    </section>
  );
}

export function PartnerHubAddButton({
  busy,
  done,
  onClick,
  label = 'Add to CCDesigner',
  doneLabel = 'Added to CCDesigner',
  className,
  variant = 'primary',
}: {
  busy: boolean;
  done?: boolean;
  onClick: () => void;
  label?: string;
  doneLabel?: string;
  className?: string;
  variant?: 'primary' | 'secondary';
}) {
  const base =
    variant === 'secondary'
      ? 'border border-[#002D24]/20 bg-[#002D24]/5 text-[#002D24] hover:bg-[#002D24]/10'
      : 'bg-[#002D24] text-white hover:opacity-95';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${className || base}`}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : done ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <PlusCircle className="h-4 w-4" aria-hidden />
      )}
      {done ? doneLabel : label}
    </button>
  );
}

export function PartnerHubResourceList({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      <ul className="mt-3 space-y-3">{children}</ul>
    </section>
  );
}

export function PartnerHubResourceRow({
  eyebrow,
  title,
  description,
  links,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  links?: { href: string; label: string; icon?: 'external' | 'file' }[];
  action?: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-5">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{eyebrow}</p>
        )}
        <h4 className="mt-0.5 text-base font-semibold text-gray-900">{title}</h4>
        {description && <div className="mt-1 text-sm text-gray-600">{description}</div>}
        {links && links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {links.map((link) => (
              <a
                key={link.href + link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-teal-700 hover:text-teal-800"
              >
                {link.icon === 'file' && <FileText className="h-3.5 w-3.5" aria-hidden />}
                {link.label}
                {link.icon !== 'file' && <ExternalLink className="h-3.5 w-3.5" aria-hidden />}
              </a>
            ))}
          </div>
        )}
      </div>
      {action}
    </li>
  );
}
