import { ExternalLink, Mail, Phone, Globe } from 'lucide-react';
import { PARTNER_CONTACTS, type PartnerContactInfo } from '../../config/partnerContacts';

interface PartnerHubContactFooterProps {
  orgId: string;
  /** Optional override when contact isn’t in the shared map yet */
  contact?: PartnerContactInfo;
  className?: string;
}

/** Footer with real org contact details from official sites. */
export function PartnerHubContactFooter({
  orgId,
  contact,
  className = '',
}: PartnerHubContactFooterProps) {
  const info = contact || PARTNER_CONTACTS[orgId];
  if (!info) return null;

  return (
    <footer
      className={`mt-8 rounded-xl border border-gray-200 bg-white px-5 py-5 text-sm text-gray-700 sm:px-6 ${className}`}
      aria-label={`${info.lines[0] || 'Partner'} contact information`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact</h3>
      <div className="mt-2 space-y-1">
        {info.lines.map((line) => (
          <p key={line} className="font-medium text-gray-900">
            {line}
          </p>
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {info.phone && (
          <li className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            <a href={`tel:${info.phone.replace(/\s+/g, '')}`} className="hover:underline">
              {info.phone}
            </a>
          </li>
        )}
        {info.fax && (
          <li className="flex items-center gap-2 text-gray-600">
            <span className="w-3.5 shrink-0 text-center text-[10px] font-semibold text-gray-400">
              Fax
            </span>
            <span>{info.fax}</span>
          </li>
        )}
        {info.email && (
          <li className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            <a href={`mailto:${info.email}`} className="hover:underline">
              {info.email}
            </a>
          </li>
        )}
        {info.web && (
          <li className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            <a
              href={info.web}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              {info.webLabel || info.web}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </li>
        )}
      </ul>
      <p className="mt-3 text-xs text-gray-400">
        Details from the organisation’s public contact page (
        <a
          href={info.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          source
        </a>
        ). Demo only — not an endorsement.
      </p>
    </footer>
  );
}
