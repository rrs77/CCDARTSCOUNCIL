import { lazy, Suspense, type ReactNode } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMusicHubBreadcrumbs,
  musicHubPageHref,
  openMusicHubPath,
  visibleChildren,
} from '../../config/musicHubsDirectory';
import type { MusicHubDirectoryNode, MusicHubResource } from '../../types/musicHubsDirectory';
import { MusicHubResourceList } from './MusicHubResourceList';
import type { EssexDistrictSlug } from '../../config/musicHubsDirectory';

const EssexDistrictMap = lazy(() =>
  import('./EssexDistrictMap').then((m) => ({ default: m.EssexDistrictMap })),
);

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#002D24]/12 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <h2 className="text-base font-semibold tracking-tight text-[#002D24] sm:text-lg">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-[#002D24]/80">{children}</div>
    </section>
  );
}

function Paragraphs({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-2">
      {lines.map((line) => (
        <p key={line.slice(0, 48)}>{line}</p>
      ))}
    </div>
  );
}

/**
 * Data-driven hub / service / borough / district page.
 * Empty sections auto-hide. EMS uses this as the master template (+ optional legacy body).
 */
export function HubPageTemplate({
  node,
  parents,
  children,
  onAddedToApp,
}: {
  node: MusicHubDirectoryNode;
  parents: MusicHubDirectoryNode[];
  /** Legacy rich content (EMS workshops / Tri-Borough programmes). */
  children?: ReactNode;
  onAddedToApp?: (info: { sheetId: string }) => void;
}) {
  const crumbs = getMusicHubBreadcrumbs(node, parents);
  const content = node.content;
  const childNodes = visibleChildren(node);
  const isComingSoon = node.status === 'coming-soon';

  const handleAdd = async (resource: MusicHubResource) => {
    // Prefer existing EMS/TBMH seeders when packId matches known demos.
    try {
      if (resource.packId === 'ems-schools-brochure') {
        const { setupEMSSchoolsExample } = await import('../../utils/setupEMSSchoolsExample');
        const result = await setupEMSSchoolsExample({ force: true, registerPartnerPlanning: true });
        toast.success(
          result.skipped
            ? 'Already in your library'
            : `Copied locally · Originally provided by ${resource.providedBy || 'Essex Music Service'}`,
        );
        onAddedToApp?.({ sheetId: result.sheetId });
        return;
      }
      if (resource.packId === 'ems-dj-workshop' || resource.packId === 'ems-rap-it-workshop') {
        const { setupEMSWorkshop } = await import('../../utils/setupEMSWorkshops');
        const id = resource.packId === 'ems-dj-workshop' ? 'dj' : 'rap-it';
        const result = await setupEMSWorkshop(id, { force: true, registerPartnerPlanning: true });
        toast.success(
          result.skipped
            ? 'Already in your library'
            : `Copied locally · Originally provided by ${resource.providedBy || 'Essex Music Service'}`,
        );
        onAddedToApp?.({ sheetId: result.sheetId });
        return;
      }
      if (resource.packId === 'tbmh-groove-n-play' || resource.packId === 'tbmh-music-makes-me') {
        const { setupTBMHProgramme } = await import('../../utils/setupTBMHProgrammes');
        const id = resource.packId === 'tbmh-groove-n-play' ? 'groove-n-play' : 'music-makes-me';
        const result = await setupTBMHProgramme(id, { force: true, registerPartnerPlanning: true });
        toast.success(
          result.skipped
            ? 'Already in your library'
            : `Copied locally · Originally provided by ${resource.providedBy || 'Tri-Borough Music Hub'}`,
        );
        onAddedToApp?.({ sheetId: result.sheetId });
        return;
      }
      toast('No local pack seeder for this resource yet — open the link instead.');
    } catch (e) {
      console.error(e);
      toast.error('Could not copy to library');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="overflow-x-auto">
        <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-[#002D24]/65 sm:text-sm">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${crumb.path}-${crumb.name}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                {last ? (
                  <span className="font-semibold text-[#002D24]">{crumb.name}</span>
                ) : (
                  <a
                    href={musicHubPageHref(crumb.path)}
                    className="hover:text-[#002D24] hover:underline"
                  >
                    {crumb.name}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <header className="rounded-xl border border-[#002D24]/12 bg-white px-4 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {isComingSoon && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#002D24]/55">
                Hub page coming soon
              </p>
            )}
            <h1 className="text-xl font-semibold tracking-tight text-[#002D24] sm:text-2xl">
              {node.name}
            </h1>
            {node.tagline && (
              <p className="mt-1 text-sm text-[#002D24]/70">{node.tagline}</p>
            )}
            {(node.description || []).map((p) => (
              <p key={p.slice(0, 40)} className="mt-2 max-w-3xl text-sm leading-relaxed text-[#002D24]/75">
                {p}
              </p>
            ))}
          </div>
          {node.siteUrl && (
            <a
              href={node.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#002D24]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#002D24] hover:bg-[#E8F0EA]"
            >
              Visit website
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
      </header>

      {isComingSoon && !children && !content?.resources?.length && (
        <Section title="Coming soon">
          <p>Hub page coming soon. No fabricated resources are listed here yet.</p>
        </Section>
      )}

      {content?.about?.length ? (
        <Section title="About">
          <Paragraphs lines={content.about} />
        </Section>
      ) : null}

      {content?.schoolsEducation?.length ? (
        <Section title="Schools / Music Education">
          <Paragraphs lines={content.schoolsEducation} />
        </Section>
      ) : null}

      {children}

      {content?.resources?.length ? (
        <Section title="Resources">
          <MusicHubResourceList
            resources={content.resources}
            organisationId={node.organisationId}
            onAddToLibrary={handleAdd}
          />
        </Section>
      ) : null}

      {content?.training?.length ? (
        <Section title="Training / CPD">
          <Paragraphs lines={content.training} />
        </Section>
      ) : null}

      {content?.events?.length ? (
        <Section title="Events / Opportunities">
          <Paragraphs lines={content.events} />
        </Section>
      ) : null}

      {node.showEssexMap ? (
        <Section title="In your area">
          <Suspense
            fallback={
              <p className="text-sm text-[#002D24]/65">Loading Essex district map…</p>
            }
          >
            <EssexDistrictMap
              onSelect={(_slug: EssexDistrictSlug, path: string) => openMusicHubPath(path)}
            />
          </Suspense>
        </Section>
      ) : null}

      {content?.links?.length ? (
        <Section title="Links">
          <ul className="space-y-2">
            {content.links.map((link) => (
              <li key={link.href + link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-[#330968] hover:underline"
                >
                  {link.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {childNodes.length > 0 && (
        <Section title="Explore">
          <ul className="space-y-2" aria-label={`Children of ${node.name}`}>
            {childNodes.map((child) => (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => openMusicHubPath(child.path)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#002D24]/15 bg-[#E8F0EA]/40 px-3 py-2.5 text-left transition-colors hover:border-[#002D24]/35 hover:bg-[#E8F0EA]"
                >
                  <span>
                    <span className="block text-sm font-semibold text-[#002D24]">{child.name}</span>
                    {child.status === 'coming-soon' && (
                      <span className="text-xs text-[#002D24]/55">Hub page coming soon</span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#002D24]/50" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
