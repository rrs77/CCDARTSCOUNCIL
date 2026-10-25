import { supabase } from '../../config/supabase';

export type FleshOutOptions = {
  includeOutcomes: boolean;
  includeSuccessCriteria: boolean;
  includeTeacherQuestions: boolean;
  includeDifferentiation: boolean;
  includeAssessment?: boolean;
  autoPickCurriculum: boolean;
  wholeLesson: boolean;
  sectionId?: string;
};

export type FleshOutCurriculumStatement = {
  id: string;
  text: string;
  strand?: string;
  keyStage?: string;
  subject?: string;
};

export type FleshOutResult = {
  learningOutcome: string;
  successCriteria: string;
  assessment?: string;
  teacherQuestions: { opening: string[]; during: string[]; plenary: string[] };
  differentiation: {
    support: string;
    core: string;
    challenge: string;
    sendEal: string;
  };
  selectedStatementIds: string[];
  wholeLessonSections: Array<{
    sectionId: string;
    title: string;
    durationMins?: number;
    bodyHtml: string;
  }>;
  sectionBodies: Array<{ sectionId: string; bodyHtml: string }>;
};

export type FleshOutResponse =
  | { ok: true; result: FleshOutResult; pickedByAi: boolean; model?: string; offlineDemo?: boolean }
  | { ok: false; message: string; code?: string; status: number };

export type FleshOutAvailability = {
  /** True when generation can run (live OpenAI or offline demo) and AI add-on allows it. */
  available: boolean;
  /** Live OpenAI key is configured on the API server. */
  live: boolean;
  /** Local/offline deterministic stub (no key, no network). */
  offlineDemo: boolean;
  /** Org has organisations.ai_addon (or caller is super admin). */
  aiAddon: boolean;
  message?: string;
  code?: string;
};

const LOCAL_API_HINT =
  'AI needs the API server running (port 8080) or VITE_API_PROXY_TARGET set. Offline demo mode is active until then.';

async function authHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function isUnreachableProxyResponse(res: Response, body: unknown): boolean {
  if (res.status === 502 || res.status === 503 || res.status === 504) return true;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return true;
  // Empty / HTML-parsed-as-{} from a dead proxy
  if (!body || typeof body !== 'object') return true;
  return false;
}

/**
 * Safe offline demo — restored after ccf788c removed the client stub.
 * Deterministic, no keys; avoids the generic filler phrases banned on the live path.
 */
export function buildOfflineDemoFleshOut(input: {
  instruction: string;
  lesson: {
    title?: string;
    activities?: Array<{ name?: string; activity?: string }>;
    sections?: Array<{ id: string; title: string; kind: string; bodyHtml?: string }>;
  };
  options: FleshOutOptions;
}): FleshOutResult {
  const title = (input.lesson.title || 'this lesson').trim();
  const activityNames = (input.lesson.activities || [])
    .map((a) => a.name || a.activity)
    .filter(Boolean)
    .slice(0, 3);
  const named = activityNames.length ? activityNames.join(', ') : title;
  const note = input.instruction.trim() || 'Make it practical';

  const learningOutcome = input.options.includeOutcomes
    ? `By the end of “${title}”, pupils will complete ${named} and explain one concrete choice they made.`
    : '';
  const successCriteria = input.options.includeSuccessCriteria
    ? [
        `• I can take part in ${activityNames[0] || 'the main activity'} with a clear role`,
        '• I can name one technique or idea I used',
        '• I can tell a partner what I would change next time',
      ].join('\n')
    : '';

  const teacherQuestions = input.options.includeTeacherQuestions
    ? {
        opening: [`What do you already know about “${title}”?`],
        during: [`During ${activityNames[0] || 'the activity'}, what is working — and what will you try next?`],
        plenary: ['What is one thing you would keep, and one thing you would change?'],
      }
    : { opening: [], during: [], plenary: [] };

  const differentiation = input.options.includeDifferentiation
    ? {
        support: 'Offer a simpler starting prompt and model the first step together.',
        core: `Complete ${named} with the success criteria as a checklist.`,
        challenge: 'Add a stretch: justify one creative choice to a partner in 20 seconds.',
        sendEal: 'Provide key vocabulary cards and allow draw/gesture responses first.',
      }
    : { support: '', core: '', challenge: '', sendEal: '' };

  const sections = input.lesson.sections || [];
  const sectionBodies =
    input.options.sectionId
      ? sections
          .filter((s) => s.id === input.options.sectionId)
          .map((s) => ({
            sectionId: s.id,
            bodyHtml: `<p><strong>Teacher note (offline demo)</strong> for “${escapeHtml(s.title)}”: ${escapeHtml(note)}</p>`,
          }))
      : sections
          .filter((s) => s.kind !== 'activity' && !(s.bodyHtml || '').trim())
          .map((s) => ({
            sectionId: s.id,
            bodyHtml: `<p><strong>Teacher note (offline demo)</strong> for “${escapeHtml(s.title)}”: ${escapeHtml(note)}</p>`,
          }));

  const wholeLessonSections = input.options.wholeLesson
    ? sections
        .filter((s) => s.kind !== 'activity')
        .map((s, i) => ({
          sectionId: s.id,
          title: s.title,
          durationMins: 5 + (i % 3) * 5,
          bodyHtml: `<p><strong>Offline demo sequence</strong> — ${escapeHtml(s.title)}: ${escapeHtml(note)}</p>`,
        }))
    : [];

  return {
    learningOutcome,
    successCriteria,
    assessment: input.options.includeAssessment !== false
      ? `Look for pupils taking part in ${named} with a clear role.`
      : '',
    teacherQuestions,
    differentiation,
    selectedStatementIds: [],
    wholeLessonSections,
    sectionBodies,
  };
}

export async function checkFleshOutAvailable(): Promise<FleshOutAvailability> {
  try {
    const res = await fetch('/api/interactive-lessons/flesh-out', {
      method: 'GET',
      headers: await authHeader(),
    });
    const body = await res.json().catch(() => null);

    if (isUnreachableProxyResponse(res, body)) {
      return {
        available: true,
        live: false,
        offlineDemo: true,
        aiAddon: true,
        message: LOCAL_API_HINT,
      };
    }

    const aiAddon = body?.aiAddon === true;
    if (body && typeof body === 'object' && 'available' in body) {
      if (body.available) {
        return {
          available: aiAddon,
          live: true,
          offlineDemo: false,
          aiAddon,
          message: aiAddon
            ? body.message
            : 'AI add-on required',
          code: aiAddon ? undefined : 'ai_addon_required',
        };
      }
      // Server reached but OPENAI_API_KEY missing — offline demo only when add-on allows.
      return {
        available: aiAddon,
        live: false,
        offlineDemo: aiAddon,
        aiAddon,
        message: aiAddon
          ? (typeof body.message === 'string' && body.message) ||
            'OPENAI_API_KEY is not set on the API server. Offline demo mode is active.'
          : 'AI add-on required',
        code: aiAddon ? undefined : 'ai_addon_required',
      };
    }

    return {
      available: true,
      live: false,
      offlineDemo: true,
      aiAddon: true,
      message: LOCAL_API_HINT,
    };
  } catch {
    return {
      available: true,
      live: false,
      offlineDemo: true,
      aiAddon: true,
      message: LOCAL_API_HINT,
    };
  }
}

export async function requestFleshOut(input: {
  instruction: string;
  lesson: {
    title?: string;
    keyStage?: string;
    yearGroup?: string;
    subject?: string;
    learningOutcome?: string;
    successCriteria?: string;
    assessment?: string;
    differentiation?: string;
    vocabulary?: string;
    keyQuestions?: string;
    activities?: Array<{
      name?: string;
      activity?: string;
      description?: string;
      time?: number;
      category?: string;
    }>;
    sections?: Array<{
      id: string;
      kind: string;
      title: string;
      durationMins?: number;
      bodyHtml?: string;
      activity?: { activity?: string; name?: string };
    }>;
  };
  curriculumStatements: FleshOutCurriculumStatement[];
  options: FleshOutOptions;
}): Promise<FleshOutResponse> {
  try {
    const res = await fetch('/api/interactive-lessons/flesh-out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader()),
      },
      body: JSON.stringify(input),
    });
    const body = await res.json().catch(() => null);

    // Paid AI add-on missing — never fall back to offline demo.
    if (res.status === 403 || body?.code === 'ai_addon_required') {
      return {
        ok: false,
        status: 403,
        message:
          (body && typeof body.message === 'string' && body.message) ||
          (body && typeof body.error === 'string' && body.error) ||
          'AI add-on required',
        code: 'ai_addon_required',
      };
    }

    if (isUnreachableProxyResponse(res, body) || res.status === 0) {
      return {
        ok: true,
        offlineDemo: true,
        pickedByAi: false,
        model: 'offline-demo',
        result: buildOfflineDemoFleshOut(input),
      };
    }

    if (res.status === 501 || (body && body.available === false && res.status >= 500)) {
      // Key missing on a reachable server — fall back to offline demo rather than hard-fail local work.
      return {
        ok: true,
        offlineDemo: true,
        pickedByAi: false,
        model: 'offline-demo',
        result: buildOfflineDemoFleshOut(input),
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message:
          (body && typeof body.message === 'string' && body.message) ||
          (res.status === 501
            ? 'OPENAI_API_KEY is not configured on the server.'
            : `Flesh out failed (${res.status}).`),
        code: body?.code,
      };
    }
    if (!body?.result) {
      return { ok: false, status: res.status, message: 'Empty Flesh out response.' };
    }
    return {
      ok: true,
      result: body.result as FleshOutResult,
      pickedByAi: !!body.pickedByAi,
      model: body.model,
    };
  } catch {
    return {
      ok: true,
      offlineDemo: true,
      pickedByAi: false,
      model: 'offline-demo',
      result: buildOfflineDemoFleshOut(input),
    };
  }
}

export function formatTeacherQuestionsHtml(q: FleshOutResult['teacherQuestions']): string {
  const block = (label: string, items: string[]) =>
    items.length
      ? `<p><strong>${label}</strong></p><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
      : '';
  return [
    block('Opening / hook', q.opening),
    block('During activities', q.during),
    block('Plenary', q.plenary),
  ]
    .filter(Boolean)
    .join('');
}

export function formatDifferentiationHtml(d: FleshOutResult['differentiation']): string {
  const parts = [
    d.support ? `<p><strong>Support</strong> — ${escapeHtml(d.support)}</p>` : '',
    d.core ? `<p><strong>Core</strong> — ${escapeHtml(d.core)}</p>` : '',
    d.challenge ? `<p><strong>Challenge</strong> — ${escapeHtml(d.challenge)}</p>` : '',
    d.sendEal ? `<p><strong>SEND / EAL</strong> — ${escapeHtml(d.sendEal)}</p>` : '',
  ].filter(Boolean);
  return parts.join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
