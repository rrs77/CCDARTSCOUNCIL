import { supabase } from '../../config/supabase';

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
};

export type FleshOutResponse =
  | { ok: true; result: FleshOutResult; pickedByAi: boolean; model?: string }
  | { ok: false; message: string; code?: string; status: number };

async function authHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function checkFleshOutAvailable(): Promise<{ available: boolean; message?: string }> {
  try {
    const res = await fetch('/api/interactive-lessons/flesh-out', {
      method: 'GET',
      headers: await authHeader(),
    });
    const body = await res.json().catch(() => ({}));
    return {
      available: !!body.available,
      message: body.message,
    };
  } catch {
    return {
      available: false,
      message: 'Could not reach the Flesh out API.',
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
  try {
    const res = await fetch('/api/interactive-lessons/flesh-out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader()),
      },
      body: JSON.stringify(input),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message:
          body.message ||
          (res.status === 501
            ? 'OPENAI_API_KEY is not configured on the server.'
            : `Flesh out failed (${res.status}).`),
        code: body.code,
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
      ok: false,
      status: 0,
      message: 'Network error calling Flesh out. Check your connection and try again.',
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
