/**
 * Pure helpers for lesson Flesh-out prompts and result filtering.
 * No secrets, no network — unit-testable with node --test.
 */

export const KEY_STAGE_GUIDANCE = {
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
    language: 'Accurate subject vocabulary. Measurable criteria. Encourage explain, compare and improve.',
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

export function looksGeneric(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  return GENERIC_BANNED.some((re) => re.test(t));
}

export function scrubGeneric(text) {
  return looksGeneric(text) ? '' : String(text || '').trim();
}

function asStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x || '').trim()).filter(Boolean);
}

/** True when the teacher instruction explicitly asks for I CAN / outcomes / boards / set works. */
export function instructionAsksFor(instruction, kind) {
  const s = String(instruction || '').toLowerCase();
  if (kind === 'ican') {
    return /\b(i can|success criteria|outcomes?|learning objectives?)\b/.test(s);
  }
  if (kind === 'exam') {
    return /\b(exam board|gcse|a-?level|specification|assessment objective|set work|ao\d)\b/.test(s);
  }
  return false;
}

/**
 * Build the JSON payload sent to the model. Curriculum IDs are only those supplied
 * in curriculumStatements (Settings list) — never invented elsewhere.
 */
export function buildFleshOutUserPayload({
  instruction,
  lesson = {},
  curriculumStatements = [],
  options = {},
}) {
  const allowedIds = curriculumStatements
    .map((s) => String(s?.id || '').trim())
    .filter(Boolean);

  const sections = Array.isArray(lesson.sections) ? lesson.sections : [];
  const activities = Array.isArray(lesson.activities) ? lesson.activities : [];

  const includeOutcomes = options.includeOutcomes !== false;
  const includeSuccessCriteria = options.includeSuccessCriteria !== false;
  const includeTeacherQuestions = !!options.includeTeacherQuestions;
  const includeDifferentiation = !!options.includeDifferentiation;
  const includeAssessment = options.includeAssessment !== false;
  const autoPickCurriculum = !!options.autoPickCurriculum;
  const wholeLesson = !!options.wholeLesson;
  const sectionId = typeof options.sectionId === 'string' ? options.sectionId : '';

  const askIcan = instructionAsksFor(instruction, 'ican');
  const askExam = instructionAsksFor(instruction, 'exam');

  // Never invent I CAN unless the teacher asked or the field is empty and generation is enabled.
  const existingIcan = String(lesson.successCriteria || '').trim();
  const mayGenerateIcan = includeSuccessCriteria && (!existingIcan || askIcan);

  return {
    instruction: String(instruction || '').trim() || 'Flesh out this lesson plan',
    keyStage: String(lesson.keyStage || 'ks2').toLowerCase(),
    yearGroup: lesson.yearGroup || '',
    subject: lesson.subject || '',
    title: lesson.title || '',
    learningOutcome: lesson.learningOutcome || '',
    successCriteria: lesson.successCriteria || '',
    assessment: lesson.assessment || '',
    differentiation: lesson.differentiation || '',
    vocabulary: lesson.vocabulary || '',
    keyQuestions: lesson.keyQuestions || '',
    activities: activities.map((a) => ({
      name: a?.name || a?.activity || '',
      description: a?.description || '',
      time: a?.time ?? a?.durationMins ?? null,
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
    // Only IDs from Settings — the model may only return a subset of these.
    curriculumStatements: curriculumStatements.map((s) => ({
      id: s.id,
      text: s.text,
      strand: s.strand || '',
      keyStage: s.keyStage || '',
      subject: s.subject || '',
    })),
    allowedCurriculumIds: allowedIds,
    generate: {
      learningOutcome: includeOutcomes,
      successCriteria: mayGenerateIcan,
      teacherQuestions: includeTeacherQuestions,
      differentiation: includeDifferentiation,
      assessment: includeAssessment,
      selectedStatementIds: autoPickCurriculum,
      wholeLessonSections: wholeLesson,
      sectionBodies: Boolean(sectionId),
      sectionId: sectionId || null,
      inventExamBoardsOrSetWorks: askExam,
    },
    absoluteRules: [
      'Use only curriculum statement IDs listed in allowedCurriculumIds / curriculumStatements. Never invent IDs.',
      mayGenerateIcan
        ? 'You may draft I CAN / success criteria for this lesson.'
        : 'Do not invent or replace I CAN / success criteria unless generate.successCriteria is true.',
      askExam
        ? 'Teacher asked about exam boards / set works — only then may you mention them, and only if supplied in the lesson.'
        : 'Never invent exam boards, specifications, assessment objectives or set works.',
      'Cover title, year group, key stage, subject, every activity with its duration, existing section content, assessment and differentiation.',
    ],
    qualityReminder:
      'Reject generic filler. Name this lesson’s title and activities in outcomes, criteria and questions.',
  };
}

/** Extract only statement IDs that appear in the allowed Settings list. */
export function filterAllowedStatementIds(candidateIds, allowedStatementIds) {
  const allowed = new Set(
    (allowedStatementIds || []).map((id) => String(id || '').trim()).filter(Boolean),
  );
  return asStringArray(candidateIds).filter((id) => allowed.has(id));
}

export function buildSystemPrompt(ks) {
  const g = KEY_STAGE_GUIDANCE[ks] || KEY_STAGE_GUIDANCE.ks2;
  return `You are an expert UK performing-arts (music / drama / dance) lesson planner writing for CCDesigner teachers.

TARGET AUDIENCE FOR THIS REQUEST
- Key stage: ${ks.toUpperCase()}
- Ages: ${g.ages}
- Refer to learners as: ${g.pupils}
- Language level: ${g.language}
- Cognitive demand: ${g.demand}
- Success criteria style: ${g.criteriaStyle}

ABSOLUTE BANS
- Never invent curriculum statement IDs — choose only from the provided list (or return []).
- Never invent I CAN / success criteria unless generate.successCriteria is true.
- Never invent exam boards, specifications, AOs or set works unless generate.inventExamBoardsOrSetWorks is true AND the teacher asked.
- No generic filler ("explore the lesson focus", "take part", "engage with the learning").

QUALITY RULES
1. Outcomes MUST name the lesson title and/or specific activities (with durations when provided).
2. Success criteria: newline-separated "• I can …" bullets only when generate.successCriteria is true.
3. Teacher questions: opening / during / plenary; reference this lesson’s content.
4. Differentiation: support / core / challenge / sendEal tied to THIS lesson’s activities.
5. Assessment: observable look-for bullets tied to activities when generate.assessment is true.
6. Curriculum statement IDs: subset of allowedCurriculumIds only.
7. Section / whole-lesson bodyHtml: simple HTML; stay editable and specific.
8. If a generate.* flag is false, return empty string / [] for that field.
9. Return JSON matching the schema exactly — no markdown fences.`;
}

export function buildUserMessage(userPayload, ks) {
  const g = KEY_STAGE_GUIDANCE[ks] || KEY_STAGE_GUIDANCE.ks2;
  const activityNames = (userPayload.activities || [])
    .map((a) => {
      const mins = a.time != null ? ` (${a.time} min)` : '';
      return `${a.name || 'Activity'}${mins}`;
    })
    .filter(Boolean)
    .join('; ');
  const title = userPayload.title || '(untitled lesson)';
  const standards = (userPayload.curriculumStatements || [])
    .map((s) => `${s.id}: ${s.text}`)
    .join('\n');
  return `Flesh out this CCDesigner ${ks.toUpperCase()} lesson (${g.ages}).
Lesson title: "${title}"
Year group: ${userPayload.yearGroup || '(not set)'}
Subject: ${userPayload.subject || '(not set)'}
Activities in this plan (with durations): ${activityNames || '(none listed — use title and section titles)'}
Chosen Settings curriculum standards (IDs only — never invent others):
${standards || '(none provided)'}

Write ONLY for flags set true in generate.*. Name the title and activities above in outcomes/criteria/questions.
Return JSON only.

${JSON.stringify(userPayload)}`;
}

export function validateAndFilterResult(parsed, allowedStatementIds, options) {
  const selectedStatementIds = filterAllowedStatementIds(
    parsed?.selectedStatementIds,
    allowedStatementIds,
  );

  const out = {
    learningOutcome: options.includeOutcomes ? scrubGeneric(parsed?.learningOutcome) : '',
    successCriteria: options.includeSuccessCriteria
      ? scrubGeneric(parsed?.successCriteria)
      : '',
    assessment: options.includeAssessment ? scrubGeneric(parsed?.assessment) : '',
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

/** Assert the user payload only ever lists the given Settings IDs. */
export function assertPayloadUsesOnlyAllowedIds(payload, allowedIds) {
  const allowed = new Set((allowedIds || []).map(String));
  const listed = (payload?.curriculumStatements || []).map((s) => String(s.id));
  const extras = listed.filter((id) => !allowed.has(id));
  return { ok: extras.length === 0, extras, listed };
}
