import React, { useEffect, useState } from 'react';
import {
  getTopic,
  replyToTopic,
  reactToPost,
  updateTopic,
  submitReport,
  forumSubscribe,
  forumUnsubscribe,
  updatePost,
} from '../../utils/forumApi';
import { sanitizeStoredHtml } from '../../utils/forumMarkdown';
import type { ForumPost } from '../../types/forum';
import { useAuth } from '../../hooks/useAuth';
import { ForumSeoHead } from './ForumSeoHead';

export function ForumTopicPage({
  topicId,
  navigate,
  requireSignIn,
}: {
  topicId: string;
  navigate: (path: string) => void;
  requireSignIn: (returnPath?: string) => boolean;
}) {
  const { user } = useAuth();
  const [topic, setTopic] = useState<any>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [caps, setCaps] = useState<string[]>([]);
  const [robots, setRobots] = useState('noindex,nofollow');
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');

  const load = async () => {
    try {
      const res = await getTopic(topicId);
      setTopic(res.topic);
      setPosts(res.posts);
      setCaps(res.caps || []);
      setRobots(res.robots || 'noindex,nofollow');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load topic');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  const canReply = caps.includes('forum.reply');
  const canReact = caps.includes('forum.react');
  const canReport = caps.includes('forum.report');
  const canMod = caps.includes('forum.moderate');

  const onReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireSignIn(`/forum/t/${topicId}`)) return;
    setBusy(true);
    setError(null);
    try {
      await replyToTopic(topicId, reply.trim());
      setReply('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reply failed');
    } finally {
      setBusy(false);
    }
  };

  const onReport = async (postId?: string) => {
    if (requireSignIn(`/forum/t/${topicId}`)) return;
    setBusy(true);
    try {
      const res = await submitReport({
        topic_id: topicId,
        post_id: postId,
        reason: reportReason,
        details: reportDetails,
      });
      setReportOpen(null);
      setReportDetails('');
      alert(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report failed');
    } finally {
      setBusy(false);
    }
  };

  if (error && !topic) {
    return <div className="text-sm text-red-700">{error}</div>;
  }
  if (!topic) return <p className="text-sm text-gray-500">Loading topic…</p>;

  return (
    <div className="space-y-6">
      <ForumSeoHead
        route={{ name: 'topic', id: topicId }}
        title={topic.title}
        description={String(topic.body_md || '').slice(0, 160)}
        robots={robots}
      />

      <button
        type="button"
        onClick={() =>
          navigate(topic.category?.slug ? `/forum/c/${topic.category.slug}` : '/forum')
        }
        className="text-sm text-teal-800 hover:underline"
      >
        ← {topic.category?.title || 'Category'}
      </button>

      <article className="rounded-xl border border-[#d5e0dc] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-[#002D24]">{topic.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {topic.author?.display_name || 'Member'} ·{' '}
              {new Date(topic.created_at).toLocaleString()}
              {topic.is_locked && ' · Locked'}
              {topic.is_pinned && ' · Pinned'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user && (
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                onClick={async () => {
                  if (topic.subscribed) await forumUnsubscribe(topicId);
                  else await forumSubscribe(topicId);
                  await load();
                }}
              >
                {topic.subscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
            )}
            {canMod && (
              <>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => updateTopic(topicId, { is_pinned: !topic.is_pinned }).then(load)}
                >
                  {topic.is_pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => updateTopic(topicId, { is_locked: !topic.is_locked }).then(load)}
                >
                  {topic.is_locked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  type="button"
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                  onClick={() =>
                    updateTopic(topicId, { is_hidden: !topic.is_hidden }).then(() =>
                      navigate('/forum'),
                    )
                  }
                >
                  {topic.is_hidden ? 'Restore' : 'Hide'}
                </button>
              </>
            )}
            {canReport && (
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                onClick={() => setReportOpen('topic')}
              >
                Report
              </button>
            )}
          </div>
        </div>
        <div
          className="prose prose-sm mt-4 max-w-none text-gray-800"
          dangerouslySetInnerHTML={{
            __html: sanitizeStoredHtml(topic.body_html || ''),
          }}
        />
      </article>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#002D24]">
          Replies ({topic.reply_count || posts.filter((p) => !p.is_topic_starter).length})
        </h2>
        {posts
          .filter((p) => !p.is_topic_starter)
          .map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border bg-white p-4 ${
                p.is_hidden ? 'border-amber-200 opacity-70' : 'border-[#d5e0dc]'
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>
                  {p.author?.display_name || 'Member'} ·{' '}
                  {new Date(p.created_at).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  {canReact && user && (
                    <button
                      type="button"
                      className="rounded border px-2 py-0.5"
                      onClick={() => reactToPost(p.id).then(load)}
                    >
                      Like ({p.reaction_count || 0})
                    </button>
                  )}
                  {canReport && (
                    <button
                      type="button"
                      className="rounded border px-2 py-0.5"
                      onClick={() => setReportOpen(p.id)}
                    >
                      Report
                    </button>
                  )}
                  {canMod && (
                    <button
                      type="button"
                      className="rounded border px-2 py-0.5 text-red-700"
                      onClick={() =>
                        updatePost(p.id, { is_hidden: !p.is_hidden }).then(load)
                      }
                    >
                      {p.is_hidden ? 'Restore' : 'Hide'}
                    </button>
                  )}
                </div>
              </div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeStoredHtml(p.body_html) }}
              />
            </div>
          ))}
      </section>

      {!topic.is_locked && (
        <form onSubmit={onReply} className="space-y-3 rounded-xl border border-[#d5e0dc] bg-white p-4">
          <h3 className="font-semibold text-[#002D24]">Reply</h3>
          {!user || !canReply ? (
            <button
              type="button"
              onClick={() => requireSignIn(`/forum/t/${topicId}`)}
              className="rounded-lg bg-[#008272] px-4 py-2 text-sm text-white"
            >
              Sign in to reply
            </button>
          ) : (
            <>
              <textarea
                required
                minLength={2}
                rows={5}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                placeholder="Write your reply (Markdown supported)"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-[#002D24] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? 'Posting…' : 'Post reply'}
              </button>
            </>
          )}
        </form>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="font-semibold text-[#002D24]">Report content</h3>
            <p className="mt-1 text-xs text-gray-500">
              Choose <strong>safeguarding</strong> only for child protection or urgent safety concerns.
              Those reports are prioritised separately from ordinary moderation.
            </p>
            <label className="mt-3 block text-sm">
              Reason
              <select
                className="mt-1 w-full rounded border px-2 py-2"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="spam">Spam</option>
                <option value="abuse">Abuse / harassment</option>
                <option value="off_topic">Off topic</option>
                <option value="safeguarding">Safeguarding</option>
                <option value="other">Other</option>
              </select>
            </label>
            <textarea
              className="mt-3 w-full rounded border px-2 py-2 text-sm"
              rows={3}
              placeholder="Optional details"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded px-3 py-1.5 text-sm" onClick={() => setReportOpen(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-[#002D24] px-3 py-1.5 text-sm text-white"
                onClick={() =>
                  onReport(reportOpen === 'topic' ? undefined : reportOpen)
                }
              >
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
