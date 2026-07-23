import { openActivityResource } from '../../utils/openActivityResource';
import type { PartnerHubConfig } from '../../config/partnerHubs';
import {
  getPartnerHubContent,
  type PartnerHubPageContent,
  type PartnerHubResourceLink,
} from '../../config/partnerHubContent';
import {
  PartnerHubFeaturedSection,
  PartnerHubResourceList,
  PartnerHubResourceRow,
} from './PartnerHubLayout';

interface PartnerResourcesHubProps {
  hub: PartnerHubConfig;
  /** Optional override; defaults to config lookup by hub.slug */
  content?: PartnerHubPageContent | null;
}

/**
 * Body for partners with official teacher-resource links (same template as LSO):
 * featured first resource → resource list with Open actions.
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
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Resources
        </p>
        <h2 className="mt-2 text-xl font-semibold text-gray-900">
          Awaiting teacher resource links
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
          {content?.awaitingNote ??
            `Teacher resource links for ${hub.shortName} will appear here when official classroom and CPD URLs are supplied. Hub branding is ready — drop in links anytime.`}
        </p>
        <a
          href={hub.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium hover:underline"
          style={{ color: hub.primaryColor }}
        >
          Visit {hub.shortName} website
        </a>
      </div>
    );
  }

  const featured = resources[0];
  const rest = resources.slice(1);

  return (
    <div className="space-y-8">
      <PartnerHubFeaturedSection
        eyebrow={`Featured · ${featured.kind || hub.shortName}`}
        title={featured.title}
        description={featured.description}
        accentClassName="border"
        eyebrowClassName="font-semibold"
        style={{
          borderColor: `${hub.accentColor}66`,
          backgroundColor: `${hub.accentColor}18`,
        }}
        eyebrowStyle={{ color: hub.primaryColor }}
        links={[
          {
            href: featured.href,
            label: featured.kind === 'PDF' ? 'Open PDF' : 'Open resource',
            icon: featured.kind === 'PDF' ? 'file' : 'external',
          },
          { href: hub.siteUrl, label: 'Organisation site', icon: 'external' },
        ]}
        action={
          <button
            type="button"
            onClick={() => openActivityResource(featured.href)}
            className="inline-flex shrink-0 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            style={{ backgroundColor: hub.primaryColor }}
          >
            Open resource
          </button>
        }
      />

      {rest.length > 0 && (
        <PartnerHubResourceList title={heading} subtitle={intro}>
          {rest.map((resource) => (
            <ResourceRowWithBrand key={resource.href + resource.title} hub={hub} resource={resource} />
          ))}
        </PartnerHubResourceList>
      )}
    </div>
  );
}

function ResourceRowWithBrand({
  hub,
  resource,
}: {
  hub: PartnerHubConfig;
  resource: PartnerHubResourceLink;
}) {
  return (
    <PartnerHubResourceRow
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
      action={
        <button
          type="button"
          onClick={() => openActivityResource(resource.href)}
          className="inline-flex w-full shrink-0 items-center justify-center rounded-lg border bg-white px-3 py-2.5 text-sm font-semibold hover:bg-gray-50 sm:w-auto"
          style={{
            borderColor: `${hub.primaryColor}44`,
            color: hub.primaryColor,
          }}
        >
          Open
        </button>
      }
    />
  );
}
