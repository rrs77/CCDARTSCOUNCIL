import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getMusicHubOverlay,
  saveMusicHubOverlay,
  walkMusicHubNodes,
  getMusicHubsDirectory,
} from '../../config/musicHubsDirectory';
import type { MusicHubPublishStatus } from '../../types/musicHubsDirectory';

/**
 * Lightweight Music Hubs admin — local overlay for status/featured.
 * Subscriber password set/clear via API (hash never displayed after save).
 * Org-scoped editing: filter by organisationId when profile org is known.
 */
export function MusicHubAdminPanel({
  organisationFilter,
  adminToken,
}: {
  /** When set, only nodes for this org are editable (org admins). */
  organisationFilter?: string | null;
  /** Optional MUSIC_HUB_ADMIN_TOKEN for password API. */
  adminToken?: string;
}) {
  const [overlay, setOverlay] = useState(() => getMusicHubOverlay());
  const [passwordOrg, setPasswordOrg] = useState('ems');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const nodes = useMemo(() => {
    const list: { id: string; name: string; path: string; organisationId?: string; status: string; featured?: boolean }[] =
      [];
    walkMusicHubNodes(getMusicHubsDirectory().countries, (node) => {
      if (organisationFilter && node.organisationId !== organisationFilter) return;
      if (!['music-hub', 'service', 'national-service', 'district', 'borough'].includes(node.kind)) {
        return;
      }
      list.push({
        id: node.id,
        name: node.name,
        path: node.path,
        organisationId: node.organisationId,
        status: node.status,
        featured: node.featured,
      });
    });
    return list;
  }, [organisationFilter, overlay]);

  const patchNode = (id: string, patch: { status?: MusicHubPublishStatus; featured?: boolean }) => {
    const next = { ...overlay, [id]: { ...overlay[id], ...patch } };
    setOverlay(next);
    saveMusicHubOverlay(next);
    toast.success('Saved locally (seed overlay)');
  };

  const setPassword = async (action: 'set' | 'clear') => {
    if (!adminToken) {
      toast.error('Set MUSIC_HUB_ADMIN_TOKEN in the environment and pass it to this panel for API calls.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/music-hubs/admin/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          organisationId: passwordOrg,
          action,
          password: action === 'set' ? newPassword : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        hash?: string;
        note?: string;
      };
      if (!res.ok) {
        toast.error(data.error || 'Password update failed');
        return;
      }
      setNewPassword('');
      if (data.hash) {
        toast.success('Hash generated — store in MUSIC_HUB_SUBSCRIBER_HASHES (password not shown again)');
        console.info('[music-hubs] subscriber hash for', passwordOrg, data.hash);
      } else {
        toast.success(data.note || 'Password cleared');
      }
    } catch {
      toast.error('Could not reach password API');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-[#002D24]/15 bg-white p-4 sm:p-5">
      <div>
        <h3 className="text-lg font-semibold text-[#002D24]">Music Hubs admin</h3>
        <p className="mt-1 text-sm text-[#002D24]/70">
          Edit publish status and featured flag (local overlay). Subscriber passwords are hashed
          server-side — saved passwords are never shown. Migrate overlay → Supabase hub_pages when
          hub-admin APIs are merged.
        </p>
      </div>

      <ul className="max-h-80 space-y-2 overflow-auto" aria-label="Music hub nodes">
        {nodes.map((node) => (
          <li
            key={node.id}
            className="flex flex-col gap-2 rounded-lg border border-[#002D24]/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#002D24]">{node.name}</p>
              <p className="truncate text-xs text-[#002D24]/55">{node.path}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`status-${node.id}`}>
                Status for {node.name}
              </label>
              <select
                id={`status-${node.id}`}
                value={overlay[node.id]?.status || node.status}
                onChange={(e) =>
                  patchNode(node.id, { status: e.target.value as MusicHubPublishStatus })
                }
                className="rounded-md border border-[#002D24]/20 bg-white px-2 py-1.5 text-xs"
              >
                <option value="published">published</option>
                <option value="draft">draft</option>
                <option value="coming-soon">coming soon</option>
              </select>
              <label className="inline-flex items-center gap-1.5 text-xs text-[#002D24]">
                <input
                  type="checkbox"
                  checked={Boolean(overlay[node.id]?.featured ?? node.featured)}
                  onChange={(e) => patchNode(node.id, { featured: e.target.checked })}
                />
                Featured
              </label>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-lg border border-[#002D24]/10 bg-[#E8F0EA]/40 px-3 py-3">
        <p className="text-sm font-semibold text-[#002D24]">Subscriber password</p>
        <p className="mt-1 text-xs text-[#002D24]/65">
          One password per organisation (collection override reserved for later). Never displays a
          saved password.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label className="text-xs font-medium text-[#002D24]" htmlFor="mh-pw-org">
              Organisation
            </label>
            <select
              id="mh-pw-org"
              value={passwordOrg}
              onChange={(e) => setPasswordOrg(e.target.value)}
              className="mt-1 block rounded-md border border-[#002D24]/20 bg-white px-2 py-1.5 text-sm"
            >
              <option value="ems">ems</option>
              <option value="triborough">triborough</option>
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className="text-xs font-medium text-[#002D24]" htmlFor="mh-pw-new">
              New password
            </label>
            <input
              id="mh-pw-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#002D24]/20 bg-white px-2 py-1.5 text-sm"
              placeholder="Min 8 characters"
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setPassword('set')}
            className="rounded-lg bg-[#002D24] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Set password
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setPassword('clear')}
            className="rounded-lg border border-[#002D24]/20 bg-white px-3 py-2 text-sm font-semibold text-[#002D24] disabled:opacity-60"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
