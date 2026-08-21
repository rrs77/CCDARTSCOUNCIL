/**
 * Source of truth: CCDesigner evidence overview re-verified 21 August 2026.
 * Numbers and caveats match the verified research brief. Prefer CLA / Ofqual / DfE
 * over secondary paraphrase. “No entries” ≠ “not taught”.
 */

export type SourceRef = {
  id: string;
  label: string;
  year: string;
  url?: string;
};

export const SOURCES: Record<string, SourceRef> = {
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
    url: "https://explore-education-statistics.service.gov.uk/",
  },
  turnItUp: {
    id: "turnItUp",
    label: "DCMS/DfE Turn It Up",
    year: "July 2026",
    url: "https://www.gov.uk/",
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

/** Chart 1 — CLA 2024 long-term contraction (end 2022/23). Do not collapse into one index. */
export const LONG_TERM_CONTRACTION = [
  {
    label: "Arts GCSE entries",
    change: -42,
    baseline: "2010",
    color: "#E97451", // salmon
  },
  {
    label: "Arts A-level entries",
    change: -21,
    baseline: "2010/11",
    color: "#C9A227", // gold
  },
  {
    label: "Arts teaching hours",
    change: -21,
    baseline: "2011/12 (excl. Dance)",
    color: "#2A9D8F", // teal
  },
  {
    label: "Arts teachers",
    change: -14,
    baseline: "vs 2010",
    color: "#5B7C99", // slate-blue
  },
] as const;

/** Chart 2 — Teacher Tapp / CLA 2026 */
export const PRIMARY_HOURS = {
  independentOver2_5: 47,
  stateOver2_5: 6,
  hoursFellHighestFsm: 31,
  hoursFellLowestFsm: 22,
  subjectLeads: [
    { subject: "Art & Design", pct: 89 },
    { subject: "Music", pct: 84 },
    { subject: "Drama", pct: 9 },
    { subject: "Dance", pct: 5 },
  ],
  noExternalPartners: 43,
} as const;

/**
 * Chart 3 — DfE Tables 18–19, % of schools WITH entries, least vs most disadvantaged fifth.
 * Photography is Table 18 subject discount group — not GCSE-only.
 */
export const DFE_DISADVANTAGE_WITH_ENTRIES = [
  { subject: "Art & Design", least: 99, most: 97, note: "GCSE" },
  { subject: "Dance", least: 27, most: 6, note: "GCSE" },
  { subject: "Music", least: 90, most: 39, note: "GCSE" },
  { subject: "Speech & Drama", least: 83, most: 42, note: "GCSE" },
  { subject: "Photography*", least: 32, most: 43, note: "Any exam entry (Table 18)" },
] as const;

/** Chart 4 — CLA 2024, schools with no GCSE entries 2022/23 */
export const SCHOOLS_NO_GCSE_2223 = [
  { subject: "Music", none: 42, color: "#2A9D8F" },
  { subject: "Drama", none: 41, color: "#7B6B9C" },
  { subject: "Dance", none: 84, color: "#E97451" },
] as const;

export const CLA_DEPRIVATION_NO_MUSIC = {
  most: 54,
  least: 21,
} as const;

export const ALEVEL_SHARE_DEPRIVATION = {
  most: 3.8,
  least: 5.9,
} as const;

/**
 * Chart 5 — Ofqual provisional GCSE counts indexed 2024=100.
 * Underlying: Art 197500/194190/199435; Drama 49410/48650/48220;
 * Music 32615/34555/34120; Perf/EA 6675/7175/7265.
 */
export const GCSE_INDEX_2024_26 = [
  {
    year: "2024",
    art: 100,
    drama: 100,
    music: 100,
    performing: 100,
  },
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
] as const;

export const OFQUAL_GCSE_YOY_2026 = [
  { subject: "Art & Design", change: 2.7 },
  { subject: "Drama", change: -0.9 },
  { subject: "Music", change: -1.3 },
  { subject: "Performing / Expressive Arts", change: 1.2 },
] as const;

/**
 * Chart 6 — A-level index 2024=100.
 * Art 40965/40400/40015; Drama 7895/7410/6710; Music 5005/4875/4635.
 */
export const ALEVEL_INDEX_2024_26 = [
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
] as const;

export const OFQUAL_ALEVEL_YOY_2026 = [
  { subject: "Drama", change: -9.5, from: 7410, to: 6710 },
  { subject: "Music", change: -4.9, from: 4875, to: 4635 },
  { subject: "Art & Design", change: -1.0 },
] as const;

/** Chart 7 — HESA via CLA 2026 */
export const HE_SUBJECT_CHANGE = [
  { subject: "Art", change: -1.5 },
  { subject: "Cinematics & Photography", change: -1.4 },
  { subject: "Creative Arts & Design (non-specific)", change: -2.9 },
  { subject: "Dance", change: -0.7 },
  { subject: "Design Studies", change: -1.1 },
  { subject: "Drama", change: 1.6 },
] as const;

export const HE_SUMMARY = {
  domesticCad: 128_300,
  cadYoy: -0.5,
  allDomesticYoy: 0.6,
  shareFrom: 7.3,
  shareTo: 7.2,
  longTermSince2010: -6,
} as const;

/** Chart 8 — funding streams (non-additive) */
export const FUNDING_STREAMS = [
  {
    label: "Annual Music Hubs backing (to AY 2026/27)",
    value: 76,
    kind: "Annual revenue backing",
    color: "#2A9D8F",
  },
  {
    label: "Additional capital for instruments/technology",
    value: 25,
    kind: "Additional capital investment",
    color: "#C9A227",
  },
  {
    label: "National Centre (up to 3 years)",
    value: 13,
    kind: "Centre contract support",
    color: "#7B6B9C",
  },
] as const;

export const WORKFORCE = {
  artsTeachersFall: -14,
  teachingHoursFall: -21,
  ebaccHours2025: 63,
  ebaccHours2010: 54,
  timetablingCoverage: 80,
  noSubjectQualPostA: 23,
} as const;

export const CHAPTERS = [
  { id: "cover", n: 1, label: "Cover", x: 0, y: 0 },
  { id: "glance", n: 2, label: "At a glance", x: 1, y: 0 },
  { id: "longterm", n: 3, label: "Long-term picture", x: 2, y: 0 },
  { id: "primary", n: 4, label: "Primary", x: 0, y: 1 },
  { id: "secondary", n: 5, label: "Secondary disadvantage", x: 1, y: 1 },
  { id: "availability", n: 6, label: "GCSE availability", x: 2, y: 1 },
  { id: "gcse", n: 7, label: "Latest GCSE", x: 0, y: 2 },
  { id: "alevel", n: 8, label: "A-level pipeline", x: 1, y: 2 },
  { id: "teachers", n: 9, label: "Teachers & time", x: 2, y: 2 },
  { id: "poverty", n: 10, label: "Poverty & place", x: 0, y: 3 },
  { id: "he", n: 11, label: "Higher education", x: 1, y: 3 },
  { id: "hubs", n: 12, label: "Music Hubs", x: 2, y: 3 },
  { id: "centre", n: 13, label: "National Centre", x: 0, y: 4 },
  { id: "meaning", n: 14, label: "What it means for CCD", x: 1, y: 4 },
  { id: "conclusion", n: 15, label: "Conclusion & sources", x: 2, y: 4 },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

export const PRINCIPAL_SOURCES = [
  SOURCES.cla2024,
  SOURCES.cla2026,
  SOURCES.cla2026detail,
  SOURCES.ofqual2026,
  SOURCES.dfeAnnex,
  SOURCES.dfeWorkforce,
  SOURCES.turnItUp,
  SOURCES.nationalCentre,
  SOURCES.hesaCla,
  SOURCES.ofqualBackground,
] as const;
