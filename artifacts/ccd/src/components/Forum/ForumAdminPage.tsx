import React, { useEffect, useState } from 'react';
import {
  listCategories,
  updateCategory,
  createCategory,
  listReports,
  updateReport,
  getForumMe,
  updateForumPrefs,
  listModerationActions,
} from '../../utils/forumApi';
import type { ForumCategory, ForumReport } from '../../types/forum';
import { useAuth } from '../../hooks/useAuth';

export function ForumAdminPage({
  navigate,
  requireSignIn,
}: {
  navigate: (path: string) => void;
  requireSignIn: (returnPath?: string) => boolean;
}) {
  const { user } = useAuth();
  const [caps, setCaps] = useState<string[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [actions, setActions] = useState<unknown[]>([]);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'categories' | 'reports' | 'prefs' | 'log'>('categories');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (!user) {
      requireSignIn('/forum/admin');
      return;
    }
    (async () => {
      try {
        const me = await getForumMe();
        setCaps(me.caps || []);
        setPrefs(me.prefs || {});
        if (
          me.caps?.includes('forum.manage_categories') ||
          me.caps?.includes('forum.moderate')
        ) {
          const cats = await listCategories({ include_drafts: true });
          setCategories(cats.categories);
        }
        if (me.caps?.includes('forum.moderate')) {
          const r = await listReports({ status: 'open' });
          setReports(r.reports);
          const log = await listModerationActions();
          setActions(log.actions || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load admin');
      }
    })();
  }, [user]);

  const canManage = caps.includes('forum.manage_categories');
  const canMod = caps.includes('forum.moderate');

  if (!user) {
    return <p className="text-sm text-gray-600">Sign in required for forum admin.</p>;
  }

  if (!canManage && !canMod) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl text-[#002D24]">Forum preferences</h1>
        <PrefsForm prefs={prefs} onSave={setPrefs} />
        <button type="button" className="text-sm text-teal-800" onClick={() => navigate('/forum')}>
          ← Back to forum
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-[#002D24]">Forum admin</h1>
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['categories', 'Categories'],
            ['reports', 'Reports'],
            ['prefs', 'Notifications'],
            ['log', 'Audit'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === id ? 'bg-[#002D24] text-white' : 'bg-white ring-1 ring-[#d5e0dc]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'categories' && canManage && (
        <div className="space-y-4">
          <form
            className="flex flex-wrap gap-2 rounded-xl border bg-white p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await createCategory({ title: newTitle, status: 'draft', scope: 'public' });
              setNewTitle('');
              const cats = await listCategories({ include_drafts: true });
              setCategories(cats.categories);
            }}
          >
            <input
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New category title"
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded bg-[#008272] px-3 py-2 text-sm text-white">
              Add draft
            </button>
          </form>
          <ul className="divide-y rounded-xl border bg-white">
            {categories.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-gray-500">
                    {c.slug} · {c.scope} · {c.status}
                    {c.hub_id ? ` · hub ${c.hub_id}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.status !== 'published' && (
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={async () => {
                        await updateCategory(c.id, { status: 'published' });
                        const cats = await listCategories({ include_drafts: true });
                        setCategories(cats.categories);
                      }}
                    >
                      Publish
                    </button>
                  )}
                  {c.status === 'published' && (
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={async () => {
                        await updateCategory(c.id, { status: 'draft' });
                        const cats = await listCategories({ include_drafts: true });
                        setCategories(cats.categories);
                      }}
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    onClick={async () => {
                      await updateCategory(c.id, { is_locked: !c.is_locked });
                      const cats = await listCategories({ include_drafts: true });
                      setCategories(cats.categories);
                    }}
                  >
                    {c.is_locked ? 'Unlock' : 'Lock'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-800">
            Seeded categories ship as <strong>Draft</strong> until an owner publishes them.
          </p>
        </div>
      )}

      {tab === 'reports' && canMod && (
        <ul className="divide-y rounded-xl border bg-white">
          {reports.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span
                    className={`mr-2 rounded px-1.5 py-0.5 text-[11px] uppercase ${
                      r.is_safeguarding
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {r.is_safeguarding ? 'Safeguarding' : r.reason}
                  </span>
                  <span className="text-sm text-gray-600">{r.status}</span>
                  {r.details && <p className="mt-1 text-sm text-gray-700">{r.details}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    onClick={async () => {
                      await updateReport({ id: r.id, status: 'resolved' });
                      const res = await listReports({ status: 'open' });
                      setReports(res.reports);
                    }}
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    onClick={async () => {
                      await updateReport({ id: r.id, status: 'dismissed' });
                      const res = await listReports({ status: 'open' });
                      setReports(res.reports);
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </li>
          ))}
          {reports.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">No open reports.</li>
          )}
        </ul>
      )}

      {tab === 'prefs' && <PrefsForm prefs={prefs} onSave={setPrefs} />}

      {tab === 'log' && canMod && (
        <ul className="divide-y rounded-xl border bg-white text-sm">
          {(actions as { id: string; action: string; target_type: string; created_at: string }[]).map(
            (a) => (
              <li key={a.id} className="px-4 py-2">
                <span className="font-medium">{a.action}</span> on {a.target_type} ·{' '}
                {new Date(a.created_at).toLocaleString()}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function PrefsForm({
  prefs,
  onSave,
}: {
  prefs: Record<string, boolean>;
  onSave: (p: Record<string, boolean>) => void;
}) {
  const [local, setLocal] = useState(prefs);
  useEffect(() => setLocal(prefs), [prefs]);
  return (
    <form
      className="space-y-3 rounded-xl border bg-white p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await updateForumPrefs(local);
        onSave((res as { prefs: Record<string, boolean> }).prefs || local);
      }}
    >
      <h2 className="font-semibold">Notification preferences</h2>
      <p className="text-xs text-gray-500">
        In-app notifications are always stored. Email delivery runs when Resend is configured;
        otherwise preferences are saved for later.
      </p>
      {(
        [
          ['forum_email_notifications', 'Email notifications'],
          ['forum_notify_replies', 'Notify on replies'],
          ['forum_notify_mentions', 'Notify on mentions'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={local[key] !== false}
            onChange={(e) => setLocal({ ...local, [key]: e.target.checked })}
          />
          {label}
        </label>
      ))}
      <button type="submit" className="rounded bg-[#002D24] px-3 py-2 text-sm text-white">
        Save preferences
      </button>
    </form>
  );
}
