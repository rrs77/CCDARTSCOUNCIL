/**
 * Shared partner-hub content primitives.
 *
 * Page chrome (logo + org description + continuous scroll) lives in
 * PartnerHubPage. These helpers keep featured / resource / add actions
 * visually consistent across ROH, LSO, We Teach Drama, EMS, iCompose, Drama Resource, stubs.
 */

import type { CSSProperties, ReactNode } from 'react';
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
  style,
  eyebrowStyle,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  links?: { href: string; label: string; icon?: 'external' | 'file' }[];
  accentClassName?: string;
  eyebrowClassName?: string;
  /** Optional inline styles for brand-tinted featured panels */
  style?: CSSProperties;
  eyebrowStyle?: CSSProperties;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border px-5 py-6 shadow-sm sm:px-7 sm:py-7 ${accentClassName}`}
      style={style}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.12em] ${eyebrowClassName}`}
            style={eyebrowStyle}
          >
            {eyebrow}
          </p>
          <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
            {title}
          </h3>
          {description && (
            <div className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-[0.95rem]">
              {description}
            </div>
          )}
          {links && links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {links.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 font-medium hover:underline ${eyebrowClassName}`}
                  style={eyebrowStyle}
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
      <div className="mb-4 max-w-3xl">
        <h3 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{title}</h3>
        {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{subtitle}</p>}
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</ul>
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
    <li className="flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            {eyebrow}
          </p>
        )}
        <h4 className="mt-1 text-base font-semibold leading-snug text-gray-900 sm:text-lg">
          {title}
        </h4>
        {description && <div className="mt-2 text-sm leading-relaxed text-gray-600">{description}</div>}
        {links && links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
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
      {action && <div className="mt-auto pt-1">{action}</div>}
    </li>
  );
}
