import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clapperboard, Link2, Play, Search, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCanEditInteractiveLessons } from '../hooks/useCanEditInteractiveLessons';
import {
  getInteractiveLesson,
  getPublishedInteractiveLessonForPlayer,
  listSlidesLibrary,
} from '../data/store';
import type { InteractiveLesson, InteractiveLessonSummary, SlidesLibraryTab } from '../types';
import { LessonCoverPreview } from './LessonCoverPreview';
import { InteractiveLessonPlayer } from './player/InteractiveLessonPlayer';
import '../styles.css';

export interface SlidesLibraryPickerProps {
  open: boolean;
  onClose: () => void;
  /** When set, shows Attach on each card. */
  onAttach?: (id: string) => void | Promise<void>;
  /** Prefer attach of published (or editable) decks only. */
  attachMode?: boolean;
  title?: string;
}

function parsePasteId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const u = new URL(trimmed, window.location.origin);
    return u.searchParams.get('play') || trimmed.split('/').filter(Boolean).pop() || trimmed;
  } catch {
    return trimmed;
  }
}

export function SlidesLibraryPicker({
  open,
  onClose,
  onAttach,
  attachMode = true,
  title = 'Slides library',
}: SlidesLibraryPickerProps) {
  const { user } = useAuth();
  const canEdit = useCanEditInteractiveLessons();
  const userId = user?.id || 'anonymous';
  const [tab, setTab] = useState<SlidesLibraryTab>('mine');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<InteractiveLessonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [previewing, setPreviewing] = useState<InteractiveLesson | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void listSlidesLibrary({ userId, canEdit: true, tab, query })
      .then((list) => {
        if (cancelled) return;
        const visible = attachMode
          ? list.filter((i) => i.status === 'published' || canEdit || i.isDemo || i.source === 'hub')
          : list;
        setItems(visible);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId, canEdit, tab, query, attachMode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !previewing) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, previewing]);

  const countsLabel = useMemo(() => {
    if (loading) return 'Loading…';
    return `${items.length} deck${items.length === 1 ? '' : 's'}`;
  }, [items.length, loading]);

  if (!open) return null;

  const attach = async (id: string) => {
    if (!onAttach) return;
    setBusyId(id);
    setError('');
    try {
      await onAttach(id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not attach slides');
    } finally {
      setBusyId(null);
    }
  };

  const attachFromPaste = async () => {
    const id = parsePasteId(pasteUrl);
    if (!id) return;
    await attach(id);
  };

  const preview = async (id: string) => {
    const { lesson, reason } = await getPublishedInteractiveLessonForPlayer(id);
    if (lesson) {
      setPreviewing(lesson);
      return;
    }
    const draft = await getInteractiveLesson(id);
    if (draft && (canEdit || draft.ownerId === userId)) {
      setPreviewing(draft);
      return;
    }
    setError(
      reason === 'unpublished'
        ? 'Not published yet — publish before previewing as a player.'
        : 'Slides not found.',
    );
  };

  return createPortal(
    <div className="ilv-root ilv-slides-picker-root" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="ilv-slides-picker-backdrop" aria-label="Close" onClick={onClose} />
      <div className="ilv-slides-picker">
        <header className="ilv-slides-picker-header">
          <div className="min-w-0">
            <h2 className="ilv-slides-picker-title">{title}</h2>
            <p className="ilv-slides-picker-sub">
              Browse your decks or Partner Hub packs. Search by title, tags or subject.
            </p>
          </div>
          <button type="button" className="ilv-btn ilv-btn-ghost" aria-label="Close picker" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="ilv-slides-picker-toolbar">
          <div className="ilv-slides-picker-tabs" role="tablist">
            {(
              [
                { id: 'mine', label: 'My slides' },
                { id: 'hubs', label: 'From hubs' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`ilv-slides-picker-tab ${tab === t.id ? 'is-active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="ilv-slides-picker-search">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, tags, subject…"
              aria-label="Search slides"
            />
          </label>
          {attachMode && onAttach && (
            <button
              type="button"
              className="ilv-btn ilv-btn-secondary text-xs"
              onClick={() => setShowPaste((v) => !v)}
            >
              <Link2 className="h-3.5 w-3.5" />
              Paste link
            </button>
          )}
        </div>

        {showPaste && attachMode && onAttach && (
          <div className="ilv-slides-picker-paste">
            <input
              className="ilv-input text-xs"
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
              placeholder="Paste player URL (?play=<id>&mode=player) or slides id…"
            />
            <button
              type="button"
              className="ilv-btn ilv-btn-primary text-xs"
              disabled={!pasteUrl.trim() || !!busyId}
              onClick={() => void attachFromPaste()}
            >
              Attach link
            </button>
          </div>
        )}

        <div className="ilv-slides-picker-meta">{countsLabel}</div>
        {error && <p className="ilv-slides-picker-error">{error}</p>}

        <div className="ilv-slides-picker-grid">
          {loading &&
            [0, 1, 2, 3].map((i) => <div key={i} className="ilv-slides-picker-card is-skeleton" aria-hidden />)}
          {!loading && items.length === 0 && (
            <div className="ilv-slides-picker-empty">
              <Clapperboard className="h-8 w-8 text-[var(--ss-indigo)]" />
              <p>
                {tab === 'hubs'
                  ? 'No hub slides in your library yet. Add Partner Hub resources to unlock packs here.'
                  : 'No slides match your search.'}
              </p>
            </div>
          )}
          {!loading &&
            items.map((item) => (
              <article key={item.id} className="ilv-slides-picker-card">
                <button
                  type="button"
                  className="ilv-slides-picker-cover"
                  onClick={() => void preview(item.id)}
                  aria-label={`Preview ${item.title}`}
                >
                  <LessonCoverPreview cover={item.cover} sceneTypes={item.sceneTypes} />
                </button>
                <div className="ilv-slides-picker-body">
                  <h3 className="ilv-slides-picker-card-title">{item.title}</h3>
                  <p className="ilv-slides-picker-card-desc">
                    {item.hubName ? `${item.hubName} · ` : ''}
                    {item.sceneCount} scenes · {item.status}
                    {item.subject ? ` · ${item.subject}` : ''}
                  </p>
                  {(item.tags || []).length > 0 && (
                    <div className="ilv-slides-picker-tags">
                      {(item.tags || []).slice(0, 3).map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="ilv-slides-picker-actions">
                    <button
                      type="button"
                      className="ilv-btn ilv-btn-secondary text-xs flex-1"
                      onClick={() => void preview(item.id)}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    {attachMode && onAttach && (
                      <button
                        type="button"
                        className="ilv-btn ilv-btn-primary text-xs flex-1"
                        disabled={busyId === item.id}
                        onClick={() => void attach(item.id)}
                      >
                        Attach
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
        </div>
      </div>

      {previewing && (
        <InteractiveLessonPlayer
          lesson={previewing}
          playerOnly
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>,
    document.body,
  );
}
