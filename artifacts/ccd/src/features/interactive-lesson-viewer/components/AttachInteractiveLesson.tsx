import React, { useEffect, useState } from 'react';
import { Clapperboard, Copy, Link2, Play, Unlink } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCanEditInteractiveLessons } from '../hooks/useCanEditInteractiveLessons';
import {
  attachInteractiveLessonToCcdLesson,
  getAttachedInteractiveLessonId,
  getInteractiveLesson,
  getPublishedInteractiveLessonForPlayer,
  listInteractiveLessons,
} from '../data/store';
import type { InteractiveLesson, InteractiveLessonSummary } from '../types';
import { InteractiveLessonPlayer } from './player/InteractiveLessonPlayer';
import { buildPlayerEmbedSnippet, buildPlayerUrl } from '../utils/playerLinks';
import '../styles.css';

interface AttachInteractiveLessonProps {
  sheet: string;
  lessonNumber: string;
  /** Optional: persist id onto LessonData via parent */
  onAttached?: (interactiveLessonId: string | null) => void;
  existingId?: string | null;
}

export function AttachInteractiveLesson({
  sheet,
  lessonNumber,
  onAttached,
  existingId,
}: AttachInteractiveLessonProps) {
  const { user } = useAuth();
  const canEdit = useCanEditInteractiveLessons();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InteractiveLessonSummary[]>([]);
  const [attachedId, setAttachedId] = useState<string | null>(
    existingId || getAttachedInteractiveLessonId(sheet, lessonNumber),
  );
  const [attachedMeta, setAttachedMeta] = useState<InteractiveLesson | null>(null);
  const [playing, setPlaying] = useState<InteractiveLesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [copyMsg, setCopyMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    void listInteractiveLessons({
      userId: user?.id || 'anonymous',
      canEdit: true,
    }).then((list) => setItems(list.filter((i) => i.status === 'published' || canEdit)));
  }, [open, user?.id, canEdit]);

  useEffect(() => {
    if (!attachedId) {
      setAttachedMeta(null);
      return;
    }
    void getInteractiveLesson(attachedId).then((l) => setAttachedMeta(l));
  }, [attachedId]);

  const attach = async (id: string) => {
    if (!user?.id) return;
    setBusy(true);
    await attachInteractiveLessonToCcdLesson(id, sheet, lessonNumber, user.id);
    setAttachedId(id);
    onAttached?.(id);
    setBusy(false);
    setOpen(false);
  };

  const attachFromPaste = async () => {
    const raw = pasteUrl.trim();
    if (!raw) return;
    let id = raw;
    try {
      const u = new URL(raw, window.location.origin);
      id = u.searchParams.get('play') || raw.split('/').filter(Boolean).pop() || raw;
    } catch {
      /* use raw */
    }
    await attach(id);
  };

  const detach = () => {
    try {
      const mapRaw = localStorage.getItem('ccd-ilv-attachments-v1');
      const map = mapRaw ? (JSON.parse(mapRaw) as Record<string, string>) : {};
      delete map[`${sheet}:${lessonNumber}`];
      localStorage.setItem('ccd-ilv-attachments-v1', JSON.stringify(map));
    } catch {
      /* ignore */
    }
    setAttachedId(null);
    onAttached?.(null);
  };

  const playAttached = async () => {
    if (!attachedId) return;
    const { lesson, reason } = await getPublishedInteractiveLessonForPlayer(attachedId);
    if (lesson) {
      setPlaying(lesson);
      return;
    }
    if (reason === 'unpublished') {
      setCopyMsg('Not available yet — publish the interactive lesson first.');
    } else {
      setCopyMsg('Interactive lesson not found.');
    }
  };

  const copyPlayerLink = async () => {
    if (!attachedId) return;
    const url = buildPlayerUrl(attachedId);
    try {
      await navigator.clipboard.writeText(url);
      setCopyMsg('Player link copied');
    } catch {
      setCopyMsg(url);
    }
  };

  return (
    <div className="ilv-root rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-lilac)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4 text-[var(--ss-indigo)]" />
          <div>
            <div className="text-xs font-bold text-[var(--ss-ink)]">Interactive lesson</div>
            <div className="text-[11px] text-[var(--ss-muted)]">
              {attachedId
                ? 'Player-only link — opens classroom play, not the editor'
                : 'None attached yet'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ilv-btn ilv-btn-secondary text-xs"
            onClick={() => setOpen((v) => !v)}
          >
            <Link2 className="h-3.5 w-3.5" />
            {attachedId ? 'Change' : 'Add interactive lesson link'}
          </button>
          {attachedId && (
            <button type="button" className="ilv-btn ilv-btn-ghost text-xs" onClick={detach} title="Detach">
              <Unlink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {attachedId && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[12px] border border-[var(--ss-line)] bg-white p-3">
          <div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded-[8px] bg-[var(--ss-ink)] text-white">
            {attachedMeta?.mediaLibrary?.[0]?.url?.match(/\.(png|jpe?g|webp|gif)/i) ||
            attachedMeta?.scenes?.find((s) => s.posterUrl || s.type === 'image')?.posterUrl ||
            attachedMeta?.scenes?.find((s) => s.type === 'image')?.mediaUrl ? (
              <img
                src={
                  attachedMeta.scenes.find((s) => s.posterUrl)?.posterUrl ||
                  attachedMeta.scenes.find((s) => s.type === 'image')?.mediaUrl ||
                  '/ccdesigner-logo.png'
                }
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <Clapperboard className="h-6 w-6 opacity-80" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold text-[var(--ss-ink)]">
              {attachedMeta?.title || 'Interactive lesson'}
            </div>
            <div className="text-[11px] text-[var(--ss-muted)]">
              {attachedMeta?.status === 'published' || attachedMeta?.isDemo
                ? 'Ready to play in class'
                : 'Not published yet'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="ilv-btn ilv-btn-primary text-xs" onClick={() => void playAttached()}>
              <Play className="h-3.5 w-3.5" />
              Play interactive lesson
            </button>
            <button type="button" className="ilv-btn ilv-btn-secondary text-xs" onClick={() => void copyPlayerLink()}>
              <Copy className="h-3.5 w-3.5" />
              Copy player link
            </button>
          </div>
        </div>
      )}

      {copyMsg && <p className="mt-2 text-[11px] text-[var(--ss-indigo)]">{copyMsg}</p>}

      {open && (
        <div className="mt-3 space-y-2 border-t border-[var(--ss-line)] pt-3">
          <p className="text-[11px] text-[var(--ss-muted)]">
            Choose a published interactive lesson, or paste a player link (
            <code className="text-[10px]">?play=&lt;id&gt;&amp;mode=player</code>).
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              className="ilv-input min-h-[36px] flex-1 text-xs"
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
              placeholder="Paste player URL or lesson id…"
            />
            <button
              type="button"
              className="ilv-btn ilv-btn-secondary text-xs"
              disabled={busy || !pasteUrl.trim()}
              onClick={() => void attachFromPaste()}
            >
              Attach link
            </button>
          </div>
          {items.length === 0 && (
            <p className="text-xs text-[var(--ss-muted)]">
              No interactive lessons available yet.
              {canEdit ? ' Create one from the Lesson Viewer tab.' : ''}
            </p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={busy}
              className="ilv-card flex w-full items-center justify-between gap-2 text-left hover:border-[var(--ss-indigo)]"
              onClick={() => void attach(item.id)}
            >
              <span>
                <span className="block text-xs font-bold">{item.title}</span>
                <span className="text-[11px] text-[var(--ss-muted)]">
                  {item.sceneCount} scenes · {item.status}
                </span>
              </span>
              <span className="ilv-chip">Attach</span>
            </button>
          ))}
          {attachedId && (
            <button
              type="button"
              className="ilv-btn ilv-btn-ghost w-full text-xs"
              onClick={async () => {
                const snip = buildPlayerEmbedSnippet(attachedId);
                try {
                  await navigator.clipboard.writeText(snip);
                  setCopyMsg('Embed code copied');
                } catch {
                  setCopyMsg(snip);
                }
              }}
            >
              Copy embed code
            </button>
          )}
        </div>
      )}

      {playing && (
        <InteractiveLessonPlayer
          lesson={playing}
          playerOnly
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}
