/**
 * CCDesigner — The facts
 * ======================
 * EDIT THIS FILE to change headlines, stats, captions, sources, and topic markers.
 * See `README.md` in this folder.
 *
 * Prezi model: one overview picture + quiet topic chips → scrollable modal scenes.
 * Do not invent numbers. Prefer CLA / Ofqual / DfE primary sources.
 * “No entries” ≠ “not taught”. Use “aims to”, not “will solve”.
 */

export type SourceRef = {
  id: string;
  label: string;
  year: string;
  url?: string;
};

export type StatTile = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  footnote: string;
  sourceId: string;
  /** Topic id this fact belongs with */
  zoomClusterId?: string;
};

export type ChartSeriesPoint = Record<string, string | number>;

export type ChartDef = {
  id: string;
  type:
    | "horizontal-change"
    | "double-doughnut"
    | "grouped-bars"
    | "lollipop"
    | "indexed-line"
    | "divergent-bars"
    | "funding-bars"
    | "funding-trend";
  caption: string;
  sourceNote: string;
  colours?: string[];
  axis?: {
    x?: string;
    y?: string;
    series?: Record<string, string>;
    legend?: Record<string, string>;
  };
  series: ChartSeriesPoint[];
  meta?: Record<string, string | number>;
};

export type CompassDir = "up" | "down" | "left" | "right";

/** Quiet chip on the overview artwork — click opens the topic modal. */
export type TopicDef = {
  id: string;
  /** Short chip label on the picture (subordinate to “The situation”). */
  markerLabel: string;
  /** World coordinates of the chip on the overview canvas. */
  x: number;
  y: number;
  title: string;
  investorLine: string;
  body: string[];
  whyThisMattersForCCD: string;
  sourceIds: string[];
  chartIds?: string[];
  /** Extra charts further down the scroll (nested detail in the modal). */
  nestedChartIds?: string[];
  statIds?: string[];
  neighbors: Partial<Record<CompassDir, string>>;
};

export const sources: Record<string, SourceRef> = {
  cla2024: {
    id: "cla2024",
    label: "Cultural Learning Alliance Report Card 2024",
    year: "2024",
    url: "https://www.culturallearningalliance.org.uk/",
  },
  cla2026: {
    id: "cla2026",
    label: "Cultural Learning Alliance Report Card 2026",
    year: "2026",
    url: "https://www.culturallearningalliance.org.uk/report-card-and-rers-published-today/",
  },
  cla2026detail: {
    id: "cla2026detail",
    label: "CLA 2026 Report Card Detailed Analysis",
    year: "2026",
    url: "https://www.culturallearningalliance.org.uk/wp-content/uploads/2026/05/CLA-2026-Report-Card-Detailed-Analysis.pdf",
  },
  ofqual2026: {
    id: "ofqual2026",
    label: "Ofqual provisional entries, summer 2026 exam series",
    year: "2026",
    url: "https://www.gov.uk/government/statistics/provisional-entries-for-gcse-as-and-a-level-summer-2026-exam-series",
  },
  dfeAnnex: {
    id: "dfeAnnex",
    label: "DfE Curriculum & Assessment Review analytical annex (Tables 18–19)",
    year: "2024/25",
    url: "https://assets.publishing.service.gov.uk/media/68f663272f0fc56403a3d11b/Curriculum_and_Assessment_Review_final_report_analytical_annex.pdf",
  },
  dfeWorkforce: {
    id: "dfeWorkforce",
    label: "DfE School Workforce in England (November 2025 census)",
    year: "2026",
  },
  turnItUp: {
    id: "turnItUp",
    label: "DCMS/DfE Turn It Up",
    year: "July 2026",
  },
  nationalCentre: {
    id: "nationalCentre",
    label: "DfE Find a Tender — National Centre for Arts and Music Education",
    year: "2026",
    url: "https://www.find-tender.service.gov.uk/Notice/014795-2026",
  },
  hesaCla: {
    id: "hesaCla",
    label: "HESA 2024/25 via CLA Report Card 2026 Detailed Analysis",
    year: "2024/25",
  },
  ofqualBackground: {
    id: "ofqualBackground",
    label: "Ofqual provisional entries methodology (collected by 15 Apr 2026, rounded to 5)",
    year: "2026",
  },
  eyfs2026: {
    id: "eyfs2026",
    label: "DfE Early Years Foundation Stage statutory framework (effective September 2026)",
    year: "2026",
    url: "https://www.gov.uk/government/publications/early-years-foundation-stage-framework--2",
  },
  enrichmentFramework: {
    id: "enrichmentFramework",
    label: "DfE Enrichment Framework for schools and colleges",
    year: "June 2026",
    url: "https://www.gov.uk/government/publications/the-enrichment-framework-for-schools-and-colleges",
  },
  enrichmentBenchmarks: {
    id: "enrichmentBenchmarks",
    label: "Enrichment benchmarks and case studies",
    year: "2026",
    url: "https://www.gov.uk/government/publications/the-enrichment-framework-for-schools-and-colleges/enrichment-benchmarks",
  },
  enrichmentBackground: {
    id: "enrichmentBackground",
    label: "Background, definition and five enrichment areas",
    year: "2026",
    url: "https://www.gov.uk/government/publications/the-enrichment-framework-for-schools-and-colleges/background-supporting-the-enrichment-framework-for-schools-and-colleges",
  },
  enrichmentResources: {
    id: "enrichmentResources",
    label: "Resources, Music Hubs and future government support",
    year: "2026",
    url: "https://www.gov.uk/government/publications/the-enrichment-framework-for-schools-and-colleges/resources-to-support-schools-and-colleges-with-enrichment",
  },
  enrichmentEvidence: {
    id: "enrichmentEvidence",
    label: "DfE Evidence on enrichment in schools and colleges (PDF)",
    year: "2026",
    url: "https://assets.publishing.service.gov.uk/media/6a2a5da31f6fa5c3377e5d43/Evidence_on_enrichment_in_schools_and_colleges.pdf",
  },
  enrichmentWorkingGroup: {
    id: "enrichmentWorkingGroup",
    label: "Enrichment framework expert working group",
    year: "2026",
    url: "https://www.gov.uk/government/publications/the-enrichment-framework-for-schools-and-colleges/enrichment-framework-expert-working-group",
  },
  musicMarkEnrichment: {
    id: "musicMarkEnrichment",
    label: "Music Mark — DfE Enrichment Benchmarks: a Reflection",
    year: "2026",
    url: "https://www.musicmark.org.uk/news/dfe-enrichment-benchmarks-a-reflection/",
  },
  musicMarkDemos: {
    id: "musicMarkDemos",
    label: "Demos / Music Mark — Facing the Music",
    year: "Feb 2025",
    url: "https://demos.co.uk/wp-content/uploads/2025/02/Music-Mark_Report_2025_Feb-2025.pdf",
  },
  musicMarkHubs: {
    id: "musicMarkHubs",
    label: "Music Mark — Music Hubs funding cuts response",
    year: "June 2026",
    url: "https://www.musicmark.org.uk/news/music-hubs-funding-cuts-music-mark-responds/",
  },
  ismHe: {
    id: "ismHe",
    label: "ISM — university arts funding cut / music course closures",
    year: "July 2026",
    url: "https://www.ism.org/news/university-arts-funding-cut-ism-response/",
  },
  ofsGrant: {
    id: "ofsGrant",
    label: "OfS — Funding for 2026–27: decisions and allocations",
    year: "2026",
    url: "https://www.officeforstudents.org.uk/media/4srekubm/funding-for-2026-27-decisions-allocations.pdf",
  },
  curriculumReview: {
    id: "curriculumReview",
    label: "Curriculum and Assessment Review — government response",
    year: "Nov 2025",
    url: "https://www.gov.uk/government/publications/curriculum-and-assessment-review-final-report",
  },
};


export const meta = {
  brand: "CCDESIGNER",
  productName: "Creative Curriculum Designer",
  title: "The State of Creative Education in England",
  titleLead: "The State of Creative Education in",
  titleAccent: "England",
  date: "21 August 2026",
  subtitle:
    "A concise evidence overview for funding, partnership and development. Prepared and re-verified 21 August 2026.",
  heroLineBefore: "Exceptional lessons start with",
  heroLineAccent: "connection",
  purposeLine:
    "A shared evidence briefing on creative education in England — official figures for teachers, funders and arts organisations.",
  heroSupport:
    "Capture ideas. Build lessons. Connect with arts organisations — EYFS to A-level.",
  experienceLead: "The",
  experienceAccent: "facts",
  situationHeadline: "The situation",
  situationLine: "Creative education in England is at a point of change.",
  coverFraming: [
    "Creative education in England has contracted over the long term, with a clear entitlement gap linked to place and disadvantage. Curriculum reform, Turn It Up and the National Centre create space to rebuild.",
    "CCDesigner is a free national planning platform for performing and creative arts teachers (EYFS to A-level). It aims to bring planning, activity blocks and resources into one place — and connect teachers with arts organisations through Partner Hubs.",
    "It aims to shorten the distance between outstanding practice and the teacher who needs it — and to show that colder areas and higher-need schools are part of that reach.",
  ],
  earlyYearsPrinciple:
    "Early-years principle: children should help shape their learning. Creative subjects need not always sit in a typical classroom.",
  closing:
    "The long-term picture is contraction and unequal entitlement by place and disadvantage — but new plans and free national resources create space to rebuild. Short-term Ofqual movement is mixed, not a reversal. CCDesigner aims to widen reach, share resources into cold spots, and evidence how teachers use materials day to day.",
  verificationNote: "",
  partnerDisclaimer:
    "Organisation logos on the live site are for demonstration only — not endorsements or signed partnerships.",
  fundingCase:
    "Strongest funding case: fragmentation, cold spots, unequal entitlement and teacher-capacity pressure — while policy seeks school–cultural partnerships. Music Hubs revenue has been cash-flat near £76m since 2019 (a real-terms cut). CCD aims to make those connections usable and evidencable.",
  ui: {
    exploreHint: "Use arrows or swipe to explore",
    closeModal: "Close",
    whyCcdLabel: "Why this matters for CCDesigner",
    drillLabel: "Detail",
    drillClear: "Clear",
    homeLabel: "Site home",
    overviewChip: "Overview",
    continuePath: "Next topic",
    prevPage: "Prev",
    nextPage: "Next",
    openGlance: "Key findings",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    zoomHint: "Pinch, scroll, or use + − to zoom · tap a heading to open",
    lookCloser: "Look closer",
    dirUp: "Up",
    dirDown: "Down",
    dirLeft: "Left",
    dirRight: "Right",
  },
};

/**
 * Overview picture — world size of the Prezi canvas.
 * Hero image is full-bleed; headline and chips sit in world coordinates.
 */
export const overview = {
  width: 2400,
  height: 1350,
  heroImage: "hero-arts.jpg",
  headlineX: 140,
  headlineY: 320,
  hintX: 140,
  hintY: 1180,
};

/** Ordered ring for arrows / swipe (neighbourhood also on each topic). */
export const topicOrder = ["exams", "primary", "poverty", "ccd"] as const;

/**
 * The strand — arrow keys step along this path (not in-modal pages).
 * situation = key findings glance; then topic chips in order.
 */
export type StrandItem = {
  id: string;
  /** "glance" opens key findings; "topic" opens topic modal */
  kind: "glance" | "topic";
  /** World coords of the small canvas box */
  x: number;
  y: number;
  label: string;
};

export const strand: StrandItem[] = [
  { id: "situation", kind: "glance", x: 220, y: 560, label: "The situation" },
  { id: "exams", kind: "topic", x: 1680, y: 560, label: "Exams" },
  { id: "primary", kind: "topic", x: 520, y: 980, label: "Primary" },
  { id: "poverty", kind: "topic", x: 340, y: 420, label: "Poverty & place" },
  { id: "ccd", kind: "topic", x: 1520, y: 200, label: "CCDesigner" },
];

export function getStrandIndex(id: string | null | undefined): number {
  if (!id) return -1;
  return strand.findIndex((s) => s.id === id);
}

export function getStrandItem(id: string): StrandItem | undefined {
  return strand.find((s) => s.id === id);
}

/** Sync topic chip positions from strand (single source for the path). */
export function strandPointForTopic(topicId: string): { x: number; y: number } | undefined {
  const s = strand.find((i) => i.id === topicId);
  return s ? { x: s.x, y: s.y } : undefined;
}

/**
 * Key findings modal — two pages (not a 9-card grid).
 * Opened from “The situation” on the overview. Edit figures here.
 */
export type GlanceFigure = {
  value: string;
  label: string;
  source: string;
};

export type GlanceSection = {
  title: string;
  figures: GlanceFigure[];
  caveat?: string;
};

export type GlancePage = {
  id: string;
  heading: string;
  /** Page 1: flat figures + one-line read */
  summary?: string;
  figures?: GlanceFigure[];
  /** Page 2: titled sections */
  sections?: GlanceSection[];
  whyThisMattersForCCD?: string;
};

export const glanceModal = {
  title: "Key findings at a glance",
  pages: [
    {
      id: "longterm",
      heading: "The long-term picture",
      summary:
        "Creative education has contracted over a decade-plus — fewer entries, thinner pathways, and uneven school provision.",
      figures: [
        {
          value: "−41.7%",
          label: "Arts GCSE entries",
          source: "CLA Report Card 2026 · 2009/10–2024/25",
        },
        {
          value: "−25%",
          label: "Arts A-level entries",
          source: "CLA Report Card 2026 · 2011/12–2024/25",
        },
        {
          value: "36% / 36% / 83%",
          label: "Schools with no GCSE Music / Drama / Dance",
          source: "CLA Report Card 2026 · 2024/25 · “no entries” ≠ “not taught”",
        },
        {
          value: "~1 in 4",
          label: "Primary teachers with less than an hour of arts / week",
          source: "Teacher Tapp / CLA Report Card 2026",
        },
      ],
    },
    {
      id: "leftout",
      heading: "Who is left out · 2026",
      sections: [
        {
          title: "Access and inequality",
          figures: [
            {
              value: "47% vs 6%",
              label: "Independent vs state primary teachers reporting >2.5 hrs arts / week",
              source: "Teacher Tapp / CLA Report Card 2026",
            },
            {
              value: "54% vs 21%",
              label: "No GCSE Music — most vs least deprived LA fifth",
              source: "CLA Report Card 2026",
            },
            {
              value: "3.8% vs 5.9%",
              label: "Arts share of A-levels — most vs least deprived",
              source: "CLA Report Card 2026",
            },
          ],
        },
        {
          title: "Latest year (provisional)",
          figures: [
            {
              value: "Art +2.7% · Drama −0.9% · Music −1.3% · Perf/EA +1.2%",
              label: "2026 GCSE vs 2025",
              source: "Ofqual provisional entries, summer 2026",
            },
            {
              value: "Drama −9.5% · Music −4.9% · Art −1.0%",
              label: "2026 A level vs 2025",
              source: "Ofqual provisional · all A-levels +2.9%",
            },
          ],
          caveat:
            "Short-term Ofqual movement is mixed — not a long-term reversal. “No entries” does not mean “not taught”.",
        },
      ],
      whyThisMattersForCCD:
        "These figures set the case for a connection layer: teachers and arts organisations need a practical way to find, adapt and share outstanding work where entitlement is uneven.",
    },
  ] satisfies GlancePage[],
};


export const stats: StatTile[] = [
  {
    id: "gcse-fall",
    label: "Arts GCSE entries",
    value: "−41.7%",
    unit: "%",
    footnote: "2009/10–2024/25",
    sourceId: "cla2026",
    zoomClusterId: "exams",
  },
  {
    id: "alevel-fall",
    label: "Arts A-level entries",
    value: "−25%",
    unit: "%",
    footnote: "2011/12–2024/25",
    sourceId: "cla2026",
    zoomClusterId: "exams",
  },
  {
    id: "no-entry",
    label: "Schools with no GCSE Music / Drama / Dance",
    value: "36% / 36% / 83%",
    unit: "% of schools",
    footnote: "2024/25 — “no entries” ≠ “not taught”",
    sourceId: "cla2026",
    zoomClusterId: "exams",
  },
  {
    id: "primary-hour",
    label: "Primary teachers with less than an hour of arts / week",
    value: "~1 in 4",
    footnote: "Teacher Tapp / CLA 2026",
    sourceId: "cla2026",
    zoomClusterId: "primary",
  },
  {
    id: "hours-gap",
    label: "Independent vs state >2.5 hrs arts / week",
    value: "47% vs 6%",
    unit: "%",
    footnote: "Primary Teacher Tapp / CLA 2026",
    sourceId: "cla2026",
    zoomClusterId: "primary",
  },
  {
    id: "deprivation-music",
    label: "No GCSE Music — most vs least deprived LA fifth",
    value: "54% vs 21%",
    unit: "% of schools",
    footnote: "CLA 2026",
    sourceId: "cla2026",
    zoomClusterId: "poverty",
  },
  {
    id: "alevel-share",
    label: "Arts share of A-levels — most vs least deprived",
    value: "3.8% vs 5.9%",
    unit: "% of entries",
    footnote: "CLA 2026",
    sourceId: "cla2026",
    zoomClusterId: "poverty",
  },
  {
    id: "ofqual-gcse-2026",
    label: "2026 GCSE vs 2025 (provisional)",
    value: "Art +2.7% · Drama −0.9% · Music −1.3% · Perf/EA +1.2%",
    unit: "% change",
    footnote: "Ofqual; rounded to 5",
    sourceId: "ofqual2026",
    zoomClusterId: "exams",
  },
  {
    id: "ofqual-alevel-2026",
    label: "2026 A level vs 2025 (provisional)",
    value: "Drama −9.5% · Music −4.9% · Art −1.0%",
    unit: "% change",
    footnote: "Ofqual; all A-levels +2.9%",
    sourceId: "ofqual2026",
    zoomClusterId: "exams",
  },
];

export const charts: Record<string, ChartDef> = {
  longterm: {
    id: "longterm",
    type: "horizontal-change",
    caption: "Long-term contraction in arts education",
    sourceNote:
      "GCSE −41.7% (2009/10–2024/25) and A-level −25% (2011/12–2024/25): CLA Report Card 2026. Teaching hours −21% (2011/12–2022/23, excl. Dance) and teacher headcount −14% vs 2010: CLA Report Card 2024.",
    axis: { x: "Percentage change" },
    series: [
      { name: "Arts GCSE entries", change: -41.7, baseline: "2009/10", fill: "#FF6B6B" },
      { name: "Arts A-level entries", change: -25, baseline: "2011/12", fill: "#0D9488" },
      { name: "Arts teaching hours", change: -21, baseline: "2011/12 (excl. Dance)", fill: "#14B8A6" },
      { name: "Arts teachers", change: -14, baseline: "vs 2010", fill: "#002D24" },
    ],
  },
  primaryHours: {
    id: "primaryHours",
    type: "double-doughnut",
    caption: "Primary teachers reporting more than 2.5 hours of arts per week",
    sourceNote:
      "Teacher Tapp survey reported in CLA Report Card 2026. These are teacher-reported survey results, not a census of schools.",
    axis: {
      legend: {
        independent: "Independent primary teachers",
        state: "State primary teachers",
      },
    },
    series: [
      { name: "Independent", value: 47, fill: "#002D24" },
      { name: "State", value: 6, fill: "#14B8A6" },
    ],
  },
  disadvantage: {
    id: "disadvantage",
    type: "grouped-bars",
    caption: "Access to arts qualifications differs by disadvantage",
    sourceNote:
      "Share of state-funded mainstream schools with GCSE entries in Art & Design, Dance and Music, by school disadvantage fifth (DfE Curriculum & Assessment Review analytical annex, Table 19, 2024/25). *Photography is any exam entry by subject discount group (Table 18), not GCSE-only.",
    axis: {
      y: "% of state-funded mainstream schools",
      legend: {
        least: "Least disadvantaged",
        most: "Most disadvantaged",
      },
    },
    series: [
      { subject: "Art & Design", least: 99, most: 97 },
      { subject: "Dance", least: 27, most: 6 },
      { subject: "Music", least: 90, most: 39 },
      { subject: "Photography*", least: 32, most: 43 },
    ],
  },
  noGcse: {
    id: "noGcse",
    type: "lollipop",
    caption: "Schools with no GCSE entries, 2024/25",
    sourceNote:
      'Source: Cultural Learning Alliance Report Card 2026. In 2022/23 the figures were 42% / 41% / 84%. “No GCSE entries” does not mean “subject not taught”.',
    axis: { x: "% of schools" },
    series: [
      { subject: "Music", none: 36, fill: "#0D9488" },
      { subject: "Drama", none: 36, fill: "#14B8A6" },
      { subject: "Dance", none: 83, fill: "#FF6B6B" },
    ],
  },
  gcseIndex: {
    id: "gcseIndex",
    type: "indexed-line",
    caption: "Recent GCSE entry movement: 2024–2026",
    sourceNote:
      "Index uses Ofqual provisional entry counts with 2024=100 so subjects of different sizes can be compared visually. Underlying counts (2024 / 2025 / 2026): Art 197,500 / 194,190 / 199,435; Drama 49,410 / 48,650 / 48,220; Music 32,615 / 34,555 / 34,120; Performing/Expressive Arts 6,675 / 7,175 / 7,265.",
    axis: {
      y: "Index (2024 = 100)",
      series: {
        art: "Art & Design",
        drama: "Drama",
        music: "Music",
        performing: "Performing / EA",
      },
    },
    series: [
      { year: "2024", art: 100, drama: 100, music: 100, performing: 100 },
      {
        year: "2025",
        art: Number(((194190 / 197500) * 100).toFixed(1)),
        drama: Number(((48650 / 49410) * 100).toFixed(1)),
        music: Number(((34555 / 32615) * 100).toFixed(1)),
        performing: Number(((7175 / 6675) * 100).toFixed(1)),
      },
      {
        year: "2026",
        art: Number(((199435 / 197500) * 100).toFixed(1)),
        drama: Number(((48220 / 49410) * 100).toFixed(1)),
        music: Number(((34120 / 32615) * 100).toFixed(1)),
        performing: Number(((7265 / 6675) * 100).toFixed(1)),
      },
    ],
    meta: { yMin: 94, yMax: 112 },
  },
  alevelIndex: {
    id: "alevelIndex",
    type: "indexed-line",
    caption: "Recent A-level entry movement: 2024–2026",
    sourceNote:
      "Index uses Ofqual provisional entry counts. Underlying counts (2024 / 2025 / 2026): Art & Design 40,965 / 40,400 / 40,015; Drama 7,895 / 7,410 / 6,710; Music 5,005 / 4,875 / 4,635. Recent change 2025→2026: Drama −9.5%; Music −4.9%; Art & Design −1.0%.",
    axis: {
      y: "Index (2024 = 100)",
      series: { art: "Art & Design", drama: "Drama", music: "Music" },
    },
    series: [
      { year: "2024", art: 100, drama: 100, music: 100 },
      {
        year: "2025",
        art: Number(((40400 / 40965) * 100).toFixed(1)),
        drama: Number(((7410 / 7895) * 100).toFixed(1)),
        music: Number(((4875 / 5005) * 100).toFixed(1)),
      },
      {
        year: "2026",
        art: Number(((40015 / 40965) * 100).toFixed(1)),
        drama: Number(((6710 / 7895) * 100).toFixed(1)),
        music: Number(((4635 / 5005) * 100).toFixed(1)),
      },
    ],
    meta: { yMin: 82.5, yMax: 100, mode: "alevel" },
  },
  heChange: {
    id: "heChange",
    type: "divergent-bars",
    caption: "University students, 2023/24–2024/25 — not school exams",
    sourceNote:
      "HESA domestic undergraduate numbers (CLA 2026 Detailed Analysis, Table 7). Full names: Art; Cinematics & Photography; Creative Arts & Design (non-specific); Dance; Design Studies; Drama; Music; Others in Creative Arts & Design; Performing Arts (non-specific). Drama +1.6% and Music +1.1% at university that year; CLA notes Drama had fallen 9.5% from 2019/20 to 2023/24 before this one-year rise. School exams are a different series: A-level Drama −9.5% and Music −4.9% (Ofqual 2026 vs 2025). Across all Creative Arts & Design, domestic undergrads fell 0.5% while the wider undergraduate cohort rose 0.6%.",
    axis: {
      x: "% change in domestic undergraduates, 2023/24 to 2024/25",
      legend: { decrease: "Fewer students", increase: "More students" },
    },
    series: [
      { subject: "Art", label: "Art", change: -1.5 },
      { subject: "Cinematics & Photography", label: "Film & photo", change: -1.4 },
      { subject: "Creative Arts & Design (non-specific)", label: "Creative arts", change: -2.9 },
      { subject: "Dance", label: "Dance", change: -0.7 },
      { subject: "Design Studies", label: "Design", change: -1.1 },
      { subject: "Drama", label: "Drama", change: 1.6 },
      { subject: "Music", label: "Music", change: 1.1 },
      { subject: "Others in Creative Arts & Design", label: "Other creative", change: -15.4 },
      { subject: "Performing Arts (non-specific)", label: "Performing arts", change: -2.9 },
    ],
  },
  hubRevenueTrend: {
    id: "hubRevenueTrend",
    type: "funding-trend",
    caption: "Music Hubs cash stayed near £76m — dotted line is 2019 money today",
    sourceNote:
      "Bars are the cash revenue grant (not capital): £75m in 2018/19; ≈ £76m since 2019; £76m confirmed to AY 2026/27 (Turn It Up). The dotted line is not extra funding — it shows what £76m in 2019 is worth now. Music Mark cites Bank of England: £76m in 2019 ≈ £100m today.",
    axis: {
      y: "£ million",
      legend: {
        cash: "Cash revenue grant",
        keep2019: "What £76m in 2019 is worth today",
      },
    },
    series: [
      { year: "2018/19", cash: 75 },
      { year: "2019/20", cash: 76, keep2019: 76 },
      { year: "2024/25", cash: 76 },
      { year: "2026/27", cash: 76, keep2019: 100 },
    ],
    meta: { yMax: 110 },
  },
  funding: {
    id: "funding",
    type: "funding-bars",
    caption: "Current national commitments: different funding purposes",
    sourceNote:
      "Not additive like-for-like funding: £76m is annual Music Hubs backing; £25m is additional capital; National Centre is backed by up to £13m over 3 years; enrichment expansion is £22.5m over 3 years for up to 400 schools. Sources: DCMS/DfE Turn It Up; DfE Enrichment Framework resources.",
    axis: {
      y: "£ million",
      legend: {
        revenue: "Annual revenue backing",
        capital: "Additional capital investment",
        centre: "Centre contract support",
      },
    },
    series: [
      {
        label: "Hubs (annual)",
        value: 76,
        kind: "Annual revenue backing",
        fill: "#0D9488",
      },
      {
        label: "Capital",
        value: 25,
        kind: "Additional capital investment",
        fill: "#14B8A6",
      },
      {
        label: "National Centre",
        value: 13,
        kind: "Centre contract support",
        fill: "#002D24",
      },
    ],
  },
  enrichmentParticipation: {
    id: "enrichmentParticipation",
    type: "lollipop",
    caption: "Reported enrichment participation, summer term 2024–25",
    sourceNote:
      "Parent/pupil-reported participation in at least one extracurricular activity. KS1–2 and KS3 both 72%; KS4 60%; special schools (primary and secondary) 45%. Musical performance was offered by 75% of schools. Source: DfE Evidence on enrichment in schools and colleges.",
    axis: { x: "% of pupils reported taking part" },
    series: [
      { subject: "KS1–3", value: 72, fill: "#0D9488" },
      { subject: "KS4", value: 60, fill: "#14B8A6" },
      { subject: "Special", value: 45, fill: "#FF6B6B" },
    ],
  },
};


export const topics: TopicDef[] = [
  {
    id: "exams",
    markerLabel: "Exams",
    x: 1680,
    y: 560,
    title: "Exams · GCSE & A level",
    investorLine: "Long-term contraction; short-term Ofqual movement is mixed — not a reversal.",
    body: [
      "Arts GCSE entries were 41.7% lower in 2024/25 than in 2009/10; arts A-level entries have fallen 25% since 2011/12 (CLA Report Card 2026). Teaching hours −21%; arts teachers −14% (CLA Report Card 2024).",
      "In 2024/25, 36% of schools had no GCSE Music entries, 36% no Drama, 83% no Dance — “no entries” does not mean “not taught”.",
      "Ofqual provisional summer 2026 vs 2025: GCSE Art +2.7%, Drama −0.9%, Music −1.3%, Performing/Expressive Arts +1.2%. A level: Drama −9.5%, Music −4.9%, Art −1.0% (all A-levels +2.9%).",
      "Access to arts qualifications still tracks disadvantage (DfE Tables 18–19).",
    ],
    whyThisMattersForCCD:
      "CCDesigner aims to support teachers working inside a system that has already contracted — keeping planning cumulative and partnership reachable where exam pathways thin out.",
    sourceIds: ["cla2024", "cla2026", "ofqual2026", "ofqualBackground", "dfeAnnex"],
    statIds: ["gcse-fall", "alevel-fall", "no-entry", "ofqual-gcse-2026", "ofqual-alevel-2026"],
    chartIds: ["longterm", "noGcse"],
    nestedChartIds: ["gcseIndex", "alevelIndex", "disadvantage"],
    neighbors: { left: "poverty", right: "ccd", down: "primary", up: "ccd" },
  },
  {
    id: "primary",
    markerLabel: "Primary",
    x: 520,
    y: 980,
    title: "Primary · entitlement starts early",
    investorLine: "The hours gap is stark — and partnerships are thin.",
    body: [
      "Primary Teacher Tapp / CLA 2026: 47% of independent vs 6% of state primary teachers report more than 2.5 hours of arts per week. About one in four report less than an hour.",
      "Subject leads: Art & Design 89%, Music 84%, Drama 9%, Dance 5%. 43% of primary teachers report that their school works with no external partners to deliver the arts curriculum.",
      "Highest-FSM vs lowest-FSM schools reporting reduced arts hours: 31% vs 22%.",
    ],
    whyThisMattersForCCD:
      "Where generalists carry the arts, reusable activity blocks and Partner Hubs aim to make excellent practice easier to find and adapt.",
    sourceIds: ["cla2026"],
    statIds: ["hours-gap", "primary-hour"],
    chartIds: ["primaryHours"],
    neighbors: { up: "poverty", right: "exams", left: "poverty", down: "exams" },
  },
  {
    id: "poverty",
    markerLabel: "Poverty & place",
    x: 340,
    y: 420,
    title: "Poverty & place",
    investorLine: "Entitlement tracks place and disadvantage — association, not proven causation.",
    body: [
      "54% vs 21% of schools in the most vs least deprived LA fifths have no GCSE Music entries; 59% vs 17% have no GCSE Drama entries (CLA 2026).",
      "Arts share of A-levels: 3.8% vs 5.9% in most vs least deprived fifths. FSM pupils are under-represented in arts GCSEs and A-level Music, Dance, Drama and Design & Technology.",
      "West Midlands and North East: highest FSM rates, and among the lowest regional arts GCSE / A-level shares.",
      "Domestic Creative Arts & Design undergraduates edged down while the wider cohort rose (HESA via CLA 2026).",
    ],
    whyThisMattersForCCD:
      "CCD aims to prioritise underserved areas in how hubs and resources are surfaced — helping teachers reach beyond postcode limits for ideas and partners.",
    sourceIds: ["cla2026", "hesaCla", "cla2024"],
    statIds: ["deprivation-music", "alevel-share", "hours-gap"],
    chartIds: ["disadvantage"],
    nestedChartIds: ["heChange"],
    neighbors: { right: "exams", down: "primary", up: "ccd", left: "primary" },
  },
  {
    id: "ccd",
    markerLabel: "CCDesigner",
    x: 1520,
    y: 200,
    title: "What this means for CCDesigner",
    investorLine: "",
    body: [
      "Connect rather than duplicate — make outstanding practice usable day to day. CCDesigner is a free national planning platform for performing and creative arts teachers (EYFS to A-level).",
      "Make partnership measurable — Partner Hubs aim to connect teachers with arts organisations in the same place they plan, so collaboration shows up in everyday work.",
      "Strongest funding case — fragmentation, unequal entitlement and teacher-capacity pressure, while policy seeks school–cultural partnerships. Music Hubs: £76m annual to AY 2026/27 + £25m capital. National Centre: up to £13m over three years — separate streams.",
      "Organisation logos on the live site are for demonstration only — not endorsements or signed partnerships.",
    ],
    whyThisMattersForCCD:
      "The evidence shows fragmentation and unequal entitlement. CCD aims to be the practical connection layer for teachers and organisations.",
    sourceIds: ["cla2026", "ofqual2026", "turnItUp", "nationalCentre"],
    neighbors: { left: "exams", down: "exams", right: "exams", up: "poverty" },
  },
];

export function getTopic(id: string): TopicDef | undefined {
  return topics.find((t) => t.id === id);
}

export function getStat(id: string): StatTile | undefined {
  return stats.find((s) => s.id === id);
}

export function getChart(id: string): ChartDef | undefined {
  return charts[id];
}

export const principalSourceIds = [
  "cla2024",
  "cla2026",
  "cla2026detail",
  "ofqual2026",
  "dfeAnnex",
  "dfeWorkforce",
  "turnItUp",
  "nationalCentre",
  "hesaCla",
  "ofqualBackground",
  "eyfs2026",
  "enrichmentFramework",
  "enrichmentBenchmarks",
  "enrichmentBackground",
  "enrichmentResources",
  "enrichmentEvidence",
  "enrichmentWorkingGroup",
  "musicMarkEnrichment",
] as const;

/** @deprecated alias — prefer getTopic */
export type ClusterDef = TopicDef;
export const clusters = topics;
export function getCluster(id: string) {
  return getTopic(id);
}
