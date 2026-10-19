import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Sparkles,
  FlipHorizontal,
  FlipVertical,
  SkipBack,
} from 'lucide-react';
import type {
  InteractiveLesson,
  KaraokeTracks,
  MediaAttribution,
  MediaLibraryItem,
  Scene,
  SceneTransition,
  SceneType,
  StageObject,
  TextOverlay,
  TransitionType,
} from '../../types';
import {
  TRANSITION_OPTIONS,
  createId,
  emptyScene,
  formatTimecode,
  lessonDurationMs,
  sceneClockMs,
} from '../../types';
import { SceneRenderer } from '../SceneRenderer';
import { LyricsPanel } from './LyricsPanel';
import { LyricsStudio } from './LyricsStudio';
import { LyricsLane } from './LyricsLane';
import { TextToolbar } from './TextToolbar';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { MediaLibraryList } from './MediaLibraryList';
import { AudioTracks } from './AudioTracks';
import { InsertImageMenu } from './InsertImageMenu';
import { InsertShapeMenu } from './InsertShapeMenu';
import { TransitionMarker } from './TransitionMarker';
import { FreeMediaPanel, FREE_MEDIA_MIME } from './FreeMediaPanel';
import { SceneBackgroundPanel } from './SceneBackgroundPanel';
import { InteractiveLessonPlayer } from '../player/InteractiveLessonPlayer';
import { saveInteractiveLesson } from '../../data/store';
import { SceneThumb } from './SceneThumb';
import { isCanvaUrl, normalizeCanvaEmbedUrl } from '../../utils/canvaEmbed';
import { buildPlayerEmbedSnippet, buildPlayerUrl } from '../../utils/playerLinks';
import { parseYouTubeUrl, isYouTubeUrl } from '../../utils/youtubeEmbed';
import { isGoogleSlidesUrl, normalizeGoogleSlidesEmbedUrl } from '../../utils/googleSlidesEmbed';
import type { AdvanceMode } from '../../types';
import { defaultAdvanceMode, resolveAdvanceMode } from '../../types';
import { absoluteLayoutMs, useLessonAudioMixer } from '../../hooks/useLessonAudioMixer';
import { sceneLayoutMs, sceneLayoutOffsets } from '../../utils/timelineAudio';
import {
  normaliseCloudLink,
  sceneTypeToCloudKind,
  isCloudShareUrl,
} from '../../utils/cloudLinks';
import {
  contrastTextColor,
  defaultOverlayWidth,
  defaultOverlayPosition,
} from '../../utils/textContrast';
import {
  uploadInteractiveLessonMedia,
  ILV_FILE_ACCEPT,
  isFileDrag,
  filesFromDrop,
  uploadKindToSceneType,
  detectUploadKind,
  type UploadProgress,
} from '../../utils/mediaUpload';
import type { FreeMediaItem } from '../../utils/freeMedia';

const TIMELINE_H_KEY = 'ccd-ilv-timeline-height-v1';
const TIMELINE_H_DEFAULT = 220;
const TIMELINE_H_MIN = 140;
const TIMELINE_H_MAX = 520;

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
  | 'freemedia'
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
  { id: 'lyrics', label: 'Lyric video', icon: <Mic2 className="h-4 w-4" /> },
  { id: 'youtube', label: 'YouTube', icon: <Youtube className="h-4 w-4" /> },
  { id: 'canva', label: 'Canva', icon: <Palette className="h-4 w-4" /> },
  { id: 'powerpoint', label: 'PPT', icon: <FileSpreadsheet className="h-4 w-4" /> },
  { id: 'googleslides', label: 'Slides', icon: <Presentation className="h-4 w-4" /> },
  { id: 'embed', label: 'Embed', icon: <Code2 className="h-4 w-4" /> },
  { id: 'uploads', label: 'Uploads', icon: <Upload className="h-4 w-4" /> },
  { id: 'freemedia', label: 'Free media', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'transitions', label: 'Transitions', icon: <Blend className="h-4 w-4" /> },
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
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [lyricsStudioOpen, setLyricsStudioOpen] = useState(false);
  const [lyricsStudioFocusLineId, setLyricsStudioFocusLineId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [localOnlyWarn, setLocalOnlyWarn] = useState<string | null>(null);
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
  const imageBtnRef = useRef<HTMLButtonElement>(null);
  const shapeBtnRef = useRef<HTMLButtonElement>(null);
  const stageCanvasRef = useRef<HTMLDivElement>(null);
  const [timelineHeight, setTimelineHeight] = useState(() => {
    try {
      const n = Number(localStorage.getItem(TIMELINE_H_KEY));
      if (Number.isFinite(n) && n >= TIMELINE_H_MIN && n <= TIMELINE_H_MAX) return n;
    } catch {
      /* ignore */
    }
    return TIMELINE_H_DEFAULT;
  });

  const persistTimelineHeight = (h: number) => {
    const clamped = Math.max(TIMELINE_H_MIN, Math.min(TIMELINE_H_MAX, h));
    setTimelineHeight(clamped);
    try {
      localStorage.setItem(TIMELINE_H_KEY, String(clamped));
    } catch {
      /* ignore */
    }
  };

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

  useEffect(() => {
    if (!localOnlyWarn) return;
    const t = window.setTimeout(() => setLocalOnlyWarn(null), 6000);
    return () => window.clearTimeout(t);
  }, [localOnlyWarn]);

  const scene = lesson.scenes[sceneIndex];
  const totalMs = lessonDurationMs(lesson);

  // Keep playhead / scene-local time inside the current lesson bounds when scenes change.
  useEffect(() => {
    if (lesson.scenes.length === 0) {
      if (sceneIndex !== 0) setSceneIndex(0);
      if (sceneTimeMs !== 0) setSceneTimeMs(0);
      return;
    }
    if (sceneIndex >= lesson.scenes.length) {
      setSceneIndex(lesson.scenes.length - 1);
      setSceneTimeMs(0);
      return;
    }
    const sc = lesson.scenes[sceneIndex];
    const maxLocal = Math.max(0, sc.durationMs || 0);
    if (sceneTimeMs > maxLocal) setSceneTimeMs(maxLocal);
  }, [lesson.scenes, sceneIndex, sceneTimeMs]);

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
      const maxLocal = Math.max(0, nextScene.durationMs || 0);
      if (sceneTimeMs > maxLocal) setSceneTimeMs(maxLocal);
      pushHistory({ ...lesson, scenes });
    },
    [lesson, scene, sceneIndex, pushHistory, sceneTimeMs],
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
      setSelectedObjectId(null);
      setEditingOverlayId(null);
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
    const count = scene?.overlays.length || 0;
    const pos = defaultOverlayPosition(style, count);
    const ov: TextOverlay = {
      id: createId('ov'),
      text: style === 'headline' ? 'Add title' : style === 'subtitle' ? 'Add subtitle' : 'Add text',
      style,
      x: pos.x,
      y: pos.y,
      width: defaultOverlayWidth(style),
      color: contrastTextColor(scene?.backgroundColor),
      fontSize: style === 'headline' ? 36 : style === 'subtitle' ? 22 : 18,
    };
    updateScene({ overlays: [...(scene?.overlays || []), ov] });
    setSelectedOverlayId(ov.id);
    setSelectedObjectId(null);
    setEditingOverlayId(ov.id);
    setTool('text');
  };

  const insertStageObject = useCallback(
    (obj: StageObject) => {
      if (!scene) return;
      updateScene({ objects: [...(scene.objects || []), obj] });
      setSelectedObjectId(obj.id);
      setSelectedOverlayId(null);
      setEditingOverlayId(null);
      setTool('select');
    },
    [scene, updateScene],
  );

  const insertStageImage = useCallback(
    (
      url: string,
      meta?: {
        name?: string;
        sourceUrl?: string;
        cloudProvider?: string;
        attribution?: MediaAttribution;
        x?: number;
        y?: number;
      },
    ) => {
      if (!scene) return;
      const obj: StageObject = {
        id: createId('obj'),
        kind: 'image',
        mediaUrl: url,
        x: meta?.x != null ? meta.x : 18 + ((scene.objects?.length || 0) % 4) * 6,
        y: meta?.y != null ? meta.y : 16 + ((scene.objects?.length || 0) % 3) * 8,
        width: 36,
        height: 32,
        opacity: 1,
        zIndex: 5 + (scene.objects?.length || 0),
        attribution: meta?.attribution || (meta?.sourceUrl
          ? { sourceUrl: meta.sourceUrl, provider: meta.cloudProvider, title: meta.name }
          : undefined),
      };
      const item: MediaLibraryItem = {
        id: createId('media'),
        name: meta?.name || url.split('/').pop() || 'Image',
        kind: 'image',
        url,
        thumbUrl: url,
        addedAt: new Date().toISOString(),
        cloudProvider: meta?.cloudProvider,
        sourceUrl: meta?.sourceUrl,
        attribution: meta?.attribution,
      };
      const scenes = lesson.scenes.map((s, i) =>
        i === sceneIndex ? { ...s, objects: [...(s.objects || []), obj] } : s,
      );
      pushHistory({ ...lesson, scenes, mediaLibrary: [...lesson.mediaLibrary, item] });
      setSelectedObjectId(obj.id);
      setSelectedOverlayId(null);
      setEditingOverlayId(null);
      setTool('select');
      setImageMenuOpen(false);
    },
    [lesson, pushHistory, scene, sceneIndex],
  );

  const handleUploadedFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      for (const file of files) {
        setUploadProgress({ loaded: 0, total: file.size, percent: 0 });
        try {
          const result = await uploadInteractiveLessonMedia(file, {
            userId: lesson.ownerId || 'anonymous',
            lessonId: lesson.id,
            onProgress: setUploadProgress,
          });
          if (result.localOnly && result.warning) {
            setLocalOnlyWarn(result.warning);
            setToast({ message: result.warning });
          }
          const sceneType = uploadKindToSceneType(result.kind);
          const item: MediaLibraryItem = {
            id: createId('media'),
            name: result.name,
            kind: result.kind === 'upload' ? 'upload' : sceneType,
            url: result.url,
            thumbUrl: result.kind === 'image' ? result.url : undefined,
            addedAt: new Date().toISOString(),
          };
          if (result.kind === 'image') {
            insertStageImage(result.url, { name: result.name });
            // insertStageImage already adds library item — skip duplicate
            continue;
          }
          let nextLesson: InteractiveLesson = {
            ...lesson,
            mediaLibrary: [...lesson.mediaLibrary, item],
          };
          if (result.kind === 'audio') {
            setToast({ message: `Added “${result.name}” to media library (drag to audio lane)` });
            setRail('audio');
          } else if (result.kind === 'video' || result.kind === 'powerpoint') {
            const patched = nextLesson.scenes.map((s, i) =>
              i === sceneIndex
                ? {
                    ...s,
                    type: sceneType,
                    advanceMode: s.advanceMode || defaultAdvanceMode(sceneType),
                    ...(result.kind === 'powerpoint'
                      ? { embedUrl: result.url }
                      : { mediaUrl: result.url }),
                  }
                : s,
            );
            nextLesson = { ...nextLesson, scenes: patched };
            setToast({ message: `Applied “${result.name}” to scene` });
          } else {
            setToast({ message: `Added “${result.name}” to library` });
          }
          pushHistory(nextLesson);
        } catch (err) {
          setToast({
            message: err instanceof Error ? err.message : 'Upload failed',
          });
        } finally {
          setUploadProgress(null);
        }
      }
    },
    [insertStageImage, lesson, pushHistory, sceneIndex],
  );

  const applyMediaUrl = (url: string, type?: SceneType) => {
    if (!url.trim()) return;
    const kind: SceneType = type || scene?.type || 'video';
    let finalUrl = url.trim();
    let resolvedKind: SceneType = kind === 'canva' || isCanvaUrl(finalUrl) ? 'canva' : kind;
    let posterUrl: string | undefined;
    let youtubeStartSec: number | undefined;
    let youtubeEndSec: number | undefined;
    let cloudProvider: string | undefined;
    let sourceUrl: string | undefined;
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
    } else {
      const cloud = normaliseCloudLink(finalUrl, sceneTypeToCloudKind(resolvedKind));
      sourceUrl = cloud.sourceUrl;
      cloudProvider = cloud.provider !== 'generic' || isCloudShareUrl(finalUrl) ? cloud.provider : undefined;
      finalUrl = cloud.preferEmbed && cloud.embedUrl ? cloud.embedUrl : cloud.streamUrl || finalUrl;
      if (cloud.shareHint && (cloud.fallback || cloud.preferEmbed)) {
        setToast({ message: cloud.shareHint });
      }
    }
    const itemKind = resolvedKind;
    const item: MediaLibraryItem = {
      id: createId('media'),
      name: (sourceUrl || finalUrl).split('/').pop() || 'Media',
      kind: itemKind,
      url: finalUrl,
      thumbUrl: posterUrl,
      addedAt: new Date().toISOString(),
      ...(cloudProvider ? { cloudProvider } : {}),
      ...(sourceUrl ? { sourceUrl } : {}),
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
  const selectedObject = scene?.objects?.find((o) => o.id === selectedObjectId) || null;
  const stageSelectionId = selectedObjectId || selectedOverlayId;

  const patchObject = (id: string, patch: Partial<StageObject>) => {
    if (!scene) return;
    updateScene({
      objects: (scene.objects || []).map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  };

  const openLyricsStudio = (lineId?: string) => {
    setLyricsStudioFocusLineId(lineId || null);
    setLyricsStudioOpen(true);
    setRail('lyrics');
  };

  const onFileDragOver = (e: React.DragEvent) => {
    const types = Array.from(e.dataTransfer?.types || []);
    if (
      isFileDrag(e) ||
      types.includes(FREE_MEDIA_MIME) ||
      types.includes('application/ilv-media') ||
      types.includes('application/ilv-audio')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const onFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Free media / library drag onto stage — place image at drop point
    const freeRaw =
      e.dataTransfer.getData(FREE_MEDIA_MIME) || e.dataTransfer.getData('application/ilv-media');
    if (freeRaw && stageCanvasRef.current) {
      try {
        const parsed = JSON.parse(freeRaw) as FreeMediaItem & {
          url?: string;
          title?: string;
          name?: string;
          mediaType?: string;
          kind?: string;
        };
        const url = parsed.url;
        const isAudio =
          parsed.mediaType === 'audio' || parsed.kind === 'audio' || /\.(mp3|wav|m4a|ogg)(\?|$)/i.test(url || '');
        if (url && isAudio) {
          // Prefer Music lane under timeline — create clip at current scene start
          const { starts } = sceneLayoutOffsets(lesson.scenes);
          const startMs = starts[sceneIndex] || 0;
          const libItem: MediaLibraryItem = {
            id: createId('media'),
            name: parsed.title || parsed.name || 'Sound',
            kind: 'audio',
            url,
            thumbUrl: parsed.thumbUrl,
            addedAt: new Date().toISOString(),
            sourceUrl: parsed.sourceUrl,
            attribution: parsed.creator
              ? {
                  title: parsed.title || parsed.name,
                  creator: parsed.creator,
                  license: parsed.license,
                  sourceUrl: parsed.sourceUrl,
                  provider: parsed.provider,
                }
              : undefined,
          };
          pushHistory({
            ...lesson,
            mediaLibrary: [...lesson.mediaLibrary, libItem],
            audioClips: [
              ...(lesson.audioClips || []),
              {
                id: createId('clip'),
                lane: 'music',
                name: libItem.name,
                mediaUrl: url,
                mediaId: libItem.id,
                startMs,
                durationMs: 8000,
                fadeInMs: 400,
                fadeOutMs: 600,
                volume: 0.85,
                loop: true,
              },
            ],
          });
          setToast({ message: `Added “${libItem.name}” to Music lane` });
          return;
        }
        if (url) {
          const rect = stageCanvasRef.current.getBoundingClientRect();
          const xPct = Math.max(0, Math.min(70, ((e.clientX - rect.left) / rect.width) * 100 - 18));
          const yPct = Math.max(0, Math.min(70, ((e.clientY - rect.top) / rect.height) * 100 - 16));
          insertStageImage(url, {
            name: parsed.title || parsed.name || 'Image',
            sourceUrl: parsed.sourceUrl,
            cloudProvider: parsed.provider,
            attribution: parsed.creator
              ? {
                  title: parsed.title || parsed.name,
                  creator: parsed.creator,
                  license: parsed.license,
                  sourceUrl: parsed.sourceUrl,
                  provider: parsed.provider,
                }
              : undefined,
            x: xPct,
            y: yPct,
          });
          return;
        }
      } catch {
        /* fall through to files */
      }
    }

    if (!isFileDrag(e)) return;
    const files = filesFromDrop(e);
    if (files.length) void handleUploadedFiles(files);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.code === 'Space' && e.shiftKey) {
        e.preventDefault();
        setPlaying(true);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId && scene) {
          e.preventDefault();
          updateScene({ objects: (scene.objects || []).filter((o) => o.id !== selectedObjectId) });
          setSelectedObjectId(null);
          return;
        }
        if (selectedOverlayId && scene) {
          e.preventDefault();
          updateScene({ overlays: scene.overlays.filter((o) => o.id !== selectedOverlayId) });
          setSelectedOverlayId(null);
          setEditingOverlayId(null);
          return;
        }
        if (!lesson.scenes.length) return;
        e.preventDefault();
        deleteSceneAt(sceneIndex);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    deleteSceneAt,
    lesson.scenes.length,
    scene,
    sceneIndex,
    selectedObjectId,
    selectedOverlayId,
    updateScene,
  ]);

  const clipWidth = useMemo(() => 96 + timelineZoom * 40, [timelineZoom]);
  const layoutTotal = useMemo(() => sceneLayoutOffsets(lesson.scenes).total, [lesson.scenes]);
  const pxPerMs = useMemo(() => {
    const trackPx = Math.max(480, lesson.scenes.length * clipWidth + 80);
    return trackPx / Math.max(1, layoutTotal);
  }, [clipWidth, layoutTotal, lesson.scenes.length]);

  // Playback clock (matches lessonDurationMs) — do not sum raw durationMs (manual scenes are 0).
  const elapsedMs = useMemo(() => {
    const before = lesson.scenes
      .slice(0, sceneIndex)
      .reduce((s, sc) => s + sceneClockMs(sc), 0);
    const clock = scene ? sceneClockMs(scene) : 0;
    return before + Math.min(Math.max(0, sceneTimeMs), clock);
  }, [lesson.scenes, scene, sceneIndex, sceneTimeMs]);
  const displayElapsedMs = Math.min(elapsedMs, Math.max(0, totalMs));
  // Layout clock for audio track + playhead alignment on the scene strip.
  const clampedLocalMs = Math.min(
    Math.max(0, sceneTimeMs),
    scene ? Math.max(0, scene.durationMs || 0) : 0,
  );
  const absoluteMs = Math.min(
    absoluteLayoutMs(lesson, sceneIndex, clampedLocalMs),
    Math.max(0, layoutTotal),
  );
  useLessonAudioMixer(lesson, absoluteMs, playing, sceneIndex);

  const renameMedia = (id: string, name: string) => {
    pushHistory({
      ...lesson,
      mediaLibrary: lesson.mediaLibrary.map((m) => (m.id === id ? { ...m, name } : m)),
    });
  };

  const replaceMediaUrl = (id: string, url: string) => {
    const prev = lesson.mediaLibrary.find((m) => m.id === id);
    if (!prev) return;
    pushHistory({
      ...lesson,
      mediaLibrary: lesson.mediaLibrary.map((m) => (m.id === id ? { ...m, url } : m)),
      scenes: lesson.scenes.map((s) => ({
        ...s,
        mediaUrl: s.mediaUrl === prev.url ? url : s.mediaUrl,
        embedUrl: s.embedUrl === prev.url ? url : s.embedUrl,
      })),
      audioClips: (lesson.audioClips || []).map((c) =>
        c.mediaId === id || c.mediaUrl === prev.url ? { ...c, mediaUrl: url } : c,
      ),
    });
  };

  const deleteMedia = (id: string, alsoRemoveFromUses: boolean) => {
    const item = lesson.mediaLibrary.find((m) => m.id === id);
    if (!item) return;
    const snapshot = deepClone(lesson);
    let scenes = lesson.scenes;
    let audioClips = lesson.audioClips || [];
    if (alsoRemoveFromUses) {
      scenes = scenes.map((s) => ({
        ...s,
        mediaUrl: s.mediaUrl === item.url ? undefined : s.mediaUrl,
        embedUrl: s.embedUrl === item.url ? undefined : s.embedUrl,
      }));
      audioClips = audioClips.filter((c) => c.mediaId !== id && c.mediaUrl !== item.url);
    }
    pushHistory({
      ...lesson,
      mediaLibrary: lesson.mediaLibrary.filter((m) => m.id !== id),
      scenes,
      audioClips,
    });
    setToast({
      message: alsoRemoveFromUses ? `Deleted “${item.name}” and cleared uses` : `Deleted “${item.name}” from library`,
      undo: true,
    });
    // Stash snapshot for undo via past already — also allow toast undo to restore
    (window as unknown as { __ilvMediaUndo?: InteractiveLesson }).__ilvMediaUndo = snapshot;
  };

  const seekLessonMs = (ms: number) => {
    if (lesson.scenes.length === 0) {
      setSceneIndex(0);
      setSceneTimeMs(0);
      return;
    }
    const { starts, total } = sceneLayoutOffsets(lesson.scenes);
    const clamped = Math.max(0, Math.min(ms, total));
    for (let i = 0; i < lesson.scenes.length; i++) {
      const start = starts[i] || 0;
      const dur = sceneLayoutMs(lesson.scenes[i]);
      const end = start + dur;
      if (clamped < end || i === lesson.scenes.length - 1) {
        const local = Math.max(0, clamped - start);
        const maxLocal = Math.max(0, lesson.scenes[i].durationMs || 0);
        setSceneIndex(i);
        setSceneTimeMs(Math.min(local, maxLocal || local));
        return;
      }
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
    <div className="ilv-root ilv-editor" role="dialog" aria-modal="true" aria-label="Slides editor">
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
          <button
            type="button"
            className="ilv-tool-btn"
            title="Undo"
            aria-label="Undo"
            onClick={undo}
            disabled={!past.length}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="ilv-tool-btn"
            title="Redo"
            aria-label="Redo"
            onClick={redo}
            disabled={!future.length}
          >
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
          <button
            type="button"
            className="ilv-btn ilv-btn-secondary"
            title="Open classroom player from current scene"
            aria-label="Open classroom player from current scene"
            onClick={() => setShowPlayer(true)}
          >
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
              aria-label="Select"
              onClick={() => setTool('select')}
            >
              <MousePointer2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`ilv-tool-btn ${tool === 'text' ? 'is-active' : ''}`}
              title="Add text"
              aria-label="Add text"
              onClick={() => {
                setTool('text');
                setRail('text');
                addTextOverlay('headline');
              }}
            >
              <Type className="h-4 w-4" />
            </button>
            <button
              ref={imageBtnRef}
              type="button"
              className={`ilv-tool-btn ${tool === 'image' || imageMenuOpen ? 'is-active' : ''}`}
              title="Insert image"
              aria-label="Insert image"
              aria-expanded={imageMenuOpen}
              onClick={() => {
                setTool('image');
                setShapeMenuOpen(false);
                setImageMenuOpen((v) => !v);
              }}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              ref={shapeBtnRef}
              type="button"
              className={`ilv-tool-btn ${tool === 'shapes' || shapeMenuOpen ? 'is-active' : ''}`}
              title="Insert shape"
              aria-label="Insert shape"
              aria-expanded={shapeMenuOpen}
              onClick={() => {
                setTool('shapes');
                setImageMenuOpen(false);
                setShapeMenuOpen((v) => !v);
              }}
            >
              <Square className="h-4 w-4" />
            </button>
            <InsertImageMenu
              open={imageMenuOpen}
              anchorRef={imageBtnRef}
              onClose={() => setImageMenuOpen(false)}
              mediaLibrary={lesson.mediaLibrary}
              userId={lesson.ownerId || 'anonymous'}
              lessonId={lesson.id}
              onUploaded={(result) => {
                if (result.localOnly && result.warning) {
                  setLocalOnlyWarn(result.warning);
                  setToast({ message: result.warning });
                }
                if (result.kind === 'image' || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(result.url)) {
                  insertStageImage(result.url, {
                    name: result.name,
                    cloudProvider: result.cloudProvider,
                    sourceUrl: result.sourceUrl,
                  });
                  return;
                }
                const kind =
                  result.kind === 'audio' ||
                  result.kind === 'video' ||
                  result.kind === 'powerpoint' ||
                  result.kind === 'upload'
                    ? result.kind
                    : detectUploadKind(
                        new File([result.url], result.name || 'upload', {
                          type: 'application/octet-stream',
                        }),
                      );
                const sceneType = uploadKindToSceneType(kind);
                const item: MediaLibraryItem = {
                  id: createId('media'),
                  name: result.name,
                  kind: kind === 'upload' ? 'upload' : sceneType,
                  url: result.url,
                  addedAt: new Date().toISOString(),
                  cloudProvider: result.cloudProvider,
                  sourceUrl: result.sourceUrl,
                };
                pushHistory({ ...lesson, mediaLibrary: [...lesson.mediaLibrary, item] });
                if (kind === 'audio') {
                  setToast({ message: `Added “${result.name}” to media library` });
                  setRail('audio');
                } else if (kind === 'video' || kind === 'powerpoint') {
                  applyMediaUrl(result.url, sceneType);
                }
              }}
              onInsertUrl={(url, meta) => insertStageImage(url, meta)}
              onOpenFreeMedia={() => setRail('freemedia')}
              onOpenLibraryRail={() => setRail('uploads')}
            />
            <InsertShapeMenu
              open={shapeMenuOpen}
              anchorRef={shapeBtnRef}
              onClose={() => setShapeMenuOpen(false)}
              onInsert={(obj) => {
                insertStageObject(obj);
                setShapeMenuOpen(false);
              }}
            />
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
          {selectedOverlay && !selectedObject && (
            <TextToolbar overlay={selectedOverlay} onChange={(patch) => patchOverlay(selectedOverlay.id, patch)} />
          )}
          {selectedObject && (
            <div className="ilv-object-toolbar" role="toolbar" aria-label="Object properties">
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase text-[var(--ss-muted)]">
                Opacity
                <input
                  className="ilv-input min-h-[28px] w-[64px] py-0.5 text-xs"
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round((selectedObject.opacity ?? 1) * 100)}
                  onChange={(e) =>
                    patchObject(selectedObject.id, {
                      opacity: Math.max(0, Math.min(100, Number(e.target.value) || 0)) / 100,
                    })
                  }
                  title="Opacity %"
                  aria-label="Opacity percent"
                />
              </label>
              <button
                type="button"
                className={`ilv-tool-btn ${selectedObject.flipH ? 'is-active' : ''}`}
                title="Flip horizontal"
                aria-label="Flip horizontal"
                onClick={() => patchObject(selectedObject.id, { flipH: !selectedObject.flipH })}
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={`ilv-tool-btn ${selectedObject.flipV ? 'is-active' : ''}`}
                title="Flip vertical"
                aria-label="Flip vertical"
                onClick={() => patchObject(selectedObject.id, { flipV: !selectedObject.flipV })}
              >
                <FlipVertical className="h-3.5 w-3.5" />
              </button>
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase text-[var(--ss-muted)]">
                W
                <input
                  className="ilv-input min-h-[28px] w-[56px] py-0.5 text-xs"
                  type="number"
                  min={4}
                  max={120}
                  value={Math.round(selectedObject.width)}
                  onChange={(e) =>
                    patchObject(selectedObject.id, { width: Math.max(4, Number(e.target.value) || 4) })
                  }
                  aria-label="Width percent"
                />
              </label>
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase text-[var(--ss-muted)]">
                H
                <input
                  className="ilv-input min-h-[28px] w-[56px] py-0.5 text-xs"
                  type="number"
                  min={4}
                  max={120}
                  value={Math.round(selectedObject.height)}
                  onChange={(e) =>
                    patchObject(selectedObject.id, { height: Math.max(4, Number(e.target.value) || 4) })
                  }
                  aria-label="Height percent"
                />
              </label>
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase text-[var(--ss-muted)]">
                Rot
                <input
                  className="ilv-input min-h-[28px] w-[56px] py-0.5 text-xs"
                  type="number"
                  step={1}
                  value={Math.round(selectedObject.rotation || 0)}
                  onChange={(e) =>
                    patchObject(selectedObject.id, { rotation: Number(e.target.value) || 0 })
                  }
                  aria-label="Rotation degrees"
                />
              </label>
              <button
                type="button"
                className="ilv-tool-btn"
                title="Delete object"
                aria-label="Delete object"
                onClick={() => {
                  updateScene({
                    objects: (scene?.objects || []).filter((o) => o.id !== selectedObject.id),
                  });
                  setSelectedObjectId(null);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="ilv-stage">
            <div
              ref={stageCanvasRef}
              className="ilv-stage-canvas"
              style={{ ['--ilv-zoom' as string]: String(zoom), position: 'relative' }}
              onDragOver={onFileDragOver}
              onDrop={onFileDrop}
            >
              {scene ? (
                <>
                  <SceneRenderer
                    key={`${scene.id}-${playing ? 'p' : 's'}-${sceneIndex}`}
                    scene={scene}
                    timeMs={sceneTimeMs}
                    playing={playing}
                    showLyrics
                    interactive
                    selectedOverlayId={stageSelectionId}
                    editingOverlayId={editingOverlayId}
                    onSelectOverlay={(id) => {
                      if (id && scene.objects?.some((o) => o.id === id)) {
                        setSelectedObjectId(id);
                        setSelectedOverlayId(null);
                        setEditingOverlayId(null);
                      } else {
                        setSelectedOverlayId(id);
                        setSelectedObjectId(null);
                      }
                    }}
                    onEditOverlay={setEditingOverlayId}
                    onUpdateOverlay={(id, patch) => patchOverlay(id, patch)}
                    onUpdateObject={(id, patch) => patchObject(id, patch)}
                    onMoveOverlay={(id, x, y) => {
                      if (scene.objects?.some((o) => o.id === id)) {
                        updateScene({
                          objects: (scene.objects || []).map((o) => (o.id === id ? { ...o, x, y } : o)),
                        });
                      } else {
                        updateScene({
                          overlays: scene.overlays.map((o) => (o.id === id ? { ...o, x, y } : o)),
                        });
                      }
                    }}
                    onUpdateLyric={(id, patch) => {
                      updateScene({
                        lyrics: (scene.lyrics || []).map((l) => (l.id === id ? { ...l, ...patch } : l)),
                        type: 'lyrics',
                      });
                    }}
                    onChangeLyricsDisplay={(patch) =>
                      updateScene({
                        lyricsDisplay: { ...(scene.lyricsDisplay || {}), ...patch },
                        type: 'lyrics',
                      })
                    }
                    onOpenLyricsStudio={openLyricsStudio}
                    transitionClass={transitionClass(scene.transition.type)}
                  />
                </>
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
              {uploadProgress && (
                <div
                  className="ilv-upload-progress"
                  role="progressbar"
                  aria-valuenow={uploadProgress.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="ilv-upload-progress-bar" style={{ width: `${uploadProgress.percent}%` }} />
                  <span>Uploading {uploadProgress.percent}%</span>
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
                <>
                  <LyricsPanel
                    scene={scene}
                    sceneTimeMs={sceneTimeMs}
                    onOpenStudio={() => openLyricsStudio()}
                  />
                  <div className="px-3 pb-3">
                    <SceneBackgroundPanel
                      scene={scene}
                      onChange={(background) =>
                        updateScene({
                          background,
                          backgroundColor: background.color || scene.backgroundColor,
                          backgroundGradient: background.gradient,
                          type: 'lyrics',
                        })
                      }
                      onPickImage={() => setRail('freemedia')}
                      onPickVideo={() => setRail('video')}
                    />
                  </div>
                </>
              )}

              {rail === 'freemedia' && (
                <FreeMediaPanel
                  onInsertImage={(item: FreeMediaItem, at) => {
                    insertStageImage(item.url, {
                      name: item.title,
                      sourceUrl: item.sourceUrl,
                      cloudProvider: item.provider,
                      attribution: {
                        title: item.title,
                        creator: item.creator,
                        license: item.license,
                        sourceUrl: item.sourceUrl,
                        provider: item.provider,
                      },
                      x: at?.xPct,
                      y: at?.yPct,
                    });
                  }}
                  onAddToLibrary={(item: FreeMediaItem) => {
                    const libItem: MediaLibraryItem = {
                      id: createId('media'),
                      name: item.title,
                      kind: item.mediaType === 'audio' ? 'audio' : 'image',
                      url: item.url,
                      thumbUrl: item.thumbUrl || item.url,
                      addedAt: new Date().toISOString(),
                      cloudProvider: item.provider,
                      sourceUrl: item.sourceUrl,
                      attribution: {
                        title: item.title,
                        creator: item.creator,
                        license: item.license,
                        sourceUrl: item.sourceUrl,
                        provider: item.provider,
                      },
                    };
                    pushHistory({ ...lesson, mediaLibrary: [...lesson.mediaLibrary, libItem] });
                    setToast({ message: `Added “${item.title}” to library` });
                  }}
                  onAddToAudioLane={(item, lane) => {
                    const clipId = createId('clip');
                    const libItem: MediaLibraryItem = {
                      id: createId('media'),
                      name: item.title,
                      kind: 'audio',
                      url: item.url,
                      thumbUrl: item.thumbUrl,
                      addedAt: new Date().toISOString(),
                      sourceUrl: item.sourceUrl,
                      attribution: {
                        title: item.title,
                        creator: item.creator,
                        license: item.license,
                        sourceUrl: item.sourceUrl,
                        provider: item.provider,
                      },
                    };
                    pushHistory({
                      ...lesson,
                      mediaLibrary: [...lesson.mediaLibrary, libItem],
                      audioClips: [
                        ...(lesson.audioClips || []),
                        {
                          id: clipId,
                          lane,
                          name: item.title,
                          mediaUrl: item.url,
                          mediaId: libItem.id,
                          startMs: absoluteMs,
                          durationMs: 8000,
                          fadeInMs: lane === 'music' ? 400 : 0,
                          fadeOutMs: lane === 'music' ? 600 : 0,
                          volume: lane === 'music' ? 0.85 : 1,
                          loop: lane === 'music',
                        },
                      ],
                    });
                    setToast({ message: `Added “${item.title}” to ${lane}` });
                  }}
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
                    title="Apply to all slides"
                    aria-label="Apply transition to all slides"
                    onClick={() => {
                      const tr = { ...scene.transition };
                      const scenes = lesson.scenes.map((s, idx) =>
                        idx === 0 ? s : { ...s, transition: { ...tr } },
                      );
                      pushHistory({ ...lesson, scenes });
                      setToast({ message: 'Transition applied to all slides' });
                    }}
                  >
                    Apply to all slides
                  </button>
                  <button
                    type="button"
                    className="ilv-btn ilv-btn-secondary w-full"
                    title="Preview transition"
                    aria-label="Preview transition"
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
                  <div
                    onDragOver={onFileDragOver}
                    onDrop={onFileDrop}
                  >
                    <label className="ilv-label">Media library</label>
                    <MediaLibraryList
                      lesson={lesson}
                      items={lesson.mediaLibrary}
                      onApply={(m) => applyMediaUrl(m.url, m.kind === 'upload' ? undefined : (m.kind as SceneType))}
                      onRename={renameMedia}
                      onReplaceUrl={replaceMediaUrl}
                      onDelete={deleteMedia}
                    />
                    <p className="mt-2 text-[10px] text-[var(--ss-muted)]">
                      Drop files here to upload ({ILV_FILE_ACCEPT.split(',').slice(0, 3).join(', ')}…)
                    </p>
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
              title={item.label}
              aria-label={item.label}
              onClick={() => setRail((r) => (r === item.id ? null : item.id))}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>
      </div>

      <div
        className="ilv-timeline-splitter"
        role="separator"
        aria-orientation="horizontal"
        aria-valuenow={timelineHeight}
        aria-valuemin={TIMELINE_H_MIN}
        aria-valuemax={TIMELINE_H_MAX}
        aria-label="Resize timeline"
        tabIndex={0}
        onPointerDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const startH = timelineHeight;
          const move = (ev: PointerEvent) => {
            persistTimelineHeight(startH - (ev.clientY - startY));
          };
          const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
          };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        }}
        onDoubleClick={() => persistTimelineHeight(TIMELINE_H_DEFAULT)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            persistTimelineHeight(timelineHeight + 16);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            persistTimelineHeight(timelineHeight - 16);
          } else if (e.key === 'Home') {
            e.preventDefault();
            persistTimelineHeight(TIMELINE_H_DEFAULT);
          }
        }}
      >
        <span className="ilv-timeline-splitter-grip" aria-hidden />
      </div>

      <div className="ilv-timeline" style={{ height: timelineHeight }}>
        <div className="ilv-timeline-controls">
          <button
            type="button"
            className="ilv-btn ilv-btn-secondary text-xs"
            title="Transitions"
            aria-label="Transitions panel"
            onClick={() => setRail((r) => (r === 'transitions' ? null : 'transitions'))}
          >
            Transitions
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="ilv-play-btn"
              onClick={() => setPlaying((p) => !p)}
              title={playing ? 'Pause preview' : 'Play from here'}
              aria-label={playing ? 'Pause preview' : 'Play from here'}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
            </button>
            <button
              type="button"
              className="ilv-btn ilv-btn-secondary text-xs"
              title="Play from start"
              aria-label="Play from start"
              onClick={() => {
                setSceneIndex(0);
                setSceneTimeMs(0);
                setPlaying(true);
              }}
            >
              <SkipBack className="h-3.5 w-3.5" />
              Play from start
            </button>
            <button
              type="button"
              className="ilv-btn ilv-btn-secondary text-xs"
              title="Play from here (Shift+Space)"
              aria-label="Play from here"
              onClick={() => setPlaying(true)}
            >
              <Play className="h-3.5 w-3.5" />
              Play from here
            </button>
            <span className="tabular-nums text-sm font-semibold text-[var(--ss-ink)]">
              {formatTimecode(displayElapsedMs)} / {formatTimecode(totalMs)}
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
              aria-label="Timeline zoom"
            />
          </label>
        </div>

        <div className="ilv-timeline-scroll" onDragOver={onFileDragOver} onDrop={onFileDrop}>
          <div
            className="ilv-scene-track"
            onDragOver={(e) => {
              if (isFileDrag(e)) {
                onFileDragOver(e);
                return;
              }
              e.preventDefault();
            }}
            onClick={(e) => {
              const track = e.currentTarget;
              if ((e.target as HTMLElement).closest('.ilv-scene-clip, .ilv-add-scene, .ilv-tr-marker')) return;
              const rect = track.getBoundingClientRect();
              const ratio = Math.max(
                0,
                Math.min(1, (e.clientX - rect.left + track.scrollLeft) / Math.max(track.scrollWidth, 1)),
              );
              seekLessonMs(ratio * layoutTotal);
              setPlaying(false);
            }}
            onDrop={(e) => {
              if (isFileDrag(e)) {
                onFileDrop(e);
                return;
              }
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
                left:
                  layoutTotal > 0
                    ? `${Math.min(100, Math.max(0, (absoluteMs / layoutTotal) * 100))}%`
                    : 0,
              }}
            />
            {lesson.scenes.length === 0 ? (
              <button type="button" className="ilv-empty-timeline" onClick={() => addScene('title')}>
                <Plus className="h-5 w-5" />
                Add scene
              </button>
            ) : (
              lesson.scenes.map((sc, i) => (
                <React.Fragment key={sc.id}>
                  {i > 0 && (
                    <TransitionMarker
                      sceneIndex={i}
                      scene={sc}
                      widthPx={Math.max(
                        18,
                        Math.min(80, (sc.transition?.durationMs || 500) * pxPerMs),
                      )}
                      onChange={(transition: SceneTransition) => {
                        const scenes = lesson.scenes.map((s, idx) =>
                          idx === i ? { ...s, transition } : s,
                        );
                        pushHistory({ ...lesson, scenes });
                      }}
                      onApplyToAll={(transition: SceneTransition) => {
                        const scenes = lesson.scenes.map((s, idx) =>
                          idx === 0 ? s : { ...s, transition: { ...transition } },
                        );
                        pushHistory({ ...lesson, scenes });
                        setToast({ message: 'Transition applied to all slides' });
                      }}
                      onRemove={() => {
                        const scenes = lesson.scenes.map((s, idx) =>
                          idx === i ? { ...s, transition: { type: 'none' as TransitionType, durationMs: 0 } } : s,
                        );
                        pushHistory({ ...lesson, scenes });
                      }}
                    />
                  )}
                  <SceneThumb
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
                      setSelectedObjectId(null);
                      setSelectedOverlayId(null);
                      setEditingOverlayId(null);
                    }}
                    onReorder={reorderScene}
                    onDelete={() => deleteSceneAt(i)}
                    onDuplicate={() => duplicateSceneAt(i)}
                    onMoveLeft={() => reorderScene(i, i - 1)}
                    onMoveRight={() => reorderScene(i, i + 1)}
                    onSetAdvance={(mode) => {
                      setSceneIndex(i);
                      const scenes = lesson.scenes.map((s, idx) =>
                        idx === i
                          ? {
                              ...s,
                              advanceMode: mode,
                              durationMs: mode === 'manual' ? 0 : s.durationMs || 5000,
                              advanceAfterMs:
                                mode === 'timer' ? s.advanceAfterMs || s.durationMs || 5000 : s.advanceAfterMs,
                            }
                          : s,
                      );
                      pushHistory({ ...lesson, scenes });
                    }}
                  />
                </React.Fragment>
              ))
            )}
            {lesson.scenes.length > 0 && (
              <button
                type="button"
                className="ilv-add-scene"
                title="Add scene"
                aria-label="Add scene"
                onClick={() => addScene('title')}
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>

          <AudioTracks
            lesson={lesson}
            elapsedMs={absoluteMs}
            pxPerMs={pxPerMs}
            onChange={(patch) => pushHistory({ ...lesson, ...patch })}
            onSeek={(ms) => {
              seekLessonMs(ms);
              setPlaying(false);
            }}
          />

          {scene && (
            <LyricsLane
              scenes={lesson.scenes}
              sceneIndex={sceneIndex}
              scene={scene}
              sceneTimeMs={sceneTimeMs}
              pxPerMs={pxPerMs}
              onChange={(lyrics) => updateScene({ lyrics, type: 'lyrics' })}
              onSeekScene={(ms) => {
                setSceneTimeMs(ms);
                setPlaying(false);
              }}
              onOpenStudio={openLyricsStudio}
            />
          )}
        </div>
      </div>

      {toast && (
        <div className="ilv-toast" role="status">
          <span>{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              className="ilv-toast-undo"
              onClick={() => {
                const snap = (window as unknown as { __ilvMediaUndo?: InteractiveLesson }).__ilvMediaUndo;
                if (snap) {
                  onChange(snap);
                  (window as unknown as { __ilvMediaUndo?: InteractiveLesson }).__ilvMediaUndo = undefined;
                } else {
                  undo();
                }
                setToast(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}

      {localOnlyWarn && !toast && (
        <div className="ilv-toast" role="status">
          <span>{localOnlyWarn}</span>
        </div>
      )}

      {lyricsStudioOpen && scene && (
        <LyricsStudio
          scene={scene}
          sceneTimeMs={sceneTimeMs}
          playing={playing}
          focusLineId={lyricsStudioFocusLineId}
          authToken={authToken}
          onClose={() => {
            setLyricsStudioOpen(false);
            setLyricsStudioFocusLineId(null);
          }}
          onChange={(lyrics) => updateScene({ lyrics, type: 'lyrics' })}
          onChangeDisplay={(lyricsDisplay) => updateScene({ lyricsDisplay, type: 'lyrics' })}
          onChangeKaraoke={(tracks: KaraokeTracks) =>
            updateScene({
              karaokeTracks: tracks,
              type: 'lyrics',
              mediaUrl: tracks.defaultVersion === 'backing' ? tracks.backingUrl || scene.mediaUrl : tracks.vocalUrl || scene.mediaUrl,
            })
          }
          onSeek={(ms) => {
            setSceneTimeMs(ms);
          }}
          onTogglePlay={() => setPlaying((p) => !p)}
          onSetMediaUrl={(url) => updateScene({ mediaUrl: url, type: 'lyrics' })}
        />
      )}

      {showPlayer && (
        <InteractiveLessonPlayer
          lesson={lesson}
          startSceneIndex={sceneIndex}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>,
    document.body,
  );
}
