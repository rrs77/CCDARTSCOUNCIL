import { supabase } from '../../config/supabase';
import {
  buildOfflineFleshOutPayload,
  preferOfflineDemoAi,
  sleepOfflineThink,
  type OfflineSuggestedActivity,
} from './offlineDemoAi';

export type FleshOutOptions = {
  includeOutcomes: boolean;
  includeSuccessCriteria: boolean;
  includeTeacherQuestions: boolean;
  includeDifferentiation: boolean;
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
  /** Offline/demo only — applied by LessonPlanModal when present. */
  lessonTitle?: string;
  vocabularyHtml?: string;
  suggestedActivities?: OfflineSuggestedActivity[];
};

export type FleshOutResponse =
  | { ok: true; result: FleshOutResult; pickedByAi: boolean; model?: string; offlineDemo?: boolean }
  | { ok: false; message: string; code?: string; status: number };

export type FleshOutAvailability = {
  /** True when Apply can run (live OpenAI or offline demo). */
  available: boolean;
  /** Live OpenAI key is configured on the API server. */
  live: boolean;
  /** Local/offline deterministic stub (no key, no network). */
  offlineDemo: boolean;
  message?: string;
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
 * Deterministic, no keys; Romeo & Juliet themed when the lesson context matches.
 */
export function buildOfflineDemoFleshOut(input: {
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
  options: FleshOutOptions;
}): FleshOutResult {
  return buildOfflineFleshOutPayload(input);
}

async function offlineDemoResponse(input: Parameters<typeof buildOfflineDemoFleshOut>[0]): Promise<
  Extract<FleshOutResponse, { ok: true }>
> {
  await sleepOfflineThink();
  return {
    ok: true,
    offlineDemo: true,
    pickedByAi: false,
    model: 'offline-demo',
    result: buildOfflineDemoFleshOut(input),
  };
}

export async function checkFleshOutAvailable(): Promise<FleshOutAvailability> {
  // Demo login: always offline canned AI (no API probe, no keys).
  if (preferOfflineDemoAi()) {
    return {
      available: true,
      live: false,
      offlineDemo: true,
      message: 'Offline demo mode is active for the demo login — canned AI runs locally with no API key.',
    };
  }

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
        message: LOCAL_API_HINT,
      };
    }

    if (body && typeof body === 'object' && 'available' in body) {
      if (body.available) {
        return {
          available: true,
          live: true,
          offlineDemo: false,
          message: body.message,
        };
      }
      // Server reached but OPENAI_API_KEY missing — still allow offline demo locally.
      return {
        available: true,
        live: false,
        offlineDemo: true,
        message:
          (typeof body.message === 'string' && body.message) ||
          'OPENAI_API_KEY is not set on the API server. Offline demo mode is active. Start api-server with OPENAI_API_KEY for live AI.',
      };
    }

    return {
      available: true,
      live: false,
      offlineDemo: true,
      message: LOCAL_API_HINT,
    };
  } catch {
    return {
      available: true,
      live: false,
      offlineDemo: true,
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
  if (preferOfflineDemoAi()) {
    return offlineDemoResponse(input);
  }

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

    if (isUnreachableProxyResponse(res, body) || res.status === 0) {
      return offlineDemoResponse(input);
    }

    if (res.status === 501 || (body && body.available === false && res.status >= 500)) {
      // Key missing on a reachable server — fall back to offline demo rather than hard-fail local work.
      return offlineDemoResponse(input);
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
    return offlineDemoResponse(input);
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
