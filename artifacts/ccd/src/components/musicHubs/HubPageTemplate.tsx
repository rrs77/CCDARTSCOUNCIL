import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronRight, ExternalLink, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMusicHubBreadcrumbs,
  musicHubAdminHref,
  musicHubPageHref,
  musicHubPublicHref,
  openMusicHubPath,
  visibleChildren,
} from '../../config/musicHubsDirectory';
import type { MusicHubDirectoryNode, MusicHubResource } from '../../types/musicHubsDirectory';
import type { HubEditFieldKey, HubEditableContent } from '../../types/musicHubContent';
import { MusicHubResourceList } from './MusicHubResourceList';
import type { EssexDistrictSlug } from '../../config/musicHubsDirectory';
import { useAuth } from '../../hooks/useAuth';
import { canEditMusicHubNode } from '../../utils/musicHubAdminAccess';
import {
  countPendingForNode,
  ensurePlaceholderMedia,
  getEditorPreviewContent,
  getWorkingRevision,
  mergeNodeWithPublished,
  MUSIC_HUB_PLACEHOLDER_CARD,
  realHubMediaUrl,
  saveDraftRevision,
  submitRevisionForApproval,
} from '../../utils/musicHubContentStore';
import { HubEditModal, HubEditPencil } from './HubEditModal';
import { GreaterEssexRegionNav } from './GreaterEssexRegionNav';

const EssexDistrictMap = lazy(() =>
  import('./EssexDistrictMap').then((m) => ({ default: m.EssexDistrictMap })),
);

function Section({
  title,
  children,
  editLabel,
  onEdit,
}: {
  title: string;
  children: ReactNode;
  editLabel?: string;
  onEdit?: () => void;
}) {
  return (
    <section className="rounded-xl border border-[#002D24]/12 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight text-[#002D24] sm:text-lg">{title}</h2>
        {onEdit && editLabel && <HubEditPencil label={editLabel} onClick={onEdit} />}
      </div>
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

function ItemCards({
  items,
}: {
  items: { id: string; title: string; description?: string; href?: string; imageUrl?: string }[];
}) {
  if (!items.length) {
    return <p className="text-sm text-[#002D24]/55">Nothing listed yet.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="overflow-hidden rounded-xl border border-[#002D24]/12 bg-[#E8F0EA]/25"
        >
          <img
            src={item.imageUrl || MUSIC_HUB_PLACEHOLDER_CARD}
            alt=""
            className="h-28 w-full object-cover"
          />
          <div className="p-3">
            <p className="text-sm font-semibold text-[#002D24]">{item.title}</p>
            {item.description && (
              <p className="mt-1 text-xs text-[#002D24]/70">{item.description}</p>
            )}
            {item.href && (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#330968] hover:underline"
              >
                Open
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Data-driven hub / service / borough / district page.
 * Hub admins see pencil icons → modal drafts; public viewers see published only.
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
  const { user, profile } = useAuth();
  const [tick, setTick] = useState(0);
  const [editField, setEditField] = useState<HubEditFieldKey | null>(null);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener('ccd:music-hub-content-changed', bump);
    window.addEventListener('ccd:music-hub-admin-changed', bump);
    return () => {
      window.removeEventListener('ccd:music-hub-content-changed', bump);
      window.removeEventListener('ccd:music-hub-admin-changed', bump);
    };
  }, []);

  const canEdit = canEditMusicHubNode(user, profile, node.id);

  const publishedMerged = useMemo(() => {
    void tick;
    return mergeNodeWithPublished(node);
  }, [node, tick]);

  const displayContent = useMemo(() => {
    void tick;
    if (canEdit) return ensurePlaceholderMedia(getEditorPreviewContent(node));
    return ensurePlaceholderMedia(publishedMerged.editable);
  }, [node, canEdit, publishedMerged, tick]);

  const working = canEdit ? getWorkingRevision(node.id) : null;
  const pendingCount = canEdit ? countPendingForNode(node.id) : 0;

  const crumbs = getMusicHubBreadcrumbs(node, parents);
  const childNodes = visibleChildren(node);
  const isComingSoon = (canEdit ? node.status : publishedMerged.status) === 'coming-soon';
  const displayName = displayContent.title || node.name;
  const logoUrl = realHubMediaUrl(displayContent.logoUrl);
  const heroUrl = realHubMediaUrl(displayContent.heroImageUrl);

  const actor = useMemo(
    () => ({
      userId: user?.id || 'anonymous',
      email: user?.email,
      name: user?.name || profile?.display_name || undefined,
    }),
    [user, profile],
  );

  const persist = useCallback(
    (next: HubEditableContent) => {
      if (!canEdit) return;
      saveDraftRevision(node.id, ensurePlaceholderMedia(next), actor);
      toast.success('Saved as draft');
      setTick((t) => t + 1);
    },
    [canEdit, node.id, actor],
  );

  const submit = () => {
    const rev = submitRevisionForApproval(node.id, actor);
    if (!rev) {
      toast.error('Save a draft before submitting');
      return;
    }
    toast.success('Submitted for admin approval');
    setTick((t) => t + 1);
  };

  const handleAdd = async (resource: MusicHubResource) => {
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

  const resources = displayContent.resources || [];
  const about = displayContent.about || [];
  const schools = displayContent.schoolsEducation || [];
  const training = displayContent.training || [];
  const events = displayContent.events || [];
  const links = displayContent.links || [];
  const courses = displayContent.courses || [];
  const activities = displayContent.activities || [];
  const lessonPlans = displayContent.lessonPlans || [];

  const showPlaceholderSection = (hasItems: boolean) => canEdit || hasItems;

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

      {canEdit &&
        (working?.status === 'draft' ||
          working?.status === 'rejected' ||
          working?.status === 'changes_requested' ||
          pendingCount > 0) && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-amber-950">
              {pendingCount > 0 ? (
                <p>
                  You have <strong>{pendingCount}</strong> change
                  {pendingCount === 1 ? '' : 's'} awaiting approval. Live page unchanged until
                  approved.
                </p>
              ) : working?.status === 'changes_requested' ? (
                <p>Changes requested. Edit and resubmit.</p>
              ) : working?.status === 'rejected' ? (
                <p>Last submission was rejected. Edit and resubmit.</p>
              ) : (
                <p>Draft changes are not live until approved.</p>
              )}
              <a
                href={musicHubAdminHref(node.path)}
                className="mt-1 inline-block text-xs font-semibold text-amber-950 underline"
              >
                Open hub admin dashboard
              </a>
            </div>
            {(working?.status === 'draft' ||
              working?.status === 'rejected' ||
              working?.status === 'changes_requested') && (
              <button
                type="button"
                onClick={submit}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#002D24] px-3 py-2 text-sm font-semibold text-white"
              >
                <Send className="h-3.5 w-3.5" />
                Submit for approval
              </button>
            )}
          </div>
        )}

      <header className="overflow-hidden rounded-xl border border-[#002D24]/12 bg-white shadow-sm">
        {heroUrl ? (
          <div className="relative">
            <img src={heroUrl} alt="" className="h-36 w-full object-cover sm:h-44" />
            {canEdit && (
              <div className="absolute right-3 top-3">
                <HubEditPencil label="Edit hero image" onClick={() => setEditField('hero')} />
              </div>
            )}
          </div>
        ) : canEdit ? (
          <div className="flex items-center justify-between gap-2 border-b border-[#002D24]/08 bg-[#E8F0EA]/35 px-4 py-2 sm:px-6">
            <p className="text-xs text-[#002D24]/60">No hero image — public page stays text-only.</p>
            <HubEditPencil label="Add hero image" onClick={() => setEditField('hero')} />
          </div>
        ) : null}
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              {logoUrl ? (
                <div className="relative shrink-0">
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-16 w-28 rounded-lg border border-[#002D24]/10 bg-[#E8F0EA] object-contain p-1"
                  />
                  {canEdit && (
                    <div className="absolute -right-2 -top-2">
                      <HubEditPencil label="Edit logo" onClick={() => setEditField('logo')} />
                    </div>
                  )}
                </div>
              ) : canEdit ? (
                <div className="relative flex h-16 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#002D24]/25 bg-[#E8F0EA]/40">
                  <span className="px-2 text-center text-[10px] font-medium text-[#002D24]/50">
                    No logo
                  </span>
                  <div className="absolute -right-2 -top-2">
                    <HubEditPencil label="Add logo" onClick={() => setEditField('logo')} />
                  </div>
                </div>
              ) : null}
              <div className="min-w-0">
                {isComingSoon && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#002D24]/55">
                    Hub page coming soon
                  </p>
                )}
                <div className="flex items-start gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-[#002D24] sm:text-2xl">
                    {displayName}
                  </h1>
                  {canEdit && (
                    <HubEditPencil label="Edit title & description" onClick={() => setEditField('header')} />
                  )}
                </div>
                {displayContent.tagline && (
                  <p className="mt-1 text-sm text-[#002D24]/70">{displayContent.tagline}</p>
                )}
                {(displayContent.description || []).map((p) => (
                  <p
                    key={p.slice(0, 40)}
                    className="mt-2 max-w-3xl text-sm leading-relaxed text-[#002D24]/75"
                  >
                    {p}
                  </p>
                ))}
              </div>
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
        </div>
      </header>

      {isComingSoon &&
        !children &&
        !resources.length &&
        !courses.length &&
        !activities.length &&
        !lessonPlans.length &&
        !canEdit && (
          <Section title="Coming soon">
            <p>Hub page coming soon. No fabricated resources are listed here yet.</p>
          </Section>
        )}

      {showPlaceholderSection(about.length > 0) && (
        <Section
          title="About"
          editLabel="Edit about"
          onEdit={canEdit ? () => setEditField('about') : undefined}
        >
          {about.length ? (
            <Paragraphs lines={about} />
          ) : (
            <p className="text-[#002D24]/55">Add an about section (placeholder).</p>
          )}
        </Section>
      )}

      {showPlaceholderSection(schools.length > 0) && (
        <Section
          title="Schools / Music Education"
          editLabel="Edit schools section"
          onEdit={canEdit ? () => setEditField('schoolsEducation') : undefined}
        >
          {schools.length ? (
            <Paragraphs lines={schools} />
          ) : (
            <p className="text-[#002D24]/55">Schools content placeholder.</p>
          )}
        </Section>
      )}

      {children}

      {showPlaceholderSection(resources.length > 0) && (
        <Section
          title="Resources"
          editLabel="Edit resources"
          onEdit={canEdit ? () => setEditField('resources') : undefined}
        >
          {resources.length ? (
            <MusicHubResourceList
              resources={resources}
              organisationId={node.organisationId}
              onAddToLibrary={handleAdd}
            />
          ) : (
            <p className="text-[#002D24]/55">No resources yet — add placeholders from the pencil.</p>
          )}
        </Section>
      )}

      {showPlaceholderSection(courses.length > 0) && (
        <Section
          title="Courses"
          editLabel="Edit courses"
          onEdit={canEdit ? () => setEditField('courses') : undefined}
        >
          <ItemCards items={courses} />
        </Section>
      )}

      {showPlaceholderSection(activities.length > 0) && (
        <Section
          title="Activities"
          editLabel="Edit activities"
          onEdit={canEdit ? () => setEditField('activities') : undefined}
        >
          <ItemCards items={activities} />
        </Section>
      )}

      {showPlaceholderSection(lessonPlans.length > 0) && (
        <Section
          title="Full lesson plans"
          editLabel="Edit lesson plans"
          onEdit={canEdit ? () => setEditField('lessonPlans') : undefined}
        >
          <ItemCards items={lessonPlans} />
        </Section>
      )}

      {showPlaceholderSection(training.length > 0) && (
        <Section
          title="Training / CPD"
          editLabel="Edit training"
          onEdit={canEdit ? () => setEditField('training') : undefined}
        >
          {training.length ? (
            <Paragraphs lines={training} />
          ) : (
            <p className="text-[#002D24]/55">Training placeholder.</p>
          )}
        </Section>
      )}

      {showPlaceholderSection(events.length > 0) && (
        <Section
          title="Events / Opportunities"
          editLabel="Edit events"
          onEdit={canEdit ? () => setEditField('events') : undefined}
        >
          {events.length ? (
            <Paragraphs lines={events} />
          ) : (
            <p className="text-[#002D24]/55">Events placeholder.</p>
          )}
        </Section>
      )}

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

      {showPlaceholderSection(links.length > 0) && (
        <Section
          title="Links"
          editLabel="Edit links"
          onEdit={canEdit ? () => setEditField('links') : undefined}
        >
          {links.length ? (
            <ul className="space-y-2">
              {links.map((link) => (
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
          ) : (
            <p className="text-[#002D24]/55">No links yet.</p>
          )}
        </Section>
      )}

      {(node.id === 'east-of-england' ||
        node.id === 'greater-essex' ||
        node.id === 'music-on-sea' ||
        node.id === 'thurrock-music-service' ||
        node.path.startsWith('england/east-of-england')) &&
        node.kind !== 'district' && (
          <GreaterEssexRegionNav
            current={
              node.id === 'east-of-england'
                ? 'east-of-england'
                : node.id === 'greater-essex'
                  ? 'greater-essex'
                  : node.id === 'music-on-sea'
                    ? 'music-on-sea'
                    : node.id === 'thurrock-music-service'
                      ? 'thurrock'
                      : node.id === 'ems'
                        ? 'ems'
                        : 'greater-essex'
            }
            title={
              node.id === 'east-of-england' || node.id === 'greater-essex'
                ? 'Hubs in East of England'
                : 'Other hubs in East of England'
            }
            showDistrictEntry={node.id !== 'music-on-sea' && node.id !== 'thurrock-music-service'}
          />
        )}

      {childNodes.length > 0 && (
        <Section title="Explore">
          <ExpandedExploreTree nodes={childNodes} depth={0} />
        </Section>
      )}

      {editField && (
        <HubEditModal
          field={editField}
          content={displayContent}
          nodeName={node.name}
          onClose={() => setEditField(null)}
          onSave={persist}
        />
      )}
    </div>
  );
}

/** Always-expanded child list with real hrefs (no JS-only navigation to `/`). */
function ExpandedExploreTree({
  nodes,
  depth,
}: {
  nodes: MusicHubDirectoryNode[];
  depth: number;
}) {
  return (
    <ul
      className={depth === 0 ? 'space-y-2' : 'mt-2 space-y-1.5 border-l border-[#002D24]/10 pl-3'}
      aria-label={depth === 0 ? 'Hubs and areas' : undefined}
    >
      {nodes.map((child) => {
        const kids = visibleChildren(child);
        const href =
          child.partnerHubSlug === 'ems' || child.partnerHubSlug === 'triborough'
            ? `/${child.partnerHubSlug}`
            : musicHubPublicHref(child.path);
        return (
          <li key={child.id}>
            <a
              href={href}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#002D24]/15 bg-[#E8F0EA]/40 px-3 py-2.5 text-left transition-colors hover:border-[#002D24]/35 hover:bg-[#E8F0EA]"
            >
              <span>
                <span className="block text-sm font-semibold text-[#002D24]">{child.name}</span>
                {child.status === 'coming-soon' && (
                  <span className="text-xs text-[#002D24]/55">Hub page coming soon</span>
                )}
                {child.tagline && child.status !== 'coming-soon' && (
                  <span className="text-xs text-[#002D24]/60">{child.tagline}</span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#002D24]/50" aria-hidden />
            </a>
            {kids.length > 0 && depth < 2 && (
              <ExpandedExploreTree nodes={kids} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
