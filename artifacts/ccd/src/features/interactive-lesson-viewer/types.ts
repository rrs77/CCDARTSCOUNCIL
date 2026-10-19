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

export type TransitionType =
  | 'none'
  | 'fade'
  | 'slide'
  | 'zoom'
  | 'dissolve'
  | 'wipe-left'
  | 'wipe-right'
  | 'push-up'
  | 'push-down'
  | 'blur'
  | 'bounce'
  | 'flip';

/** How the classroom player advances past this scene. */
export type AdvanceMode = 'manual' | 'timer' | 'media-end';

export type TextPreset = 'headline' | 'subtitle' | 'body';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextListType = 'none' | 'bullet' | 'numbered';

export type TextAnimationType =
  | 'none'
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'bounce'
  | 'pulse'
  | 'typewriter'
  | 'pop'
  | 'karaoke-wipe'
  | 'karaoke-fill'
  | 'bounce-in'
  | 'word-pop'
  | 'fade-up'
  | 'glow-pulse'
  | 'scale-highlight'
  | 'slide-in-line'
  | 'colour-sweep';

export type TextAnimationPhase = 'entrance' | 'emphasis' | 'exit';
export type LyricAnimScope = 'line' | 'word';

export interface SceneTransition {
  type: TransitionType;
  durationMs: number;
}

/** Canva-style text effect preset. */
export type TextEffectPreset =
  | 'none'
  | 'shadow'
  | 'lift'
  | 'hollow'
  | 'splice'
  | 'echo'
  | 'glitch'
  | 'neon'
  | 'background'
  | 'outline'
  | 'curve';

export type TextCase = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted';

export interface TextEffects {
  /** Active visual preset (Canva-style). */
  preset?: TextEffectPreset;
  shadow?: boolean;
  shadowColor?: string;
  shadowIntensity?: number; // 0–100 (legacy blur/opacity proxy)
  /** Shadow offset distance in px. */
  shadowOffset?: number;
  /** Shadow direction in degrees (0 = right, 90 = down). */
  shadowAngle?: number;
  shadowBlur?: number;
  shadowOpacity?: number; // 0–1
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  highlight?: boolean;
  highlightColor?: string;
  highlightOpacity?: number; // 0–1
  /** Neon glow intensity 0–100. */
  neonIntensity?: number;
  neonColor?: string;
  /** Curve warp amount −100…100 (arc text approximation via CSS). */
  curveAmount?: number;
  /** Echo / splice / glitch layers use secondary colour. */
  effectColor?: string;
  effectOpacity?: number;
  /** Text fill gradient (overrides solid color when set). */
  fillGradient?: string;
  /** Box chrome */
  boxBackground?: string;
  boxGradient?: string;
  boxRadius?: number; // px; large values → pill
  boxPadding?: number; // px
  boxBorderWidth?: number;
  boxBorderColor?: string;
  boxBorderStyle?: BorderStyle;
  /** Vertical align tweak for superscript (boolean). */
  superscript?: boolean;
}

export interface TextAnimation {
  type: TextAnimationType;
  phase?: TextAnimationPhase;
  durationMs?: number;
  delayMs?: number;
  /** Emphasis / karaoke speed multiplier (0.25–3). */
  speed?: number;
  scope?: LyricAnimScope;
}

export type SceneBackgroundKind = 'color' | 'gradient' | 'image' | 'video';

export interface SceneBackground {
  kind: SceneBackgroundKind;
  color?: string;
  gradient?: string;
  imageUrl?: string;
  videoUrl?: string;
  /** Dim overlay 0–1. */
  dim?: number;
  /** CSS blur px on media. */
  blur?: number;
  /** Media opacity 0–1. */
  opacity?: number;
  loop?: boolean;
  muted?: boolean;
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
  textTransform?: TextCase;
  textAlign?: TextAlign;
  letterSpacing?: number; // px
  lineHeight?: number; // unitless multiplier
  /** Whole-element opacity 0–1 (text + box). Prefer color/boxBackground alpha for separate control. */
  opacity?: number;
  /** Text box fill (supports rgba / #rrggbbaa). Prefer effects.boxBackground when both set. */
  boxBackground?: string;
  rotation?: number; // degrees
  flipH?: boolean;
  flipV?: boolean;
  locked?: boolean;
  listType?: TextListType;
  effects?: TextEffects;
  animation?: TextAnimation;
  /** Stacking order within the scene (higher = front). */
  zIndex?: number;
}

export const TEXT_EFFECT_PRESETS: { id: TextEffectPreset; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'lift', label: 'Lift' },
  { id: 'hollow', label: 'Hollow' },
  { id: 'splice', label: 'Splice' },
  { id: 'echo', label: 'Echo' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'neon', label: 'Neon' },
  { id: 'background', label: 'Background' },
  { id: 'outline', label: 'Outline' },
  { id: 'curve', label: 'Curve' },
];

/** Apply a Canva-style effect preset onto existing effects (keeps unrelated box chrome). */
export function applyTextEffectPreset(
  current: TextEffects | undefined,
  preset: TextEffectPreset,
): TextEffects {
  const base: TextEffects = { ...(current || {}), preset };
  // Reset mutually exclusive flags
  base.shadow = false;
  base.outline = false;
  base.highlight = false;
  switch (preset) {
    case 'none':
      return { ...base, curveAmount: 0, neonIntensity: 0, fillGradient: undefined };
    case 'shadow':
      return {
        ...base,
        shadow: true,
        shadowOffset: current?.shadowOffset ?? 4,
        shadowAngle: current?.shadowAngle ?? 135,
        shadowBlur: current?.shadowBlur ?? 6,
        shadowOpacity: current?.shadowOpacity ?? 0.45,
        shadowColor: current?.shadowColor || 'rgba(0,0,0,0.55)',
      };
    case 'lift':
      return {
        ...base,
        shadow: true,
        shadowOffset: 0,
        shadowAngle: 90,
        shadowBlur: 18,
        shadowOpacity: 0.35,
        shadowColor: 'rgba(31,27,77,0.4)',
      };
    case 'hollow':
      return {
        ...base,
        outline: true,
        outlineWidth: current?.outlineWidth ?? 2,
        outlineColor: current?.outlineColor || '#1F1B4D',
      };
    case 'splice':
      return {
        ...base,
        outline: true,
        outlineWidth: 2,
        outlineColor: current?.outlineColor || '#FFFFFF',
        effectColor: current?.effectColor || '#4338E8',
        effectOpacity: 0.9,
      };
    case 'echo':
      return {
        ...base,
        shadow: true,
        shadowOffset: 6,
        shadowAngle: 0,
        shadowBlur: 0,
        shadowOpacity: 0.55,
        shadowColor: current?.effectColor || '#4338E8',
        effectColor: current?.effectColor || '#4338E8',
      };
    case 'glitch':
      return {
        ...base,
        shadow: true,
        shadowOffset: 3,
        shadowAngle: 0,
        shadowBlur: 0,
        shadowOpacity: 0.85,
        shadowColor: '#FF2D55',
        effectColor: '#00C2FF',
        effectOpacity: 0.85,
      };
    case 'neon':
      return {
        ...base,
        neonIntensity: current?.neonIntensity ?? 70,
        neonColor: current?.neonColor || '#FFC93C',
        shadow: true,
        shadowBlur: 16,
        shadowOffset: 0,
        shadowOpacity: 0.9,
        shadowColor: current?.neonColor || '#FFC93C',
      };
    case 'background':
      return {
        ...base,
        highlight: true,
        highlightColor: current?.highlightColor || 'rgba(255,201,60,0.45)',
        highlightOpacity: current?.highlightOpacity ?? 0.45,
      };
    case 'outline':
      return {
        ...base,
        outline: true,
        outlineWidth: current?.outlineWidth ?? 3,
        outlineColor: current?.outlineColor || '#FFFFFF',
        shadow: true,
        shadowOffset: 0,
        shadowBlur: 0,
        shadowOpacity: 1,
        shadowColor: '#1F1B4D',
      };
    case 'curve':
      return {
        ...base,
        curveAmount: current?.curveAmount ?? 40,
      };
    default:
      return base;
  }
}

/** Attribution for free/public-domain or cloud media. */
export interface MediaAttribution {
  license?: string;
  creator?: string;
  sourceUrl?: string;
  provider?: string;
  title?: string;
}

export type StageObjectKind = 'image' | 'video' | 'shape';
export type ShapeKind = 'rect' | 'rounded' | 'ellipse' | 'triangle' | 'line' | 'arrow' | 'star';

/** Placed image / video / shape on the stage (Canva-style transformable). */
export interface StageObject {
  id: string;
  kind: StageObjectKind;
  shape?: ShapeKind;
  mediaUrl?: string;
  /** Position as % of stage. */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number; // 0–1
  flipH?: boolean;
  flipV?: boolean;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  locked?: boolean;
  zIndex?: number;
  attribution?: MediaAttribution;
}

export type LyricsPosition = 'top' | 'center' | 'bottom';

export interface LyricsDisplayOptions {
  fontFamily?: string;
  fontSize?: number;
  activeColor?: string;
  upcomingColor?: string;
  pastColor?: string;
  position?: LyricsPosition;
  showUpcoming?: boolean;
  showPast?: boolean;
  background?: boolean;
  backgroundColor?: string;
  /** Lyric backdrop opacity 0–1 (multiplies backgroundColor alpha when set). */
  backdropOpacity?: number;
  /** Lead-in highlight before line start (ms). */
  leadInMs?: number;
  /** Karaoke / lyric animation. */
  animation?: TextAnimationType;
  animScope?: LyricAnimScope;
  animSpeed?: number; // 0.25–3
  animDurationMs?: number;
}

export interface LyricWord {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
}

export interface LyricLine {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  /** Optional per-word timing within the line. */
  words?: LyricWord[];
}

/** Karaoke dual-track: instrumental backing + full vocal, time-aligned. */
export type KaraokeTrackDefault = 'vocals' | 'backing';

export interface KaraokeTracks {
  /** Full / vocal version URL (used for Whisper auto-sync). */
  vocalUrl?: string;
  /** Instrumental / backing track URL. */
  backingUrl?: string;
  /** Default version when the player opens. */
  defaultVersion?: KaraokeTrackDefault;
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
  /** Optional CSS gradient overriding solid backgroundColor when set. */
  backgroundGradient?: string;
  /** Rich scene background (colour / gradient / image / video). */
  background?: SceneBackground;
  /** Scene background opacity 0–1 (colour/gradient/image/video bed). */
  backgroundOpacity?: number;
  /** Full-bleed scene media opacity 0–1. */
  mediaOpacity?: number;
  overlays: TextOverlay[];
  /** Placed images, videos, and shapes on the canvas. */
  objects?: StageObject[];
  lyrics?: LyricLine[];
  lyricsDisplay?: LyricsDisplayOptions;
  /** Karaoke: backing + vocal URLs (mediaUrl stays as the active/default play URL). */
  karaokeTracks?: KaraokeTracks;
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
  attribution?: MediaAttribution;
  /** Detected cloud provider badge (Drive, Dropbox, …). */
  cloudProvider?: string;
  /** Original share link before normalisation. */
  sourceUrl?: string;
}

/** Timeline audio lane kind — separate Voiceover vs Music rows. */
export type AudioLaneKind = 'voiceover' | 'music';

/** How music behaves while a manual-advance scene is waiting on Next. */
export type ManualAdvanceAudioMode = 'keep-playing' | 'pause-until-next';

export interface VolumeKeyframe {
  /** 0–1 position along the clip duration. */
  t: number;
  /** Gain 0–1. */
  gain: number;
}

export interface AudioClip {
  id: string;
  lane: AudioLaneKind;
  name: string;
  mediaUrl: string;
  mediaId?: string;
  /** Absolute start on the lesson timeline (ms from lesson start, using scene durations). */
  startMs: number;
  /** Clip length on the timeline (ms). May span multiple scenes. */
  durationMs: number;
  /** Offset into the source file (trim start). */
  trimStartMs?: number;
  volume?: number; // 0–1, default 1
  fadeInMs?: number;
  fadeOutMs?: number;
  /** Optional volume envelope; t is 0–1 along clip. */
  volumeCurve?: VolumeKeyframe[];
  /** Music only: loop the source for the full clip span. */
  loop?: boolean;
  muted?: boolean;
}

export interface AudioLaneState {
  kind: AudioLaneKind;
  muted?: boolean;
  solo?: boolean;
}

export interface AudioMixSettings {
  /** Auto-duck music while voiceover is audible. */
  duckMusicUnderVoiceover?: boolean;
  /** Duck amount 0–1 (how much to reduce music). Default 0.7. */
  duckAmount?: number;
  /** Manual-advance scenes: keep music playing or pause until Next. */
  manualAdvanceMusic?: ManualAdvanceAudioMode;
  lanes?: AudioLaneState[];
}

/** Where a slides deck came from in the teacher library. */
export type InteractiveLessonSource = 'user' | 'hub' | 'demo';

export interface InteractiveLesson {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerEmail?: string;
  status: InteractiveLessonStatus;
  scenes: Scene[];
  mediaLibrary: MediaLibraryItem[];
  /** Multi-track audio clips (voiceover / music) spanning the lesson timeline. */
  audioClips?: AudioClip[];
  audioMix?: AudioMixSettings;
  /** CCD lesson attachment keys (`sheet:lessonNumber`). */
  attachedLessonKeys: string[];
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  /** Library provenance — user-created, partner hub pack, or shipped demo. */
  source?: InteractiveLessonSource;
  /** Partner hub slug when source === 'hub'. */
  hubId?: string;
  hubName?: string;
  tags?: string[];
  subject?: string;
}

/** Lightweight first-scene snapshot for library tile covers. */
export interface InteractiveLessonCover {
  type: SceneType;
  title: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  mediaUrl?: string;
  posterUrl?: string;
  embedUrl?: string;
  headline?: string;
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
  cover?: InteractiveLessonCover;
  /** Distinct scene types in order of first appearance (for cover chips). */
  sceneTypes?: SceneType[];
  source?: InteractiveLessonSource;
  hubId?: string;
  hubName?: string;
  tags?: string[];
  subject?: string;
}

export type SlidesLibraryTab = 'mine' | 'hubs' | 'all';

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

export const TEXT_FONT_OPTIONS: { id: string; label: string; stack: string; category: string }[] = [
  { id: 'plus-jakarta', label: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'inter', label: 'Inter', stack: "'Inter', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'lexend', label: 'Lexend', stack: "'Lexend', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'atkinson', label: 'Atkinson Hyperlegible', stack: "'Atkinson Hyperlegible', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'nunito', label: 'Nunito', stack: "'Nunito', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'poppins', label: 'Poppins', stack: "'Poppins', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'montserrat', label: 'Montserrat', stack: "'Montserrat', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'dm-sans', label: 'DM Sans', stack: "'DM Sans', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'space-grotesk', label: 'Space Grotesk', stack: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'outfit', label: 'Outfit', stack: "'Outfit', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'rubik', label: 'Rubik', stack: "'Rubik', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'source-sans', label: 'Source Sans 3', stack: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'work-sans', label: 'Work Sans', stack: "'Work Sans', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'manrope', label: 'Manrope', stack: "'Manrope', ui-sans-serif, system-ui, sans-serif", category: 'Sans' },
  { id: 'fredoka', label: 'Fredoka', stack: "'Fredoka', ui-sans-serif, system-ui, sans-serif", category: 'Display' },
  { id: 'baloo', label: 'Baloo 2', stack: "'Baloo 2', ui-sans-serif, system-ui, sans-serif", category: 'Display' },
  { id: 'comfortaa', label: 'Comfortaa', stack: "'Comfortaa', ui-sans-serif, system-ui, sans-serif", category: 'Display' },
  { id: 'righteous', label: 'Righteous', stack: "'Righteous', ui-sans-serif, system-ui, sans-serif", category: 'Display' },
  { id: 'bebas', label: 'Bebas Neue', stack: "'Bebas Neue', ui-sans-serif, system-ui, sans-serif", category: 'Display' },
  { id: 'anton', label: 'Anton', stack: "'Anton', ui-sans-serif, system-ui, sans-serif", category: 'Display' },
  { id: 'lobster', label: 'Lobster', stack: "'Lobster', ui-serif, Georgia, serif", category: 'Display' },
  { id: 'pacifico', label: 'Pacifico', stack: "'Pacifico', cursive", category: 'Script' },
  { id: 'caveat', label: 'Caveat', stack: "'Caveat', cursive", category: 'Script' },
  { id: 'patrick', label: 'Patrick Hand', stack: "'Patrick Hand', cursive", category: 'Script' },
  { id: 'kalam', label: 'Kalam', stack: "'Kalam', cursive", category: 'Script' },
  { id: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', ui-serif, Georgia, serif", category: 'Serif' },
  { id: 'merriweather', label: 'Merriweather', stack: "'Merriweather', ui-serif, Georgia, serif", category: 'Serif' },
  { id: 'lora', label: 'Lora', stack: "'Lora', ui-serif, Georgia, serif", category: 'Serif' },
  { id: 'libre-baskerville', label: 'Libre Baskerville', stack: "'Libre Baskerville', ui-serif, Georgia, serif", category: 'Serif' },
  { id: 'crimson', label: 'Crimson Text', stack: "'Crimson Text', ui-serif, Georgia, serif", category: 'Serif' },
  { id: 'bricolage', label: 'Bricolage Grotesque', stack: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif", category: 'Display' },
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
  { type: 'wipe-left', label: 'Wipe left' },
  { type: 'wipe-right', label: 'Wipe right' },
  { type: 'push-up', label: 'Push up' },
  { type: 'push-down', label: 'Push down' },
  { type: 'blur', label: 'Blur' },
  { type: 'bounce', label: 'Bounce' },
  { type: 'flip', label: 'Flip' },
];

export const TEXT_ANIMATION_OPTIONS: { type: TextAnimationType; label: string; phase?: TextAnimationPhase }[] = [
  { type: 'none', label: 'None' },
  { type: 'fade-in', label: 'Fade in', phase: 'entrance' },
  { type: 'fade-up', label: 'Fade up', phase: 'entrance' },
  { type: 'slide-up', label: 'Slide up', phase: 'entrance' },
  { type: 'slide-down', label: 'Slide down', phase: 'entrance' },
  { type: 'slide-left', label: 'Slide left', phase: 'entrance' },
  { type: 'slide-right', label: 'Slide right', phase: 'entrance' },
  { type: 'slide-in-line', label: 'Slide in line', phase: 'entrance' },
  { type: 'zoom-in', label: 'Zoom in', phase: 'entrance' },
  { type: 'bounce', label: 'Bounce', phase: 'entrance' },
  { type: 'bounce-in', label: 'Bounce in', phase: 'entrance' },
  { type: 'pop', label: 'Pop', phase: 'entrance' },
  { type: 'word-pop', label: 'Word pop', phase: 'entrance' },
  { type: 'typewriter', label: 'Typewriter', phase: 'entrance' },
  { type: 'pulse', label: 'Pulse', phase: 'emphasis' },
  { type: 'glow-pulse', label: 'Glow pulse', phase: 'emphasis' },
  { type: 'scale-highlight', label: 'Scale highlight', phase: 'emphasis' },
  { type: 'karaoke-wipe', label: 'Karaoke wipe', phase: 'emphasis' },
  { type: 'karaoke-fill', label: 'Karaoke fill', phase: 'emphasis' },
  { type: 'colour-sweep', label: 'Colour sweep', phase: 'emphasis' },
];

export const DEFAULT_LYRICS_DISPLAY: LyricsDisplayOptions = {
  fontFamily: 'plus-jakarta',
  fontSize: 28,
  activeColor: '#FFFFFF',
  upcomingColor: 'rgba(255,255,255,0.45)',
  pastColor: 'rgba(255,255,255,0.28)',
  position: 'bottom',
  showUpcoming: true,
  showPast: true,
  background: false,
  backgroundColor: 'rgba(31,27,77,0.55)',
  leadInMs: 0,
};

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
