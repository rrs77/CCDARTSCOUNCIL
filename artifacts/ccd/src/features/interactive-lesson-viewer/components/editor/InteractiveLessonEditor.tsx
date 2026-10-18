import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Undo2,
  Redo2,
  MousePointer2,
  Type,
  Image as ImageIcon,
  Square,
  Play,
  Share2,
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
  BRAND_TEXT_COLORS,
  SCENE_TYPE_COLORS,
  SCENE_TYPE_LABELS,
  TRANSITION_OPTIONS,
  createId,
  emptyScene,
  formatTimecode,
  lessonDurationMs,
} from '../../types';
import { SceneRenderer } from '../SceneRenderer';
import { LyricsPanel } from './LyricsPanel';
import { InteractiveLessonPlayer } from '../player/InteractiveLessonPlayer';
import { saveInteractiveLesson } from '../../data/store';

type RailPanel =
  | 'video'
  | 'audio'
  | 'image'
  | 'text'
  | 'lyrics'
  | 'canva'
  | 'powerpoint'
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
  { id: 'canva', label: 'Canva', icon: <Palette className="h-4 w-4" /> },
  { id: 'powerpoint', label: 'PPT', icon: <FileSpreadsheet className="h-4 w-4" /> },
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
  const [rail, setRail] = useState<RailPanel>('uploads');
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
      sc.overlays = [
        {
          id: createId('ov'),
          text: 'Add title',
          style: 'headline',
          x: 10,
          y: 36,
          width: 80,
          color: '#FFFFFF',
          fontSize: 48,
        },
      ];
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

  const addTextOverlay = (style: TextOverlay['style'] = 'headline') => {
    const ov: TextOverlay = {
      id: createId('ov'),
      text: style === 'headline' ? 'Add title' : style === 'subtitle' ? 'Add subtitle' : 'Add text',
      style,
      x: 12,
      y: 20 + (scene?.overlays.length || 0) * 12,
      width: 76,
      color: scene?.backgroundColor === '#1F1B4D' ? '#FFFFFF' : '#1F1B4D',
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
    const item: MediaLibraryItem = {
      id: createId('media'),
      name: url.split('/').pop() || 'Media',
      kind,
      url: url.trim(),
      addedAt: new Date().toISOString(),
    };
    const mediaLibrary = [...lesson.mediaLibrary, item];
    const patched = lesson.scenes.map((s, i) =>
      i === sceneIndex
        ? {
            ...s,
            type: kind,
            ...(isEmbed ? { embedUrl: url.trim() } : { mediaUrl: url.trim() }),
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

  const clipWidth = useMemo(() => 96 + timelineZoom * 40, [timelineZoom]);

  if (!scene) {
    return (
      <div className="ilv-root p-6">
        <p>No scenes yet.</p>
        <button type="button" className="ilv-btn ilv-btn-primary mt-3" onClick={() => addScene('title')}>
          Add title scene
        </button>
      </div>
    );
  }

  return (
    <div className="ilv-root">
      <div className="ilv-editor">
        {/* Header */}
        <header className="ilv-editor-header">
          <div className="min-w-0">
            <input
              className="ilv-input border-0 bg-transparent px-0 text-lg font-extrabold tracking-tight"
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
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="ilv-btn ilv-btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="ilv-btn ilv-btn-secondary" onClick={() => setShowPlayer(true)}>
              <Play className="h-4 w-4" />
              Play
            </button>
            <button
              type="button"
              className="ilv-btn ilv-btn-primary"
              disabled={saving}
              onClick={() => void publish(lesson.status === 'published' ? 'draft' : 'published')}
            >
              <Share2 className="h-4 w-4" />
              {lesson.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </header>

        <div className="ilv-editor-body relative">
          <div className="ilv-stage-wrap">
            {/* Compact top toolbar */}
            <div className="ilv-toolbar">
              <button type="button" className="ilv-tool-btn" title="Undo" onClick={undo} disabled={!past.length}>
                <Undo2 className="h-4 w-4" />
              </button>
              <button type="button" className="ilv-tool-btn" title="Redo" onClick={redo} disabled={!future.length}>
                <Redo2 className="h-4 w-4" />
              </button>
              <span className="mx-1 h-5 w-px bg-[var(--ss-line)]" />
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
              <span className="mx-1 h-5 w-px bg-[var(--ss-line)]" />
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
                  addTextOverlay('body');
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
              <button type="button" className="ilv-tool-btn" title="Shapes (background frame)" onClick={() => setTool('shapes')}>
                <Square className="h-4 w-4" />
              </button>
              <div className="ml-auto flex items-center gap-2">
                <input
                  className="ilv-input min-h-[32px] w-[140px] py-1 text-xs"
                  type="number"
                  min={1000}
                  step={500}
                  value={scene.durationMs}
                  onChange={(e) => updateScene({ durationMs: Math.max(1000, Number(e.target.value) || 1000) })}
                  title="Scene duration (ms)"
                />
                <span className="text-[10px] font-semibold uppercase text-[var(--ss-muted)]">ms</span>
              </div>
            </div>

            <div className="ilv-stage">
              <div className="ilv-stage-canvas" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
                <SceneRenderer
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
                />
              </div>
            </div>
          </div>

          {/* Right tool rail */}
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

          {/* Side panel */}
          {rail && (
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
                      Canva-style titles: add, drag to position, pick a preset and brand colour.
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
                          onChange={(e) =>
                            updateScene({
                              overlays: scene.overlays.map((o) =>
                                o.id === selectedOverlay.id ? { ...o, text: e.target.value } : o,
                              ),
                            })
                          }
                        />
                        <label className="ilv-label">Preset</label>
                        <select
                          className="ilv-select"
                          value={selectedOverlay.style}
                          onChange={(e) =>
                            updateScene({
                              overlays: scene.overlays.map((o) =>
                                o.id === selectedOverlay.id
                                  ? { ...o, style: e.target.value as TextOverlay['style'] }
                                  : o,
                              ),
                            })
                          }
                        >
                          <option value="headline">Headline</option>
                          <option value="subtitle">Subtitle</option>
                          <option value="body">Body</option>
                        </select>
                        <label className="ilv-label">Colour</label>
                        <div className="flex flex-wrap gap-2">
                          {BRAND_TEXT_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              title={c}
                              className="h-8 w-8 rounded-full border border-[var(--ss-line)]"
                              style={{ background: c }}
                              onClick={() =>
                                updateScene({
                                  overlays: scene.overlays.map((o) =>
                                    o.id === selectedOverlay.id ? { ...o, color: c } : o,
                                  ),
                                })
                              }
                            />
                          ))}
                        </div>
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
                      Per-slide transition into this scene. Preview with Play — respects prefers-reduced-motion.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
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
                  rail === 'embed' ||
                  rail === 'uploads') && (
                  <div className="space-y-3 p-3">
                    <p className="text-xs text-[var(--ss-muted)]">
                      {rail === 'canva' &&
                        'Paste a Canva share/embed link, or add an exported MP4 to the media library. Live embeds keep layout; MP4 locks motion.'}
                      {rail === 'powerpoint' &&
                        'Paste an Office Online embed URL, or upload a PPTX hosted where Office can reach it. Animations need Online or an MP4 export.'}
                      {rail === 'embed' && 'Generic placeholder for media types not finalised yet.'}
                      {(rail === 'video' || rail === 'audio' || rail === 'image' || rail === 'uploads') &&
                        'Add a URL (hosted elsewhere later is fine). Demo/local files work now.'}
                    </p>
                    <label className="ilv-label">Media / embed URL</label>
                    <input
                      className="ilv-input"
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      placeholder="https://…"
                    />
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
                      Apply to scene
                    </button>
                    <button
                      type="button"
                      className="ilv-btn ilv-btn-secondary w-full"
                      onClick={() => addScene((rail === 'uploads' ? 'video' : rail) as SceneType)}
                    >
                      <Plus className="h-4 w-4" />
                      New {rail === 'uploads' ? 'video' : rail} scene
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
        </div>

        {/* Bottom timeline */}
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
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <span className="text-xs font-bold tracking-widest">II</span>
                ) : (
                  <Play className="h-4 w-4 fill-white" />
                )}
              </button>
              <span className="tabular-nums text-sm font-semibold text-[var(--ss-ink)]">
                {formatTimecode(
                  lesson.scenes.slice(0, sceneIndex).reduce((s, sc) => s + sc.durationMs, 0) + sceneTimeMs,
                )}{' '}
                / {formatTimecode(totalMs)}
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
            {lesson.scenes.map((sc, i) => (
              <div
                key={sc.id}
                className={`ilv-scene-clip ${i === sceneIndex ? 'is-active' : ''}`}
                style={{ width: clipWidth }}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/ilv-scene-index', String(i))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData('text/ilv-scene-index'));
                  if (!Number.isNaN(from)) reorderScene(from, i);
                }}
                onClick={() => {
                  setSceneIndex(i);
                  setSceneTimeMs(0);
                  setPlaying(false);
                }}
              >
                <div className="ilv-scene-thumb">
                  {sc.type === 'image' && sc.mediaUrl ? (
                    <img src={sc.mediaUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    SCENE_TYPE_LABELS[sc.type]
                  )}
                </div>
                <div className="ilv-scene-typebar" style={{ background: SCENE_TYPE_COLORS[sc.type] }}>
                  {SCENE_TYPE_LABELS[sc.type]}
                </div>
              </div>
            ))}
            <button type="button" className="ilv-add-scene" title="Add scene" onClick={() => addScene('title')}>
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {showPlayer && (
        <InteractiveLessonPlayer
          lesson={lesson}
          startSceneIndex={sceneIndex}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
}
