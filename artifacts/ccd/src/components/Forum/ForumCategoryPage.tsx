import React, { useEffect, useState } from 'react';
import { getCategory, listTopics, createTopic } from '../../utils/forumApi';
import type { ForumCategory, ForumTopicListItem } from '../../types/forum';
import { useAuth } from '../../hooks/useAuth';

export function ForumCategoryPage({
  slug,
  navigate,
  requireSignIn,
  compose = false,
}: {
  slug: string;
  navigate: (path: string) => void;
  requireSignIn: (returnPath?: string) => boolean;
  compose?: boolean;
}) {
  const { user } = useAuth();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [topics, setTopics] = useState<ForumTopicListItem[]>([]);
  const [caps, setCaps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [showCompose, setShowCompose] = useState(compose);

  const load = async () => {
    if (!slug) {
      setError('Choose a category to start a topic.');
      return;
    }
    setError(null);
    try {
      const catRes = await getCategory(slug);
      setCategory(catRes.category);
      setCaps(catRes.caps || []);
      const tops = await listTopics({
        category: catRes.category.slug,
        page,
        limit: 20,
      });
      setTopics(tops.topics);
      setTotal(tops.total);
      setCaps(tops.caps || catRes.caps || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load category');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, page]);

  const canCreate = caps.includes('forum.create_topic');

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireSignIn(`/forum/c/${slug}`)) return;
    if (!category) return;
    setPosting(true);
    setError(null);
    try {
      const res = await createTopic({
        category_id: category.id,
        title: title.trim(),
        body_md: body.trim(),
      });
      navigate(`/forum/t/${res.topic.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create topic');
    } finally {
      setPosting(false);
    }
  };

  if (!slug) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Pick a category from the forum home, then start a topic.
        <button
          type="button"
          className="ml-2 underline"
          onClick={() => navigate('/forum')}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/forum')}
        className="text-sm text-teal-800 hover:underline"
      >
        ← All categories
      </button>

      {category && (
        <div>
          <h1 className="font-serif text-3xl text-[#002D24]">{category.title}</h1>
          {category.description && (
            <p className="mt-2 text-sm text-gray-600">{category.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded bg-[#e8f2ef] px-2 py-0.5 text-xs uppercase text-[#005a50]">
              {category.scope}
            </span>
            {category.status !== 'published' && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs uppercase text-amber-800">
                {category.status}
              </span>
            )}
            {user && canCreate && (
              <button
                type="button"
                onClick={() => {
                  if (requireSignIn(`/forum/c/${slug}`)) return;
                  setShowCompose((v) => !v);
                }}
                className="rounded-lg bg-[#008272] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#006d60]"
              >
                {showCompose ? 'Cancel' : 'New topic'}
              </button>
            )}
            {!user && (
              <button
                type="button"
                onClick={() => requireSignIn(`/forum/c/${slug}`)}
                className="rounded-lg bg-[#008272] px-3 py-1.5 text-sm font-medium text-white"
              >
                Sign in to post
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {showCompose && category && (
        <form onSubmit={onCreate} className="space-y-3 rounded-xl border border-[#d5e0dc] bg-white p-4">
          <h2 className="font-semibold text-[#002D24]">New topic</h2>
          <input
            required
            minLength={5}
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Topic title"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            required
            minLength={5}
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write in Markdown. Be respectful — see Community Guidelines."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
          />
          <button
            type="submit"
            disabled={posting}
            className="rounded-lg bg-[#002D24] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {posting ? 'Posting…' : 'Post topic'}
          </button>
        </form>
      )}

      <ul className="divide-y divide-[#e2ebe8] rounded-xl border border-[#d5e0dc] bg-white">
        {topics.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => navigate(`/forum/t/${t.id}`)}
              className="flex w-full justify-between gap-3 px-4 py-3 text-left hover:bg-[#f4f7f6]"
            >
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-gray-500">
                  {t.author?.display_name} · {t.reply_count} replies
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(t.created_at).toLocaleDateString()}
              </span>
            </button>
          </li>
        ))}
        {topics.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-500">No topics in this category yet.</li>
        )}
      </ul>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} · {total} topics
          </span>
          <button
            type="button"
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
