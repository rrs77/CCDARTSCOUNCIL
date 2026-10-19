import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Clapperboard,
  Layers,
  Lock,
  Mic2,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Presentation,
  Trash2,
  Youtube,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCanEditInteractiveLessons } from '../hooks/useCanEditInteractiveLessons';
import {
  deleteInteractiveLesson,
  getInteractiveLesson,
  getPublishedInteractiveLessonForPlayer,
  listSlidesLibrary,
  saveInteractiveLesson,
} from '../data/store';
import { buildDemoInteractiveLesson } from '../data/demoLesson';
import type { InteractiveLesson, InteractiveLessonSummary, SlidesLibraryTab } from '../types';
import { createId, emptyScene } from '../types';
import { InteractiveLessonEditor } from './editor/InteractiveLessonEditor';
import { InteractiveLessonPlayer } from './player/InteractiveLessonPlayer';
import { LessonCoverPreview } from './LessonCoverPreview';
import { readPlayerLaunchFromLocation } from '../utils/playerLinks';
import '../styles.css';

function formatRelativeEdited(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Edited just now';
  if (mins < 60) return `Edited ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Edited ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `Edited ${days}d ago`;
  try {
    return `Edited ${new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  } catch {
    return '';
  }
}

const FEATURES = [
  { icon: <Layers className="h-4 w-4" />, label: 'Timeline scenes' },
  { icon: <Mic2 className="h-4 w-4" />, label: 'Lyric videos' },
  { icon: <Youtube className="h-4 w-4" />, label: 'YouTube & audio' },
  { icon: <Presentation className="h-4 w-4" />, label: 'Canva & PowerPoint' },
  { icon: <Clapperboard className="h-4 w-4" />, label: 'Full-screen present' },
];

function LessonCardMenu({
  canDelete,
  onDelete,
}: {
  canDelete: boolean;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!canDelete) return null;

  return (
    <div className="ilv-card-menu">
      <button
        ref={btnRef}
        type="button"
        className="ilv-card-menu-btn"
        aria-label="More actions"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div ref={menuRef} className="ilv-card-menu-pop" role="menu">
          <button
            type="button"
            role="menuitem"
            className="is-danger"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function InteractiveLessonHub() {
  const { user, profile } = useAuth();
  const canEdit = useCanEditInteractiveLessons();
  const [items, setItems] = useState<InteractiveLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InteractiveLesson | null>(null);
  const [playing, setPlaying] = useState<InteractiveLesson | null>(null);
  const [playerOnly, setPlayerOnly] = useState(false);
  const [unavailable, setUnavailable] = useState('');
  const [error, setError] = useState('');
  const [libraryTab, setLibraryTab] = useState<SlidesLibraryTab>('mine');
  const [libraryQuery, setLibraryQuery] = useState('');

  const userId = user?.id || 'anonymous';

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listSlidesLibrary({
        userId,
        canEdit,
        tab: libraryTab,
        query: libraryQuery,
      });
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load slides');
    } finally {
      setLoading(false);
    }
  }, [userId, canEdit, libraryTab, libraryQuery]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const [launchScene, setLaunchScene] = useState(0);

  // Deep-link: /?tab=lesson-viewer&play=<id>&mode=player&scene=N → classroom player only
  useEffect(() => {
    const { playId, playerOnly: only, sceneIndex } = readPlayerLaunchFromLocation();
    if (!playId) return;
    let cancelled = false;
    void (async () => {
      const { lesson, reason } = await getPublishedInteractiveLessonForPlayer(playId);
      if (cancelled) return;
      if (lesson) {
        setPlayerOnly(only);
        setLaunchScene(Math.max(0, Math.min(sceneIndex, lesson.scenes.length - 1)));
        setPlaying(lesson);
        setUnavailable('');
      } else if (reason === 'unpublished') {
        setUnavailable('These slides are not available yet. Ask the author to publish them.');
      } else {
        setUnavailable('Slides not found.');
      }
      try {
        const params = new URLSearchParams(window.location.search);
        params.delete('play');
        params.delete('mode');
        params.delete('scene');
        const qs = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname || '/'}${qs ? `?${qs}` : ''}`);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const createNew = async () => {
    if (!canEdit) return;
    const now = new Date().toISOString();
    const lesson: InteractiveLesson = {
      id: createId('ilv'),
      title: 'Untitled slides',
      description: '',
      ownerId: userId,
      ownerEmail: user?.email,
      status: 'draft',
      source: 'user',
      scenes: [emptyScene('title')],
      mediaLibrary: [],
      attachedLessonKeys: [],
      createdAt: now,
      updatedAt: now,
    };
    const saved = await saveInteractiveLesson(lesson);
    setEditing(saved);
    void refresh();
  };

  const openEditor = async (id: string) => {
    if (!canEdit) {
      setError('Only admins and hub admins can open the Slides editor.');
      return;
    }
    const lesson = await getInteractiveLesson(id);
    if (!lesson) {
      setError('Slides not found');
      return;
    }
    if (lesson.isDemo || lesson.ownerId !== userId) {
      const copy: InteractiveLesson = {
        ...structuredClone(lesson),
        id: createId('ilv'),
        title: `${lesson.title} (copy)`,
        ownerId: userId,
        ownerEmail: user?.email,
        status: 'draft',
        isDemo: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const saved = await saveInteractiveLesson(copy);
      setEditing(saved);
    } else {
      setEditing(lesson);
    }
  };

  const openPlayer = async (id: string) => {
    const lesson = (await getInteractiveLesson(id)) || buildDemoInteractiveLesson(userId);
    if (lesson.status !== 'published' && lesson.ownerId !== userId && !lesson.isDemo && !canEdit) {
      setError('These slides are not published yet.');
      return;
    }
    setPlaying(lesson);
  };

  if (editing) {
    return (
      <InteractiveLessonEditor
        lesson={editing}
        authToken={user?.token}
        onChange={setEditing}
        onClose={() => {
          setEditing(null);
          void refresh();
        }}
      />
    );
  }

  return (
    <div className="ilv-root ilv-hub">
      {unavailable && (
        <div className="mb-4 rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-suntint)] px-4 py-3 text-sm text-[var(--ss-ink)]">
          {unavailable}
        </div>
      )}

      <section className="ilv-hub-hero">
        <div className="ilv-hub-hero-copy">
          <h1 className="ilv-hub-hero-title">Slides that fill the room</h1>
          <p className="ilv-hub-hero-lede">
            Build timeline scenes with lyric videos and timed words, YouTube, audio, Canva and
            PowerPoint embeds — then present full-screen to the class. Attach a player-only link to
            any CCD lesson.
          </p>
          <div className="ilv-hub-hero-actions">
            {canEdit ? (
              <button type="button" className="ilv-btn ilv-btn-primary ilv-hub-cta" onClick={() => void createNew()}>
                <Plus className="h-4 w-4" />
                New slides
              </button>
            ) : (
              <span className="ilv-chip inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Player only · editor needs admin / hub admin
              </span>
            )}
          </div>
        </div>
        <ul className="ilv-hub-features" aria-label="What you can build">
          {FEATURES.map((f) => (
            <li key={f.label}>
              {f.icon}
              {f.label}
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <div className="mb-4 rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-suntint)] px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="ilv-hub-library-head">
        <h2 className="ilv-hub-library-title">Slides library</h2>
        <p className="ilv-hub-library-meta">
          {loading ? 'Loading…' : `${items.length} deck${items.length === 1 ? '' : 's'}`}
          {canEdit ? ' · create, edit and publish' : ' · play published slides'}
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="ilv-hub-library-tabs" role="tablist">
          {(
            [
              { id: 'mine' as const, label: 'My slides' },
              { id: 'hubs' as const, label: 'From hubs' },
            ]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={libraryTab === t.id}
              className={`ilv-slides-picker-tab ${libraryTab === t.id ? 'is-active' : ''}`}
              onClick={() => setLibraryTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="ilv-slides-picker-search max-w-sm flex-1">
          <span className="sr-only">Search slides</span>
          <input
            value={libraryQuery}
            onChange={(e) => setLibraryQuery(e.target.value)}
            placeholder="Search title, tags, subject…"
          />
        </label>
      </div>

      {loading ? (
        <div className="ilv-hub-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ilv-lesson-tile is-skeleton" aria-hidden />
          ))}
        </div>
      ) : (
        <div className="ilv-hub-grid">
          {items.map((item) => {
            const canDelete = canEdit && !item.isDemo && item.ownerId === userId;
            return (
              <article key={item.id} className="ilv-lesson-tile">
                <button
                  type="button"
                  className="ilv-lesson-tile-cover-btn"
                  onClick={() => void openPlayer(item.id)}
                  aria-label={`Play ${item.title}`}
                >
                  <LessonCoverPreview cover={item.cover} sceneTypes={item.sceneTypes} />
                  <span className="ilv-lesson-tile-play-overlay">
                    <Play className="h-6 w-6" fill="currentColor" />
                  </span>
                </button>

                <div className="ilv-lesson-tile-body">
                  <div className="ilv-lesson-tile-top">
                    <div className="min-w-0 flex-1">
                      <h3 className="ilv-lesson-tile-title">{item.title}</h3>
                      <p className="ilv-lesson-tile-desc">{item.description || 'No description yet.'}</p>
                    </div>
                    <LessonCardMenu
                      canDelete={canDelete}
                      onDelete={() => {
                        if (confirm('Delete these slides?')) {
                          void deleteInteractiveLesson(item.id, userId).then(refresh);
                        }
                      }}
                    />
                  </div>

                  <div className="ilv-lesson-tile-meta">
                    <span className={`ilv-chip ${item.status === 'published' ? 'ilv-chip-mint' : 'ilv-chip-sun'}`}>
                      {item.status}
                    </span>
                    <span className="ilv-chip">{item.sceneCount} scenes</span>
                    {item.isDemo && <span className="ilv-chip ilv-chip-sun">Demo</span>}
                    <span className="ilv-lesson-tile-edited">{formatRelativeEdited(item.updatedAt)}</span>
                  </div>

                  <div className="ilv-lesson-tile-actions">
                    <button
                      type="button"
                      className="ilv-btn ilv-btn-primary flex-1"
                      onClick={() => void openPlayer(item.id)}
                    >
                      <Play className="h-4 w-4" />
                      Play
                    </button>
                    {canEdit ? (
                      <button
                        type="button"
                        className="ilv-btn ilv-btn-secondary"
                        onClick={() => void openEditor(item.id)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 text-[12px] text-[var(--ss-muted)]">
                        <Eye className="h-3.5 w-3.5" />
                        View only
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {canEdit && libraryTab === 'mine' && (
            <button type="button" className="ilv-create-tile" onClick={() => void createNew()}>
              <span className="ilv-create-tile-icon">
                <Plus className="h-7 w-7" />
              </span>
              <span className="ilv-create-tile-title">Create new slides</span>
              <span className="ilv-create-tile-sub">
                Start with a title scene — add lyric videos, embeds and timeline as you go
              </span>
            </button>
          )}

          {!loading && items.length === 0 && (
            <div className="ilv-hub-empty">
              <Clapperboard className="h-8 w-8 text-[var(--ss-indigo)]" />
              <p>
                {libraryTab === 'hubs'
                  ? 'No hub slides in your library yet.'
                  : 'No slides here yet.'}
              </p>
              <p className="text-[var(--ss-muted)]">
                {libraryTab === 'hubs'
                  ? 'Add Partner Hub resources to unlock packs, or browse seeded hub demos.'
                  : canEdit
                    ? 'Create a deck or switch to From hubs.'
                    : 'Ask an admin to publish slides, or attach a player link from a CCD lesson.'}
              </p>
            </div>
          )}
        </div>
      )}

      {!canEdit && (
        <p className="mt-5 text-xs text-[var(--ss-muted)]">
          Signed in as {profile?.role || user?.role || 'user'}. Contact an admin if you need editor access.
        </p>
      )}

      {playing && (
        <InteractiveLessonPlayer
          lesson={playing}
          playerOnly={playerOnly}
          canEdit={canEdit}
          startSceneIndex={launchScene}
          onEdit={
            canEdit
              ? () => {
                  setPlaying(null);
                  setPlayerOnly(false);
                  setLaunchScene(0);
                  void openEditor(playing.id);
                }
              : undefined
          }
          onClose={() => {
            setPlaying(null);
            setPlayerOnly(false);
            setLaunchScene(0);
          }}
        />
      )}
    </div>
  );
}
