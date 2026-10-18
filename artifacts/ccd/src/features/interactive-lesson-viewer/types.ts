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
  | 'embed';

export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom' | 'dissolve';

export type TextPreset = 'headline' | 'subtitle' | 'body';

export interface SceneTransition {
  type: TransitionType;
  durationMs: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  style: TextPreset;
  /** Position as % of stage (0–100). */
  x: number;
  y: number;
  width: number;
  color: string;
  fontSize?: number;
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
  /** Embed / share link (YouTube, Vimeo, Canva, Office Online, generic). */
  embedUrl?: string;
  posterUrl?: string;
  backgroundColor?: string;
  overlays: TextOverlay[];
  lyrics?: LyricLine[];
  /** Trade-off / helper note shown in editor for Canva / PPT / embeds. */
  notes?: string;
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
  embed: 'Embed',
};

export const BRAND_TEXT_COLORS = [
  '#1F1B4D',
  '#4338E8',
  '#FFFFFF',
  '#FFC93C',
  '#77738F',
  '#002D24',
] as const;

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

export function emptyScene(type: SceneType, partial?: Partial<Scene>): Scene {
  const defaults: Record<SceneType, number> = {
    video: 7000,
    audio: 30000,
    image: 5000,
    title: 4000,
    text: 4000,
    lyrics: 32000,
    youtube: 120000,
    vimeo: 120000,
    canva: 15000,
    powerpoint: 15000,
    embed: 10000,
  };
  return {
    id: createId('scene'),
    type,
    title: SCENE_TYPE_LABELS[type],
    durationMs: defaults[type],
    transition: { type: 'fade', durationMs: 500 },
    overlays: [],
    backgroundColor: type === 'title' || type === 'text' ? '#1F1B4D' : '#FFFFFF',
    ...partial,
  };
}

export function lessonDurationMs(lesson: InteractiveLesson): number {
  return lesson.scenes.reduce((sum, s) => sum + Math.max(0, s.durationMs), 0);
}

export function formatTimecode(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 100) / 10);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  const whole = Math.floor(secs);
  const tenths = Math.round((secs - whole) * 10);
  return `${String(mins).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${tenths}`;
}
