/** Interactive Lesson Viewer — domain types (self-contained module). */

export type InteractiveLessonStatus = 'draft' | 'published';

export type SceneType =
  | 'video'
  | 'audio'
  | 'image'
  | 'title'
  | 'text'
  | 'lyrics'
  | 'youtube'
  | 'vimeo'
  | 'canva'
  | 'powerpoint'
  | 'googleslides'
  | 'embed';

export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom' | 'dissolve';

/** How the classroom player advances past this scene. */
export type AdvanceMode = 'manual' | 'timer' | 'media-end';

export type TextPreset = 'headline' | 'subtitle' | 'body';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextListType = 'none' | 'bullet' | 'numbered';

export interface SceneTransition {
  type: TransitionType;
  durationMs: number;
}

export interface TextEffects {
  shadow?: boolean;
  shadowColor?: string;
  shadowIntensity?: number; // 0–100
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  highlight?: boolean;
  highlightColor?: string;
}

export interface TextOverlay {
  id: string;
  text: string;
  style: TextPreset;
  /** Position as % of stage (0–100). */
  x: number;
  y: number;
  width: number;
  /** Height as % of stage — optional; derived from content when omitted. */
  height?: number;
  color: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through' | 'underline line-through';
  textTransform?: 'none' | 'uppercase';
  textAlign?: TextAlign;
  letterSpacing?: number; // em-ish px offset
  lineHeight?: number;
  opacity?: number; // 0–1
  rotation?: number; // degrees
  locked?: boolean;
  listType?: TextListType;
  effects?: TextEffects;
  /** Stacking order within the scene (higher = front). */
  zIndex?: number;
}

export interface LyricLine {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
}

export interface Scene {
  id: string;
  type: SceneType;
  title: string;
  durationMs: number;
  transition: SceneTransition;
  /** Direct media / file URL (video, audio, image, exported MP4). */
  mediaUrl?: string;
  /** Embed / share link (YouTube, Vimeo, Canva, Office Online, Google Slides, generic). */
  embedUrl?: string;
  posterUrl?: string;
  backgroundColor?: string;
  overlays: TextOverlay[];
  lyrics?: LyricLine[];
  /** Trade-off / helper note shown in editor for Canva / PPT / embeds. */
  notes?: string;
  /** Classroom advance behaviour. Defaults by type when omitted. */
  advanceMode?: AdvanceMode;
  /** Used when advanceMode === 'timer' (milliseconds). */
  advanceAfterMs?: number;
  /** YouTube clip window (seconds). */
  youtubeStartSec?: number;
  youtubeEndSec?: number;
}

export interface MediaLibraryItem {
  id: string;
  name: string;
  kind: SceneType | 'upload';
  url: string;
  thumbUrl?: string;
  durationMs?: number;
  addedAt: string;
}

export interface InteractiveLesson {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerEmail?: string;
  status: InteractiveLessonStatus;
  scenes: Scene[];
  mediaLibrary: MediaLibraryItem[];
  /** CCD lesson attachment keys (`sheet:lessonNumber`). */
  attachedLessonKeys: string[];
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface InteractiveLessonSummary {
  id: string;
  title: string;
  description: string;
  status: InteractiveLessonStatus;
  ownerId: string;
  sceneCount: number;
  updatedAt: string;
  isDemo?: boolean;
}

export const SCENE_TYPE_COLORS: Record<SceneType, string> = {
  video: '#F59E0B',
  audio: '#14B8A6',
  image: '#6366F1',
  title: '#4338E8',
  text: '#77738F',
  lyrics: '#EC4899',
  youtube: '#EF4444',
  vimeo: '#1AB7EA',
  canva: '#00C4CC',
  powerpoint: '#D24726',
  googleslides: '#F4B400',
  embed: '#77738F',
};

export const SCENE_TYPE_LABELS: Record<SceneType, string> = {
  video: 'Video',
  audio: 'Audio',
  image: 'Image',
  title: 'Title',
  text: 'Text',
  lyrics: 'Lyrics',
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  canva: 'Canva',
  powerpoint: 'PowerPoint',
  googleslides: 'Slides',
  embed: 'Embed',
};

export const BRAND_TEXT_COLORS = [
  '#1F1B4D',
  '#4338E8',
  '#FFFFFF',
  '#FFC93C',
  '#F4F3FA',
  '#D5F3EA',
  '#FFF1C2',
  '#77738F',
  '#002D24',
  '#7C3AED', // CC logo purple
] as const;

export const DEFAULT_SOLID_COLORS = [
  '#000000',
  '#FFFFFF',
  '#1F1B4D',
  '#4338E8',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6',
  '#F97316',
  '#64748B',
  '#F4F3FA',
  '#FFC93C',
  '#002D24',
] as const;

export const TEXT_FONT_OPTIONS: { id: string; label: string; stack: string }[] = [
  { id: 'plus-jakarta', label: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" },
  { id: 'lexend', label: 'Lexend', stack: "'Lexend', ui-sans-serif, system-ui, sans-serif" },
  { id: 'atkinson', label: 'Atkinson Hyperlegible', stack: "'Atkinson Hyperlegible', ui-sans-serif, system-ui, sans-serif" },
  { id: 'nunito', label: 'Nunito', stack: "'Nunito', ui-sans-serif, system-ui, sans-serif" },
  { id: 'poppins', label: 'Poppins', stack: "'Poppins', ui-sans-serif, system-ui, sans-serif" },
  { id: 'fredoka', label: 'Fredoka', stack: "'Fredoka', ui-sans-serif, system-ui, sans-serif" },
  { id: 'baloo', label: 'Baloo 2', stack: "'Baloo 2', ui-sans-serif, system-ui, sans-serif" },
  { id: 'patrick', label: 'Patrick Hand', stack: "'Patrick Hand', ui-sans-serif, system-ui, sans-serif" },
  { id: 'montserrat', label: 'Montserrat', stack: "'Montserrat', ui-sans-serif, system-ui, sans-serif" },
  { id: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', ui-serif, Georgia, serif" },
];

export const TEXT_PRESET_DEFAULTS: Record<
  TextPreset,
  { fontSize: number; fontWeight: number; label: string }
> = {
  headline: { fontSize: 36, fontWeight: 800, label: 'Headline' },
  subtitle: { fontSize: 22, fontWeight: 600, label: 'Subtitle' },
  body: { fontSize: 18, fontWeight: 500, label: 'Body' },
};

export const TRANSITION_OPTIONS: { type: TransitionType; label: string }[] = [
  { type: 'none', label: 'None' },
  { type: 'fade', label: 'Fade' },
  { type: 'slide', label: 'Slide' },
  { type: 'zoom', label: 'Zoom' },
  { type: 'dissolve', label: 'Dissolve' },
];

export function createId(prefix = 'il'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function defaultAdvanceMode(type: SceneType): AdvanceMode {
  if (type === 'video' || type === 'audio' || type === 'lyrics') return 'media-end';
  if (
    type === 'youtube' ||
    type === 'vimeo' ||
    type === 'canva' ||
    type === 'powerpoint' ||
    type === 'googleslides' ||
    type === 'embed'
  ) {
    return 'manual';
  }
  return 'timer';
}

export function emptyScene(type: SceneType, partial?: Partial<Scene>): Scene {
  const defaults: Record<SceneType, number> = {
    video: 7000,
    audio: 30000,
    image: 5000,
    title: 4000,
    text: 4000,
    lyrics: 32000,
    youtube: 0,
    vimeo: 0,
    canva: 0,
    powerpoint: 0,
    googleslides: 0,
    embed: 0,
  };
  const advanceMode = defaultAdvanceMode(type);
  return {
    id: createId('scene'),
    type,
    title: SCENE_TYPE_LABELS[type],
    durationMs: defaults[type],
    transition: { type: 'fade', durationMs: 500 },
    overlays: [],
    backgroundColor: type === 'title' || type === 'text' ? '#1F1B4D' : '#FFFFFF',
    advanceMode,
    advanceAfterMs: advanceMode === 'timer' ? defaults[type] || 5000 : undefined,
    ...partial,
  };
}

export function resolveAdvanceMode(scene: Scene): AdvanceMode {
  return scene.advanceMode || defaultAdvanceMode(scene.type);
}

/** Duration contribution for lesson totals — manual scenes count as 0 clock time. */
export function sceneClockMs(scene: Scene): number {
  const mode = resolveAdvanceMode(scene);
  if (mode === 'manual') return 0;
  if (mode === 'timer') return Math.max(0, scene.advanceAfterMs ?? scene.durationMs);
  return Math.max(0, scene.durationMs);
}

export function lessonDurationMs(lesson: InteractiveLesson): number {
  return lesson.scenes.reduce((sum, s) => sum + sceneClockMs(s), 0);
}

export function formatTimecode(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 100) / 10);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  const whole = Math.floor(secs);
  const tenths = Math.round((secs - whole) * 10);
  return `${String(mins).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${tenths}`;
}

export function formatSceneDurationLabel(scene: Scene): string {
  const mode = resolveAdvanceMode(scene);
  if (mode === 'manual') return 'Manual';
  if (mode === 'timer') {
    const ms = scene.advanceAfterMs ?? scene.durationMs;
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${(Math.max(0, scene.durationMs) / 1000).toFixed(1)}s`;
}
