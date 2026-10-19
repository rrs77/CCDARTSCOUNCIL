import React, { useEffect, useState } from 'react';
import { Clapperboard, Copy, Play, Plus, Unlink } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  attachInteractiveLessonToCcdLesson,
  getAttachedInteractiveLessonId,
  getInteractiveLesson,
  getPublishedInteractiveLessonForPlayer,
} from '../data/store';
import type { InteractiveLesson } from '../types';
import { InteractiveLessonPlayer } from './player/InteractiveLessonPlayer';
import { LessonCoverPreview } from './LessonCoverPreview';
import { SlidesLibraryPicker } from './SlidesLibraryPicker';
import { buildPlayerEmbedSnippet, buildPlayerUrl } from '../utils/playerLinks';
import { toSummary } from './slidesSummary';
import '../styles.css';

interface AttachInteractiveLessonProps {
  sheet: string;
  lessonNumber: string;
  /** Optional: persist id onto LessonData via parent */
  onAttached?: (interactiveLessonId: string | null) => void;
  existingId?: string | null;
  /** Compact side-rail card (lesson details). Default true. */
  compact?: boolean;
}

export function AttachInteractiveLesson({
  sheet,
  lessonNumber,
  onAttached,
  existingId,
  compact = true,
}: AttachInteractiveLessonProps) {
  const { user } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [attachedId, setAttachedId] = useState<string | null>(
    existingId || getAttachedInteractiveLessonId(sheet, lessonNumber),
  );
  const [attachedMeta, setAttachedMeta] = useState<InteractiveLesson | null>(null);
  const [playing, setPlaying] = useState<InteractiveLesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');

  useEffect(() => {
    setAttachedId(existingId || getAttachedInteractiveLessonId(sheet, lessonNumber));
  }, [existingId, sheet, lessonNumber]);

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
    setPickerOpen(false);
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
      setCopyMsg('Not available yet — publish the slides first.');
    } else {
      setCopyMsg('Slides not found.');
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

  const summary = attachedMeta ? toSummary(attachedMeta) : null;

  return (
    <div className={`ilv-root ${compact ? 'ilv-slides-attach' : 'ilv-slides-attach is-wide'}`}>
      <div className="ilv-slides-attach-head">
        <Clapperboard className="h-4 w-4 text-[var(--ss-indigo)]" />
        <span className="ilv-slides-attach-label">Slides</span>
      </div>

      {!attachedId ? (
        <button
          type="button"
          className="ilv-slides-attach-empty"
          disabled={busy}
          onClick={() => setPickerOpen(true)}
        >
          <span className="ilv-slides-attach-empty-icon">
            <Plus className="h-5 w-5" />
          </span>
          <span className="ilv-slides-attach-empty-title">Add slides</span>
          <span className="ilv-slides-attach-empty-sub">
            Attach a deck from your library or Partner Hubs
          </span>
        </button>
      ) : (
        <div className="ilv-slides-attach-card">
          <button
            type="button"
            className="ilv-slides-attach-thumb"
            onClick={() => void playAttached()}
            aria-label="Play slides"
          >
            <LessonCoverPreview
              cover={summary?.cover}
              sceneTypes={summary?.sceneTypes}
            />
            <span className="ilv-slides-attach-play">
              <Play className="h-4 w-4" fill="currentColor" />
            </span>
          </button>
          <div className="ilv-slides-attach-meta">
            <div className="ilv-slides-attach-title">
              {attachedMeta?.title || 'Slides'}
            </div>
            <div className="ilv-slides-attach-status">
              {attachedMeta?.status === 'published' || attachedMeta?.isDemo || attachedMeta?.source === 'hub'
                ? 'Ready to play in class'
                : 'Not published yet'}
              {attachedMeta ? ` · ${attachedMeta.scenes.length} scenes` : ''}
            </div>
            <div className="ilv-slides-attach-actions">
              <button
                type="button"
                className="ilv-btn ilv-btn-primary text-xs"
                onClick={() => void playAttached()}
              >
                <Play className="h-3.5 w-3.5" />
                Play
              </button>
              <button
                type="button"
                className="ilv-btn ilv-btn-secondary text-xs"
                onClick={() => setPickerOpen(true)}
              >
                Change
              </button>
              <button
                type="button"
                className="ilv-btn ilv-btn-ghost text-xs"
                onClick={() => void copyPlayerLink()}
                title="Copy player-only link"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="ilv-btn ilv-btn-ghost text-xs"
                onClick={detach}
                title="Detach slides"
              >
                <Unlink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {copyMsg && <p className="mt-2 text-[11px] text-[var(--ss-indigo)]">{copyMsg}</p>}

      {attachedId && (
        <button
          type="button"
          className="mt-2 text-[11px] font-semibold text-[var(--ss-muted)] hover:text-[var(--ss-indigo)]"
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

      <SlidesLibraryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAttach={(id) => attach(id)}
        title="Add slides"
      />

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
