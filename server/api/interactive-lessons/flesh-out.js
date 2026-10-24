/**
 * Lesson plan “Flesh out with AI” — OpenAI chat proxy.
 * Secret: OPENAI_API_KEY (server env only — never expose client-side).
 * Routed through /api/router (Hobby function limit).
 */

import {
  corsHeaders,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from '../../../api/_authShared.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_FLESH_OUT_MODEL || 'gpt-4o-mini';

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || '';
}

const KEY_STAGE_GUIDANCE = {
  eyfs: {
    ages: '3–5',
    language:
      'Warm, concrete, play-based language. Short sentences. Focus on exploring, noticing, joining in, and simple “I can…” for early learners.',
    demand: 'Sensory, imitative, guided play; adult modelling; celebration of participation.',
  },
  ks1: {
    ages: '5–7 (Years 1–2)',
    language:
      'Clear everyday vocabulary. Short “I can…” criteria. Practical and playful with light subject words introduced carefully.',
    demand: 'Recall + simple explain; partner talk; follow a short sequence of steps.',
  },
  ks2: {
    ages: '7–11 (Years 3–6)',
    language:
      'Subject vocabulary used accurately. Measurable “I can…” criteria. Encourage explain, compare, and improve.',
    demand: 'Apply skills with increasing independence; peer feedback; short reflections.',
  },
  ks3: {
    ages: '11–14 (Years 7–9)',
    language:
      'Disciplinary language. Criteria that demand analysis, refinement, and justification. Avoid babyish tone.',
    demand: 'Higher-order questioning; evaluate choices; link technique to intention.',
  },
  ks4: {
    ages: '14–16 (Years 10–11 / GCSE)',
    language:
      'Exam-ready subject terminology. Criteria map to performance/composition/appraisal skills where relevant.',
    demand: 'Critical judgment, refinement cycles, evidence-based reflection.',
  },
  ks5: {
    ages: '16–18 (A-level / KS5)',
    language: 'Sophisticated critical vocabulary; independent enquiry tone.',
    demand: 'Synthesise ideas; justify artistic decisions; extend and critique.',
  },
};

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    learningOutcome: { type: 'string' },
    successCriteria: { type: 'string' },
    teacherQuestions: {
      type: 'object',
      additionalProperties: false,
      properties: {
        opening: { type: 'array', items: { type: 'string' } },
        during: { type: 'array', items: { type: 'string' } },
        plenary: { type: 'array', items: { type: 'string' } },
      },
      required: ['opening', 'during', 'plenary'],
    },
    differentiation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        support: { type: 'string' },
        core: { type: 'string' },
        challenge: { type: 'string' },
        sendEal: { type: 'string' },
      },
      required: ['support', 'core', 'challenge', 'sendEal'],
    },
    selectedStatementIds: { type: 'array', items: { type: 'string' } },
    wholeLessonSections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          sectionId: { type: 'string' },
          title: { type: 'string' },
          durationMins: { type: 'number' },
          bodyHtml: { type: 'string' },
        },
        required: ['sectionId', 'title', 'bodyHtml'],
      },
    },
    sectionBodies: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          sectionId: { type: 'string' },
          bodyHtml: { type: 'string' },
        },
        required: ['sectionId', 'bodyHtml'],
      },
    },
  },
  required: [
    'learningOutcome',
    'successCriteria',
    'teacherQuestions',
    'differentiation',
    'selectedStatementIds',
    'wholeLessonSections',
    'sectionBodies',
  ],
};

function asStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x || '').trim()).filter(Boolean);
}

function validateAndFilterResult(parsed, allowedStatementIds, options) {
  const allowed = new Set(allowedStatementIds);
  const selectedStatementIds = asStringArray(parsed?.selectedStatementIds).filter((id) =>
    allowed.has(id),
  );

  const out = {
    learningOutcome: options.includeOutcomes ? String(parsed?.learningOutcome || '').trim() : '',
    successCriteria: options.includeSuccessCriteria
      ? String(parsed?.successCriteria || '').trim()
      : '',
    teacherQuestions: options.includeTeacherQuestions
      ? {
          opening: asStringArray(parsed?.teacherQuestions?.opening).slice(0, 6),
          during: asStringArray(parsed?.teacherQuestions?.during).slice(0, 8),
          plenary: asStringArray(parsed?.teacherQuestions?.plenary).slice(0, 6),
        }
      : { opening: [], during: [], plenary: [] },
    differentiation: options.includeDifferentiation
      ? {
          support: String(parsed?.differentiation?.support || '').trim(),
          core: String(parsed?.differentiation?.core || '').trim(),
          challenge: String(parsed?.differentiation?.challenge || '').trim(),
          sendEal: String(parsed?.differentiation?.sendEal || '').trim(),
        }
      : { support: '', core: '', challenge: '', sendEal: '' },
    selectedStatementIds: options.autoPickCurriculum ? selectedStatementIds : [],
    wholeLessonSections: [],
    sectionBodies: [],
  };

  if (options.wholeLesson && Array.isArray(parsed?.wholeLessonSections)) {
    out.wholeLessonSections = parsed.wholeLessonSections
      .map((s) => ({
        sectionId: String(s?.sectionId || ''),
        title: String(s?.title || '').trim(),
        durationMins:
          typeof s?.durationMins === 'number' && Number.isFinite(s.durationMins)
            ? s.durationMins
            : undefined,
        bodyHtml: String(s?.bodyHtml || '').trim(),
      }))
      .filter((s) => s.sectionId && s.bodyHtml);
  }

  if (options.sectionId && Array.isArray(parsed?.sectionBodies)) {
    out.sectionBodies = parsed.sectionBodies
      .filter((s) => String(s?.sectionId || '') === options.sectionId)
      .map((s) => ({
        sectionId: String(s.sectionId),
        bodyHtml: String(s.bodyHtml || '').trim(),
      }))
      .filter((s) => s.bodyHtml);
  }

  return out;
}

function buildSystemPrompt(ks) {
  const g = KEY_STAGE_GUIDANCE[ks] || KEY_STAGE_GUIDANCE.ks2;
  return `You are an expert UK performing-arts lesson planner for CCDesigner.
Write ONLY content pitched for key stage ${ks.toUpperCase()} (ages ${g.ages}).
Language level: ${g.language}
Cognitive demand: ${g.demand}

Hard rules:
- Never invent curriculum statement text or IDs. If asked to pick statements, choose ONLY from the provided list of statement IDs.
- Outcomes and success criteria MUST be specific to THIS lesson's title and activities — never generic filler.
- Success criteria must be concrete, measurable "I can…" bullets tied to the activities.
- Teacher questions: mix of recall and higher-order, grouped by opening / during / plenary.
- Differentiation: support, core, challenge, plus brief SEND/EAL notes, tied to the actual activities.
- bodyHtml may use simple HTML (<p>, <ul>, <li>, <strong>) for teacher actions, pupil actions, transitions, resources, questions.
- If a section is not requested, return empty string / empty arrays for it.
- Return JSON matching the schema exactly.

Quality bar examples (do not copy; match this specificity):

KS1 Music example outcome: "Children will keep a steady pulse on body percussion while singing the chorus of ‘Rain, rain’, and say whether the music feels fast or slow."
KS1 success criteria: "• I can clap the pulse with the class\\n• I can sing the chorus with my partner\\n• I can tell a friend if the music is fast or slow"

KS3 Drama example outcome: "Pupils will devise a 60-second duologue that establishes status through stillness and proxemics, then justify one staging choice using subject vocabulary."
KS3 success criteria: "• I can show clear high/low status without relying on volume\\n• I can use proxemics to change the power relationship mid-scene\\n• I can explain one staging choice using the terms status and proxemics"`;
}

export async function GET() {
  const key = getOpenAiKey();
  if (!key) {
    return jsonResponse(
      {
        available: false,
        message:
          'OPENAI_API_KEY is not set on the server. Flesh out with AI is unavailable until an admin adds it.',
      },
      200,
    );
  }
  return jsonResponse({ available: true, model: MODEL });
}

export async function POST(request) {
  if (request.method === 'OPTIONS') return optionsResponse();

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const key = getOpenAiKey();
  if (!key) {
    return jsonResponse(
      {
        available: false,
        message:
          'OPENAI_API_KEY is not set on the server. Ask an admin to configure it on the API project (production + preview).',
      },
      501,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid JSON body' }, 400);
  }

  const lesson = body?.lesson && typeof body.lesson === 'object' ? body.lesson : {};
  const options = body?.options && typeof body.options === 'object' ? body.options : {};
  const curriculumStatements = Array.isArray(body?.curriculumStatements)
    ? body.curriculumStatements
    : [];

  const keyStage = String(lesson.keyStage || 'ks2').toLowerCase();
  const allowedStatementIds = curriculumStatements
    .map((s) => String(s?.id || '').trim())
    .filter(Boolean);

  const includeOutcomes = options.includeOutcomes !== false;
  const includeSuccessCriteria = options.includeSuccessCriteria !== false;
  const includeTeacherQuestions = !!options.includeTeacherQuestions;
  const includeDifferentiation = !!options.includeDifferentiation;
  const autoPickCurriculum = !!options.autoPickCurriculum;
  const wholeLesson = !!options.wholeLesson;
  const sectionId = typeof options.sectionId === 'string' ? options.sectionId : '';
  const instruction = String(body?.instruction || '').trim() || 'Flesh out this lesson plan';

  if (autoPickCurriculum && allowedStatementIds.length === 0) {
    return jsonResponse(
      {
        message:
          'No curriculum statements are defined in Settings for this lesson. Add frameworks, strands and statements in Settings → Curriculum, then try again.',
        code: 'empty_curriculum',
      },
      400,
    );
  }

  const sections = Array.isArray(lesson.sections) ? lesson.sections : [];
  const activities = Array.isArray(lesson.activities) ? lesson.activities : [];

  const userPayload = {
    instruction,
    keyStage,
    yearGroup: lesson.yearGroup || '',
    subject: lesson.subject || '',
    title: lesson.title || '',
    learningOutcome: lesson.learningOutcome || '',
    successCriteria: lesson.successCriteria || '',
    activities: activities.map((a) => ({
      name: a?.name || a?.activity || '',
      description: a?.description || '',
      time: a?.time || null,
      category: a?.category || '',
    })),
    sections: sections.map((s) => ({
      id: s.id,
      kind: s.kind,
      title: s.title,
      durationMins: s.durationMins,
      bodyHtml: s.bodyHtml || '',
      activityName: s.activity?.activity || s.activity?.name || '',
    })),
    curriculumStatements: curriculumStatements.map((s) => ({
      id: s.id,
      text: s.text,
      strand: s.strand || '',
      keyStage: s.keyStage || '',
      subject: s.subject || '',
    })),
    generate: {
      learningOutcome: includeOutcomes,
      successCriteria: includeSuccessCriteria,
      teacherQuestions: includeTeacherQuestions,
      differentiation: includeDifferentiation,
      selectedStatementIds: autoPickCurriculum,
      wholeLessonSections: wholeLesson,
      sectionBodies: Boolean(sectionId),
      sectionId: sectionId || null,
    },
  };

  try {
    const oaRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'ccd_flesh_out',
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
        messages: [
          { role: 'system', content: buildSystemPrompt(keyStage) },
          {
            role: 'user',
            content: `Flesh out this CCDesigner lesson. Return JSON only.\n${JSON.stringify(userPayload)}`,
          },
        ],
      }),
    });

    if (!oaRes.ok) {
      const errText = await oaRes.text().catch(() => '');
      console.error('Flesh-out OpenAI error', oaRes.status, errText.slice(0, 500));
      return jsonResponse(
        {
          message:
            oaRes.status === 401 || oaRes.status === 403
              ? 'OpenAI rejected the server API key. Check OPENAI_API_KEY on the API project.'
              : 'Flesh out failed talking to OpenAI. Try again in a moment.',
        },
        502,
      );
    }

    const oaJson = await oaRes.json();
    const content = oaJson?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return jsonResponse({ message: 'Empty response from OpenAI' }, 502);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return jsonResponse({ message: 'OpenAI returned invalid JSON' }, 502);
    }

    const result = validateAndFilterResult(parsed, allowedStatementIds, {
      includeOutcomes,
      includeSuccessCriteria,
      includeTeacherQuestions,
      includeDifferentiation,
      autoPickCurriculum,
      wholeLesson,
      sectionId,
    });

    return jsonResponse({
      available: true,
      model: MODEL,
      result,
      pickedByAi: autoPickCurriculum ? result.selectedStatementIds.length > 0 : false,
    });
  } catch (err) {
    console.error('Flesh-out failed', err);
    return jsonResponse({ message: 'Flesh out failed unexpectedly' }, 500);
  }
}

export async function OPTIONS() {
  return optionsResponse();
}

// silence unused import lint in some bundlers
void corsHeaders;
