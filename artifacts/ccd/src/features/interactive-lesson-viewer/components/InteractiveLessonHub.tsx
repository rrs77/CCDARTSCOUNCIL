import React, { useCallback, useEffect, useState } from 'react';
import { Clapperboard, Lock, Play, Plus, Pencil, Eye } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCanEditInteractiveLessons } from '../hooks/useCanEditInteractiveLessons';
import {
  deleteInteractiveLesson,
  getInteractiveLesson,
  listInteractiveLessons,
  saveInteractiveLesson,
} from '../data/store';
import { buildDemoInteractiveLesson } from '../data/demoLesson';
import type { InteractiveLesson, InteractiveLessonSummary } from '../types';
import { createId, emptyScene } from '../types';
import { InteractiveLessonEditor } from './editor/InteractiveLessonEditor';
import { InteractiveLessonPlayer } from './player/InteractiveLessonPlayer';
import '../styles.css';

export function InteractiveLessonHub() {
  const { user, profile } = useAuth();
  const canEdit = useCanEditInteractiveLessons();
  const [items, setItems] = useState<InteractiveLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InteractiveLesson | null>(null);
  const [playing, setPlaying] = useState<InteractiveLesson | null>(null);
  const [error, setError] = useState('');

  const userId = user?.id || 'anonymous';

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listInteractiveLessons({ userId, canEdit });
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load interactive lessons');
    } finally {
      setLoading(false);
    }
  }, [userId, canEdit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createNew = async () => {
    if (!canEdit) return;
    const now = new Date().toISOString();
    const lesson: InteractiveLesson = {
      id: createId('ilv'),
      title: 'Untitled interactive lesson',
      description: '',
      ownerId: userId,
      ownerEmail: user?.email,
      status: 'draft',
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
      setError('Only admins and hub admins can open the Interactive Lesson editor.');
      return;
    }
    const lesson = await getInteractiveLesson(id);
    if (!lesson) {
      setError('Lesson not found');
      return;
    }
    // Demo is editable as a personal copy for admins
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
      setError('This interactive lesson is not published yet.');
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
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="ilv-title text-[26px] text-[var(--ss-ink)]">Lesson Viewer</h2>
          <p className="mt-1 text-[13px] text-[var(--ss-muted)]">
            Interactive classroom lessons with timeline scenes, karaoke lyrics, and embeds.
            {canEdit
              ? ' Signed in with editor rights — create, edit and publish.'
              : ' Play published lessons (attach them from any CCDesigner lesson).'}
          </p>
        </div>
        {canEdit ? (
          <button type="button" className="ilv-btn ilv-btn-primary" onClick={() => void createNew()}>
            <Plus className="h-4 w-4" />
            New interactive lesson
          </button>
        ) : (
          <span className="ilv-chip inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Player only · editor needs admin / hub admin
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-suntint)] px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--ss-muted)]">Loading…</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="ilv-card flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--ss-softindigo)] text-[var(--ss-indigo)]">
                  <Clapperboard className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xs font-bold text-[var(--ss-ink)]">{item.title}</h3>
                  <p className="line-clamp-2 text-[11px] text-[var(--ss-muted)]">{item.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`ilv-chip ${item.status === 'published' ? 'ilv-chip-mint' : 'ilv-chip-sun'}`}>
                  {item.status}
                </span>
                <span className="ilv-chip">{item.sceneCount} scenes</span>
                {item.isDemo && <span className="ilv-chip ilv-chip-sun">Demo</span>}
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ilv-btn ilv-btn-primary text-xs"
                  onClick={() => void openPlayer(item.id)}
                >
                  <Play className="h-3.5 w-3.5" />
                  Play
                </button>
                {canEdit && (
                  <button
                    type="button"
                    className="ilv-btn ilv-btn-secondary text-xs"
                    onClick={() => void openEditor(item.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
                {!canEdit && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ss-muted)]">
                    <Eye className="h-3.5 w-3.5" />
                    View only
                  </span>
                )}
                {canEdit && !item.isDemo && item.ownerId === userId && (
                  <button
                    type="button"
                    className="ilv-btn ilv-btn-ghost text-xs text-[var(--ss-muted)]"
                    onClick={() => {
                      if (confirm('Delete this interactive lesson?')) {
                        void deleteInteractiveLesson(item.id, userId).then(refresh);
                      }
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
          {canEdit && (
            <button type="button" className="ilv-empty-slot min-h-[120px]" onClick={() => void createNew()}>
              + Create interactive lesson
            </button>
          )}
        </div>
      )}

      {!canEdit && (
        <p className="mt-4 text-xs text-[var(--ss-muted)]">
          Signed in as {profile?.role || user?.role || 'user'}. Contact an admin if you need editor access.
        </p>
      )}

      {playing && (
        <InteractiveLessonPlayer lesson={playing} onClose={() => setPlaying(null)} />
      )}
    </div>
  );
}
