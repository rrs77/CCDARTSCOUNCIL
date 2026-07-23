import type { PartnerHubConfig } from '../../config/partnerHubs';
import {
  getPartnerHubContent,
  type PartnerHubPageContent,
} from '../../config/partnerHubContent';
import {
  PartnerHubResourceList,
  PartnerHubResourceRow,
} from './PartnerHubLayout';

interface PartnerResourcesHubProps {
  hub: PartnerHubConfig;
  /** Optional override; defaults to config lookup by hub.slug */
  content?: PartnerHubPageContent | null;
}

/**
 * Body for partners with official teacher-resource links but no CCDesigner seed yet.
 * Logo / org description / contact live in PartnerHubPage.
 */
export function PartnerResourcesHub({ hub, content: contentProp }: PartnerResourcesHubProps) {
  const content = contentProp ?? getPartnerHubContent(hub.slug);
  const resources = content?.resources ?? [];
  const heading = content?.resourcesHeading ?? 'Teacher resources';
  const intro =
    content?.resourcesIntro ??
    'Official links for classroom and CPD materials. Add to CCDesigner can be wired when you choose packs to seed.';

  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-8 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Resources
        </p>
        <h2 className="mt-2 text-lg font-semibold text-gray-900">
          Awaiting teacher resource links
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
          {content?.awaitingNote ??
            `Teacher resource links for ${hub.shortName} will appear here when official classroom and CPD URLs are supplied. Hub branding is ready — drop in links anytime.`}
        </p>
        <a
          href={hub.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium text-teal-700 hover:underline"
        >
          Visit {hub.shortName} website
        </a>
      </div>
    );
  }

  return (
    <PartnerHubResourceList title={heading} subtitle={intro}>
      {resources.map((resource) => (
        <PartnerHubResourceRow
          key={resource.href + resource.title}
          eyebrow={resource.kind}
          title={resource.title}
          description={resource.description}
          links={[
            {
              href: resource.href,
              label: resource.kind === 'PDF' ? 'Open PDF' : 'Open resource',
              icon: resource.kind === 'PDF' ? 'file' : 'external',
            },
          ]}
        />
      ))}
    </PartnerHubResourceList>
  );
}
