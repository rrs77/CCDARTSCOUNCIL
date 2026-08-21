/**
 * CCDesigner — The facts
 * ======================
 * EDIT THIS FILE to change headlines, stats, captions, sources, and cluster order.
 * See `README.md` in this folder.
 *
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
  /** Optional unit hint for editors (e.g. "%", "pp") — display is usually in `value`. */
  unit?: string;
  footnote: string;
  sourceId: string;
  /** Cluster to fly to when this tile is tapped on the overview */
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
    | "funding-bars";
  caption: string;
  sourceNote: string;
  /** Colour tokens used by the chart renderer */
  colours?: string[];
  /** Axis / legend labels — keep copy here, not in React chart code */
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

export type ClusterDef = {
  id: string;
  n: number;
  /**
   * World coordinates on the infinite canvas (pixels in the landscape).
   * Edit these to rearrange the Prezi map — not a slide index.
   */
  x: number;
  y: number;
  title: string;
  /** Short line readable on the map (before opening the node) */
  overviewLine: string;
  /** Investor / funder one-liner */
  investorLine: string;
  /** Short body paragraphs */
  body: string[];
  whyThisMattersForCCD: string;
  sourceIds: string[];
  chartIds?: string[];
  /** Optional inline stat tiles shown inside the cluster */
  statIds?: string[];
  caveats?: string[];
  /** Compass neighbours — arrow / swipe / D-pad step here (editable). */
  neighbors?: Partial<Record<CompassDir, string>>;
  /** Home node: camera lands here; Escape returns here. */
  isHome?: boolean;
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
};

export const meta = {
  brand: "CCDESIGNER",
  productName: "Creative Curriculum Designer",
  title: "The State of Creative Education in England",
  /** Cover headline split for the italic accent word */
  titleLead: "The State of Creative Education in",
  titleAccent: "England",
  date: "21 August 2026",
  subtitle:
    "A concise evidence overview for funding, partnership and development. Prepared and re-verified 21 August 2026.",
  /** Homepage opening beat (login hero language). */
  heroLineBefore: "Exceptional lessons start with",
  heroLineAccent: "connection",
  heroSupport:
    "Capture ideas. Build lessons. Connect with arts organisations — EYFS to A-level.",
  /** Topbar experience name */
  experienceLead: "The",
  experienceAccent: "facts",
  /** Short line under “The situation” on the home node (map, not a stats dump). */
  situationLine: "Creative education at a point of change.",
  coverFraming: [
    "Creative education in England has contracted over the long term, with a clear entitlement gap linked to disadvantage. Curriculum reform and the National Centre create space to strengthen access and partnership.",
    "CCDesigner is a free national planning platform for performing and creative arts teachers (EYFS–KS5). It aims to bring planning, activity blocks and resources into one place — and connect teachers with arts organisations through Partner Hubs.",
    "Not a fix for structural inequality on its own. It aims to shorten the distance between excellent practice and the teacher who needs it. A platform cannot replace specialists, instruments or live culture — it can keep ideas and connections from being confined by postcode.",
  ],
  earlyYearsPrinciple:
    "Early-years principle: children should help shape their learning. Creative subjects need not always sit in a typical classroom.",
  closing:
    "The long-term picture is contraction and unequal entitlement. Short-term Ofqual movement is mixed, not a reversal. CCDesigner aims to be a practical connection layer — teachers and organisations, day to day — without over-claiming impact.",
  verificationNote:
    "Verification note: figures re-checked against CLA, Ofqual, DfE and HESA analyses on 21 August 2026. Primary tables preferred over secondary paraphrase. Unverified national percentages omitted.",
  partnerDisclaimer:
    "Organisation logos on the live site are for demonstration only — not endorsements or signed partnerships. This is a prototype / demo connection layer.",
  fundingCase:
    "Strongest funding case: fragmentation, unequal entitlement and teacher-capacity pressure — while policy seeks school–cultural partnerships. CCD aims to make those connections usable. We don’t need more resources so much as to make the outstanding ones easier to find, connect and build upon.",
  /** Chrome / buttons — edit here, not in React components */
  ui: {
    enterCta: "Enter the facts",
    exploreHint: "Use arrows or swipe to explore",
    backHome: "The situation",
    openNode: "Open",
    closeModal: "Close",
    whyCcdLabel: "Why this matters for CCDesigner",
    drillLabel: "Detail",
    drillClear: "Clear",
    homeLabel: "Site home",
    overviewChip: "Overview",
    continuePath: "Next topic",
    dirUp: "Up",
    dirDown: "Down",
    dirLeft: "Left",
    dirRight: "Right",
    scrollMore: "Scroll for more",
  },
};

/** Home cluster id — Escape / “The situation” control returns here. */
export const HOME_ID = "situation";

/**
 * Investor key facts live on their topic nodes (not dumped on home).
 * Listed here so editors can see the persuasive set at a glance.
 */
export const keyFactStatIds = [
  "gcse-fall",
  "alevel-fall",
  "no-entry",
  "hours-gap",
  "deprivation-music",
  "ofqual-gcse-2026",
  "ofqual-alevel-2026",
] as const;

/** Soft path glow through topics (visual only). */
export const journey: string[] = [
  "cover",
  "glance",
  "longterm",
  "primary",
  "secondary",
  "availability",
  "gcse",
  "alevel",
  "teachers",
  "poverty",
  "he",
  "hubs",
  "centre",
  "meaning",
  "conclusion",
];

/** Key investor-facing facts — also shown on the overview map. */
export const stats: StatTile[] = [
  {
    id: "gcse-fall",
    label: "Arts GCSE entries",
    value: "−42%",
    unit: "%",
    footnote: "2010–2022/23",
    sourceId: "cla2024",
    zoomClusterId: "glance",
  },
  {
    id: "alevel-fall",
    label: "Arts A-level entries",
    value: "−21%",
    unit: "%",
    footnote: "2010/11–2022/23",
    sourceId: "cla2024",
    zoomClusterId: "glance",
  },
  {
    id: "no-entry",
    label: "Schools with no GCSE Music / Drama / Dance",
    value: "42% / 41% / 84%",
    unit: "% of schools",
    footnote: "2022/23 — “no entries” ≠ “not taught”",
    sourceId: "cla2024",
    zoomClusterId: "availability",
  },
  {
    id: "primary-hour",
    label: "Primary teachers under 1 hour arts / week",
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
    zoomClusterId: "gcse",
  },
  {
    id: "ofqual-alevel-2026",
    label: "2026 A level vs 2025 (provisional)",
    value: "Drama −9.5% · Music −4.9% · Art −1.0%",
    unit: "% change",
    footnote: "Ofqual; all A-levels +2.9%",
    sourceId: "ofqual2026",
    zoomClusterId: "alevel",
  },
];

export const charts: Record<string, ChartDef> = {
  longterm: {
    id: "longterm",
    type: "horizontal-change",
    caption: "Long-term contraction in arts education",
    sourceNote:
      "Baselines: GCSE 2010; A level 2010/11; teaching hours 2011/12; teacher headcount reported by CLA against 2010. End point 2022/23. Source: CLA Report Card 2024.",
    axis: { x: "Percentage change" },
    series: [
      { name: "Arts GCSE entries", change: -42, baseline: "2010", fill: "#E97451" },
      { name: "Arts A-level entries", change: -21, baseline: "2010/11", fill: "#C9A227" },
      { name: "Arts teaching hours", change: -21, baseline: "2011/12 (excl. Dance)", fill: "#2A9D8F" },
      { name: "Arts teachers", change: -14, baseline: "vs 2010", fill: "#5B7C99" },
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
      { name: "Independent", value: 47, fill: "#7B6B9C" },
      { name: "State", value: 6, fill: "#2A9D8F" },
    ],
  },
  disadvantage: {
    id: "disadvantage",
    type: "grouped-bars",
    caption: "Access to arts qualifications differs by disadvantage",
    sourceNote:
      "GCSE entries for Art & Design, Dance, Music and Speech & Drama (Table 19). *Photography is any exam entry by subject discount group (Table 18), not GCSE-only. DfE Curriculum & Assessment Review analytical annex, 2024/25.",
    axis: {
      y: "% of state-funded mainstream schools",
      legend: {
        least: "Least disadvantaged fifth",
        most: "Most disadvantaged fifth",
      },
    },
    series: [
      { subject: "Art & Design", least: 99, most: 97 },
      { subject: "Dance", least: 27, most: 6 },
      { subject: "Music", least: 90, most: 39 },
      { subject: "Speech & Drama", least: 83, most: 42 },
      { subject: "Photography*", least: 32, most: 43 },
    ],
  },
  noGcse: {
    id: "noGcse",
    type: "lollipop",
    caption: "Schools with no GCSE entries, 2022/23",
    sourceNote:
      'Source: Cultural Learning Alliance Report Card 2024. “No GCSE entries” does not mean “subject not taught”.',
    axis: { x: "% of schools" },
    series: [
      { subject: "Music", none: 42, fill: "#2A9D8F" },
      { subject: "Drama", none: 41, fill: "#7B6B9C" },
      { subject: "Dance", none: 84, fill: "#E97451" },
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
        performing: "Performing / Expressive Arts",
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
    caption: "Higher education: change within Creative Arts & Design",
    sourceNote:
      "Domestic undergraduate student numbers. HESA 2024/25 as analysed in CLA Report Card 2026 Detailed Analysis.",
    axis: {
      x: "% change, 2023/24 to 2024/25",
      legend: { decrease: "Decrease", increase: "Increase" },
    },
    series: [
      { subject: "Art", change: -1.5 },
      { subject: "Cinematics & Photography", change: -1.4 },
      { subject: "Creative Arts & Design (non-specific)", change: -2.9 },
      { subject: "Dance", change: -0.7 },
      { subject: "Design Studies", change: -1.1 },
      { subject: "Drama", change: 1.6 },
    ],
  },
  funding: {
    id: "funding",
    type: "funding-bars",
    caption: "Current national commitments: different funding purposes",
    sourceNote:
      "Not additive like-for-like funding: £76m is annual Music Hubs backing; £25m is additional capital; National Centre is backed by up to £13m over 3 years. Source: DCMS/DfE, Turn It Up, July 2026.",
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
        label: "Annual Music Hubs backing (to AY 2026/27)",
        value: 76,
        kind: "Annual revenue backing",
        fill: "#2A9D8F",
      },
      {
        label: "Additional capital for instruments/technology",
        value: 25,
        kind: "Additional capital investment",
        fill: "#C9A227",
      },
      {
        label: "National Centre (up to 3 years)",
        value: 13,
        kind: "Centre contract support",
        fill: "#7B6B9C",
      },
    ],
  },
};

export const clusters: ClusterDef[] = [
  {
    id: "cover",
    n: 1,
    x: 0,
    y: 0,
    title: "Cover / framing",
    overviewLine: "Evidence + CCD vision",
    investorLine: "A connection layer for creative education — not a claim to fix inequality alone.",
    body: meta.coverFraming,
    whyThisMattersForCCD:
      "This canvas sets the evidence case for why a free national planning and partnership platform aims to matter now.",
    sourceIds: ["cla2026", "ofqual2026"],
  },
  {
    id: "glance",
    n: 2,
    x: 920,
    y: -80,
    title: "Key findings at a glance",
    overviewLine: "Investor-ready headline stats",
    investorLine: "Usable on its own — the figures that persuade a funder in thirty seconds.",
    body: [
      "Ofqual 2026 figures are provisional (rounded to 5). “No entries” does not mean “not taught”.",
    ],
    whyThisMattersForCCD:
      "These figures set the case for a connection layer: teachers and arts organisations need a practical way to find, adapt and share outstanding work where entitlement is uneven.",
    sourceIds: ["cla2024", "cla2026", "ofqual2026"],
    statIds: [
      "gcse-fall",
      "alevel-fall",
      "no-entry",
      "primary-hour",
      "hours-gap",
      "deprivation-music",
      "alevel-share",
      "ofqual-gcse-2026",
      "ofqual-alevel-2026",
    ],
  },
  {
    id: "longterm",
    n: 3,
    x: 1680,
    y: 40,
    title: "Long-term picture",
    overviewLine: "Chart 1 — contraction since ~2010",
    investorLine: "Four separate baselines — do not collapse into one index.",
    body: ["Each series has its own baseline. End point 2022/23 (CLA Report Card 2024)."],
    whyThisMattersForCCD:
      "CCDesigner aims to support teachers working inside a system that has already contracted — by making planning and partnership more usable day to day.",
    sourceIds: ["cla2024"],
    chartIds: ["longterm"],
  },
  {
    id: "primary",
    n: 4,
    x: -200,
    y: 720,
    title: "Primary provision",
    overviewLine: "Chart 2 — hours gap & subject leads",
    investorLine: "The entitlement gap starts early — and partnerships are thin.",
    body: [
      "Some schools report music or drama only later, or inside English — treat that as a research question, not a proven national pattern.",
      "No official national statistic exists for weekly Year 7 music/drama teaching time — so none is quoted here.",
      "Subject leads: Art & Design 89%, Music 84%, Drama 9%, Dance 5%. 43% of primary teachers report no external artist or cultural organisation. Highest-FSM vs lowest-FSM schools reporting reduced arts hours: 31% vs 22%.",
    ],
    whyThisMattersForCCD:
      "Where generalists carry the arts, reusable activity blocks and Partner Hubs aim to make excellent practice easier to find and adapt — without claiming to replace specialists.",
    sourceIds: ["cla2026"],
    chartIds: ["primaryHours"],
  },
  {
    id: "secondary",
    n: 5,
    x: 720,
    y: 780,
    title: "Secondary disadvantage",
    overviewLine: "Chart 3 — who gets entries",
    investorLine: "Access to arts qualifications tracks disadvantage.",
    body: [
      "Percentage of state-funded mainstream schools with entries (DfE Tables 18–19, 2024/25).",
      "Technical Awards narrow some gaps. These data cannot tell whether Year 7 or 8 receive a weekly lesson.",
    ],
    whyThisMattersForCCD:
      "CCD aims to help cover cold spots by connecting schools with organisation resources — as a proposed connection layer, not a signed partnership claim.",
    sourceIds: ["dfeAnnex"],
    chartIds: ["disadvantage"],
  },
  {
    id: "availability",
    n: 6,
    x: 1550,
    y: 820,
    title: "GCSE availability",
    overviewLine: "Chart 4 — schools with no entries",
    investorLine: "Large shares of schools enter nobody for Music, Drama or Dance.",
    body: [
      "CLA 2026: 54% vs 21% of schools in the most vs least deprived LA fifths have no GCSE Music entries.",
      "FSM pupils are under-represented in all arts GCSEs and over-represented in arts Level 2 vocational entries. Stay qualification-neutral when interpreting.",
    ],
    whyThisMattersForCCD:
      "Where GCSE pathways thin out, teachers still need planning stubs and links to official organisation materials — CCD holds the planning layer, not the copyrighted resource itself.",
    sourceIds: ["cla2024", "cla2026"],
    chartIds: ["noGcse"],
  },
  {
    id: "gcse",
    n: 7,
    x: -120,
    y: 1520,
    title: "Latest GCSE",
    overviewLine: "Chart 5 — indexed 2024–26",
    investorLine: "Short-term movement is mixed — not a long-term reversal.",
    body: [
      "Ofqual provisional summer 2026 vs 2025. All GCSEs +1.1%; age-16 population +1.2%. Collected by 15 April 2026; rounded to 5.",
      "Music rose 2024–25 then eased in 2026. Read against long-term contraction.",
    ],
    whyThisMattersForCCD:
      "Short-term movement does not undo the long-term fall. CCD aims to help teachers keep creative learning cumulative year to year.",
    sourceIds: ["ofqual2026", "ofqualBackground"],
    chartIds: ["gcseIndex"],
  },
  {
    id: "alevel",
    n: 8,
    x: 780,
    y: 1580,
    title: "A-level pipeline",
    overviewLine: "Chart 6 — indexed A-level",
    investorLine: "Drama −9.5% and Music −4.9% in the latest provisional year.",
    body: [
      "All A-levels +2.9% in 2026 provisional data, while arts subjects remain well below 2010/11.",
      "Arts A-level share 3.8% vs 5.9% in most vs least deprived fifths. FSM pupils under-represented in A-level Music, Dance, Drama and Design & Technology.",
    ],
    whyThisMattersForCCD:
      "A thinner post-16 pipeline makes earlier connection — from primary through KS4 — more important. CCD aims to support that continuum.",
    sourceIds: ["ofqual2026", "cla2026"],
    chartIds: ["alevelIndex"],
  },
  {
    id: "teachers",
    n: 9,
    x: 1620,
    y: 1500,
    title: "Teachers & time",
    overviewLine: "Workforce pressure",
    investorLine: "Fewer arts teachers and fewer arts hours — while EBacc hours rose.",
    body: [
      "CLA 2024: 14% fewer arts teachers vs 2010; −21% teaching hours 2011/12–2022/23 (excl. Dance).",
      "DfE School Workforce Nov 2025 (pub 4 Jun 2026): 63% of secondary hours in EBacc 2025/26 (54% in 2010/11); 80% of eligible secondaries supplied timetabling data.",
      "CLA 2026: ~23% of expressive-arts teachers have no subject-relevant post-A-level qualification — that does not mean ineffective.",
    ],
    whyThisMattersForCCD:
      "CCD complements expertise. It aims to reduce planning friction for specialists and generalists alike — not to replace teachers, instruments or live cultural experiences.",
    sourceIds: ["cla2024", "cla2026", "dfeWorkforce"],
  },
  {
    id: "poverty",
    n: 10,
    x: -80,
    y: 2280,
    title: "Poverty & place",
    overviewLine: "Cold spots",
    investorLine: "Entitlement tracks place and disadvantage — association, not proven causation.",
    body: [
      "54% vs 21% (no GCSE Music by LA deprivation fifth); 31% vs 22% (primary hours reduced by FSM); 3.8% vs 5.9% (arts A-level share).",
      "West Midlands and North East: highest FSM rates and lowest arts GCSE entry share among regions. FSM ≠ LA deprivation.",
    ],
    whyThisMattersForCCD:
      "CCD aims to prioritise underserved areas in how hubs and resources are surfaced — helping teachers reach beyond postcode limits for ideas and partners.",
    sourceIds: ["cla2026"],
    statIds: ["deprivation-music", "hours-gap", "alevel-share"],
  },
  {
    id: "he",
    n: 11,
    x: 800,
    y: 2340,
    title: "Higher education",
    overviewLine: "Chart 7 — Creative Arts & Design",
    investorLine: "Domestic CAD undergrads edged down while the wider cohort rose.",
    body: [
      "128,300 domestic Creative Arts & Design undergraduates; −0.5% vs total domestic +0.6%; share 7.3%→7.2%.",
      "Long-term about −6% since 2010 (CLA 2024). Do not invent a national percentage of universities closing arts courses.",
    ],
    whyThisMattersForCCD:
      "A contracting HE pathway reinforces the need to protect school-stage creative learning and keep connections alive earlier in the journey.",
    sourceIds: ["hesaCla", "cla2024"],
    chartIds: ["heChange"],
  },
  {
    id: "hubs",
    n: 12,
    x: 1600,
    y: 2280,
    title: "Music Hubs",
    overviewLine: "Chart 8 — funding streams",
    investorLine: "Keep revenue, capital and Centre support as separate streams.",
    body: [
      "43 partnerships. £76m annually to AY 2026/27 plus a separate £25m capital programme (>130,000 instruments/kit by end 2026/27).",
      "Do not say hub funding has simply “declined”. The earlier £79m figure over AY 2023/24–2024/25 is not comparable. Streams are not additive like-for-like totals.",
    ],
    whyThisMattersForCCD:
      "Hubs are a natural CCD partnership model: teachers pull organisation planning stubs into their library while official materials stay on the organisation site.",
    sourceIds: ["turnItUp"],
    chartIds: ["funding"],
  },
  {
    id: "centre",
    n: 13,
    x: 200,
    y: 3000,
    title: "National Centre",
    overviewLine: "National architecture",
    investorLine: "Phased from Sept 2026 — aligns with CCD’s connect proposition, without a formal claim.",
    body: [
      "Phased establishment from September 2026, backed by up to £13 million over three years.",
      "Intended Music Hubs fundholder from 1 September 2027 (procurement documentation; the music plan also references August 2027).",
      "As organisations come together nationally, the opportunity is stronger coordination — not duplication.",
    ],
    whyThisMattersForCCD:
      "CCD aims to make school–organisation connections usable in everyday planning as the national architecture evolves — without claiming any formal relationship with the Centre.",
    sourceIds: ["nationalCentre", "turnItUp"],
  },
  {
    id: "meaning",
    n: 14,
    x: 900,
    y: 3080,
    title: "What it means for CCD",
    overviewLine: "How CCD aims to respond",
    investorLine: "Connect rather than duplicate — make outstanding practice usable day to day.",
    body: [
      "Connect rather than duplicate. Support generalists and specialists. Design for different learners. Keep learning cumulative from EYFS to A-level.",
      "Make partnership measurable through Partner Hubs. Prioritise underserved areas. Keep children active in shaping learning.",
      meta.fundingCase,
      meta.partnerDisclaimer,
    ],
    whyThisMattersForCCD:
      "The evidence shows fragmentation and unequal entitlement. CCD aims to be the practical connection layer — not a claimed fix for structural inequality.",
    sourceIds: ["cla2026", "ofqual2026", "turnItUp"],
  },
  {
    id: "conclusion",
    n: 15,
    x: 1600,
    y: 3020,
    title: "Conclusion & sources",
    overviewLine: "Verification & register",
    investorLine: "Traceable sources; unverified claims omitted.",
    body: [meta.closing, meta.verificationNote],
    whyThisMattersForCCD:
      "A credible evidence base is part of the funding case — quality over quantity.",
    sourceIds: [
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
    ],
  },
];

export type ClusterId = (typeof clusters)[number]["id"];

export function getCluster(id: string): ClusterDef | undefined {
  return clusters.find((c) => c.id === id);
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
] as const;
