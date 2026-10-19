import type { InteractiveLesson } from '../types';
import { createId, emptyScene } from '../types';

/**
 * Partner-hub slides decks seeded for the prototype "From hubs" library tab.
 * These become available when teachers browse Partner Hub resources (local demo
 * always includes them so the tab is never empty).
 */
export function buildHubSlidesDecks(): InteractiveLesson[] {
  const now = new Date().toISOString();

  const lso: InteractiveLesson = {
    id: 'hub-slides-lso-orchestra-warmup',
    title: 'LSO · Orchestra warm-up slides',
    description:
      'Partner Hub pack: title, listening focus, and a short karaoke rhythm warm-up for KS2.',
    ownerId: 'hub-lso',
    ownerEmail: 'hubs@ccd.preview',
    status: 'published',
    source: 'hub',
    hubId: 'lso',
    hubName: 'London Symphony Orchestra',
    tags: ['orchestra', 'warm-up', 'listening', 'ks2'],
    subject: 'Music',
    attachedLessonKeys: [],
    createdAt: now,
    updatedAt: now,
    mediaLibrary: [],
    scenes: [
      {
        ...emptyScene('title', {
          id: 'hub-lso-s1',
          title: 'Welcome',
          backgroundColor: '#1F1B4D',
          overlays: [
            {
              id: createId('ov'),
              text: 'Build an Orchestra',
              style: 'headline',
              x: 8,
              y: 34,
              width: 84,
              color: '#FFFFFF',
              fontSize: 40,
              fontFamily: 'plus-jakarta',
            },
            {
              id: createId('ov'),
              text: 'LSO Discover · KS2 warm-up',
              style: 'subtitle',
              x: 8,
              y: 58,
              width: 84,
              color: '#FFC93C',
              fontSize: 20,
              fontFamily: 'playfair',
            },
          ],
        }),
      },
      {
        ...emptyScene('text', {
          id: 'hub-lso-s2',
          title: 'Listening focus',
          backgroundColor: '#4338E8',
          overlays: [
            {
              id: createId('ov'),
              text: 'What families can you hear?',
              style: 'headline',
              x: 10,
              y: 36,
              width: 80,
              color: '#FFFFFF',
              fontSize: 34,
            },
          ],
        }),
      },
      {
        ...emptyScene('lyrics', {
          id: 'hub-lso-s3',
          title: 'Clap the pulse',
          backgroundColor: '#1F1B4D',
          durationMs: 16000,
          lyrics: [
            {
              id: createId('ly'),
              text: 'Clap clap rest — feel the pulse',
              startMs: 0,
              endMs: 4000,
              words: [
                { id: createId('w'), text: 'Clap', startMs: 0, endMs: 600 },
                { id: createId('w'), text: 'clap', startMs: 700, endMs: 1300 },
                { id: createId('w'), text: 'rest', startMs: 1500, endMs: 2200 },
                { id: createId('w'), text: '—', startMs: 2300, endMs: 2500 },
                { id: createId('w'), text: 'feel', startMs: 2600, endMs: 3100 },
                { id: createId('w'), text: 'the', startMs: 3200, endMs: 3500 },
                { id: createId('w'), text: 'pulse', startMs: 3600, endMs: 4000 },
              ],
            },
          ],
        }),
      },
    ],
  };

  const ems: InteractiveLesson = {
    id: 'hub-slides-ems-singing-assembly',
    title: 'EMS · Singing assembly slides',
    description:
      'Essex Music Services hub deck: gathering song title, lyrics call-and-response, and a YouTube listen-along.',
    ownerId: 'hub-ems',
    ownerEmail: 'hubs@ccd.preview',
    status: 'published',
    source: 'hub',
    hubId: 'ems',
    hubName: 'Essex Music Services',
    tags: ['singing', 'assembly', 'ks1', 'ks2', 'choir'],
    subject: 'Music',
    attachedLessonKeys: [],
    createdAt: now,
    updatedAt: now,
    mediaLibrary: [],
    scenes: [
      {
        ...emptyScene('title', {
          id: 'hub-ems-s1',
          title: 'Assembly',
          backgroundColor: '#002D24',
          overlays: [
            {
              id: createId('ov'),
              text: 'Singing Assembly',
              style: 'headline',
              x: 8,
              y: 36,
              width: 84,
              color: '#FFFFFF',
              fontSize: 42,
            },
            {
              id: createId('ov'),
              text: 'Essex Music Services',
              style: 'subtitle',
              x: 8,
              y: 60,
              width: 84,
              color: '#B6FF7E',
              fontSize: 20,
            },
          ],
        }),
      },
      {
        ...emptyScene('lyrics', {
          id: 'hub-ems-s2',
          title: 'Call and response',
          backgroundColor: '#002D24',
          durationMs: 20000,
          lyrics: [
            {
              id: createId('ly'),
              text: 'Hello friends — we sing together',
              startMs: 0,
              endMs: 5000,
            },
          ],
        }),
      },
      {
        ...emptyScene('youtube', {
          id: 'hub-ems-s3',
          title: 'Listen along',
          embedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          notes: 'Replace with hub-approved listen-along link in production.',
        }),
      },
      {
        ...emptyScene('text', {
          id: 'hub-ems-s4',
          title: 'Reflect',
          backgroundColor: '#1F1B4D',
          overlays: [
            {
              id: createId('ov'),
              text: 'What made the song feel strong?',
              style: 'headline',
              x: 10,
              y: 40,
              width: 80,
              color: '#FFC93C',
              fontSize: 32,
            },
          ],
        }),
      },
    ],
  };

  return [lso, ems];
}
