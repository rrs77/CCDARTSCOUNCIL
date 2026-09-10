import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { findMusicHubNodeById, musicHubAdminHref } from '../../config/musicHubsDirectory';
import type { HubContentRevision } from '../../types/musicHubContent';
import { canApproveMusicHubContent } from '../../utils/musicHubAdminAccess';
import {
  approveRevision,
  listPendingRevisions,
  rejectRevision,
  requestChangesRevision,
} from '../../utils/musicHubContentStore';
import { getMusicHubOverlay, saveMusicHubOverlay } from '../../config/musicHubsDirectory';

/**
 * Settings → Hub content — system admins approve / request changes / reject.
 * Hub admins cannot approve their own submissions.
 */
export function HubContentApprovalQueue() {
  const { user, profile } = useAuth();
  const [pending, setPending] = useState<HubContentRevision[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});

  const refresh = () => setPending(listPendingRevisions());

  useEffect(() => {
    refresh();
    const bump = () => refresh();
    window.addEventListener('ccd:music-hub-content-changed', bump);
    return () => window.removeEventListener('ccd:music-hub-content-changed', bump);
  }, []);

  if (!canApproveMusicHubContent(user, profile)) {
    return (
      <p className="text-sm text-gray-600">
        Only CCDesigner admins can approve Music Hub content changes.
      </p>
    );
  }

  const actor = {
    userId: user?.id || 'admin',
    email: user?.email,
    name: user?.name || profile?.display_name || undefined,
  };

  const onApprove = (rev: HubContentRevision) => {
    if (!canApproveMusicHubContent(user, profile, rev.editedBy.userId)) {
      toast.error('You cannot approve your own submission');
      return;
    }
    const result = approveRevision(rev.id, actor, note[rev.id]);
    if (!result) {
      toast.error('Could not approve (own submission or already handled)');
      return;
    }
    const overlay = getMusicHubOverlay();
    saveMusicHubOverlay({
      ...overlay,
      [rev.nodeId]: { ...overlay[rev.nodeId], status: 'published' },
    });
    toast.success('Approved and published — live page updated');
    refresh();
  };

  const onRequestChanges = (rev: HubContentRevision) => {
    if (!canApproveMusicHubContent(user, profile, rev.editedBy.userId)) {
      toast.error('You cannot review your own submission');
      return;
    }
    const result = requestChangesRevision(rev.id, actor, note[rev.id] || 'Changes requested');
    if (!result) {
      toast.error('Could not request changes');
      return;
    }
    toast.success('Changes requested — hub editor notified in-app');
    refresh();
  };

  const onReject = (rev: HubContentRevision) => {
    if (!canApproveMusicHubContent(user, profile, rev.editedBy.userId)) {
      toast.error('You cannot reject your own submission');
      return;
    }
    rejectRevision(rev.id, actor, note[rev.id] || 'Rejected');
    toast.success('Rejected — hub editor can revise');
    refresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Content Approvals</h3>
        <p className="mt-1 text-sm text-gray-600">
          Hub editors submit drafts; live pages stay unchanged until you Approve &amp; Publish.
          Assign hub access under Users → Manage Access. You cannot approve your own submissions.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
          No changes awaiting approval.
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((rev) => {
            const node = findMusicHubNodeById(rev.nodeId);
            const isOwn = Boolean(user?.id && rev.editedBy.userId === user.id);
            return (
              <li
                key={rev.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{node?.name || rev.nodeId}</p>
                    <p className="text-xs text-gray-500">{node?.path || rev.nodeId}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      Submitted by {rev.editedBy.name || rev.editedBy.email || rev.editedBy.userId}
                      {rev.submittedAt
                        ? ` · ${new Date(rev.submittedAt).toLocaleString()}`
                        : ''}
                      {isOwn ? ' · (your submission — another admin must approve)' : ''}
                    </p>
                  </div>
                  {node && (
                    <a
                      href={musicHubAdminHref(node.path)}
                      className="text-xs font-semibold text-teal-700 hover:underline"
                    >
                      Open hub admin
                    </a>
                  )}
                </div>
                <ul className="mt-2 grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
                  <li>Title: {rev.content.title || '—'}</li>
                  <li>Resources: {(rev.content.resources || []).length}</li>
                  <li>Courses: {(rev.content.courses || []).length}</li>
                  <li>Activities: {(rev.content.activities || []).length}</li>
                  <li>Lesson plans: {(rev.content.lessonPlans || []).length}</li>
                  <li>Logo: {rev.content.logoUrl ? 'set' : 'placeholder'}</li>
                </ul>
                <label className="mt-3 block text-xs font-medium text-gray-700">
                  Review note (optional)
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    value={note[rev.id] || ''}
                    onChange={(e) => setNote((n) => ({ ...n, [rev.id]: e.target.value }))}
                    placeholder="Shown on request changes / reject"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isOwn}
                    onClick={() => onApprove(rev)}
                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    Approve &amp; Publish
                  </button>
                  <button
                    type="button"
                    disabled={isOwn}
                    onClick={() => onRequestChanges(rev)}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    disabled={isOwn}
                    onClick={() => onReject(rev)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
