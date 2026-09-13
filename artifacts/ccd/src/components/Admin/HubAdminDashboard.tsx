import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Upload,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import type { HubResource, OrganisationHub } from '../../types/hubs';
import {
  createHubResource,
  grantHubMember,
  hubExportUrl,
  hubPageAction,
  listAdminHubs,
  listHubMembers,
  loadHubAdmin,
  loadHubAnalytics,
  loadHubAudit,
  reorderHubResources,
  resourceLifecycle,
  revokeHubMember,
  updateHubPage,
  updateHubResource,
} from '../../utils/hubAdminApi';
import { sanitizeHtml } from '../../utils/sanitize';
import { supabase } from '../../config/supabase';

type Section =
  | 'edit-page'
  | 'resources'
  | 'activities'
  | 'media'
  | 'drafts'
  | 'preview'
  | 'publish'
  | 'hub-users'
  | 'analytics'
  | 'export'
  | 'audit';

const SECTIONS: { id: Section; label: string; minRole: string }[] = [
  { id: 'edit-page', label: 'Edit page', minRole: 'hub_editor' },
  { id: 'resources', label: 'Resources', minRole: 'hub_editor' },
  { id: 'activities', label: 'Activities', minRole: 'hub_viewer' },
  { id: 'media', label: 'Media', minRole: 'hub_viewer' },
  { id: 'drafts', label: 'Drafts', minRole: 'hub_editor' },
  { id: 'preview', label: 'Preview', minRole: 'hub_viewer' },
  { id: 'publish', label: 'Publish', minRole: 'hub_publisher' },
  { id: 'hub-users', label: 'Hub users', minRole: 'hub_administrator' },
  { id: 'analytics', label: 'Analytics', minRole: 'hub_administrator' },
  { id: 'export', label: 'Export', minRole: 'hub_administrator' },
  { id: 'audit', label: 'Audit', minRole: 'hub_administrator' },
];

const ROLE_RANK: Record<string, number> = {
  hub_viewer: 1,
  hub_editor: 2,
  hub_publisher: 3,
  hub_administrator: 4,
};

function can(role: string | undefined, min: string) {
  return (ROLE_RANK[role || ''] || 0) >= (ROLE_RANK[min] || 99);
}

interface HubAdminDashboardProps {
  onClose?: () => void;
  embedded?: boolean;
}

export function HubAdminDashboard({ onClose, embedded }: HubAdminDashboardProps) {
  const { profile } = useAuth();
  const [hubs, setHubs] = useState<OrganisationHub[]>([]);
  const [isSuper, setIsSuper] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [section, setSection] = useState<Section>('edit-page');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingHub, setLoadingHub] = useState(false);
  const [hubRole, setHubRole] = useState<string>('hub_viewer');
  const [org, setOrg] = useState<OrganisationHub | null>(null);
  const [tagline, setTagline] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [introHtml, setIntroHtml] = useState('');
  const [featuredTitle, setFeaturedTitle] = useState('');
  const [featuredHref, setFeaturedHref] = useState('');
  const [featuredDesc, setFeaturedDesc] = useState('');
  const [resources, setResources] = useState<HubResource[]>([]);
  const [activities, setActivities] = useState<unknown[]>([]);
  const [media, setMedia] = useState<unknown[]>([]);
  const [saving, setSaving] = useState(false);

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await listAdminHubs({
        q: search || undefined,
        status: statusFilter || undefined,
      });
      setHubs(data.hubs);
      setIsSuper(data.is_super_admin);
      if (!selectedId && data.hubs.length === 1) {
        setSelectedId(data.hubs[0].id);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load hubs');
    } finally {
      setLoadingList(false);
    }
  }, [search, statusFilter, selectedId]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const loadSelected = useCallback(async (hubId: string) => {
    setLoadingHub(true);
    try {
      const data = await loadHubAdmin(hubId);
      setOrg(data.organisation);
      setHubRole(data.hub_role);
      setResources(
        (data.resources || []).map((r) => ({
          ...r,
          external_url: r.download_url || r.external_url,
        })),
      );
      setActivities(data.activities || []);
      setMedia(data.media || []);
      const page = data.page;
      setTagline(page?.tagline || '');
      setDescriptionText((page?.description || []).join('\n\n'));
      setIntroHtml(page?.intro_html || '');
      const featured = (page?.featured || {}) as Record<string, string>;
      setFeaturedTitle(featured.title || '');
      setFeaturedHref(featured.href || '');
      setFeaturedDesc(featured.description || '');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load hub');
    } finally {
      setLoadingHub(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadSelected(selectedId);
  }, [selectedId, loadSelected]);

  const visibleSections = SECTIONS.filter((s) => can(hubRole, s.minRole));

  useEffect(() => {
    if (!visibleSections.find((s) => s.id === section) && visibleSections[0]) {
      setSection(visibleSections[0].id);
    }
  }, [visibleSections, section]);

  const savePage = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateHubPage(selectedId, {
        display_name: org?.display_name,
        logo_src: org?.logo_src || undefined,
        site_url: org?.site_url || undefined,
        primary_color: org?.primary_color || undefined,
        accent_color: org?.accent_color || undefined,
        page: {
          tagline,
          description: descriptionText
            .split(/\n\n+/)
            .map((p) => p.trim())
            .filter(Boolean),
          intro_html: introHtml,
          featured: {
            title: featuredTitle,
            href: featuredHref,
            description: featuredDesc,
          },
        },
      });
      toast.success('Hub page saved');
      await loadSelected(selectedId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const shellClass = embedded
    ? 'flex flex-col gap-4'
    : 'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4';

  const panel = (
    <div
      className={
        embedded
          ? 'rounded-xl border border-teal-200 bg-white shadow-sm'
          : 'flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl'
      }
    >
      <header className="flex items-start justify-between gap-3 border-b border-teal-100 bg-gradient-to-r from-[#002D24] to-[#008272] px-5 py-4 text-white">
        <div>
          <p className="text-xs uppercase tracking-wide text-teal-100">Organisation hub admin</p>
          <h2 className="text-xl font-semibold">
            {org ? `Editing: ${org.display_name}` : 'Select a hub'}
          </h2>
          {org && (
            <p className="mt-1 text-sm text-teal-50">
              /{org.slug} · your role: {hubRole.replace('hub_', '')}
              {isSuper ? ' · super admin' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshList()}
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Hub selector */}
        <aside className="w-full border-b border-gray-200 md:w-64 md:border-b-0 md:border-r">
          {(isSuper || hubs.length > 1) && (
            <div className="space-y-2 border-b border-gray-100 p-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search hubs…"
                  className="w-full rounded-md border border-gray-200 py-2 pl-8 pr-2 text-sm"
                />
              </div>
              {isSuper && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              )}
            </div>
          )}
          <div className="max-h-48 overflow-y-auto md:max-h-[calc(92vh-8rem)]">
            {loadingList ? (
              <div className="flex items-center gap-2 p-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading hubs…
              </div>
            ) : hubs.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                No hubs assigned.
                {(profile?.role as string) === 'super_admin' || profile?.role === 'superuser'
                  ? ' Run the hub administration migration to seed Jazz North.'
                  : ' Ask a super admin to grant hub membership.'}
              </p>
            ) : (
              hubs.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedId(h.id)}
                  className={`block w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-teal-50 ${
                    selectedId === h.id ? 'bg-teal-50 font-semibold text-teal-900' : 'text-gray-800'
                  }`}
                >
                  <span className="block truncate">{h.display_name}</span>
                  <span className="text-xs text-gray-500">
                    {h.status} · {h.hub_role?.replace('hub_', '')}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {selectedId && (
            <nav className="flex flex-wrap gap-1 border-b border-gray-100 bg-gray-50 px-3 py-2">
              {visibleSections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                    section === s.id
                      ? 'bg-teal-700 text-white'
                      : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-teal-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!selectedId ? (
              <p className="text-sm text-gray-500">Choose a hub to manage.</p>
            ) : loadingHub ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <>
                {section === 'edit-page' && (
                  <EditPageSection
                    org={org}
                    setOrg={setOrg}
                    tagline={tagline}
                    setTagline={setTagline}
                    descriptionText={descriptionText}
                    setDescriptionText={setDescriptionText}
                    introHtml={introHtml}
                    setIntroHtml={setIntroHtml}
                    featuredTitle={featuredTitle}
                    setFeaturedTitle={setFeaturedTitle}
                    featuredHref={featuredHref}
                    setFeaturedHref={setFeaturedHref}
                    featuredDesc={featuredDesc}
                    setFeaturedDesc={setFeaturedDesc}
                    saving={saving}
                    onSave={savePage}
                  />
                )}
                {section === 'resources' && selectedId && (
                  <ResourcesSection
                    hubId={selectedId}
                    resources={resources}
                    hubRole={hubRole}
                    onReload={() => loadSelected(selectedId)}
                  />
                )}
                {section === 'activities' && (
                  <SimpleList
                    title="Hub activities"
                    empty="No activities linked yet."
                    items={(activities as { id?: string; title?: string; status?: string; activity_ref?: string }[]).map(
                      (a) => `${a.title || a.activity_ref} (${a.status})`,
                    )}
                  />
                )}
                {section === 'media' && (
                  <SimpleList
                    title="Hub media"
                    empty="No media entries."
                    items={(media as { title?: string; external_url?: string; media_type?: string }[]).map(
                      (m) => `${m.title} · ${m.media_type} · ${m.external_url}`,
                    )}
                  />
                )}
                {section === 'drafts' && (
                  <ResourcesSection
                    hubId={selectedId}
                    resources={resources.filter((r) => r.status === 'draft')}
                    hubRole={hubRole}
                    onReload={() => loadSelected(selectedId)}
                    draftsOnly
                  />
                )}
                {section === 'preview' && org && (
                  <PreviewSection
                    org={org}
                    tagline={tagline}
                    descriptionText={descriptionText}
                    introHtml={introHtml}
                    featuredTitle={featuredTitle}
                    featuredDesc={featuredDesc}
                    resources={resources.filter((r) => r.status === 'published')}
                  />
                )}
                {section === 'publish' && selectedId && (
                  <PublishSection
                    hubId={selectedId}
                    publishedAt={undefined}
                    onDone={() => loadSelected(selectedId)}
                  />
                )}
                {section === 'hub-users' && selectedId && (
                  <MembersSection hubId={selectedId} />
                )}
                {section === 'analytics' && selectedId && (
                  <AnalyticsSection hubId={selectedId} />
                )}
                {section === 'export' && selectedId && org && (
                  <ExportSection hubId={selectedId} slug={org.slug} />
                )}
                {section === 'audit' && selectedId && <AuditSection hubId={selectedId} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return panel;
  return <div className={shellClass}>{panel}</div>;
}

function EditPageSection(props: {
  org: OrganisationHub | null;
  setOrg: (o: OrganisationHub | null) => void;
  tagline: string;
  setTagline: (v: string) => void;
  descriptionText: string;
  setDescriptionText: (v: string) => void;
  introHtml: string;
  setIntroHtml: (v: string) => void;
  featuredTitle: string;
  setFeaturedTitle: (v: string) => void;
  featuredHref: string;
  setFeaturedHref: (v: string) => void;
  featuredDesc: string;
  setFeaturedDesc: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const {
    org,
    setOrg,
    tagline,
    setTagline,
    descriptionText,
    setDescriptionText,
    introHtml,
    setIntroHtml,
    featuredTitle,
    setFeaturedTitle,
    featuredHref,
    setFeaturedHref,
    featuredDesc,
    setFeaturedDesc,
    saving,
    onSave,
  } = props;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <p className="text-sm text-gray-600">
        Structured fields only — no arbitrary HTML/JS shells. Rich text is sanitised on save.
      </p>
      <Field label="Organisation name">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={org?.display_name || ''}
          onChange={(e) => org && setOrg({ ...org, display_name: e.target.value })}
        />
      </Field>
      <Field label="Logo URL (path or HTTPS)">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={org?.logo_src || ''}
          onChange={(e) => org && setOrg({ ...org, logo_src: e.target.value })}
        />
      </Field>
      <Field label="Tagline">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
      </Field>
      <Field label="Description (paragraphs separated by a blank line)">
        <textarea
          className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
          value={descriptionText}
          onChange={(e) => setDescriptionText(e.target.value)}
        />
      </Field>
      <Field label="Intro (limited rich text)">
        <textarea
          className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm font-mono"
          value={introHtml}
          onChange={(e) => setIntroHtml(e.target.value)}
        />
      </Field>
      <Field label="Featured heading">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={featuredTitle}
          onChange={(e) => setFeaturedTitle(e.target.value)}
        />
      </Field>
      <Field label="Featured link (HTTPS)">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={featuredHref}
          onChange={(e) => setFeaturedHref(e.target.value)}
        />
      </Field>
      <Field label="Featured description">
        <textarea
          className="min-h-[60px] w-full rounded-md border px-3 py-2 text-sm"
          value={featuredDesc}
          onChange={(e) => setFeaturedDesc(e.target.value)}
        />
      </Field>
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save page
      </button>
    </div>
  );
}

function ResourcesSection({
  hubId,
  resources,
  hubRole,
  onReload,
  draftsOnly,
}: {
  hubId: string;
  resources: HubResource[];
  hubRole: string;
  onReload: () => void;
  draftsOnly?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('pdf');
  const [busy, setBusy] = useState(false);

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...resources];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    try {
      await reorderHubResources(
        hubId,
        next.map((r) => r.id),
      );
      onReload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reorder failed');
    }
  };

  const create = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error('Title and HTTPS URL required');
      return;
    }
    setBusy(true);
    try {
      const res = await createHubResource(hubId, {
        title: title.trim(),
        external_url: url.trim(),
        resource_type: type,
        status: 'draft',
      });
      if (res.warning) toast(res.warning, { icon: '⚠️' });
      else toast.success('Resource created as draft');
      setTitle('');
      setUrl('');
      onReload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">
        {draftsOnly ? 'Draft resources' : 'Resources'} — external links only
      </h3>
      {!draftsOnly && can(hubRole, 'hub_editor') && (
        <div className="grid gap-2 rounded-lg border border-dashed border-teal-200 bg-teal-50/40 p-3 sm:grid-cols-4">
          <input
            placeholder="Title"
            className="rounded-md border px-2 py-1.5 text-sm sm:col-span-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            placeholder="https://…"
            className="rounded-md border px-2 py-1.5 text-sm sm:col-span-2"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              className="rounded-md border px-2 py-1.5 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="audio_zip">Audio ZIP</option>
              <option value="video">Video</option>
              <option value="web">Web</option>
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={() => void create()}
              className="inline-flex items-center gap-1 rounded-md bg-teal-700 px-3 py-1.5 text-sm text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>
      )}
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {resources.length === 0 && (
          <li className="p-4 text-sm text-gray-500">No resources in this view.</li>
        )}
        {resources.map((r, i) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{r.title}</p>
              <p className="truncate text-xs text-gray-500">
                {r.status} · {r.resource_type}
                {r.url_check_warning ? ` · ⚠ ${r.url_check_warning}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {!draftsOnly && (
                <>
                  <button type="button" className="rounded p-1 hover:bg-gray-100" onClick={() => void move(i, -1)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="rounded p-1 hover:bg-gray-100" onClick={() => void move(i, 1)}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              {can(hubRole, 'hub_publisher') && r.status !== 'published' && (
                <button
                  type="button"
                  className="rounded bg-teal-50 px-2 py-1 text-xs text-teal-800"
                  onClick={async () => {
                    try {
                      await resourceLifecycle(hubId, r.id, 'publish');
                      toast.success('Published');
                      onReload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Publish failed');
                    }
                  }}
                >
                  Publish
                </button>
              )}
              {can(hubRole, 'hub_publisher') && r.status === 'published' && (
                <button
                  type="button"
                  className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800"
                  onClick={async () => {
                    await resourceLifecycle(hubId, r.id, 'unpublish');
                    onReload();
                  }}
                >
                  Unpublish
                </button>
              )}
              {can(hubRole, 'hub_editor') && (
                <button
                  type="button"
                  className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-700"
                  onClick={async () => {
                    await resourceLifecycle(hubId, r.id, 'archive');
                    onReload();
                  }}
                >
                  <Archive className="inline h-3 w-3" /> Archive
                </button>
              )}
              {can(hubRole, 'hub_editor') && (
                <button
                  type="button"
                  className="rounded bg-gray-50 px-2 py-1 text-xs"
                  onClick={async () => {
                    const next = window.prompt('External HTTPS URL', r.external_url || '');
                    if (!next) return;
                    try {
                      const res = await updateHubResource(hubId, r.id, { external_url: next });
                      if (res.warning) toast(res.warning, { icon: '⚠️' });
                      else toast.success('URL updated');
                      onReload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Update failed');
                    }
                  }}
                >
                  Edit URL
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PublishSection({
  hubId,
  onDone,
}: {
  hubId: string;
  publishedAt?: string;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <Upload className="mx-auto h-8 w-8 text-teal-700" />
      <p className="text-sm text-gray-600">
        Publishing creates a page revision and makes structured content live on the public hub.
        Resource publish is per-item under Resources.
      </p>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
          onClick={async () => {
            try {
              await hubPageAction(hubId, 'publish');
              toast.success('Hub page published');
              onDone();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Publish failed');
            }
          }}
        >
          Publish page
        </button>
        <button
          type="button"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          onClick={async () => {
            await hubPageAction(hubId, 'unpublish');
            toast.success('Page unpublished');
            onDone();
          }}
        >
          Unpublish page
        </button>
      </div>
    </div>
  );
}

function PreviewSection(props: {
  org: OrganisationHub;
  tagline: string;
  descriptionText: string;
  introHtml: string;
  featuredTitle: string;
  featuredDesc: string;
  resources: HubResource[];
}) {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Eye className="h-4 w-4" /> Preview (published resources only)
      </div>
      <h3 className="text-2xl font-semibold" style={{ color: props.org.primary_color || '#002D24' }}>
        {props.org.display_name}
      </h3>
      <p className="text-sm text-gray-600">{props.tagline}</p>
      <div className="space-y-2 text-sm text-gray-700">
        {props.descriptionText.split(/\n\n+/).map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
      {props.introHtml && (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(props.introHtml) }}
        />
      )}
      <div className="rounded-md bg-pink-50 p-3">
        <p className="font-semibold text-pink-900">{props.featuredTitle}</p>
        <p className="text-sm text-pink-800">{props.featuredDesc}</p>
      </div>
      <ul className="text-sm">
        {props.resources.map((r) => (
          <li key={r.id} className="border-b border-gray-100 py-1.5">
            {r.title}{' '}
            <span className="text-xs text-gray-400">→ /api/resources/{r.id}/download</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MembersSection({ hubId }: { hubId: string }) {
  const [members, setMembers] = useState<
    { id: string; user_id: string; role: string; profile: { email: string | null; display_name: string | null } | null }[]
  >([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('hub_editor');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listHubMembers(hubId);
      setMembers(data.members);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [hubId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Users className="h-4 w-4" />
        Hub roles only — cannot grant system admin / super_admin / other hubs.
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="rounded-md border px-2 py-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="hub_viewer">Hub Viewer</option>
          <option value="hub_editor">Hub Editor</option>
          <option value="hub_publisher">Hub Publisher</option>
          <option value="hub_administrator">Hub Administrator</option>
        </select>
        <button
          type="button"
          className="rounded-md bg-teal-700 px-3 py-2 text-sm text-white"
          onClick={async () => {
            try {
              await grantHubMember(hubId, { email, role });
              toast.success('Membership granted');
              setEmail('');
              await reload();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Grant failed');
            }
          }}
        >
          Grant
        </button>
      </div>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ul className="divide-y rounded-lg border">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>
                {m.profile?.display_name || m.profile?.email || m.user_id}
                <span className="ml-2 text-xs text-gray-500">{m.role}</span>
              </span>
              <button
                type="button"
                className="text-xs text-red-700"
                onClick={async () => {
                  await revokeHubMember(hubId, m.user_id);
                  await reload();
                }}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnalyticsSection({ hubId }: { hubId: string }) {
  const [total, setTotal] = useState(0);
  const [byResource, setByResource] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await loadHubAnalytics(hubId, 30);
        setTotal(data.total);
        setByResource(data.by_resource || {});
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Analytics failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [hubId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-teal-700" />
        <h3 className="font-semibold">Downloads (30 days) — this hub only</h3>
      </div>
      <p className="text-xs text-gray-500">Raw IP addresses are never shown. Geo city/region only.</p>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <p className="text-3xl font-semibold text-teal-900">{total}</p>
          <ul className="text-sm">
            {Object.entries(byResource).map(([id, n]) => (
              <li key={id} className="flex justify-between border-b py-1">
                <span className="font-mono text-xs">{id}</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ExportSection({ hubId, slug }: { hubId: string; slug: string }) {
  return (
    <div className="space-y-3">
      <Download className="h-6 w-6 text-teal-700" />
      <p className="text-sm text-gray-600">
        Export org-scoped download events as CSV (no raw IPs). Requires a signed-in session.
      </p>
      <button
        type="button"
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
        onClick={async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (!token) {
            toast.error('Sign in required');
            return;
          }
          const res = await fetch(hubExportUrl(hubId, 90), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            toast.error('Export failed');
            return;
          }
          const blob = await res.blob();
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${slug}-downloads-90d.csv`;
          a.click();
        }}
      >
        Download CSV (90 days)
      </button>
    </div>
  );
}

function AuditSection({ hubId }: { hubId: string }) {
  const [events, setEvents] = useState<{ action: string; created_at: string; target_type?: string; target_id?: string }[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const data = await loadHubAudit(hubId);
        setEvents((data.events || []) as typeof events);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Audit load failed');
      }
    })();
  }, [hubId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <History className="h-4 w-4" /> Audit trail
      </div>
      <ul className="max-h-80 overflow-y-auto divide-y rounded-lg border text-sm">
        {events.length === 0 && <li className="p-3 text-gray-500">No events yet.</li>}
        {events.map((e, i) => (
          <li key={`${e.created_at}-${i}`} className="px-3 py-2">
            <span className="font-medium">{e.action}</span>
            <span className="ml-2 text-xs text-gray-500">
              {e.target_type}/{e.target_id} · {new Date(e.created_at).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimpleList({ title, empty, items }: { title: string; empty: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 font-semibold">
        <FileText className="h-4 w-4" /> {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

/** Compact entry point used from Settings. */
export function HubAdminEntryButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900 hover:bg-teal-100"
    >
      <Shield className="h-4 w-4" />
      Organisation hub admin
      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
    </button>
  );
}
