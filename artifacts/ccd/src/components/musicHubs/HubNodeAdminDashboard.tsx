import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  findMusicHubNodeByPath,
  musicHubAdminHref,
  musicHubPublicHref,
} from '../../config/musicHubsDirectory';
import { useAuth } from '../../hooks/useAuth';
import type { HubEditFieldKey, HubEditableContent } from '../../types/musicHubContent';
import {
  canApproveMusicHubContent,
  canEditMusicHubNode,
  HUB_ADMIN_PERMISSION_DENIED,
} from '../../utils/musicHubAdminAccess';
import {
  countPendingForNode,
  ensurePlaceholderMedia,
  getEditorPreviewContent,
  getWorkingRevision,
  realHubMediaUrl,
  saveDraftRevision,
  submitRevisionForApproval,
} from '../../utils/musicHubContentStore';
import { backToCCDesigner } from '../../config/partnerHubs';
import { HubEditModal, HubEditPencil } from './HubEditModal';

function TableSection({
  title,
  field,
  rows,
  canEdit,
  onEdit,
  empty,
}: {
  title: string;
  field: HubEditFieldKey;
  rows: { id: string; title: string; description?: string; imageUrl?: string }[];
  canEdit: boolean;
  onEdit: (field: HubEditFieldKey) => void;
  empty: string;
}) {
  return (
    <section className="rounded-xl border border-[#002D24]/12 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[#002D24]">{title}</h2>
        {canEdit && <HubEditPencil label={`Edit ${title}`} onClick={() => onEdit(field)} />}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[#002D24]/60">{empty}</p>
      ) : (
        <ul className="divide-y divide-[#002D24]/10">
          {rows.map((row) => (
            <li key={row.id} className="flex gap-3 py-3">
              {row.imageUrl && (
                <img
                  src={row.imageUrl}
                  alt=""
                  className="h-14 w-20 shrink-0 rounded-md object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#002D24]">{row.title}</p>
                {row.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-[#002D24]/65">{row.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Per-node hub admin dashboard — `/ems/admin`, `/essex/chelmsford/admin`, etc.
 */
export function HubNodeAdminDashboard({ path }: { path: string }) {
  const { user, profile } = useAuth();
  const match = findMusicHubNodeByPath(path);
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

  const node = match?.node;
  const canEdit = node ? canEditMusicHubNode(user, profile, node.id) : false;
  const canApprove = canApproveMusicHubContent(user, profile);

  const content = useMemo(() => {
    if (!node) return null;
    void tick;
    return ensurePlaceholderMedia(getEditorPreviewContent(node));
  }, [node, tick]);

  const working = node ? getWorkingRevision(node.id) : null;
  const pendingCount = node ? countPendingForNode(node.id) : 0;

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
      if (!node || !canEdit) return;
      saveDraftRevision(node.id, ensurePlaceholderMedia(next), actor);
      toast.success('Saved as draft — submit for approval when ready');
      setTick((t) => t + 1);
    },
    [node, canEdit, actor],
  );

  const submit = () => {
    if (!node || !canEdit) return;
    const rev = submitRevisionForApproval(node.id, actor);
    if (!rev) {
      toast.error('Save a draft before submitting');
      return;
    }
    toast.success('Submitted for admin approval');
    setTick((t) => t + 1);
  };

  if (!match || !node || !content) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[#002D24]">Admin page not found</h1>
        <a href="/music-hubs" className="mt-4 inline-block text-sm font-semibold underline">
          Back to Music Hubs
        </a>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[#002D24]">
          {HUB_ADMIN_PERMISSION_DENIED}
        </h1>
        <p className="mt-2 text-sm text-[#002D24]/70">
          Ask a CCDesigner admin to assign you this area under Settings → Users → Manage Access.
        </p>
        <button
          type="button"
          onClick={() => backToCCDesigner('our-partners')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#002D24]/20 bg-white px-3 py-1.5 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F0EA]/70 via-gray-50 to-gray-50">
      <div className="border-b border-[#002D24]/10 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => backToCCDesigner('our-partners')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#002D24]/20 bg-white px-3 py-1.5 text-sm font-semibold text-[#002D24]"
          >
            <ArrowLeft className="h-4 w-4" />
            CCDesigner
          </button>
          <div className="flex flex-wrap gap-2">
            <a
              href={musicHubPublicHref(path)}
              className="rounded-lg border border-[#002D24]/20 bg-white px-3 py-1.5 text-sm font-semibold text-[#002D24]"
            >
              View public page
            </a>
            <a
              href={musicHubAdminHref(path)}
              className="rounded-lg bg-[#002D24]/5 px-3 py-1.5 text-xs text-[#002D24]/60"
            >
              {musicHubAdminHref(path)}
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-[#002D24]/12 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#002D24]/55">
            Hub admin
          </p>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {realHubMediaUrl(content.logoUrl) ? (
                <img
                  src={content.logoUrl}
                  alt=""
                  className="h-14 w-28 rounded-lg border border-[#002D24]/10 bg-[#E8F0EA] object-contain p-1"
                />
              ) : (
                <div className="flex h-14 w-28 items-center justify-center rounded-lg border border-dashed border-[#002D24]/25 bg-[#E8F0EA]/40">
                  <span className="text-[10px] font-medium text-[#002D24]/50">No logo</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-[#002D24] sm:text-2xl">
                  {content.title || node.name}
                </h1>
                <p className="text-sm text-[#002D24]/65">{node.path}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <HubEditPencil label="Edit logo" onClick={() => setEditField('logo')} />
              <HubEditPencil label="Edit header" onClick={() => setEditField('header')} />
            </div>
          </div>
        </header>

        {(working?.status === 'draft' ||
          working?.status === 'rejected' ||
          working?.status === 'changes_requested' ||
          pendingCount > 0) && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-amber-950">
              {pendingCount > 0 ? (
                <p>
                  You have <strong>{pendingCount}</strong> change
                  {pendingCount === 1 ? '' : 's'} awaiting approval. Live page is unchanged until
                  Approve &amp; Publish.
                </p>
              ) : working?.status === 'changes_requested' ? (
                <p>
                  Changes requested
                  {working.reviewNote ? `: ${working.reviewNote}` : ''}. Edit and resubmit.
                </p>
              ) : working?.status === 'rejected' ? (
                <p>
                  Last submission was rejected
                  {working.reviewNote ? `: ${working.reviewNote}` : ''}. Edit and resubmit.
                </p>
              ) : (
                <p>You have draft changes that are not live yet.</p>
              )}
              {canApprove && (
                <p className="mt-1 text-xs text-amber-900/80">
                  System admins approve in Settings → Hub content (not your own submissions).
                </p>
              )}
            </div>
            {working?.status === 'draft' ||
            working?.status === 'rejected' ||
            working?.status === 'changes_requested' ? (
              <button
                type="button"
                onClick={submit}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#002D24] px-3 py-2 text-sm font-semibold text-white"
              >
                <Send className="h-3.5 w-3.5" />
                Submit for approval
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-900">
                <CheckCircle2 className="h-4 w-4" />
                Pending review
              </span>
            )}
          </div>
        )}

        <TableSection
          title="Resources"
          field="resources"
          rows={(content.resources || []).map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
          }))}
          canEdit={canEdit}
          onEdit={setEditField}
          empty="No resources yet — use the pencil to add placeholders."
        />
        <TableSection
          title="Courses"
          field="courses"
          rows={content.courses || []}
          canEdit={canEdit}
          onEdit={setEditField}
          empty="No courses yet — placeholders OK."
        />
        <TableSection
          title="Activities"
          field="activities"
          rows={content.activities || []}
          canEdit={canEdit}
          onEdit={setEditField}
          empty="No activities yet — placeholders OK."
        />
        <TableSection
          title="Lesson plans"
          field="lessonPlans"
          rows={content.lessonPlans || []}
          canEdit={canEdit}
          onEdit={setEditField}
          empty="No full lesson plans yet — placeholders OK."
        />
      </div>

      {editField && (
        <HubEditModal
          field={editField}
          content={content}
          nodeName={node.name}
          onClose={() => setEditField(null)}
          onSave={persist}
        />
      )}
    </div>
  );
}
