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
    pupils: 'children / early learners',
    language:
      'Warm, concrete, play-based language. Very short sentences. Name what children see, hear, move and join in with. Avoid abstract meta-language.',
    demand:
      'Sensory, imitative, guided play; adult modelling; celebrate participation. Questions: notice / copy / show me.',
    criteriaStyle: 'Simple “I can…” with one concrete action each (clap, join in, point to…).',
  },
  ks1: {
    ages: '5–7 (Years 1–2)',
    pupils: 'children',
    language:
      'Clear everyday vocabulary. Introduce 1–2 subject words carefully and reuse them. Short, spoken-friendly sentences.',
    demand:
      'Recall + simple explain; partner talk; follow a short sequence. Questions mix “what / how” with one “why”.',
    criteriaStyle: '3–5 short “I can…” bullets, each observable in this lesson’s activities.',
  },
  ks2: {
    ages: '7–11 (Years 3–6)',
    pupils: 'pupils',
    language:
      'Accurate subject vocabulary. Measurable criteria. Encourage explain, compare and improve.',
    demand:
      'Apply skills with growing independence; peer feedback; short reflections. Include one evaluative question.',
    criteriaStyle: '3–5 “I can…” bullets naming technique + evidence from the activity.',
  },
  ks3: {
    ages: '11–14 (Years 7–9)',
    pupils: 'pupils',
    language:
      'Disciplinary language (technique, intention, form, audience). Never babyish. Criteria demand analysis and justification.',
    demand:
      'Higher-order questioning; evaluate choices; link technique to intention. Mix recall with analyse / justify / refine.',
    criteriaStyle: '3–5 “I can…” bullets that name specific techniques and a justification step.',
  },
  ks4: {
    ages: '14–16 (Years 10–11 / GCSE)',
    pupils: 'students',
    language:
      'Exam-ready subject terminology. Criteria map to performance / composition / appraisal skills where relevant.',
    demand:
      'Critical judgment, refinement cycles, evidence-based reflection. Questions probe intention and evaluation.',
    criteriaStyle: '3–5 “I can…” bullets pitched at GCSE assessment language, tied to this lesson’s tasks.',
  },
  ks5: {
    ages: '16–18 (A-level / KS5)',
    pupils: 'students',
    language: 'Sophisticated critical vocabulary; independent enquiry tone.',
    demand: 'Synthesise ideas; justify artistic decisions; extend and critique.',
    criteriaStyle: '3–5 “I can…” bullets that require justification or evaluation using named concepts.',
  },
};

/** Phrases that indicate lazy generic filler — reject / blank if dominant. */
const GENERIC_BANNED = [
  /learners will explore the lesson focus/i,
  /through practical activities/i,
  /i can take part/i,
  /explain one idea/i,
  /reflect with a partner/i,
  /engage with the learning/i,
  /develop their understanding/i,
  /explore the theme/i,
  /participate actively/i,
  /work collaboratively to explore/i,
  /demonstrate understanding of the topic/i,
  /the lesson focus/i,
];

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

function looksGeneric(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  return GENERIC_BANNED.some((re) => re.test(t));
}

function scrubGeneric(text) {
  return looksGeneric(text) ? '' : String(text || '').trim();
}

function validateAndFilterResult(parsed, allowedStatementIds, options) {
  const allowed = new Set(allowedStatementIds);
  const selectedStatementIds = asStringArray(parsed?.selectedStatementIds).filter((id) =>
    allowed.has(id),
  );

  const out = {
    learningOutcome: options.includeOutcomes
      ? scrubGeneric(parsed?.learningOutcome)
      : '',
    successCriteria: options.includeSuccessCriteria
      ? scrubGeneric(parsed?.successCriteria)
      : '',
    teacherQuestions: options.includeTeacherQuestions
      ? {
          opening: asStringArray(parsed?.teacherQuestions?.opening)
            .filter((q) => !looksGeneric(q))
            .slice(0, 6),
          during: asStringArray(parsed?.teacherQuestions?.during)
            .filter((q) => !looksGeneric(q))
            .slice(0, 8),
          plenary: asStringArray(parsed?.teacherQuestions?.plenary)
            .filter((q) => !looksGeneric(q))
            .slice(0, 6),
        }
      : { opening: [], during: [], plenary: [] },
    differentiation: options.includeDifferentiation
      ? {
          support: scrubGeneric(parsed?.differentiation?.support),
          core: scrubGeneric(parsed?.differentiation?.core),
          challenge: scrubGeneric(parsed?.differentiation?.challenge),
          sendEal: scrubGeneric(parsed?.differentiation?.sendEal),
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
        bodyHtml: looksGeneric(s?.bodyHtml) ? '' : String(s?.bodyHtml || '').trim(),
      }))
      .filter((s) => s.sectionId && s.bodyHtml);
  }

  if (options.sectionId && Array.isArray(parsed?.sectionBodies)) {
    out.sectionBodies = parsed.sectionBodies
      .filter((s) => String(s?.sectionId || '') === options.sectionId)
      .map((s) => ({
        sectionId: String(s.sectionId),
        bodyHtml: looksGeneric(s?.bodyHtml) ? '' : String(s.bodyHtml || '').trim(),
      }))
      .filter((s) => s.bodyHtml);
  }

  return out;
}

function buildSystemPrompt(ks) {
  const g = KEY_STAGE_GUIDANCE[ks] || KEY_STAGE_GUIDANCE.ks2;
  return `You are an expert UK performing-arts (music / drama / dance) lesson planner writing for CCDesigner teachers.

TARGET AUDIENCE FOR THIS REQUEST
- Key stage: ${ks.toUpperCase()}
- Ages: ${g.ages}
- Refer to learners as: ${g.pupils}
- Language level: ${g.language}
- Cognitive demand: ${g.demand}
- Success criteria style: ${g.criteriaStyle}

ABSOLUTE BANS (never write these or close paraphrases)
- "Learners will explore the lesson focus through practical activities"
- "I can take part / explain one idea / reflect with a partner"
- "engage with the learning", "develop their understanding", "explore the theme"
- Any outcome that could fit ANY lesson without naming THIS lesson’s title, song, scene, skill or activity
- Vague verbs alone: explore, engage, participate, experience (without a concrete object)

QUALITY RULES
1. Outcomes MUST name the lesson title and/or specific activities supplied in the user JSON (song names, games, techniques, repertoire). If activities are listed, weave at least two of them into the outcome or criteria.
2. Success criteria: newline-separated "• I can …" bullets only; each bullet is observable in one of the listed activities; pitched for ${ks.toUpperCase()}.
3. Teacher questions: real questions a teacher asks aloud. Grouped opening / during / plenary. Mix recall + higher-order suited to ${ks.toUpperCase()}. Reference the lesson content (not "the activity").
4. Differentiation: support / core / challenge / sendEal — each names how THIS lesson’s activities change (scaffolds, roles, extensions). Not generic “provide support”.
5. Curriculum statement IDs: choose ONLY from the provided list; never invent IDs or statement text. Prefer statements that match the activities. If none fit, return [].
6. Whole-lesson / section bodyHtml: simple HTML (<p>, <ul>, <li>, <strong>) covering timings, teacher actions, pupil actions, transitions, resources, questions, differentiation notes, assessment checks. Stay editable and specific.
7. If a generate.* flag is false, return empty string / [] for that field.
8. Return JSON matching the schema exactly — no markdown fences.

QUALITY BAR — match this specificity (do not copy; adapt to the supplied lesson):

KS1 Music example
- learningOutcome: "Children will keep a steady pulse on body percussion while singing the chorus of ‘Rain, rain’, and say whether the music feels fast or slow."
- successCriteria: "• I can clap the pulse with the class\\n• I can sing the chorus of ‘Rain, rain’ with my partner\\n• I can tell a friend if the music is fast or slow"
- teacherQuestions.opening: ["What do you hear first — our voices or the clap?"]
- teacherQuestions.during: ["Can you show me the pulse on your knees while we sing the chorus?"]
- teacherQuestions.plenary: ["Was ‘Rain, rain’ faster or slower than our warm-up chant — how do you know?"]
- differentiation.support: "Sit next to an adult model; clap pulse only on the chorus, not the verse."
- differentiation.challenge: "Lead the class pulse for 8 beats, then choose a new body-percussion sound."

KS3 Drama example
- learningOutcome: "Pupils will devise a 60-second duologue that establishes status through stillness and proxemics, then justify one staging choice using the terms status and proxemics."
- successCriteria: "• I can show clear high/low status without relying on volume\\n• I can use proxemics to change the power relationship mid-scene\\n• I can explain one staging choice using the terms status and proxemics"
- teacherQuestions.opening: ["Where have you seen status shown without anyone speaking?"]
- teacherQuestions.during: ["If you freeze now, who holds higher status — and which proxemic choice creates that?"]
- teacherQuestions.plenary: ["Which one staging change most shifted status, and why would you keep it for performance?"]
- differentiation.support: "Use a status ladder (1–5) card; rehearse stillness before adding lines."
- differentiation.challenge: "Add a third beat that reverses status using only proxemics, then annotate the script."`;
}

function buildUserMessage(userPayload, ks) {
  const g = KEY_STAGE_GUIDANCE[ks] || KEY_STAGE_GUIDANCE.ks2;
  const activityNames = (userPayload.activities || [])
    .map((a) => a.name)
    .filter(Boolean)
    .join('; ');
  const title = userPayload.title || '(untitled lesson)';
  return `Flesh out this CCDesigner ${ks.toUpperCase()} lesson (${g.ages}).
Lesson title: "${title}"
Year group: ${userPayload.yearGroup || '(not set)'}
Subject: ${userPayload.subject || '(not set)'}
Activities in this plan: ${activityNames || '(none listed — use title and section titles)'}

Write ONLY for flags set true in generate.*. Name the title and activities above in outcomes/criteria/questions.
Return JSON only.

${JSON.stringify(userPayload)}`;
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
    qualityReminder:
      'Reject generic filler. Name this lesson’s title and activities in outcomes, criteria and questions.',
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
        temperature: 0.35,
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
          { role: 'user', content: buildUserMessage(userPayload, keyStage) },
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

    const neededSomething =
      includeOutcomes ||
      includeSuccessCriteria ||
      includeTeacherQuestions ||
      includeDifferentiation ||
      wholeLesson ||
      Boolean(sectionId);

    const gotSomething =
      !!result.learningOutcome ||
      !!result.successCriteria ||
      result.teacherQuestions.opening.length +
        result.teacherQuestions.during.length +
        result.teacherQuestions.plenary.length >
        0 ||
      !!result.differentiation.support ||
      !!result.differentiation.core ||
      result.wholeLessonSections.length > 0 ||
      result.sectionBodies.length > 0 ||
      result.selectedStatementIds.length > 0;

    if (neededSomething && !gotSomething) {
      return jsonResponse(
        {
          message:
            'Flesh out returned only generic placeholder text, which was rejected. Try again with a clearer lesson title and named activities.',
          code: 'generic_rejected',
        },
        502,
      );
    }

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
