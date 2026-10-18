import React, { useEffect, useState } from 'react';
import { Clapperboard, Link2, Play, Unlink } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCanEditInteractiveLessons } from '../hooks/useCanEditInteractiveLessons';
import {
  attachInteractiveLessonToCcdLesson,
  getAttachedInteractiveLessonId,
  getInteractiveLesson,
  listInteractiveLessons,
} from '../data/store';
import type { InteractiveLesson, InteractiveLessonSummary } from '../types';
import { InteractiveLessonPlayer } from './player/InteractiveLessonPlayer';
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
  const [playing, setPlaying] = useState<InteractiveLesson | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    void listInteractiveLessons({
      userId: user?.id || 'anonymous',
      canEdit: true,
    }).then((list) => setItems(list.filter((i) => i.status === 'published' || canEdit)));
  }, [open, user?.id, canEdit]);

  const attach = async (id: string) => {
    if (!user?.id) return;
    setBusy(true);
    await attachInteractiveLessonToCcdLesson(id, sheet, lessonNumber, user.id);
    setAttachedId(id);
    onAttached?.(id);
    setBusy(false);
    setOpen(false);
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
    const lesson = await getInteractiveLesson(attachedId);
    if (lesson) setPlaying(lesson);
  };

  return (
    <div className="ilv-root rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-lilac)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4 text-[var(--ss-indigo)]" />
          <div>
            <div className="text-xs font-bold text-[var(--ss-ink)]">Interactive lesson</div>
            <div className="text-[11px] text-[var(--ss-muted)]">
              {attachedId ? 'Attached — open the classroom player' : 'None attached yet'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {attachedId && (
            <button type="button" className="ilv-btn ilv-btn-primary text-xs" onClick={() => void playAttached()}>
              <Play className="h-3.5 w-3.5" />
              Play
            </button>
          )}
          <button
            type="button"
            className="ilv-btn ilv-btn-secondary text-xs"
            onClick={() => setOpen((v) => !v)}
          >
            <Link2 className="h-3.5 w-3.5" />
            {attachedId ? 'Change' : 'Add interactive lesson'}
          </button>
          {attachedId && (
            <button type="button" className="ilv-btn ilv-btn-ghost text-xs" onClick={detach} title="Detach">
              <Unlink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-1.5 border-t border-[var(--ss-line)] pt-3">
          <p className="text-[11px] text-[var(--ss-muted)]">
            Choose a published interactive lesson{canEdit ? ' (or one of your drafts)' : ''}.
          </p>
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
        </div>
      )}

      {playing && <InteractiveLessonPlayer lesson={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
