/**
 * Lean Prezi layout from CONTENT.md — overlap-safe grid.
 * Root hubs sit on a quiet pathway grid with large gutters.
 * Leaf frames are parked far below (path/modal only) so they never
 * collide with hub overview scenes.
 */

import {
  parseContentMarkdown,
  type ContentBlock,
  type ParsedDocument,
} from "./parseContent";

export type SceneKind = "title" | "hub" | "leaf" | "sources";
export type PhotoCrop = "classroom" | "drama" | "dance" | "wide";

export type FrameNode = {
  id: string;
  parentId: string | null;
  mainSectionId: string;
  sequence: number;
  level: 1 | 2 | 3;
  kind: SceneKind;
  title: string;
  titleSmall: string;
  titleGiant: string;
  navLabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
  sentence: string;
  heroStat?: { value: string; label: string };
  quote?: string;
  chartId?: string;
  photoHero: boolean;
  photoCrop: PhotoCrop;
  footnotes?: ParsedDocument["footnotes"];
  childIds: string[];
  /** Full CONTENT.md blocks for this section (modal body). */
  blocks: ContentBlock[];
  /** Nested ### sections for hub detail modals */
  subsections?: { title: string; blocks: ContentBlock[] }[];
};

export type Presentation = {
  title: string;
  world: { width: number; height: number; heroImage: string };
  frames: FrameNode[];
  path: string[];
  mainSectionIds: string[];
};

const MAX_CHILDREN = 4;
/** Uniform zone — sized so rest-camera body stays ≥18px; overview uses readable target scale */
const FRAME_W = 1180;
const FRAME_H = 780;
/** Tight enough for a readable overview constellation; still ≥48px clear between frames */
const GUTTER = 200;
const PAD = 180;
/** Park leaves well below the hub band */
const LEAF_BAND_GAP = 4200;

function uniqueId(base: string, used: Set[string]): string {
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}
