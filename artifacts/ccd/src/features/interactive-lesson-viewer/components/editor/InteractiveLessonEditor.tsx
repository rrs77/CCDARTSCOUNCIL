import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Undo2,
  Redo2,
  MousePointer2,
  Type,
  Image as ImageIcon,
  Square,
  Play,
  Pause,
  Share2,
  Copy,
  Plus,
  Video,
  Music,
  Mic2,
  Palette,
  FileSpreadsheet,
  Code2,
  Upload,
  Blend,
  ZoomIn,
  Trash2,
  ChevronDown,
  ArrowLeft,
  Presentation,
  Youtube,
} from 'lucide-react';
import type {
  InteractiveLesson,
  MediaLibraryItem,
  Scene,
  SceneType,
  TextOverlay,
  TransitionType,
} from '../../types';
import {
  TRANSITION_OPTIONS,
  createId,
  emptyScene,
  formatTimecode,
  lessonDurationMs,
} from '../../types';
import { SceneRenderer } from '../SceneRenderer';
import { LyricsPanel } from './LyricsPanel';
import { TextToolbar } from './TextToolbar';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { LyricsWaveformDock } from './LyricsWaveformDock';
import { InteractiveLessonPlayer } from '../player/InteractiveLessonPlayer';
import { saveInteractiveLesson } from '../../data/store';
import { SceneThumb } from './SceneThumb';
import { isCanvaUrl, normalizeCanvaEmbedUrl } from '../../utils/canvaEmbed';
import { buildPlayerEmbedSnippet, buildPlayerUrl } from '../../utils/playerLinks';
import { parseYouTubeUrl, isYouTubeUrl } from '../../utils/youtubeEmbed';
import { isGoogleSlidesUrl, normalizeGoogleSlidesEmbedUrl } from '../../utils/googleSlidesEmbed';
import type { AdvanceMode } from '../../types';
import { defaultAdvanceMode, resolveAdvanceMode } from '../../types';

type RailPanel =
  | 'video'
  | 'audio'
  | 'image'
  | 'text'
  | 'lyrics'
  | 'canva'
  | 'powerpoint'
  | 'youtube'
  | 'googleslides'
  | 'embed'
  | 'uploads'
  | 'transitions'
  | null;

type ToolMode = 'select' | 'text' | 'image' | 'shapes';

interface InteractiveLessonEditorProps {
  lesson: InteractiveLesson;
  onChange: (lesson: InteractiveLesson) => void;
  onClose: () => void;
  authToken?: string | null;
}

const RAIL: { id: RailPanel; label: string; icon: React.ReactNode }[] = [
  { id: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
  { id: 'audio', label: 'Audio', icon: <Music className="h-4 w-4" /> },
  { id: 'image', label: 'Image', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
  { id: 'lyrics', label: 'Lyrics', icon: <Mic2 className="h-4 w-4" /> },
  { id: 'youtube', label: 'YouTube', icon: <Youtube className="h-4 w-4" /> },
  { id: 'canva', label: 'Canva', icon: <Palette className="h-4 w-4" /> },
  { id: 'powerpoint', label: 'PPT', icon: <FileSpreadsheet className="h-4 w-4" /> },
  { id: 'googleslides', label: 'Slides', icon: <Presentation className="h-4 w-4" /> },
  { id: 'embed', label: 'Embed', icon: <Code2 className="h-4 w-4" /> },
  { id: 'uploads', label: 'Uploads', icon: <Upload className="h-4 w-4" /> },
  { id: 'transitions', label: 'Trans.', icon: <Blend className="h-4 w-4" /> },
];

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function InteractiveLessonEditor({
  lesson,
  onChange,
  onClose,
  authToken,
}: InteractiveLessonEditorProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [rail, setRail] = useState<RailPanel>(null);
  const [tool, setTool] = useState<ToolMode>('select');
  const [zoom, setZoom] = useState(1);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [past, setPast] = useState<InteractiveLesson[]>([]);
  const [future, setFuture] = useState<InteractiveLesson[]>([]);
  const [playing, setPlaying] = useState(false);
  const [sceneTimeMs, setSceneTimeMs] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [toast, setToast] = useState<{ message: string; undo?: boolean } | null>(null);
  const [publishMenu, setPublishMenu] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const scene = lesson.scenes[sceneIndex];
  const totalMs = lessonDurationMs(lesson);

  const pushHistory = useCallback(
    (next: InteractiveLesson) => {
      setPast((p) => [...p.slice(-39), deepClone(lesson)]);
      setFuture([]);
      onChange(next);
    },
    [lesson, onChange],
  );

  const updateScene = useCallback(
    (patch: Partial<Scene> | ((s: Scene) => Scene)) => {
      if (!scene) return;
      const nextScene = typeof patch === 'function' ? patch(scene) : { ...scene, ...patch };
      const scenes = lesson.scenes.map((s, i) => (i === sceneIndex ? nextScene : s));
      pushHistory({ ...lesson, scenes });
    },
    [lesson, scene, sceneIndex, pushHistory],
  );

  const undo = () => {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [deepClone(lesson), ...f]);
    onChange(prev);
  };

  const redo = () => {
    const nxt = future[0];
    if (!nxt) return;
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, deepClone(lesson)]);
    onChange(nxt);
  };

  useEffect(() => {
    if (!playing || !scene) return;
    const started = performance.now() - sceneTimeMs;
    let raf = 0;
    const tick = (now: number) => {
      const t = now - started;
      if (t >= scene.durationMs) {
        if (sceneIndex < lesson.scenes.length - 1) {
          setSceneIndex((i) => i + 1);
          setSceneTimeMs(0);
        } else {
          setSceneTimeMs(scene.durationMs);
          setPlaying(false);
        }
        return;
      }
      setSceneTimeMs(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sceneIndex, scene?.id]);

  const addScene = (type: SceneType) => {
    const sc = emptyScene(type);
    if (type === 'title') {
      // Empty title stage — faint helper text is shown until the teacher adds content.
      sc.overlays = [];
    }
    if (type === 'lyrics') {
      sc.lyrics = [];
      sc.notes = 'Add audio/video, then Tap to sync or auto-transcribe lyrics.';
    }
    if (type === 'canva') {
      sc.notes =
        'Canva: use a share/embed link for live layout, or export MP4 for guaranteed motion (animations flattened into video).';
    }
    if (type === 'powerpoint') {
      sc.notes =
        'PowerPoint: Office Online embed keeps slide advances when the file URL is public; uploaded PPTX needs Office Online or MP4 export for animations.';
    }
    const scenes = [...lesson.scenes, sc];
    pushHistory({ ...lesson, scenes });
    setSceneIndex(scenes.length - 1);
    setRail(
      type === 'lyrics'
        ? 'lyrics'
        : type === 'canva' || type === 'powerpoint' || type === 'embed'
          ? (type as RailPanel)
          : type === 'title' || type === 'text'
            ? 'text'
            : (type as RailPanel),
    );
  };

  const reorderScene = (from: number, to: number) => {
    if (to < 0 || to >= lesson.scenes.length || from === to) return;
    const scenes = [...lesson.scenes];
    const [moved] = scenes.splice(from, 1);
    scenes.splice(to, 0, moved);
    pushHistory({ ...lesson, scenes });
    setSceneIndex(to);
  };

  const deleteSceneAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= lesson.scenes.length) return;
      const scenes = lesson.scenes.filter((_, i) => i !== index);
      pushHistory({ ...lesson, scenes });
      if (scenes.length === 0) {
        setSceneIndex(0);
      } else if (index >= scenes.length) {
        setSceneIndex(scenes.length - 1);
      } else {
        setSceneIndex(index);
      }
      setSceneTimeMs(0);
      setPlaying(false);
      setSelectedOverlayId(null);
      setToast({ message: 'Scene deleted', undo: true });
    },
    [lesson, pushHistory],
  );

  const duplicateSceneAt = useCallback(
    (index: number) => {
      const src = lesson.scenes[index];
      if (!src) return;
      const copy = deepClone(src);
      copy.id = createId('scene');
      copy.title = `${src.title} copy`;
      const scenes = [...lesson.scenes];
      scenes.splice(index + 1, 0, copy);
      pushHistory({ ...lesson, scenes });
      setSceneIndex(index + 1);
      setSceneTimeMs(0);
      setPlaying(false);
    },
    [lesson, pushHistory],
  );

  const addTextOverlay = (style: TextOverlay['style'] = 'headline') => {
    const ov: TextOverlay = {
      id: createId('ov'),
      text: style === 'headline' ? 'Lesson title' : style === 'subtitle' ? 'Subtitle' : 'Body text',
      style,
      x: 8,
      y: style === 'headline' ? 34 : style === 'subtitle' ? 52 : 20 + (scene?.overlays.length || 0) * 10,
      width: 84,
      color: scene?.backgroundColor === '#1F1B4D' ? '#FFFFFF' : '#1F1B4D',
      fontSize: style === 'headline' ? 36 : style === 'subtitle' ? 22 : 18,
    };
    updateScene({ overlays: [...(scene?.overlays || []), ov] });
    setSelectedOverlayId(ov.id);
    setTool('text');
  };

  const applyMediaUrl = (url: string, type?: SceneType) => {
    if (!url.trim()) return;
    const kind: SceneType = type || scene?.type || 'video';
    const isEmbed =
      kind === 'youtube' ||
      kind === 'vimeo' ||
      kind === 'canva' ||
      kind === 'powerpoint' ||
      kind === 'embed';
    let finalUrl = url.trim();
    let resolvedKind: SceneType = kind === 'canva' || isCanvaUrl(finalUrl) ? 'canva' : kind;
    let posterUrl: string | undefined;
    let youtubeStartSec: number | undefined;
    let youtubeEndSec: number | undefined;
    if (resolvedKind === 'canva' || isCanvaUrl(finalUrl)) {
      finalUrl = normalizeCanvaEmbedUrl(finalUrl);
      resolvedKind = 'canva';
    } else if (resolvedKind === 'youtube' || isYouTubeUrl(finalUrl) || (rail === 'video' && isYouTubeUrl(finalUrl))) {
      const yt = parseYouTubeUrl(finalUrl);
      if (yt) {
        finalUrl = yt.embedUrl;
        posterUrl = yt.thumbUrl;
        youtubeStartSec = yt.startSec;
        youtubeEndSec = yt.endSec;
        resolvedKind = 'youtube';
      }
    } else if (resolvedKind === 'googleslides' || isGoogleSlidesUrl(finalUrl)) {
      finalUrl = normalizeGoogleSlidesEmbedUrl(finalUrl);
      resolvedKind = 'googleslides';
    }
    const itemKind = resolvedKind;
    const item: MediaLibraryItem = {
      id: createId('media'),
      name: finalUrl.split('/').pop() || 'Media',
      kind: itemKind,
      url: finalUrl,
      thumbUrl: posterUrl,
      addedAt: new Date().toISOString(),
    };
    const mediaLibrary = [...lesson.mediaLibrary, item];
    const isEmbedType =
      itemKind === 'youtube' ||
      itemKind === 'vimeo' ||
      itemKind === 'canva' ||
      itemKind === 'powerpoint' ||
      itemKind === 'googleslides' ||
      itemKind === 'embed';
    const patched: Scene[] = lesson.scenes.map((s, i) =>
      i === sceneIndex
        ? {
            ...s,
            type: itemKind,
            advanceMode: s.advanceMode || defaultAdvanceMode(itemKind),
            ...(posterUrl ? { posterUrl } : {}),
            ...(youtubeStartSec != null ? { youtubeStartSec } : {}),
            ...(youtubeEndSec != null ? { youtubeEndSec } : {}),
            ...(isEmbedType ? { embedUrl: finalUrl } : { mediaUrl: finalUrl }),
          }
        : s,
    );
    pushHistory({ ...lesson, mediaLibrary, scenes: patched });
    setUrlDraft('');
  };

  const publish = async (status: 'draft' | 'published') => {
    setSaving(true);
    const next = await saveInteractiveLesson({ ...lesson, status });
    onChange(next);
    setSaving(false);
    setSaveMsg(status === 'published' ? 'Published — available to teachers in lessons.' : 'Saved as draft.');
  };

  const selectedOverlay = scene?.overlays.find((o) => o.id === selectedOverlayId);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedOverlayId && scene) {
          e.preventDefault();
          updateScene({ overlays: scene.overlays.filter((o) => o.id !== selectedOverlayId) });
          setSelectedOverlayId(null);
          return;
        }
        if (!lesson.scenes.length) return;
        e.preventDefault();
        deleteSceneAt(sceneIndex);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteSceneAt, lesson.scenes.length, scene, sceneIndex, selectedOverlayId, updateScene]);

  const clipWidth = useMemo(() => 96 + timelineZoom * 40, [timelineZoom]);

  const elapsedMs =
    lesson.scenes.slice(0, sceneIndex).reduce((s, sc) => s + sc.durationMs, 0) + sceneTimeMs;

  const seekLessonMs = (ms: number) => {
    let remaining = Math.max(0, Math.min(ms, totalMs));
    for (let i = 0; i < lesson.scenes.length; i++) {
      const dur = lesson.scenes[i].durationMs;
      if (remaining <= dur || i === lesson.scenes.length - 1) {
        setSceneIndex(i);
        setSceneTimeMs(Math.min(remaining, dur));
        return;
      }
      remaining -= dur;
    }
  };

  const transitionClass = (type: string) => {
    switch (type) {
      case 'fade':
        return 'ilv-tr-fade-enter';
      case 'slide':
        return 'ilv-tr-slide-enter';
      case 'zoom':
        return 'ilv-tr-zoom-enter';
      case 'dissolve':
        return 'ilv-tr-dissolve-enter';
      case 'wipe-left':
        return 'ilv-tr-wipe-left-enter';
      case 'wipe-right':
        return 'ilv-tr-wipe-right-enter';
      case 'push-up':
        return 'ilv-tr-push-up-enter';
      case 'push-down':
        return 'ilv-tr-push-down-enter';
      case 'blur':
        return 'ilv-tr-blur-enter';
      case 'bounce':
        return 'ilv-tr-bounce-enter';
      case 'flip':
        return 'ilv-tr-flip-enter';
      default:
        return '';
    }
  };

  const patchOverlay = (id: string, patch: Partial<TextOverlay>) => {
    if (!scene) return;
    updateScene({
      overlays: scene.overlays.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  };


  // Portal to body — dashboard TabsContent uses transform, which would trap position:fixed.
  return createPortal(
    <div className="ilv-root ilv-editor" role="dialog" aria-modal="true" aria-label="Interactive lesson editor">
      <header className="ilv-editor-header">
        <div className="ilv-editor-header-left">
          <button type="button" className="ilv-btn ilv-btn-secondary" onClick={onClose} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="min-w-0 flex-1">
            <input
              className="ilv-input border-0 bg-transparent px-0 text-base font-extrabold tracking-tight"
              value={lesson.title}
              onChange={(e) => pushHistory({ ...lesson, title: e.target.value })}
              aria-label="Lesson title"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className={`ilv-chip ${lesson.status === 'published' ? 'ilv-chip-mint' : 'ilv-chip-sun'}`}>
                {lesson.status === 'published' ? 'Published' : 'Draft'}
              </span>
              <span className="text-xs text-[var(--ss-muted)]">{lesson.scenes.length} scenes</span>
              {saveMsg && <span className="text-xs text-[var(--ss-indigo)]">{saveMsg}</span>}
            </div>
          </div>
        </div>
        <div className="ilv-editor-header-right">
          <button type="button" className="ilv-tool-btn" title="Undo" onClick={undo} disabled={!past.length}>
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" className="ilv-tool-btn" title="Redo" onClick={redo} disabled={!future.length}>
            <Redo2 className="h-4 w-4" />
          </button>
          <label className="flex items-center gap-1 text-xs text-[var(--ss-muted)]">
            <ZoomIn className="h-3.5 w-3.5" />
            <select
              className="ilv-select min-h-[32px] w-[88px] py-1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            >
              <option value={0.75}>75%</option>
              <option value={1}>Fit</option>
              <option value={1.25}>125%</option>
              <option value={1.5}>150%</option>
            </select>
          </label>
          <button type="button" className="ilv-btn ilv-btn-secondary" onClick={() => setShowPlayer(true)}>
            <Play className="h-4 w-4" />
            Play
          </button>
          <div className="relative">
            <button
              type="button"
              className="ilv-btn ilv-btn-primary"
              disabled={saving}
              onClick={() => setPublishMenu((v) => !v)}
            >
              <Share2 className="h-4 w-4" />
              Publish
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {publishMenu && (
              <div className="ilv-clip-menu" style={{ top: '110%', right: 0, left: 'auto' }}>
                <button
                  type="button"
                  role="menuitem"
                  disabled={saving}
                  onClick={() => {
                    setPublishMenu(false);
                    void publish(lesson.status === 'published' ? 'draft' : 'published');
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {lesson.status === 'published' ? 'Unpublish' : 'Publish for teachers'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setPublishMenu(false);
                    const url = buildPlayerUrl(lesson.id);
                    try {
                      await navigator.clipboard.writeText(url);
                      setSaveMsg('Player link copied');
                    } catch {
                      setSaveMsg(url);
                    }
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy player link
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setPublishMenu(false);
                    const snip = buildPlayerEmbedSnippet(lesson.id);
                    try {
                      await navigator.clipboard.writeText(snip);
                      setSaveMsg('Embed code copied');
                    } catch {
                      setSaveMsg(snip);
                    }
                  }}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Copy embed code
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`ilv-editor-body ${rail ? 'has-panel' : ''}`}>
        <div className="ilv-stage-wrap">
          <div className="ilv-toolbar">
            <button
              type="button"
              className={`ilv-tool-btn ${tool === 'select' ? 'is-active' : ''}`}
              title="Select"
              onClick={() => setTool('select')}
            >
              <MousePointer2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`ilv-tool-btn ${tool === 'text' ? 'is-active' : ''}`}
              title="Add text"
              onClick={() => {
                setTool('text');
                setRail('text');
                addTextOverlay('headline');
              }}
            >
              <Type className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`ilv-tool-btn ${tool === 'image' ? 'is-active' : ''}`}
              title="Add image"
              onClick={() => {
                setTool('image');
                setRail('image');
                addScene('image');
              }}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button type="button" className="ilv-tool-btn" title="Shapes" onClick={() => setTool('shapes')}>
              <Square className="h-4 w-4" />
            </button>
            {scene && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 text-[10px] font-semibold uppercase text-[var(--ss-muted)]">
                  Advance
                  <select
                    className="ilv-select min-h-[32px] w-[150px] py-1 normal-case"
                    value={resolveAdvanceMode(scene)}
                    onChange={(e) => {
                      const mode = e.target.value as AdvanceMode;
                      updateScene({
                        advanceMode: mode,
                        advanceAfterMs:
                          mode === 'timer' ? scene.advanceAfterMs || scene.durationMs || 5000 : scene.advanceAfterMs,
                        durationMs: mode === 'manual' ? 0 : scene.durationMs || 5000,
                      });
                    }}
                  >
                    <option value="manual">Manual (Next)</option>
                    <option value="timer">After X seconds</option>
                    <option value="media-end">When media ends</option>
                  </select>
                </label>
                {resolveAdvanceMode(scene) === 'timer' && (
                  <>
                    <input
                      className="ilv-input min-h-[32px] w-[88px] py-1 text-xs"
                      type="number"
                      min={1}
                      step={1}
                      value={Math.round((scene.advanceAfterMs ?? scene.durationMs ?? 5000) / 1000)}
                      onChange={(e) => {
                        const sec = Math.max(1, Number(e.target.value) || 1);
                        updateScene({ advanceAfterMs: sec * 1000, durationMs: sec * 1000 });
                      }}
                      title="Advance after seconds"
                    />
                    <span className="text-[10px] font-semibold uppercase text-[var(--ss-muted)]">sec</span>
                  </>
                )}
                {resolveAdvanceMode(scene) === 'media-end' && (
                  <>
                    <input
                      className="ilv-input min-h-[32px] w-[100px] py-1 text-xs"
                      type="number"
                      min={1000}
                      step={500}
                      value={scene.durationMs || 5000}
                      onChange={(e) => updateScene({ durationMs: Math.max(1000, Number(e.target.value) || 1000) })}
                      title="Fallback duration (ms)"
                    />
                    <span className="text-[10px] font-semibold uppercase text-[var(--ss-muted)]">ms</span>
                  </>
                )}
              </div>
            )}
          </div>
          {selectedOverlay && (
            <TextToolbar overlay={selectedOverlay} onChange={(patch) => patchOverlay(selectedOverlay.id, patch)} />
          )}

          <div className="ilv-stage">
            <div
              className="ilv-stage-canvas"
              style={{ ['--ilv-zoom' as string]: String(zoom) }}
            >
              {scene ? (
                <SceneRenderer
                  key={`${scene.id}-${playing ? 'p' : 's'}-${sceneIndex}`}
                  scene={scene}
                  timeMs={sceneTimeMs}
                  playing={playing}
                  showLyrics
                  interactive
                  selectedOverlayId={selectedOverlayId}
                  onSelectOverlay={setSelectedOverlayId}
                  onMoveOverlay={(id, x, y) => {
                    updateScene({
                      overlays: scene.overlays.map((o) => (o.id === id ? { ...o, x, y } : o)),
                    });
                  }}
                  transitionClass={transitionClass(scene.transition.type)}
                />
              ) : (
                <div className="ilv-stage-empty">
                  <p className="ilv-stage-empty-title">No scenes yet</p>
                  <p className="ilv-stage-empty-sub">Add a scene to start building this lesson.</p>
                  <button type="button" className="ilv-btn ilv-btn-primary" onClick={() => addScene('title')}>
                    <Plus className="h-4 w-4" />
                    Add scene
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {rail && scene && (
          <div className="ilv-panel">
            <div className="flex items-center justify-between border-b border-[var(--ss-line)] px-3 py-2">
              <strong className="text-sm font-extrabold tracking-tight">
                {RAIL.find((r) => r.id === rail)?.label}
              </strong>
              <button type="button" className="ilv-tool-btn" onClick={() => setRail(null)} aria-label="Close panel">
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {rail === 'text' && (
                <div className="space-y-3 p-3">
                  <p className="text-xs text-[var(--ss-muted)]">
                    Add titles and body copy, then drag them on the stage. Use the Canva-style toolbar above the stage for fonts, colour, and animations.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="ilv-btn ilv-btn-primary text-xs" onClick={() => addTextOverlay('headline')}>
                      Add title
                    </button>
                    <button type="button" className="ilv-btn ilv-btn-secondary text-xs" onClick={() => addTextOverlay('subtitle')}>
                      Add subtitle
                    </button>
                    <button type="button" className="ilv-btn ilv-btn-secondary text-xs" onClick={() => addTextOverlay('body')}>
                      Add text
                    </button>
                  </div>
                  {selectedOverlay && (
                    <div className="space-y-2 rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-lilac)] p-2.5">
                      <label className="ilv-label">Selected text</label>
                      <textarea
                        className="ilv-textarea min-h-[64px]"
                        value={selectedOverlay.text}
                        onChange={(e) => patchOverlay(selectedOverlay.id, { text: e.target.value })}
                      />
                      <label className="ilv-label">Preset</label>
                      <select
                        className="ilv-select"
                        value={selectedOverlay.style}
                        onChange={(e) =>
                          patchOverlay(selectedOverlay.id, {
                            style: e.target.value as TextOverlay['style'],
                          })
                        }
                      >
                        <option value="headline">Headline</option>
                        <option value="subtitle">Subtitle</option>
                        <option value="body">Body</option>
                      </select>
                      <ColorSwatchPicker
                        label="Colour"
                        value={selectedOverlay.color}
                        onChange={(color) => patchOverlay(selectedOverlay.id, { color })}
                      />
                      <button
                        type="button"
                        className="ilv-btn ilv-btn-secondary w-full text-xs"
                        onClick={() => {
                          updateScene({
                            overlays: scene.overlays.filter((o) => o.id !== selectedOverlay.id),
                          });
                          setSelectedOverlayId(null);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove text
                      </button>
                    </div>
                  )}
                </div>
              )}

              {rail === 'lyrics' && (
                <LyricsPanel
                  scene={scene}
                  sceneTimeMs={sceneTimeMs}
                  playing={playing}
                  authToken={authToken}
                  onChange={(lyrics) => updateScene({ lyrics, type: 'lyrics' })}
                  onChangeDisplay={(lyricsDisplay) => updateScene({ lyricsDisplay, type: 'lyrics' })}
                  onSeek={(ms) => {
                    setSceneTimeMs(ms);
                    setPlaying(false);
                  }}
                  onTogglePlay={() => setPlaying((p) => !p)}
                />
              )}

              {rail === 'transitions' && (
                <div className="space-y-3 p-3">
                  <p className="text-xs text-[var(--ss-muted)]">
                    Per-slide transition into this scene. Preview with the timeline play button.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TRANSITION_OPTIONS.map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        className={`ilv-btn text-xs ${
                          scene.transition.type === opt.type ? 'ilv-btn-primary' : 'ilv-btn-secondary'
                        }`}
                        onClick={() =>
                          updateScene({
                            transition: { ...scene.transition, type: opt.type as TransitionType },
                          })
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <label className="ilv-label">Duration (ms)</label>
                  <input
                    className="ilv-input"
                    type="number"
                    min={0}
                    max={3000}
                    step={50}
                    value={scene.transition.durationMs}
                    onChange={(e) =>
                      updateScene({
                        transition: {
                          ...scene.transition,
                          durationMs: Math.max(0, Number(e.target.value) || 0),
                        },
                      })
                    }
                  />
                  <button
                    type="button"
                    className="ilv-btn ilv-btn-secondary w-full"
                    onClick={() => {
                      setSceneTimeMs(0);
                      setPlaying(true);
                    }}
                  >
                    Preview transition
                  </button>
                </div>
              )}

              {(rail === 'video' ||
                rail === 'audio' ||
                rail === 'image' ||
                rail === 'canva' ||
                rail === 'powerpoint' ||
                rail === 'youtube' ||
                rail === 'googleslides' ||
                rail === 'embed' ||
                rail === 'uploads') && (
                <div className="space-y-3 p-3">
                  <p className="text-xs text-[var(--ss-muted)]">
                    {rail === 'canva' &&
                      'Use a Canva Embed link so it can play in class. Share → More → Embed, then paste below. Or export MP4 and add as video.'}
                    {rail === 'powerpoint' &&
                      'Paste an Office Online embed URL, or upload a PPTX hosted where Office can reach it.'}
                    {rail === 'youtube' &&
                      'Paste any YouTube watch, share, Shorts, or embed URL. Optional start/end times from the link (?t= / &start= / &end=) are kept.'}
                    {rail === 'googleslides' &&
                      'Paste a Google Slides share or edit link (Anyone with the link). We convert it to the classroom embed URL.'}
                    {rail === 'embed' && 'Paste any allow-listed embed URL.'}
                    {(rail === 'video' || rail === 'audio' || rail === 'image' || rail === 'uploads') &&
                      'Add a media URL. YouTube links pasted into Video are auto-detected. Demo and local files work now.'}
                  </p>
                  <label className="ilv-label">
                    {rail === 'youtube'
                      ? 'YouTube URL'
                      : rail === 'googleslides'
                        ? 'Google Slides URL'
                        : 'Media / embed URL'}
                  </label>
                  <input
                    className="ilv-input"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    placeholder={
                      rail === 'canva'
                        ? 'https://www.canva.com/design/…/…/view?embed'
                        : rail === 'youtube'
                          ? 'https://www.youtube.com/watch?v=…'
                          : rail === 'googleslides'
                            ? 'https://docs.google.com/presentation/d/…/edit'
                            : 'https://…'
                    }
                  />
                  {rail === 'canva' && (
                    <p className="text-[11px] leading-snug text-[var(--ss-muted)]">
                      Edit or view links are blocked in iframes. Only the Embed URL (
                      <code className="text-[10px]">/view?embed</code>) works. Short links (canva.link) must be
                      opened and replaced with the full embed URL.
                    </p>
                  )}
                  {rail === 'youtube' && scene.type === 'youtube' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="ilv-label">Start (sec)</label>
                        <input
                          className="ilv-input"
                          type="number"
                          min={0}
                          value={scene.youtubeStartSec ?? 0}
                          onChange={(e) =>
                            updateScene({ youtubeStartSec: Math.max(0, Number(e.target.value) || 0) })
                          }
                        />
                      </div>
                      <div>
                        <label className="ilv-label">End (sec)</label>
                        <input
                          className="ilv-input"
                          type="number"
                          min={0}
                          value={scene.youtubeEndSec ?? ''}
                          placeholder="optional"
                          onChange={(e) => {
                            const v = e.target.value;
                            updateScene({
                              youtubeEndSec: v === '' ? undefined : Math.max(0, Number(v) || 0),
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {rail === 'googleslides' && (
                    <p className="text-[11px] leading-snug text-[var(--ss-muted)]">
                      Share the deck as <strong>Anyone with the link can view</strong>, or use File → Share → Publish to
                      the web. Advance stays Manual so teachers click through slides in class.
                    </p>
                  )}
                  <button
                    type="button"
                    className="ilv-btn ilv-btn-primary w-full"
                    onClick={() => {
                      const typeMap: Record<string, SceneType> = {
                        video: 'video',
                        audio: 'audio',
                        image: 'image',
                        canva: 'canva',
                        powerpoint: 'powerpoint',
                        youtube: 'youtube',
                        googleslides: 'googleslides',
                        embed: 'embed',
                        uploads: scene.type,
                      };
                      const t = typeMap[rail || 'video'];
                      if (scene.type !== t && rail !== 'uploads') {
                        addScene(t);
                      }
                      applyMediaUrl(urlDraft, t);
                    }}
                  >
                    {rail === 'youtube'
                      ? 'Import YouTube'
                      : rail === 'googleslides'
                        ? 'Import Slides'
                        : 'Apply to scene'}
                  </button>
                  <button
                    type="button"
                    className="ilv-btn ilv-btn-secondary w-full"
                    onClick={() =>
                      addScene(
                        (rail === 'uploads'
                          ? 'video'
                          : rail === 'youtube'
                            ? 'youtube'
                            : rail === 'googleslides'
                              ? 'googleslides'
                              : rail) as SceneType,
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                    New{' '}
                    {rail === 'uploads'
                      ? 'video'
                      : rail === 'youtube'
                        ? 'YouTube'
                        : rail === 'googleslides'
                          ? 'Slides'
                          : rail}{' '}
                    scene
                  </button>
                  {scene.notes && (
                    <p className="rounded-[12px] border border-[var(--ss-line)] bg-[var(--ss-lilac)] p-2 text-xs text-[var(--ss-muted)]">
                      {scene.notes}
                    </p>
                  )}
                  <div>
                    <label className="ilv-label">Media library</label>
                    <div className="space-y-1.5">
                      {lesson.mediaLibrary.length === 0 && (
                        <button type="button" className="ilv-empty-slot w-full" disabled>
                          + Add media via URL above
                        </button>
                      )}
                      {lesson.mediaLibrary.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="ilv-card w-full text-left text-xs hover:border-[var(--ss-indigo)]"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/ilv-media', JSON.stringify(m));
                          }}
                          onClick={() => applyMediaUrl(m.url, m.kind === 'upload' ? undefined : (m.kind as SceneType))}
                        >
                          <div className="font-bold">{m.name}</div>
                          <div className="truncate text-[var(--ss-muted)]">{m.url}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <aside className="ilv-rail" aria-label="Content tools">
          {RAIL.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ilv-rail-btn ${rail === item.id ? 'is-active' : ''}`}
              onClick={() => setRail((r) => (r === item.id ? null : item.id))}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>
      </div>

      <div className="ilv-timeline">
        <div className="ilv-timeline-controls">
          <button
            type="button"
            className="ilv-btn ilv-btn-secondary text-xs"
            onClick={() => setRail((r) => (r === 'transitions' ? null : 'transitions'))}
          >
            Transitions
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="ilv-play-btn"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Pause preview' : 'Play preview'}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
            </button>
            <span className="tabular-nums text-sm font-semibold text-[var(--ss-ink)]">
              {formatTimecode(elapsedMs)} / {formatTimecode(totalMs)}
            </span>
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--ss-muted)]">
            Zoom
            <input
              type="range"
              min={0.6}
              max={2}
              step={0.1}
              value={timelineZoom}
              onChange={(e) => setTimelineZoom(Number(e.target.value))}
            />
          </label>
        </div>

        <div
          className="ilv-scene-track"
          onDragOver={(e) => e.preventDefault()}
          onClick={(e) => {
            const track = e.currentTarget;
            if ((e.target as HTMLElement).closest('.ilv-scene-clip, .ilv-add-scene')) return;
            const rect = track.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left + track.scrollLeft) / Math.max(track.scrollWidth, 1)));
            seekLessonMs(ratio * totalMs);
            setPlaying(false);
          }}
          onDrop={(e) => {
            const raw = e.dataTransfer.getData('application/ilv-media');
            if (!raw) return;
            try {
              const m = JSON.parse(raw) as MediaLibraryItem;
              applyMediaUrl(m.url, m.kind === 'upload' ? undefined : (m.kind as SceneType));
            } catch {
              /* ignore */
            }
          }}
        >
          <div
            className="ilv-playhead"
            style={{
              left: totalMs > 0 ? `${(elapsedMs / totalMs) * 100}%` : 0,
            }}
          />
          {lesson.scenes.length === 0 ? (
            <button type="button" className="ilv-empty-timeline" onClick={() => addScene('title')}>
              <Plus className="h-5 w-5" />
              Add scene
            </button>
          ) : (
            lesson.scenes.map((sc, i) => (
              <SceneThumb
                key={sc.id}
                scene={sc}
                index={i}
                active={i === sceneIndex}
                width={clipWidth}
                canMoveLeft={i > 0}
                canMoveRight={i < lesson.scenes.length - 1}
                onSelect={() => {
                  setSceneIndex(i);
                  setSceneTimeMs(0);
                  setPlaying(false);
                }}
                onReorder={reorderScene}
                onDelete={() => deleteSceneAt(i)}
                onDuplicate={() => duplicateSceneAt(i)}
                onMoveLeft={() => reorderScene(i, i - 1)}
                onMoveRight={() => reorderScene(i, i + 1)}
              />
            ))
          )}
          {lesson.scenes.length > 0 && (
            <button type="button" className="ilv-add-scene" title="Add scene" onClick={() => addScene('title')}>
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>

        {scene && (scene.type === 'lyrics' || (scene.lyrics && scene.lyrics.length > 0)) && (
          <LyricsWaveformDock
            scene={scene}
            sceneTimeMs={sceneTimeMs}
            onSeek={(ms) => {
              setSceneTimeMs(ms);
              setPlaying(false);
            }}
            onChangeLyrics={(lyrics) => updateScene({ lyrics, type: 'lyrics' })}
          />
        )}
      </div>

      {toast && (
        <div className="ilv-toast" role="status">
          <span>{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              className="ilv-toast-undo"
              onClick={() => {
                undo();
                setToast(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}

      {showPlayer && (
        <InteractiveLessonPlayer
          lesson={lesson}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>,
    document.body,
  );
}
