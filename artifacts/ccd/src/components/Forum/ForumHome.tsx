import React, { useEffect, useState } from 'react';
import { Lock, Megaphone, Users, Globe2 } from 'lucide-react';
import { listCategories, listTopics } from '../../utils/forumApi';
import type { ForumCategory, ForumTopicListItem } from '../../types/forum';
import { useAuth } from '../../hooks/useAuth';

function scopeIcon(scope: string) {
  if (scope === 'hub' || scope === 'members') return <Users className="h-3.5 w-3.5" />;
  if (scope === 'announcement') return <Megaphone className="h-3.5 w-3.5" />;
  if (scope === 'role_restricted') return <Lock className="h-3.5 w-3.5" />;
  return <Globe2 className="h-3.5 w-3.5" />;
}

export function ForumHome({
  navigate,
  requireSignIn,
  searchQuery,
}: {
  navigate: (path: string) => void;
  requireSignIn: (returnPath?: string) => boolean;
  searchQuery?: string;
}) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopicListItem[]>([]);
  const [caps, setCaps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'recent' | 'pinned' | 'unanswered'>('recent');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cats, tops] = await Promise.all([
          listCategories({ include_drafts: Boolean(user) }),
          listTopics({
            q: searchQuery,
            filter: filter === 'recent' ? undefined : filter,
            sort: 'recent',
            limit: 25,
          }),
        ]);
        if (cancelled) return;
        setCategories(cats.categories);
        setCaps(cats.caps || tops.caps || []);
        setTopics(tops.topics);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load forum');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, searchQuery, filter]);

  const canModerate = caps.includes('forum.moderate') || caps.includes('forum.manage_categories');

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-serif text-3xl text-[#002D24]">
          {searchQuery ? `Search: ${searchQuery}` : 'Community'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Discuss curriculum, classroom practice and arts education with other CCDesigner users.
          Public categories are readable by everyone; posting requires a signed-in account.
        </p>
        {!user && (
          <button
            type="button"
            onClick={() => requireSignIn('/forum')}
            className="mt-4 rounded-lg bg-[#008272] px-4 py-2 text-sm font-medium text-white hover:bg-[#006d60]"
          >
            Sign in to contribute
          </button>
        )}
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!searchQuery && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#002D24]">Categories</h2>
          {loading && <p className="text-sm text-gray-500">Loading…</p>}
          <ul className="divide-y divide-[#e2ebe8] rounded-xl border border-[#d5e0dc] bg-white">
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/forum/c/${c.slug}`)}
                  className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-[#f4f7f6]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{c.title}</span>
                      <span className="inline-flex items-center gap-1 rounded bg-[#e8f2ef] px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-[#005a50]">
                        {scopeIcon(c.scope)}
                        {c.scope}
                      </span>
                      {c.status !== 'published' && canModerate && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] uppercase text-amber-800">
                          {c.status}
                        </span>
                      )}
                    </div>
                    {c.description && (
                      <p className="mt-1 text-sm text-gray-600">{c.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-xs text-gray-500">
                    <div>{c.topic_count} topics</div>
                    <div>{c.post_count} posts</div>
                  </div>
                </button>
              </li>
            ))}
            {!loading && categories.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-gray-500">
                No published categories yet. Moderators can publish draft categories from Forum admin.
              </li>
            )}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#002D24]">
            {searchQuery ? 'Results' : 'Topics'}
          </h2>
          <div className="flex gap-1 text-sm">
            {(['recent', 'pinned', 'unanswered'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 capitalize ${
                  filter === f ? 'bg-[#002D24] text-white' : 'bg-white text-gray-700 ring-1 ring-[#d5e0dc]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <ul className="divide-y divide-[#e2ebe8] rounded-xl border border-[#d5e0dc] bg-white">
          {topics.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => navigate(`/forum/t/${t.id}`)}
                className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-[#f4f7f6]"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {t.is_pinned && (
                      <span className="mr-2 text-[11px] font-semibold uppercase text-teal-700">
                        Pinned
                      </span>
                    )}
                    {t.title}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {t.category_title || 'Category'} · {t.author?.display_name || 'Member'} ·{' '}
                    {t.reply_count} replies
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {t.last_reply_at
                    ? new Date(t.last_reply_at).toLocaleDateString()
                    : new Date(t.created_at).toLocaleDateString()}
                </div>
              </button>
            </li>
          ))}
          {!loading && topics.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">No topics yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
