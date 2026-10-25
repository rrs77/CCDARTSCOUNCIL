import type { InteractiveLesson } from '../types';
import { createId } from '../types';
import {
  DEMO_INTRO_DURATION_MS,
  DEMO_INTRO_SCENE_ID,
  DEMO_INTRO_VIDEO,
  DEMO_LESSON_ID,
} from './demoGuard';
import { CCD_LOGO_COLOUR_PATH } from '../../../utils/brandLogo';
import { normalizeCanvaEmbedUrl } from '../utils/canvaEmbed';

const INTRO_VIDEO = DEMO_INTRO_VIDEO;
const KARAOKE_AUDIO = '/interactive-lessons/sample-karaoke-placeholder.mp3';
const LOGO = CCD_LOGO_COLOUR_PATH;

/** Public Canva view/embed used elsewhere in the demo curriculum (classroom example). */
const DEMO_CANVA_EMBED = normalizeCanvaEmbedUrl(
  'https://www.canva.com/design/DAHCD56d7sA/ip6Kq4MhJ4gRUhq6pVno6Q/view',
);

/**
 * Polished demo interactive lesson shipped with the prototype.
 * Scenes: intro sting → title → lyrics (vocals) → audio → Canva → PowerPoint → image.
 * One video example only (lyrics/vocals); no separate YouTube sample scene.
 */
export function buildDemoInteractiveLesson(ownerId = 'system-demo'): InteractiveLesson {
  const now = new Date().toISOString();

  return {
    id: DEMO_LESSON_ID,
    title: 'CCDesigner Slides Demo',
    description:
      'Classroom-ready sample slides: intro sting, title, lyric video with timed lyrics, audio, Canva and PowerPoint examples.',
    ownerId,
    ownerEmail: 'demo@ccd.preview',
    status: 'published',
    isDemo: true,
    attachedLessonKeys: [],
    createdAt: now,
    updatedAt: now,
    mediaLibrary: [
      {
        id: createId('media'),
        name: 'CCDesigner intro sting',
        kind: 'video',
        url: INTRO_VIDEO,
        durationMs: DEMO_INTRO_DURATION_MS,
        addedAt: now,
      },
      {
        id: createId('media'),
        name: 'Sample lyric audio bed',
        kind: 'audio',
        url: KARAOKE_AUDIO,
        durationMs: 32000,
        addedAt: now,
      },
      {
        id: createId('media'),
        name: 'CCDesigner logo',
        kind: 'image',
        url: LOGO,
        addedAt: now,
      },
    ],
    scenes: [
      {
        id: DEMO_INTRO_SCENE_ID,
        type: 'video',
        title: 'Intro sting',
        durationMs: DEMO_INTRO_DURATION_MS,
        advanceMode: 'media-end',
        transition: { type: 'fade', durationMs: 400 },
        mediaUrl: INTRO_VIDEO,
        overlays: [],
        notes: '8-second CCDesigner logo sting — no lyrics track.',
      },
      {
        id: 'demo-scene-title',
        type: 'title',
        title: 'Title slide',
        durationMs: 4500,
        advanceMode: 'timer',
        advanceAfterMs: 4500,
        transition: { type: 'zoom', durationMs: 600 },
        backgroundColor: '#1F1B4D',
        overlays: [
          {
            id: 'ov-title-1',
            text: 'Welcome to Interactive Lessons',
            style: 'headline',
            x: 8,
            y: 32,
            width: 84,
            color: '#FFFFFF',
            fontSize: 44,
            fontFamily: 'plus-jakarta',
            animation: { type: 'slide-up', durationMs: 700 },
          },
          {
            id: 'ov-title-2',
            text: 'Exceptional lessons start with connection.',
            style: 'subtitle',
            x: 8,
            y: 58,
            width: 84,
            color: '#FFC93C',
            fontSize: 24,
            fontFamily: 'playfair',
            animation: { type: 'fade-in', durationMs: 900, delayMs: 200 },
          },
        ],
      },
      {
        id: 'demo-scene-karaoke',
        type: 'lyrics',
        title: 'Lyric video sample',
        durationMs: 32000,
        advanceMode: 'media-end',
        transition: { type: 'dissolve', durationMs: 700 },
        mediaUrl: KARAOKE_AUDIO,
        karaokeTracks: {
          vocalUrl: KARAOKE_AUDIO,
          backingUrl: KARAOKE_AUDIO,
          defaultVersion: 'vocals',
        },
        backgroundColor: '#1F1B4D',
        lyricsDisplay: {
          fontFamily: 'fredoka',
          fontSize: 30,
          activeColor: '#FFC93C',
          upcomingColor: 'rgba(255,255,255,0.45)',
          pastColor: 'rgba(255,255,255,0.28)',
          position: 'bottom',
          showUpcoming: true,
          showPast: true,
          background: true,
          backgroundColor: 'rgba(31,27,77,0.55)',
        },
        notes:
          'SAMPLE — timed lyrics for classroom lyric video demo (vocals / backing toggle).',
        overlays: [],
        lyrics: [
          { id: 'ly1', text: 'Clap your hands and find the beat', startMs: 0, endMs: 4000 },
          { id: 'ly2', text: 'Stamp your feet and feel the heat', startMs: 4000, endMs: 8000 },
          { id: 'ly3', text: 'Sing together, loud and clear', startMs: 8000, endMs: 12000 },
          { id: 'ly4', text: 'Music brings us all right here', startMs: 12000, endMs: 16000 },
          { id: 'ly5', text: 'Echo soft, then echo strong', startMs: 16000, endMs: 20000 },
          { id: 'ly6', text: 'Keep the pulse and join the song', startMs: 20000, endMs: 24000 },
          { id: 'ly7', text: 'One more time from the start', startMs: 24000, endMs: 28000 },
          { id: 'ly8', text: 'Rhythm lives inside your heart', startMs: 28000, endMs: 32000 },
        ],
      },
      {
        id: 'demo-scene-audio',
        type: 'audio',
        title: 'Audio listening',
        durationMs: 12000,
        advanceMode: 'media-end',
        transition: { type: 'fade', durationMs: 400 },
        mediaUrl: KARAOKE_AUDIO,
        backgroundColor: '#4338E8',
        overlays: [
          {
            id: 'ov-aud-1',
            text: 'Listening focus',
            style: 'headline',
            x: 10,
            y: 36,
            width: 80,
            color: '#FFFFFF',
            fontSize: 40,
          },
          {
            id: 'ov-aud-2',
            text: 'Close your eyes and follow the pulse.',
            style: 'subtitle',
            x: 10,
            y: 56,
            width: 80,
            color: '#FFC93C',
            fontSize: 22,
          },
        ],
      },
      {
        id: 'demo-scene-canva',
        type: 'canva',
        title: 'Canva design',
        durationMs: 12000,
        advanceMode: 'manual',
        transition: { type: 'fade', durationMs: 500 },
        backgroundColor: '#1F1B4D',
        embedUrl: DEMO_CANVA_EMBED,
        posterUrl: LOGO,
        overlays: [],
        notes:
          'Example Canva embed (public view link). In your own decks, paste Share → More → Embed.',
      },
      {
        id: 'demo-scene-ppt',
        type: 'powerpoint',
        title: 'PowerPoint',
        durationMs: 12000,
        advanceMode: 'manual',
        transition: { type: 'slide', durationMs: 500 },
        backgroundColor: '#F4F3FA',
        posterUrl: LOGO,
        overlays: [
          {
            id: 'ov-ppt-eyebrow',
            text: 'EXAMPLE POWERPOINT SLIDE',
            style: 'body',
            x: 8,
            y: 10,
            width: 84,
            color: '#4338E8',
            fontSize: 14,
            fontFamily: 'plus-jakarta',
          },
          {
            id: 'ov-ppt-1',
            text: 'Lesson warm-up agenda',
            style: 'headline',
            x: 8,
            y: 22,
            width: 84,
            color: '#1F1B4D',
            fontSize: 36,
            fontFamily: 'plus-jakarta',
          },
          {
            id: 'ov-ppt-2',
            text: '1. Pulse game (2 min)   2. Echo clap (3 min)   3. Sing the hook (5 min)',
            style: 'subtitle',
            x: 8,
            y: 48,
            width: 84,
            color: '#5F5B7A',
            fontSize: 20,
          },
          {
            id: 'ov-ppt-3',
            text: 'Paste an Office Online or SharePoint embed URL to show a live .pptx here.',
            style: 'body',
            x: 8,
            y: 72,
            width: 84,
            color: '#77738F',
            fontSize: 16,
          },
        ],
        notes:
          'Clearly labelled example slide content. Teachers can replace this with an Office Online embed of their own deck.',
      },
      {
        id: 'demo-scene-image',
        type: 'image',
        title: 'Image + text',
        durationMs: 5000,
        advanceMode: 'timer',
        advanceAfterMs: 5000,
        transition: { type: 'zoom', durationMs: 450 },
        mediaUrl: LOGO,
        backgroundColor: '#F4F3FA',
        overlays: [
          {
            id: 'ov-img-1',
            text: 'Exceptional lessons start with connection.',
            style: 'headline',
            x: 8,
            y: 72,
            width: 84,
            color: '#1F1B4D',
            fontSize: 28,
          },
        ],
      },
    ],
  };
}
