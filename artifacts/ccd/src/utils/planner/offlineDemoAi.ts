/**
 * Offline / demo-login AI stubs — no network, no API keys.
 * Used when demo mode is active or the flesh-out API is unreachable.
 */

import { isDemoModeActive } from '../demoMode.ts';

export const OFFLINE_AI_THINK_MS = 1000;

export function preferOfflineDemoAi(): boolean {
  return isDemoModeActive();
}

export function sleepOfflineThink(ms = OFFLINE_AI_THINK_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRomeoJulietContext(...parts: Array<string | undefined | null>): boolean {
  const blob = parts.filter(Boolean).join(' ').toLowerCase();
  return /romeo|juliet|r\s*&\s*j|r and j|prokofiev|macmillan|create\s*&\s*dance|create and dance/.test(
    blob,
  );
}

export type OfflineSuggestedActivity = {
  title: string;
  description: string;
  activityText: string;
  durationMins: number;
  category: string;
  teacherCues: string;
};

export type OfflineLessonFill = {
  lessonTitle: string;
  learningOutcome: string;
  successCriteria: string;
  vocabularyHtml: string;
  teacherQuestions: { opening: string[]; during: string[]; plenary: string[] };
  differentiation: {
    support: string;
    core: string;
    challenge: string;
    sendEal: string;
  };
  sectionNote: (sectionTitle: string, instruction: string) => string;
  suggestedActivities: OfflineSuggestedActivity[];
};

/** Subject-neutral generic fill (no MUSIC / Rhythmstix / Jazz North branding). */
export function genericOfflineLessonFill(title: string): OfflineLessonFill {
  const t = title.trim() || 'this lesson';
  return {
    lessonTitle: t.toLowerCase().includes('untitled') || t === 'this lesson'
      ? 'Creative exploration — listen, make, share'
      : t,
    learningOutcome: `By the end of “${t}”, pupils will try one practical approach, name a choice they made, and share a short outcome with a partner.`,
    successCriteria: [
      '• I can take part with a clear role',
      '• I can name one technique or idea I used',
      '• I can tell a partner what I would change next time',
    ].join('\n'),
    vocabularyHtml:
      '<p><strong>Explore</strong> · <strong>Share</strong> · <strong>Reflect</strong> · <strong>Collaborate</strong> · <strong>Refine</strong></p>',
    teacherQuestions: {
      opening: [`What do you already notice about “${t}”?`],
      during: ['What is working well — and what will you try next?'],
      plenary: ['What is one thing you would keep, and one thing you would change?'],
    },
    differentiation: {
      support: 'Offer a simpler starting prompt and model the first step together.',
      core: `Complete the main task for “${t}” using the success criteria as a checklist.`,
      challenge: 'Justify one creative choice to a partner in 20 seconds.',
      sendEal: 'Provide key vocabulary cards and allow draw/gesture responses first.',
    },
    sectionNote: (sectionTitle, instruction) =>
      `<p><strong>Teacher note</strong> — ${escapeHtml(sectionTitle)}: ${escapeHtml(instruction || 'Keep it practical and pupil-led.')}</p>
<p><em>Teacher cue:</em> Give a clear start signal, circulate with one coaching prompt, then invite a 20-second share.</p>`,
    suggestedActivities: [
      {
        title: 'Warm-up: notice and copy',
        description:
          '<p>Pupils warm up by noticing a short model, copying one idea safely, then adding a small variation.</p>',
        activityText:
          '<p>1. Watch/listen once.<br>2. Copy one idea together.<br>3. Add your own variation.<br>4. Share with a partner.</p>',
        durationMins: 8,
        category: 'Warm-up',
        teacherCues: 'Keep energy calm; praise clear starts and stops.',
      },
      {
        title: 'Explore: make and refine',
        description:
          '<p>In pairs or small groups, pupils build a short response to the lesson focus and refine it once.</p>',
        activityText:
          '<p>1. Agree a starting idea.<br>2. Rehearse for 3 minutes.<br>3. Change one element.<br>4. Rehearse again.</p>',
        durationMins: 15,
        category: 'Main',
        teacherCues: 'Ask: “What did you change, and why?”',
      },
      {
        title: 'Share and reflect',
        description:
          '<p>Groups share a short extract; classmates name one strength and one next step.</p>',
        activityText:
          '<p>1. Share 20–30 seconds.<br>2. Peer feedback: one keep, one change.<br>3. Exit ticket: one word for today’s learning.</p>',
        durationMins: 10,
        category: 'Plenary',
        teacherCues: 'Time-box shares; model kind, specific feedback.',
      },
    ],
  };
}

/** Romeo & Juliet cross-curricular demo (Music, Drama, Dance, Art). */
export function romeoJulietOfflineLessonFill(title: string): OfflineLessonFill {
  const t = title.trim() || 'Romeo and Juliet';
  return {
    lessonTitle: /romeo|juliet/i.test(t)
      ? t
      : 'Romeo and Juliet — story, motif and mood',
    learningOutcome:
      'By the end of this lesson, pupils will explore the Romeo and Juliet story through music, drama, dance and art: shape a short motif, show character or mood, and explain one creative choice.',
    successCriteria: [
      '• I can show a clear motif or gesture linked to a character or mood',
      '• I can work with others to structure a short shared moment',
      '• I can name how music, drama, dance or art helped tell the story',
    ].join('\n'),
    vocabularyHtml:
      '<p><strong>Motif</strong> · <strong>Mood</strong> · <strong>Character</strong> · <strong>Conflict</strong> · <strong>Counterpoint</strong> · <strong>Tableau</strong> · <strong>Score</strong></p>',
    teacherQuestions: {
      opening: [
        'What do you already know about Romeo and Juliet — story, characters, or mood?',
        'Which art form will help you show Capulet vs Montague tension today?',
      ],
      during: [
        'How does your motif change when the mood shifts from celebration to conflict?',
        'Where could music, stillness, or a visual image make the story clearer?',
      ],
      plenary: [
        'Which moment best showed the story — and which art form carried it?',
        'What would you refine if you had two more minutes?',
      ],
    },
    differentiation: {
      support:
        'Offer a simple two-move motif and word bank (love, conflict, fate). Pair stronger peers as guides.',
      core: 'Build a short Romeo and Juliet moment using at least two art forms (e.g. dance + drama, or music + tableau).',
      challenge:
        'Add counterpoint: two groups show opposing moods at once, then resolve into a shared final image.',
      sendEal:
        'Use character image cards and gesture-first responses; allow drawing a mood colour before speaking.',
    },
    sectionNote: (sectionTitle, instruction) =>
      `<p><strong>Teacher note</strong> — ${escapeHtml(sectionTitle)}: ${escapeHtml(instruction || 'Link every task back to story, motif and mood.')}</p>
<p><em>Teacher cue:</em> “Show me Capulet energy in 5 seconds… now Montague… freeze.”</p>`,
    suggestedActivities: [
      {
        title: 'Warm-up: Capulet / Montague pulse',
        description:
          '<p>Music & dance: pupils move on a shared pulse, switching between two contrasting family motifs.</p>',
        activityText:
          '<p>1. Learn motif A (Capulet) and motif B (Montague).<br>2. Switch on a cue.<br>3. Freeze in a tableau that shows tension.</p>',
        durationMins: 8,
        category: 'Warm-up',
        teacherCues: 'Use a clear auditory cue; keep spacing safe.',
      },
      {
        title: 'Drama: balcony thought-track',
        description:
          '<p>Drama: pairs create a short thought-track for Romeo or Juliet, then add a still image.</p>',
        activityText:
          '<p>1. Choose a character.<br>2. Speak one inner thought.<br>3. Partner echoes with a gesture.<br>4. Hold a shared tableau.</p>',
        durationMins: 12,
        category: 'Drama',
        teacherCues: 'Encourage clear projection; no forced romance stereotypes.',
      },
      {
        title: 'Art & music: mood score',
        description:
          '<p>Art + music: sketch a simple visual score for a mood shift, then perform it with body percussion or found sounds.</p>',
        activityText:
          '<p>1. Draw three mood panels (hope → conflict → resolve).<br>2. Assign a sound or gesture to each.<br>3. Perform the score once, then refine.</p>',
        durationMins: 15,
        category: 'Art',
        teacherCues: 'Display panels; keep volume classroom-safe.',
      },
      {
        title: 'Share: story through motif',
        description:
          '<p>Groups share a 30-second extract blending at least two disciplines; peers name the story beat they saw.</p>',
        activityText:
          '<p>1. Rehearse extract.<br>2. Perform.<br>3. Audience: name character, mood, and art forms used.</p>',
        durationMins: 10,
        category: 'Plenary',
        teacherCues: 'Celebrate cross-curricular choices, not polish alone.',
      },
    ],
  };
}

export function offlineLessonFillFor(
  title: string,
  ...contextParts: Array<string | undefined | null>
): OfflineLessonFill {
  return isRomeoJulietContext(title, ...contextParts)
    ? romeoJulietOfflineLessonFill(title)
    : genericOfflineLessonFill(title);
}

export type OfflineFleshOutOptions = {
  includeOutcomes: boolean;
  includeSuccessCriteria: boolean;
  includeTeacherQuestions: boolean;
  includeDifferentiation: boolean;
  wholeLesson: boolean;
  sectionId?: string;
};

/** Pure offline flesh-out payload (no network / supabase). */
export function buildOfflineFleshOutPayload(input: {
  instruction: string;
  lesson: {
    title?: string;
    activities?: Array<{ name?: string; activity?: string; description?: string }>;
    sections?: Array<{
      id: string;
      title: string;
      kind: string;
      bodyHtml?: string;
      durationMins?: number;
      activity?: { activity?: string; name?: string; description?: string };
    }>;
  };
  options: OfflineFleshOutOptions;
}) {
  const title = (input.lesson.title || 'this lesson').trim();
  const activityNames = (input.lesson.activities || [])
    .map((a) => a.name || a.activity)
    .filter(Boolean) as string[];
  const note = input.instruction.trim() || 'Make it practical';
  const fill = offlineLessonFillFor(
    title,
    note,
    activityNames.join(' '),
    ...(input.lesson.sections || []).map((s) => s.title),
  );

  const sections = input.lesson.sections || [];
  const sectionBodies = input.options.sectionId
    ? sections
        .filter((s) => s.id === input.options.sectionId)
        .map((s) => ({
          sectionId: s.id,
          bodyHtml: fill.sectionNote(s.title, note),
        }))
    : sections
        .filter((s) => s.kind !== 'activity' && !(s.bodyHtml || '').trim())
        .map((s) => ({
          sectionId: s.id,
          bodyHtml: fill.sectionNote(s.title, note),
        }));

  const wholeLessonSections = input.options.wholeLesson
    ? sections.map((s, i) => {
        if (s.kind === 'activity') {
          const actName = s.activity?.activity || s.activity?.name || s.title;
          const cues =
            fill.suggestedActivities[i % fill.suggestedActivities.length]?.teacherCues ||
            'Circulate with one coaching prompt.';
          return {
            sectionId: s.id,
            title: s.title,
            durationMins: s.durationMins || 5 + (i % 3) * 5,
            bodyHtml: `<p><strong>${escapeHtml(actName)}</strong> — refine timing and teacher cues.</p>
<p>${escapeHtml(s.activity?.description || note)}</p>
<p><em>Teacher cue:</em> ${escapeHtml(cues)}</p>`,
          };
        }
        return {
          sectionId: s.id,
          title: s.title,
          durationMins: 5 + (i % 3) * 5,
          bodyHtml: fill.sectionNote(s.title, note),
        };
      })
    : [];

  const activityCount = sections.filter((s) => s.kind === 'activity').length;
  const suggestedActivities =
    input.options.wholeLesson && activityCount < 2 ? fill.suggestedActivities : undefined;

  return {
    learningOutcome: input.options.includeOutcomes ? fill.learningOutcome : '',
    successCriteria: input.options.includeSuccessCriteria ? fill.successCriteria : '',
    teacherQuestions: input.options.includeTeacherQuestions
      ? fill.teacherQuestions
      : { opening: [] as string[], during: [] as string[], plenary: [] as string[] },
    differentiation: input.options.includeDifferentiation
      ? fill.differentiation
      : { support: '', core: '', challenge: '', sendEal: '' },
    selectedStatementIds: [] as string[],
    wholeLessonSections,
    sectionBodies,
    lessonTitle: fill.lessonTitle,
    vocabularyHtml: fill.vocabularyHtml,
    suggestedActivities,
  };
}

/** Polish / rewrite an activity description (introduction or activity text). */
export function offlineHelpMeWrite(input: {
  title?: string;
  currentHtml?: string;
  tab: 'introduction' | 'activity';
  lessonHint?: string;
}): string {
  const fill = offlineLessonFillFor(input.title || '', input.lessonHint, input.currentHtml);
  const name = (input.title || 'this activity').trim() || 'this activity';
  if (input.tab === 'introduction') {
    if (isRomeoJulietContext(name, input.lessonHint, input.currentHtml)) {
      return `<p><strong>${escapeHtml(name)}</strong> introduces a Romeo and Juliet idea through clear mood and character.</p>
<p>Pupils connect story, sound, movement and image before they make their own short response.</p>
<p>${fill.suggestedActivities[0]?.teacherCues || ''}</p>`;
    }
    return `<p><strong>${escapeHtml(name)}</strong> sets up today’s creative focus.</p>
<p>Pupils notice a model, try one idea safely, then prepare to make and share a short response.</p>`;
  }
  if (isRomeoJulietContext(name, input.lessonHint, input.currentHtml)) {
    return `<p><strong>Steps</strong></p>
<ol>
<li>Recall the story beat (character or mood).</li>
<li>Build a short motif using music, drama, dance or art.</li>
<li>Rehearse once, then change one element for contrast.</li>
<li>Share 20–30 seconds and name the story choice you made.</li>
</ol>
<p><em>Teacher cue:</em> ${escapeHtml(fill.suggestedActivities[1]?.teacherCues || 'Keep motifs clear and safe.')}</p>`;
  }
  return `<p><strong>Steps</strong></p>
<ol>
<li>Notice the model or starting prompt.</li>
<li>Try the core idea with a clear role.</li>
<li>Refine one element with a partner.</li>
<li>Share briefly and note one next step.</li>
</ol>
<p><em>Teacher cue:</em> Circulate with one coaching question; time-box the share.</p>`;
}

export function offlinePolishBodies(lessonTitle?: string): {
  sequence: string;
  objectives: string;
  differentiation: string;
  learningOutcome: string;
  successCriteria: string;
} {
  const fill = offlineLessonFillFor(lessonTitle || '');
  return {
    sequence: isRomeoJulietContext(lessonTitle)
      ? 'Polish · sequence: Capulet/Montague warm-up → motif exploration (music/drama/dance/art) → shared story moment → short reflection.'
      : 'Polish · sequence: Warm-up → explore → share/perform → short reflection.',
    objectives: isRomeoJulietContext(lessonTitle)
      ? 'Polish · success: Prefer clear “I can…” statements about motif, mood, character and cross-curricular choices.'
      : 'Polish · success: Prefer clear “I can…” statements tied to what pupils actually do in this lesson.',
    differentiation: isRomeoJulietContext(lessonTitle)
      ? 'Polish · inclusion: Motif cards for support; counterpoint extension for challenge; gesture-first options for SEND/EAL.'
      : 'Polish · inclusion: Scaffold for new learners; offer a creative extension for those ready for more.',
    learningOutcome: fill.learningOutcome,
    successCriteria: fill.successCriteria,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
