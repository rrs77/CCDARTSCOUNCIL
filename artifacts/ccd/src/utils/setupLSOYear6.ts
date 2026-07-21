/**
 * Year 6 Music — How to Build an Orchestra (LSO / Hachette).
 *
 * Seeds content that matches existing CCDesigner flows:
 *  - Lesson Library: individual Year 6 lessons + one editable LESSON stack/unit
 *  - Activity Library / Lesson Builder: separate activities under category banners
 *    (category name = section heading; folder = LSO brand area)
 *
 * Sources:
 *  - https://www.hachette.co.uk/wp-content/uploads/2020/05/How_to_Build_an_Orchestra_KS2-Project-Pack.pdf
 *  - https://www.hachette.co.uk/wp-content/uploads/2020/05/Beethoven_Bolero_KS2-3-Project-Pack.pdf
 *
 * Usage: await setupLSOYear6Example()  |  await setupLSOYear6Example({ force: true })
 */

import { activitiesApi, lessonsApi, customCategoriesApi } from '../config/api';
import { activityStacksApi } from '../config/activityStacksApi';
import { lessonStacksApi } from '../config/lessonStacksApi';
import { isSupabaseConfigured } from '../config/supabase';
import type { Activity, LessonData } from '../contexts/DataContext';
import type { StackedLesson } from '../hooks/useLessonStacks';
import { LSO_FOLDER_NAME, LSO_LOGO_SRC, HTBAO_PROJECT_PREFIX } from './lsoBranding';

const HTBAO_PACK_PDF =
  'https://www.hachette.co.uk/wp-content/uploads/2020/05/How_to_Build_an_Orchestra_KS2-Project-Pack.pdf';
const BEETHOVEN_BOLERO_PACK_PDF =
  'https://www.hachette.co.uk/wp-content/uploads/2020/05/Beethoven_Bolero_KS2-3-Project-Pack.pdf';

const LSO_HTBAO_PAGE =
  'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/how-to-build-an-orchestra/';
const LSO_PLAY_HOME = 'https://play.lso.co.uk/';
const LSO_PLAY_BOLERO =
  'https://play.lso.co.uk/performances/Ravels-Bolero/explore/masterclasses/m7/watch';
const LSO_BOOK_URL = 'https://lsolive.lso.co.uk/products/how-to-build-an-orchestra';

const SHEET_ID = 'Year6';
const SHEET_NAME = 'Year 6';
/** Parent brand folder in Settings / Activity Library category folders. */
const FOLDER = LSO_FOLDER_NAME;
const UNIT = 'How to Build an Orchestra';
const STACK_NAME = 'How to Build an Orchestra';
const LEVEL = 'KS2';
const YEAR_GROUPS = [SHEET_ID, SHEET_NAME];
const MARKER_KEY = 'ccd-lso-year6-seeded-v6';
const STACK_ID_KEY = 'ccd-lso-year6-lesson-stack-id';
const LESSON_KEYS_KEY = 'ccd-lso-year6-lesson-keys';
const ACADEMIC_YEAR = '2026-2027';
const SEED_NOTE = 'LSO_Y6_SEED:How to Build an Orchestra';

/**
 * Category names = Activity Library / Lesson Builder section banners.
 * Folder “LSO” is the brand parent; “How to Build an Orchestra” is one project
 * (future LSO projects can add more categories under the same folder).
 */
const CAT = {
  listening: `${HTBAO_PROJECT_PREFIX} — Listening`,
  practical: `${HTBAO_PROJECT_PREFIX} — Practical`,
  composition: `${HTBAO_PROJECT_PREFIX} — Composition`,
  warmup: `${HTBAO_PROJECT_PREFIX} — Warm-up`,
} as const;

const ALL_CATEGORIES = Object.values(CAT);

/** Previous seed category names to strip on re-seed. */
const OLD_CATEGORY_NAMES = [
  'LSO',
  'LSO How to build an orchestra',
  'LSO How to build an orchestra — Listening',
  'LSO How to build an orchestra — Practical',
  'LSO How to build an orchestra — Composition',
  'LSO How to build an orchestra — Warm-up',
  'KS2 Music',
  ...ALL_CATEGORIES,
];

type SeedActivity = Omit<
  Activity,
  'id' | '_id' | 'videoLink' | 'musicLink' | 'backingLink' | 'vocalsLink' | 'imageLink' | 'resourceLink'
> & {
  videoLink?: string;
  musicLink?: string;
  backingLink?: string;
  vocalsLink?: string;
  imageLink?: string;
  resourceLink?: string;
  /** Which unit lesson (1–6) this activity belongs in */
  unitLesson: number;
};

function act(
  partial: Omit<SeedActivity, 'level' | 'yearGroups' | 'teachingUnit' | 'unitName' | 'link' | 'lessonNumber'> & {
    link?: string;
    category: string;
    unitLesson: number;
  },
): SeedActivity {
  return {
    ...partial,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: String(partial.unitLesson),
    link: partial.link ?? HTBAO_PACK_PDF,
    videoLink: partial.videoLink || '',
    musicLink: partial.musicLink || '',
    backingLink: partial.backingLink || '',
    resourceLink: partial.resourceLink || HTBAO_PACK_PDF,
    vocalsLink: partial.vocalsLink || '',
    imageLink: partial.imageLink || LSO_LOGO_SRC,
    descriptionHeading: 'Introduction/Context',
    activityHeading: 'Activity',
    linkHeading: 'Project pack / media',
  };
}

/**
 * Separate library activities — each is a complete lesson section with pack
 * instructions. Category = banner heading in Activity Library / Lesson Builder.
 * Media URLs live ONLY in videoLink / resourceLink / link / musicLink (Web Resources).
 */
const SEED_ACTIVITIES: SeedActivity[] = [
  // —— Lesson 1: Building the Orchestra ——
  act({
    unitLesson: 1,
    category: CAT.listening,
    activity: 'Project Pack, Book & Classroom Film',
    description: `<p>Start with the official <strong>How to Build an Orchestra</strong> KS2 Online Project Pack (Rachel Leach / LSO / Hachette). The pack helps you explore Mary Auld’s book with the LSO: follow conductor Simon as he puts together an orchestra and discover the instruments, how they are played, and what they can do.</p>
<p>The book features illustrations by Elisa Paganelli and music played by the LSO. Use the classroom film and LSO page alongside the pack. Tip from the pack: little and often works better than one big push — make music part of the routine.</p>
<p><strong>Materials:</strong> interactive whiteboard or laptop for film; book (if available); Project Pack PDF open for teacher reference only (all steps are below).</p>`,
    activityText: `<ol>
<li>Open the Hachette KS2 project pack PDF (Web Resources) and skim the Introduction so you know the unit shape.</li>
<li>Open the LSO How to Build an Orchestra page and preview: classroom film (Sir Simon Rattle &amp; Rachel Leach), family videos, and Orchestra sing-along.</li>
<li>Show pupils the book cover / idea of “building” an orchestra with conductor Simon auditioning instruments for a concert.</li>
<li>Explain you will meet instrument families, then compose a storm (Beethoven) and a class Boléro (Ravel).</li>
<li>Bookmark the pack + LSO page for the rest of the unit (links stay in Web Resources, not in this text).</li>
</ol>`,
    time: 15,
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: HTBAO_PACK_PDF,
    link: LSO_BOOK_URL,
  }),
  act({
    unitLesson: 1,
    category: CAT.practical,
    activity: 'Classroom Instrument Rules & Silence Signal',
    description: `<p>From the pack introduction — set clear rules <em>before</em> creative instrumental work:</p>
<ul>
<li>Demonstrate each instrument: name it, hold it correctly, pass it around so children can make informed composing choices later (Which instrument sounds like rain? Which can be loud, soft, scary?).</li>
<li>Respect and care for instruments from the start.</li>
<li>Put an instrument gently on the floor when not playing.</li>
<li>Agree a <strong>signal for silence</strong> (hand in the air, or clap a pattern). When children see/hear it they stop, put instruments down and listen. Make it a game.</li>
<li>When working creatively, try out children’s ideas as they suggest them — nothing is ‘right’ or ‘wrong’.</li>
</ul>
<p><strong>Materials:</strong> 2–3 classroom instruments to demonstrate; space for a circle.</p>`,
    activityText: `<ol>
<li>Demonstrate 2–3 classroom instruments: name, correct hold, one short sound each.</li>
<li>Pass instruments around; ask “loud / soft / scary / rain?” so pupils start linking sound to purpose.</li>
<li>Agree a silence signal with the class; practise: play freely → signal → stop, instruments down, listen.</li>
<li>Practise putting instruments gently on the floor when not playing.</li>
<li>Remind the class: try children’s ideas — creative work has no single right answer.</li>
</ol>`,
    time: 10,
    resourceLink: HTBAO_PACK_PDF,
    link: HTBAO_PACK_PDF,
    videoLink: LSO_HTBAO_PAGE,
  }),

  // —— Lesson 2: Meet the Families ——
  act({
    unitLesson: 2,
    category: CAT.listening,
    activity: 'Meet the Instrument Families',
    description: `<p>Use the book and LSO film to discover the families of the orchestra — <strong>strings, woodwind, brass and percussion</strong> — and how each instrument is played and what it can do. Follow conductor Simon auditioning instruments for his concert.</p>
<p><strong>Materials:</strong> LSO classroom film / family videos; optional book; board for family names.</p>`,
    activityText: `<ol>
<li>Watch a section of the classroom film / family videos from the LSO page (Web Resources → Video).</li>
<li>Pause to name each family as it appears: strings, woodwind, brass, percussion.</li>
<li>Ask: How is this instrument played? What can it do? Loud / soft / high / low?</li>
<li>Optional: match classroom instruments to orchestral families.</li>
<li>Pupils sketch or list one instrument per family they heard.</li>
</ol>`,
    time: 20,
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: HTBAO_PACK_PDF,
    link: LSO_BOOK_URL,
  }),
  act({
    unitLesson: 2,
    category: CAT.practical,
    activity: 'Orchestra Sing-Along & Family Sound Hunt',
    description: `<p>Use the Orchestra sing-along and family videos on the LSO How to Build an Orchestra page, then hunt for matching sounds on classroom instruments.</p>
<p><strong>Materials:</strong> LSO sing-along; classroom instruments; silence signal from Lesson 1.</p>`,
    activityText: `<ol>
<li>Join the Orchestra sing-along from the LSO page (Web Resources).</li>
<li>In pairs/groups, choose a family and find classroom sounds that could belong to it.</li>
<li>Share: one sound + why it fits that family.</li>
<li>Conduct a short ‘family parade’: point to a family group to play on cue (use your silence signal).</li>
</ol>`,
    time: 15,
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: HTBAO_PACK_PDF,
    link: LSO_HTBAO_PAGE,
  }),

  // —— Lesson 3: Beethoven's Storm ——
  act({
    unitLesson: 3,
    category: CAT.listening,
    activity: "Beethoven's Storm — Motifs & Listening",
    description: `<p><strong>Project 1 – Beethoven’s Storm</strong> (Pastoral Symphony No. 6, movement 4). Beethoven was one of the first to write a musical storm using motifs (small ideas):</p>
<ul>
<li><strong>Wind</strong> — swirling scales rushing up and down</li>
<li><strong>Rain</strong> — short ‘next-door notes’ (violins at the beginning)</li>
<li><strong>Thunder</strong> — scary rumbles from the basses and cellos</li>
<li><strong>Lightning</strong> — a low note followed very soon by a high note</li>
</ul>
<p>Beethoven (1770–1827) wrote the first symphony with a programme (story): the Pastoral (1808) depicts five countryside scenes. Movement 4 is a ferocious storm.</p>
<p><strong>Materials:</strong> recording of Beethoven’s Storm; board + coloured pens for a symbol key.</p>`,
    activityText: `<ol>
<li>Briefly introduce Beethoven and the Pastoral (story symphony / countryside day). Mention he began to go deaf at 28.</li>
<li>Teach the four motifs with gestures or board icons (wind, rain, thunder, lightning).</li>
<li>Ask what happens in a real storm. Invent simple coloured symbols for each element; write a key on the board.</li>
<li>Listen to Beethoven’s Storm. Hands up / count lightning flashes (~14 in this piece).</li>
<li>Discuss: Where is the peak? What happens at the end?</li>
</ol>`,
    time: 20,
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: BEETHOVEN_BOLERO_PACK_PDF,
    link: HTBAO_PACK_PDF,
    musicLink: BEETHOVEN_BOLERO_PACK_PDF,
  }),
  act({
    unitLesson: 3,
    category: CAT.listening,
    activity: 'Storm Graphic Score Artwork',
    description: `<p>Large landscape paper: left = start of storm, right = end (pencil ‘start’ / ‘end’). Layer symbols while listening until the page is a storm picture — peak in the middle, calmer towards the end.</p>
<p><strong>Extension:</strong> fold another sheet into quarters numbered 1, 2, 3, 5 (you already did 4 — the storm) and finish the Pastoral story (countryside, brook/birds, party, sunshine after the storm).</p>
<p><strong>Materials:</strong> large landscape paper (bigger is better); art materials / coloured pens; Storm recording.</p>`,
    activityText: `<ol>
<li>Place paper landscape; mark start (left) and end (right) lightly in pencil.</li>
<li>Listen 1: draw lightning symbols every time you hear a flash (left = early, right = late).</li>
<li>Listen 2: add thunder symbols in relation to the lightning.</li>
<li>Listen 3–4: add wind and rain until the page is a storm picture; match peak then calm ending.</li>
<li>Optional pause: add colours, trees bending, people sheltering.</li>
<li>Final listen: Beethoven’s upward flute scale at the end — what does it represent? Add it.</li>
<li>Optional extension: Pastoral movements 1, 2, 3, 5 on a quartered page (beautiful day; brook &amp; birds; lunch party; sunshine after the storm).</li>
</ol>`,
    time: 25,
    resourceLink: BEETHOVEN_BOLERO_PACK_PDF,
    link: HTBAO_PACK_PDF,
    videoLink: LSO_HTBAO_PAGE,
  }),

  // —— Lesson 4: Compose a Storm ——
  act({
    unitLesson: 4,
    category: CAT.warmup,
    activity: 'Five Facts Warm-Up (Beethoven)',
    description: `<p>Rachel Leach’s <strong>five facts</strong> warm-up from the KS2 pack (adapt to any five facts). Stand in a circle; each fact has a body tap + shout/words + a class-chosen gesture.</p>
<ul>
<li>Tap head → shout “BEETHOVEN!” + chosen gesture</li>
<li>Tap shoulders → “born 250 years ago!” + gesture</li>
<li>Tap tummy → “6th symphony” + gesture (a symphony = large piece for orchestra)</li>
<li>Tap knees → “…tells a story” + gesture</li>
<li>Tap feet → “genius” + gesture</li>
</ul>
<p><strong>Materials:</strong> open space for a circle. (Pack video demonstration is linked in Web Resources.)</p>`,
    activityText: `<ol>
<li>Stand in a circle.</li>
<li>Teacher models each line (tap body part + words); class copies.</li>
<li>Collect a gesture for each fact; choose the best for each.</li>
<li>Perform the full five-fact sequence together:
<ul>
<li>Tap head: “Beethoven!” + gesture</li>
<li>Tap shoulders: “born 250 years ago!” + gesture</li>
<li>Tap tummy: “6th symphony” + gesture</li>
<li>Tap knees: “tells a story” + gesture</li>
<li>Tap feet: “genius” + gesture</li>
</ul>
</li>
<li>Optional: speed up / add dynamics / take turns leading.</li>
</ol>`,
    time: 10,
    videoLink: HTBAO_PACK_PDF,
    resourceLink: HTBAO_PACK_PDF,
    link: HTBAO_PACK_PDF,
  }),
  act({
    unitLesson: 4,
    category: CAT.composition,
    activity: 'Compose a Musical Storm',
    description: `<p>Classroom composition using Beethoven’s motif shapes. Tell the story of a storm from first raindrops to last. Motifs can be pitched, unpitched, voice or body percussion — keep the shapes.</p>
<ul>
<li><strong>Rain</strong> — fast short notes moving by step (body perc: tap fingers on palm)</li>
<li><strong>Thunder</strong> — low rumble / long notes getting louder (body perc: rumble on knees)</li>
<li><strong>Lightning</strong> — one large jump low→high; low note loudest (body perc: Stamp! Clap!). Unpitched: bang vs crash.</li>
<li><strong>Wind</strong> — swirling notes / glissandos or chromatic scales</li>
</ul>
<p>Build <strong>Soft – Crescendo – Loud – Diminuendo – Soft</strong> so the storm passes overhead. Add final slow raindrops before the calm.</p>
<p><strong>Materials:</strong> pitched and/or unpitched classroom instruments (or body perc); board for motif list + structure diagram.</p>`,
    activityText: `<ol>
<li>Discuss storm elements; write motifs on the board (rain, thunder, lightning, wind).</li>
<li>Decide instruments (or body perc) for each element; one volunteer tries rain first.</li>
<li>Divide into four groups; each practises until its motif is fixed and the same every time.</li>
<li>Appoint a conductor; build the storm by pointing at groups. Remind: some elements are more important than others (e.g. wind &amp; rain continuous; occasional lightning/thunder).</li>
<li>Shape the whole piece: Soft → Crescendo → Loud → Diminuendo → Soft (passing overhead). Diagram on the board.</li>
<li>Add Beethoven’s final slow sprinkling of raindrops before the calm.</li>
<li>Perform and reflect: Does our storm pass overhead? Can we hear every weather layer?</li>
</ol>`,
    time: 25,
    resourceLink: HTBAO_PACK_PDF,
    link: BEETHOVEN_BOLERO_PACK_PDF,
    videoLink: LSO_HTBAO_PAGE,
  }),
  act({
    unitLesson: 4,
    category: CAT.composition,
    activity: 'Rainbow Scale, Sunshine Melody & Graphic Score',
    description: `<p><strong>Taking it further</strong> (pack): after the storm, Beethoven’s flute rising scale (a rainbow?) and a simple sunshine tune on three notes (F, A, C). Invent a class rainbow scale and three-note sunshine theme.</p>
<p><strong>Graphic score:</strong> challenge pupils to score their final storm piece with symbols for weather elements. Listen again to Beethoven and spot rain, thunder and lightning; optional class graphic score of Beethoven’s piece.</p>
<p><strong>Materials:</strong> pitched instruments for rainbow/sunshine; paper for graphic scores.</p>`,
    activityText: `<ol>
<li>After the storm piece, invent a rising ‘rainbow’ scale (like Beethoven’s flute).</li>
<li>Invent a short sunshine motif using only three notes (Beethoven uses F, A, C — yours can differ).</li>
<li>Add rainbow + sunshine to the end of the class storm.</li>
<li>Create a graphic score of the final class piece with weather symbols.</li>
<li>Optional: class graphic score of Beethoven’s Storm while listening — spot rain, thunder, lightning.</li>
</ol>`,
    time: 15,
    resourceLink: HTBAO_PACK_PDF,
    link: HTBAO_PACK_PDF,
    videoLink: LSO_HTBAO_PAGE,
  }),

  // —— Lesson 5: Boléro ——
  act({
    unitLesson: 5,
    category: CAT.listening,
    activity: "Ravel's Boléro — Three Ingredients",
    description: `<p><strong>Project 2 – Ravel’s Bolero</strong> (1928). Maurice Ravel (1875–1937), French composer in Paris. Boléro began as a short Spanish-feel ballet piece and became famous as an orchestral work. Three ingredients that repeat, plus one long crescendo:</p>
<ul>
<li>A repeating <strong>bassline</strong> (mostly cellos and basses)</li>
<li>A repeating rhythm / <strong>ostinato</strong> (snare drum throughout)</li>
<li>A wandering, snakey <strong>tune</strong></li>
</ul>
<p><strong>Materials:</strong> Boléro recording / LSO Play; coloured pens for ingredient colours.</p>`,
    activityText: `<ol>
<li>Introduce Ravel and Boléro (ballet → famous orchestral crescendo from very soft to very loud).</li>
<li>Teach the three ingredients; assign one colour for bassline, another for ostinato, many colours for the melody journey.</li>
<li>Listen: spot bassline, ostinato, melody.</li>
<li>Discuss: What repeats? What changes? How does the crescendo work?</li>
<li>Optional: open LSO Play Boléro masterclass briefly (Web Resources → Video).</li>
</ol>`,
    time: 20,
    videoLink: LSO_PLAY_BOLERO,
    musicLink: LSO_PLAY_HOME,
    resourceLink: BEETHOVEN_BOLERO_PACK_PDF,
    link: HTBAO_PACK_PDF,
  }),
  act({
    unitLesson: 5,
    category: CAT.listening,
    activity: 'Boléro Colour Score (Melody Through the Orchestra)',
    description: `<p>Very large paper (lining paper / wallpaper reverse). Mark start and finish. Draw the flute tune without lifting the pen, then add new colours as the melody moves through the orchestra. Finally draw the bassline along the bottom and the ostinato; mark the coda at the far right. Key change (~15′29) feels like the roof lifting — invent a symbol for it.</p>
<p><strong>Instrument timeline (pack order — use as a teacher checklist):</strong> snare + bass → flute → clarinet → bassoon → Eb clarinet → oboe → flute+trumpet → tenor sax → soprano sax → piccolos/horn/celeste → reeds → trombone → woodwinds → strings joining → full orchestra → KEY CHANGE → back to C for ending / coda.</p>
<p><strong>Materials:</strong> largest paper available; many colours; Boléro recording (~15+ minutes). If space is limited, make one big class score with children contributing turn by turn.</p>`,
    activityText: `<ol>
<li>Spread large paper; mark start → finish lightly in pencil. Have many colours ready.</li>
<li>Listen: draw the flute melody left→right without lifting the pen; hand moves with the tune shape.</li>
<li>Add a new colour for clarinet, then each soloist/combination from the pack list (bassoon, Eb clarinet, oboe, flute+trumpet, saxes, trombone, full orchestra…).</li>
<li>At the key change (~15′29), invent a symbol (sun coming out / roof lifting).</li>
<li>Final listen: add bassline along the bottom and ostinato symbols; mark the coda at the far right (fancy ending — different from the rest).</li>
<li>Share scores — what did you notice about orchestration?</li>
</ol>`,
    time: 25,
    videoLink: LSO_PLAY_HOME,
    resourceLink: HTBAO_PACK_PDF,
    link: LSO_PLAY_BOLERO,
  }),

  // —— Lesson 6: Our Class Boléro ——
  act({
    unitLesson: 6,
    category: CAT.practical,
    activity: 'Boléro Bassline (C, High G, Low G)',
    description: `<p>Teach the bassline with body percussion (knees / hands / feet visualise middle / high / low), then transfer to xylophone using <strong>C, high G and low G</strong> — as in both project packs. Play along with LSO Play when ready (pizzicato strings at the start).</p>
<p><strong>Materials:</strong> space for a circle; xylophones/glocks with C and Gs; optional LSO Play.</p>`,
    activityText: `<ol>
<li>Whole class stand in a circle. Explain you will re-create Boléro from three simple repeating ideas that grow louder and louder.</li>
<li>Teach the body-percussion bassline slowly and steadily (knees = middle, hands = high, feet = low).</li>
<li>When confident, invite children one by one onto xylophone using only C, high G and low G.</li>
<li>Practise until the pattern is strong; keep a steady tempo.</li>
<li>Play along with LSO Play / pack audio (join pizzicato strings at the start).</li>
<li>Without instruments: three sounds (high / middle / low) from classroom objects.</li>
</ol>`,
    time: 15,
    videoLink: LSO_PLAY_BOLERO,
    resourceLink: HTBAO_PACK_PDF,
    link: BEETHOVEN_BOLERO_PACK_PDF,
    musicLink: LSO_PLAY_HOME,
  }),
  act({
    unitLesson: 6,
    category: CAT.practical,
    activity: 'Boléro Ostinato (Square & Triangle Score)',
    description: `<p>Learn Ravel’s ostinato with the pack’s square/triangle score: clap squares; say or play “tri-an-gle” on triangles; transfer to drum + shaker. Reading two symbols begins the journey towards reading music.</p>
<p>Split: Group 1 bassline (Cs &amp; Gs), Group 2 ostinato. Begin <em>pp</em> and crescendo together — you now have ⅔ of Boléro.</p>
<p><strong>Materials:</strong> square/triangle symbol score (board or floor objects); drum + shaker (or two contrasting short sounds); pitched instruments for Group 1.</p>`,
    activityText: `<ol>
<li>Slowly point through the symbol score: clap every square; say “triangle” on every triangle.</li>
<li>Volunteer replaces clap with a short drum sound.</li>
<li>Choose a contrasting sound for triangles (shaker). For Ravel’s exact rhythm, play three quick notes on the triangle sound (= “tri-an-gle”).</li>
<li>Split class: Group 1 bassline on pitched percussion (Cs &amp; Gs); Group 2 ostinato on unpitched.</li>
<li>Combine both groups; start as soft as possible and gradually crescendo to as loud as possible.</li>
<li>Celebrate: you have made two-thirds of Boléro!</li>
</ol>`,
    time: 20,
    videoLink: LSO_PLAY_HOME,
    resourceLink: HTBAO_PACK_PDF,
    link: BEETHOVEN_BOLERO_PACK_PDF,
  }),
  act({
    unitLesson: 6,
    category: CAT.composition,
    activity: 'Boléro Melody, Transposition & Coda',
    description: `<p><strong>Melody group:</strong> next-door notes only; begin/end on C; short, repeatable, same every time. Layer over bass + ostinato while others keep the crescendo.</p>
<p><strong>Transposition:</strong> near the end Boléro shifts up (bass to E/B, or easier: one note up to D/A). Signal with conductor or gong.</p>
<p><strong>Coda:</strong> swoops up/down ×4, clashy cluster chord, fall to C — use big percussion (djembes, cymbals, gongs); conductor holds the cluster before the final crash to C.</p>
<p><strong>Materials:</strong> tuned instruments for melody group; big percussion for coda; optional gong for transposition cue.</p>`,
    activityText: `<ol>
<li>Select a small melody group on xylophones/glocks. Rules: (a) next-door notes only; (b) begin on C, snake up and down, end on C; (c) short, repeatable, same every time.</li>
<li>While melody invents, bass + ostinato groups practise their crescendo. Layer melody on top.</li>
<li>Low on pitched instruments? Share, or use a series of soloists improvising in turn.</li>
<li>Optional transposition: on a clear signal (conductor / gong), shift bass up (E/B or easier D/A); melodies may rest.</li>
<li>Rehearse coda: swoops up/down ×4 → clashy cluster → fall to final C with big percussion; conductor holds the cluster.</li>
<li>Final performance. Optional: share with @londonsymphony as the pack suggests.</li>
</ol>`,
    time: 20,
    videoLink: LSO_PLAY_HOME,
    resourceLink: HTBAO_PACK_PDF,
    link: BEETHOVEN_BOLERO_PACK_PDF,
    musicLink: LSO_PLAY_BOLERO,
  }),
  act({
    unitLesson: 6,
    category: CAT.listening,
    activity: 'Watch & Explore Boléro on LSO Play',
    description: `<p>LSO Play: multi-angle filmed performance, player interviews, guide to Ravel/Boléro, and filmed classroom demonstrations. Use it to help children understand the orchestra and Boléro.</p>
<p><strong>How to access (classroom):</strong> open play.lso.co.uk → scroll to Ravel → select the performance (Boléro starts quietly). Choose camera angles as you watch.</p>`,
    activityText: `<ol>
<li>Open LSO Play (Web Resources → Video / Link).</li>
<li>Scroll to Ravel and select the Boléro performance (it begins very quietly).</li>
<li>Watch with different camera angles; spot snare, bassline, solos.</li>
<li>Optional: masterclass / interviews / classroom demos on LSO Play.</li>
<li>Link back to your class Boléro — what will you improve next time?</li>
</ol>`,
    time: 15,
    videoLink: LSO_PLAY_BOLERO,
    resourceLink: HTBAO_PACK_PDF,
    link: LSO_PLAY_HOME,
  }),
];

const LESSON_META: Record<
  number,
  {
    title: string;
    learningOutcome: string;
    successCriteria: string;
    introduction: string;
    mainActivity: string;
    plenary: string;
    vocabulary: string;
    keyQuestions: string;
    resources: string;
    videoLink: string;
    resourceLink: string;
    additionalLinks: { label: string; url: string }[];
  }
> = {
  1: {
    title: 'Building the Orchestra',
    learningOutcome:
      'Pupils know the How to Build an Orchestra project pack, book and LSO film, and can follow classroom instrument rules.',
    successCriteria:
      'I can find the pack and LSO page; I can name/hold instruments carefully; I know our silence signal.',
    introduction:
      '<p>Introduce Mary Auld’s book with the LSO and the KS2 Online Project Pack. Open Links &amp; Resources for the pack PDF, LSO film page and book.</p>',
    mainActivity: 'Explore pack introduction, LSO classroom film page, and set instrument/listening routines.',
    plenary: 'Bookmark pack + LSO page. Preview next: instrument families.',
    vocabulary: 'orchestra, conductor, LSO Discovery, project pack',
    keyQuestions: 'What will we learn from How to Build an Orchestra? How do we care for instruments?',
    resources:
      '<p>Project pack PDF, LSO classroom film / families / sing-along, and book — all listed under Links &amp; Resources (not as bare URLs in this text).</p>',
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: HTBAO_PACK_PDF,
    additionalLinks: [
      { label: 'How to Build an Orchestra book (LSO Live)', url: LSO_BOOK_URL },
    ],
  },
  2: {
    title: 'Meet the Families',
    learningOutcome:
      'Pupils identify orchestra families (strings, woodwind, brass, percussion) using the book/film and classroom sounds.',
    successCriteria:
      'I can name the four families; I can match a sound to a family; I can play on a conductor’s cue.',
    introduction:
      '<p>Follow conductor Simon and the LSO film/family videos. Links &amp; Resources open the LSO page and pack.</p>',
    mainActivity: 'Watch family videos; name instruments; sing-along; classroom family sound hunt.',
    plenary: 'Share one favourite instrument/family. Next: Beethoven’s Storm.',
    vocabulary: 'strings, woodwind, brass, percussion, audition',
    keyQuestions: 'How is this instrument played? Which family does our classroom sound belong to?',
    resources: '<p>LSO page, KS2 Project Pack, book — see Links &amp; Resources.</p>',
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: HTBAO_PACK_PDF,
    additionalLinks: [{ label: 'Book (LSO Live)', url: LSO_BOOK_URL }],
  },
  3: {
    title: "Beethoven's Storm",
    learningOutcome:
      'Pupils identify wind, rain, thunder and lightning motifs and map them onto a graphic score/artwork.',
    successCriteria:
      'I can name Beethoven’s storm motifs; I can place symbols in time across a landscape page; I notice the flute scale at the end.',
    introduction:
      '<p>Project 1 — Pastoral Symphony movement 4. Use the Beethoven &amp; Boléro pack and HTBAO pack from Links &amp; Resources.</p>',
    mainActivity: 'Symbol key; listen for lightning (~14); build layered storm artwork/score; optional Pastoral 1–3 & 5.',
    plenary: 'Compare scores. What happens after the storm?',
    vocabulary: 'motif, Pastoral, movement, graphic score, dynamics',
    keyQuestions: 'Where is the peak of the storm? What might the flute scale represent?',
    resources: '<p>HTBAO KS2 Pack (Project 1) and Beethoven &amp; Boléro KS2/3 Pack — see Links &amp; Resources.</p>',
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: BEETHOVEN_BOLERO_PACK_PDF,
    additionalLinks: [{ label: 'HTBAO KS2 Pack — Project 1 Storm', url: HTBAO_PACK_PDF }],
  },
  4: {
    title: 'Compose a Storm',
    learningOutcome:
      'Pupils compose and conduct a storm piece using Beethoven’s motif shapes and Soft–Crescendo–Loud–Diminuendo–Soft.',
    successCriteria:
      'I can perform my weather motif; I can follow a conductor; I can add rainbow/sunshine ideas and a graphic score.',
    introduction:
      '<p>Five facts warm-up, then classroom storm composition from the KS2 pack. Open composition pages via Links &amp; Resources.</p>',
    mainActivity: 'Warm-up; four motif groups; structure with dynamics; rainbow & sunshine; graphic score.',
    plenary: 'Perform and reflect. Link forward to Ravel’s Boléro.',
    vocabulary: 'crescendo, diminuendo, glissando, conductor, structure',
    keyQuestions: 'Does our storm pass overhead? Can we hear every weather layer?',
    resources: '<p>HTBAO KS2 Pack (compose a storm) and Beethoven &amp; Boléro Pack — see Links &amp; Resources.</p>',
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: HTBAO_PACK_PDF,
    additionalLinks: [{ label: 'Beethoven & Boléro Pack', url: BEETHOVEN_BOLERO_PACK_PDF }],
  },
  5: {
    title: 'Boléro',
    learningOutcome:
      'Pupils hear bassline, ostinato and melody, and track orchestration/crescendo in Boléro.',
    successCriteria:
      'I can spot the three ingredients; I can follow the melody’s colours; I can use LSO Play to watch Boléro.',
    introduction:
      '<p>Project 2 — Boléro. Use pack audio/video and LSO Play from Links &amp; Resources.</p>',
    mainActivity: 'Three-ingredient listen; large colour score with instrument timeline; mark key change and coda.',
    plenary: 'Share scores. Next lesson: build Our Class Boléro.',
    vocabulary: 'ostinato, bassline, crescendo, coda, orchestration',
    keyQuestions: 'What repeats? What changes? How does the crescendo work?',
    resources: '<p>HTBAO KS2 Pack (Project 2), Beethoven &amp; Boléro Pack, LSO Play — see Links &amp; Resources.</p>',
    videoLink: LSO_PLAY_BOLERO,
    resourceLink: BEETHOVEN_BOLERO_PACK_PDF,
    additionalLinks: [
      { label: 'HTBAO KS2 Pack — Project 2 Bolero', url: HTBAO_PACK_PDF },
      { label: 'LSO Play home', url: LSO_PLAY_HOME },
    ],
  },
  6: {
    title: 'Our Class Boléro',
    learningOutcome:
      'Pupils perform a layered Boléro with bassline, ostinato, melody, crescendo and coda, supported by LSO Play.',
    successCriteria:
      'I can keep the C/G bassline or ostinato; I can enter on cue; I can help shape a coda and play along with LSO Play.',
    introduction:
      '<p>Step-by-step Boléro from both packs; play along on LSO Play (Links &amp; Resources).</p>',
    mainActivity: 'Bassline → ostinato → combine with crescendo → melody → optional transposition → coda. Watch LSO Play.',
    plenary: 'Final performance. Optional: share with @londonsymphony as the pack suggests.',
    vocabulary: 'transposition, coda, ensemble, pizzicato, snare',
    keyQuestions: 'Can we crescendo together? Does our coda contrast the ostinato?',
    resources: '<p>HTBAO KS2 Pack (make your own Bolero), Beethoven &amp; Boléro Pack, LSO Play — see Links &amp; Resources.</p>',
    videoLink: LSO_PLAY_HOME,
    resourceLink: HTBAO_PACK_PDF,
    additionalLinks: [
      { label: 'Beethoven & Boléro Pack — Bolero at Home', url: BEETHOVEN_BOLERO_PACK_PDF },
      { label: 'LSO Play Boléro masterclass', url: LSO_PLAY_BOLERO },
    ],
  },
};

function blankMedia(a: SeedActivity): Activity {
  const { unitLesson: _u, ...rest } = a;
  return {
    ...rest,
    videoLink: rest.videoLink || '',
    musicLink: rest.musicLink || '',
    backingLink: rest.backingLink || '',
    resourceLink: rest.resourceLink || HTBAO_PACK_PDF,
    vocalsLink: rest.vocalsLink || '',
    imageLink: rest.imageLink || LSO_LOGO_SRC,
    eyfsStandards: [],
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isLsoCategoryName(name: unknown): boolean {
  const n = String(name || '');
  return (
    OLD_CATEGORY_NAMES.includes(n) ||
    n === 'LSO' ||
    n.startsWith('LSO ') ||
    n.startsWith('LSO How to build an orchestra') ||
    n.startsWith(HTBAO_PROJECT_PREFIX) ||
    ALL_CATEGORIES.includes(n as (typeof ALL_CATEGORIES)[number])
  );
}

function mergeCategoriesIntoLocalStorage() {
  const existing = readJson<any[]>('saved-categories', []);
  const without = existing.filter((c) => !isLsoCategoryName(c?.name));
  const basePos = Math.max(0, ...without.map((c) => Number(c.position) || 0), 0);
  const colors = ['#1e3a8a', '#0f766e', '#b45309', '#7c3aed'];
  const created = ALL_CATEGORIES.map((name, i) => ({
    name,
    color: colors[i % 4],
    position: basePos + i + 1,
    group: FOLDER,
    groups: [FOLDER],
    yearGroups: { [SHEET_ID]: true, [SHEET_NAME]: true },
  }));
  localStorage.setItem('saved-categories', JSON.stringify([...without, ...created]));

  const folders = readJson<any[]>('category-folders', []);
  // Prefer brand folder “LSO”; remove legacy “KS2 Music” folder if we created it for this unit
  const withoutLegacy = folders.filter((f) => f?.name !== 'KS2 Music' || f?.id !== 'folder-ks2-music');
  if (!withoutLegacy.some((f) => f?.name === FOLDER)) {
    withoutLegacy.push({
      id: 'folder-lso',
      name: FOLDER,
      color: '#0b1f4a',
      position: withoutLegacy.length,
    });
  }
  localStorage.setItem('category-folders', JSON.stringify(withoutLegacy));
  return created;
}

function isOldLsoActivity(a: any): boolean {
  if (isLsoCategoryName(a?.category)) return true;
  if (String(a?.unitName || '') === UNIT) return true;
  if (typeof a?.activity === 'string' && (a.activity.startsWith('LSO') || a.activity.includes('How to Build an Orchestra'))) {
    return String(a?.category || '').includes('LSO') || String(a?.unitName || '') === UNIT || String(a?.category || '').includes(HTBAO_PROJECT_PREFIX);
  }
  return false;
}

function mergeActivitiesIntoLocalStorage(activities: Activity[]) {
  const existing = readJson<any[]>('library-activities', []);
  const names = new Set(activities.map((a) => a.activity));
  const kept = existing.filter((a) => !names.has(a.activity) && !isOldLsoActivity(a));
  const withIds = activities.map((a, i) => ({
    ...a,
    _id: a._id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `lso-y6-${i}-${Date.now()}`),
  }));
  localStorage.setItem('library-activities', JSON.stringify([...kept, ...withIds]));
  return withIds;
}

/** True if this activity-stack entry is leftover LSO / HTBAO seed (wrong type for this unit). */
function isLsoActivityStack(s: any): boolean {
  if (!s) return false;
  const id = String(s.id || '');
  const name = String(s.name || '');
  const description = String(s.description || '');
  if (id.startsWith('lso-y6-stack-')) return true;
  if (name === STACK_NAME || name.includes('How to Build an Orchestra')) return true;
  if (name.startsWith('LSO L') || name.startsWith('LSO:') || name.startsWith('LSO ')) return true;
  if (description.includes('LSO_Y6_SEED') || description.includes('How to Build an Orchestra')) return true;
  if (isLsoCategoryName(s.category)) return true;
  return false;
}

/** Remove old LSO *activity* stacks (unit lives as a lesson stack in Lesson Library only). */
function cleanupOldActivityStacks() {
  const existing = readJson<any[]>('activity-stacks', []);
  const cleaned = existing.filter((s) => !isLsoActivityStack(s));
  localStorage.setItem('activity-stacks', JSON.stringify(cleaned));
}

function isLsoSeedLesson(lesson: any): boolean {
  if (!lesson) return false;
  const notes = String(lesson.notes || '');
  const title = String(lesson.title || '');
  const lessonName = String(lesson.lessonName || '');
  return (
    notes.includes('LSO_Y6_SEED') ||
    title.includes('How to Build an Orchestra') ||
    lessonName.includes('How to Build an Orchestra') ||
    (title.includes('LSO') && (title.includes('Storm') || title.includes('Boléro') || title.includes('Bolero')))
  );
}

function allocateLessonNumbers(count: number, existingKeys: string[]): string[] {
  const used = new Set(existingKeys.map(String));
  const previous = readJson<string[]>(LESSON_KEYS_KEY, []);
  previous.forEach((k) => used.delete(String(k))); // free our previous keys for reuse

  const reused: string[] = [];
  for (const k of previous) {
    if (reused.length >= count) break;
    if (/^\d+$/.test(String(k))) reused.push(String(k));
  }
  if (reused.length === count) return reused;

  const nums = existingKeys
    .map((k) => parseInt(String(k), 10))
    .filter((n) => !isNaN(n));
  let next = (nums.length ? Math.max(...nums) : 0) + 1;
  const allocated: string[] = [...reused];
  while (allocated.length < count) {
    const key = String(next++);
    if (used.has(key) && !previous.includes(key)) continue;
    allocated.push(key);
    used.add(key);
  }
  return allocated;
}

function buildLessons(
  activities: Activity[],
  lessonNumbers: string[],
): Record<string, LessonData> {
  const byUnitLesson: Record<number, Activity[]> = {};
  SEED_ACTIVITIES.forEach((seed, i) => {
    const a = activities[i];
    if (!a) return;
    if (!byUnitLesson[seed.unitLesson]) byUnitLesson[seed.unitLesson] = [];
    byUnitLesson[seed.unitLesson].push(a);
  });

  const lessons: Record<string, LessonData> = {};
  for (let i = 1; i <= 6; i++) {
    const meta = LESSON_META[i];
    const lessonActs = byUnitLesson[i] || [];
    const key = lessonNumbers[i - 1];
    const categoriesInLesson = [...new Set(lessonActs.map((a) => a.category))];
    const grouped: Record<string, Activity[]> = {};
    categoriesInLesson.forEach((c) => {
      grouped[c] = lessonActs.filter((a) => a.category === c);
    });

    lessons[key] = {
      title: meta.title,
      lessonName: `${UNIT} — ${meta.title}`,
      grouped,
      categoryOrder: categoriesInLesson,
      orderedActivities: lessonActs,
      totalTime: lessonActs.reduce((sum, a) => sum + (a.time || 0), 0),
      learningOutcome: meta.learningOutcome,
      successCriteria: meta.successCriteria,
      introduction: meta.introduction,
      mainActivity: meta.mainActivity,
      plenary: meta.plenary,
      vocabulary: meta.vocabulary,
      keyQuestions: meta.keyQuestions,
      resources: meta.resources,
      notes: `${SEED_NOTE}. Open Links & Resources and each activity’s Web Resources for pack PDFs and LSO media.`,
      videoLink: meta.videoLink,
      resourceLink: meta.resourceLink,
      additionalLinks: JSON.stringify([
        { label: 'How to Build an Orchestra KS2 Project Pack (PDF)', url: HTBAO_PACK_PDF },
        { label: 'Beethoven & Boléro KS2/3 Project Pack (PDF)', url: BEETHOVEN_BOLERO_PACK_PDF },
        ...meta.additionalLinks,
      ]) as unknown as string,
      isUserCreated: true,
      academicYear: ACADEMIC_YEAR,
    };
  }
  return lessons;
}

function mergeLessonsIntoLocalStorage(lessons: Record<string, LessonData>) {
  const key = `lesson-data-${SHEET_ID}`;
  const existing = readJson<any>(key, {
    allLessonsData: {},
    lessonNumbers: [],
    teachingUnits: [],
  });
  const allLessonsData = { ...(existing.allLessonsData || {}) };

  const previousKeys = readJson<string[]>(LESSON_KEYS_KEY, []);
  for (const k of Object.keys(allLessonsData)) {
    if (
      previousKeys.includes(k) ||
      /^LSO\d+$/i.test(k) ||
      /^HTBAO\d+$/i.test(k) ||
      isLsoSeedLesson(allLessonsData[k])
    ) {
      if (
        previousKeys.includes(k) ||
        /^LSO\d+$/i.test(k) ||
        /^HTBAO\d+$/i.test(k) ||
        String(allLessonsData[k]?.notes || '').includes('LSO_Y6_SEED') ||
        String(allLessonsData[k]?.lessonName || '').includes(UNIT)
      ) {
        delete allLessonsData[k];
      }
    }
  }

  const writtenNumbers = Object.keys(lessons);
  for (const [num, lesson] of Object.entries(lessons)) {
    allLessonsData[num] = lesson;
  }

  const lessonNumbers = [
    ...new Set(
      [...(existing.lessonNumbers || []).filter((n: string) => allLessonsData[n]), ...writtenNumbers].filter(
        (n) => !/^LSO\d+$/i.test(String(n)) && !/^HTBAO\d+$/i.test(String(n)),
      ),
    ),
  ].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

  const teachingUnits = [...new Set([...(existing.teachingUnits || []), UNIT])];
  const payload = {
    ...existing,
    allLessonsData,
    lessonNumbers,
    teachingUnits,
    notes: existing.notes || '',
  };
  localStorage.setItem(key, JSON.stringify(payload));
  localStorage.setItem(LESSON_KEYS_KEY, JSON.stringify(writtenNumbers));
  return { payload, writtenNumbers };
}

/** Lesson Library stack (NOT activity stack). Same id style as lessonStacksApi.create. */
function buildLessonStack(lessonNumbers: string[], activities: Activity[]): StackedLesson {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `stack-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
      : `stack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    name: STACK_NAME,
    description:
      'Year 6 unit from the Hachette/LSO How to Build an Orchestra KS2 packs (Beethoven Storm + Ravel Boléro). Open lessons individually or assign this stack to a half-term.',
    color: '#0b1f4a',
    lessons: lessonNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    customObjectives: [],
    curriculumType: 'CUSTOM',
    created_at: new Date().toISOString(),
  };
}

function mergeLessonStackIntoLocalStorage(stack: StackedLesson) {
  const existing = readJson<any[]>('lesson-stacks', []);
  const oldId = localStorage.getItem(STACK_ID_KEY);
  const cleaned = existing.filter((s) => {
    if (!s) return false;
    if (oldId && s.id === oldId) return false;
    if (s.name === STACK_NAME) return false;
    const id = String(s.id || '');
    if (id.startsWith('lso-y6-stack-')) return false;
    return true;
  });
  localStorage.setItem('lesson-stacks', JSON.stringify([...cleaned, stack]));
  localStorage.setItem(STACK_ID_KEY, stack.id);
}

async function tryCloudSync(
  categories: ReturnType<typeof mergeCategoriesIntoLocalStorage>,
  activities: Activity[],
  lessonPayload: any,
  lessonStack: StackedLesson,
) {
  if (!isSupabaseConfigured()) return;

  try {
    const existingCats = await customCategoriesApi.getAll();
    const without = (existingCats || []).filter((c: any) => !isLsoCategoryName(c.name));
    await customCategoriesApi.upsert([...without, ...categories]);
  } catch (e) {
    console.warn('LSO seed: category cloud sync skipped', e);
  }

  try {
    const all = await activitiesApi.getAll();
    for (const a of all || []) {
      if (isOldLsoActivity(a) && a._id) {
        try {
          await activitiesApi.delete(a._id);
        } catch {
          /* ignore */
        }
      }
    }
  } catch (e) {
    console.warn('LSO seed: activity cleanup skipped', e);
  }

  for (const activity of activities) {
    try {
      const created = await activitiesApi.create(activity as any);
      if (created?._id) activity._id = created._id;
    } catch (e: any) {
      if (e?.code !== '23505') {
        console.warn(`LSO seed: activity cloud create skipped (${activity.activity})`, e);
      }
    }
  }

  try {
    const existingStacks = await activityStacksApi.getAll();
    for (const s of existingStacks) {
      if (isLsoActivityStack(s)) {
        try {
          await activityStacksApi.delete(s.id);
        } catch {
          /* ignore */
        }
      }
    }
  } catch (e) {
    console.warn('LSO seed: activity-stack cleanup skipped', e);
  }

  try {
    const existingLessonStacks = await lessonStacksApi.getAll();
    for (const s of existingLessonStacks) {
      if (s.name === STACK_NAME || s.id === localStorage.getItem(STACK_ID_KEY)) {
        try {
          await lessonStacksApi.delete(s.id);
        } catch {
          /* ignore */
        }
      }
    }
    const created = await lessonStacksApi.create({
      name: lessonStack.name,
      description: lessonStack.description,
      color: lessonStack.color,
      lessons: lessonStack.lessons,
      totalTime: lessonStack.totalTime,
      totalActivities: lessonStack.totalActivities,
      customObjectives: lessonStack.customObjectives || [],
      curriculumType: lessonStack.curriculumType,
    });
    if (created?.id) {
      lessonStack.id = created.id;
      localStorage.setItem(STACK_ID_KEY, created.id);
      const local = readJson<any[]>('lesson-stacks', []);
      const merged = local.filter((s) => s?.name !== STACK_NAME).concat([
        { ...lessonStack, id: created.id, created_at: created.created_at || lessonStack.created_at },
      ]);
      localStorage.setItem('lesson-stacks', JSON.stringify(merged));
    }
  } catch (e) {
    console.warn('LSO seed: lesson stack cloud sync skipped', e);
  }

  try {
    await lessonsApi.updateSheet(
      SHEET_ID,
      {
        allLessonsData: lessonPayload.allLessonsData,
        lessonNumbers: lessonPayload.lessonNumbers,
        teachingUnits: lessonPayload.teachingUnits,
        notes: lessonPayload.notes || '',
      },
      ACADEMIC_YEAR,
    );
  } catch (e) {
    console.warn('LSO seed: lessons cloud sync skipped', e);
  }
}

export async function setupLSOYear6Example(options?: { force?: boolean }) {
  if (!options?.force && localStorage.getItem(MARKER_KEY) === '1') {
    console.log('ℹ️ How to Build an Orchestra (Year 6) already seeded (pass { force: true } to re-seed)');
    return { success: true, skipped: true };
  }

  console.log('🚀 Seeding Year 6 Lesson Library unit: How to Build an Orchestra (v6)...');

  const categories = mergeCategoriesIntoLocalStorage();
  cleanupOldActivityStacks();

  const prepared = SEED_ACTIVITIES.map(blankMedia);
  const activities = mergeActivitiesIntoLocalStorage(prepared);

  const existingLessonData = readJson<any>(`lesson-data-${SHEET_ID}`, { allLessonsData: {} });
  const existingKeys = Object.keys(existingLessonData.allLessonsData || {});
  const lessonNumbers = allocateLessonNumbers(6, existingKeys);
  const lessons = buildLessons(activities, lessonNumbers);
  const { payload, writtenNumbers } = mergeLessonsIntoLocalStorage(lessons);

  const lessonStack = buildLessonStack(writtenNumbers, activities);
  mergeLessonStackIntoLocalStorage(lessonStack);

  await tryCloudSync(categories, activities, payload, lessonStack);

  localStorage.setItem(MARKER_KEY, '1');
  localStorage.removeItem('ccd-lso-year6-seeded-v1');
  localStorage.removeItem('ccd-lso-year6-seeded-v2');
  localStorage.removeItem('ccd-lso-year6-seeded-v3');
  localStorage.removeItem('ccd-lso-year6-seeded-v4');
  localStorage.removeItem('ccd-lso-year6-seeded-v5');

  console.log('✅ Year 6 — How to Build an Orchestra ready (v6)');
  console.log(`   Lesson stack (Lesson Library): "${STACK_NAME}" → lessons ${writtenNumbers.join(', ')}`);
  console.log(`   Folder: ${FOLDER} (LSO brand) · Project categories:`);
  ALL_CATEGORIES.forEach((c) => console.log(`     • ${c}`));
  console.log(`   Activities: ${activities.length} (Activity Library / Lesson Builder — no activity stacks)`);
  console.log(`   Packs: ${HTBAO_PACK_PDF}`);
  console.log(`          ${BEETHOVEN_BOLERO_PACK_PDF}`);

  return {
    success: true,
    stackName: STACK_NAME,
    stackId: localStorage.getItem(STACK_ID_KEY) || lessonStack.id,
    stackLocation: 'Lesson Library → Lesson Stacks / Units',
    folder: FOLDER,
    categories: ALL_CATEGORIES,
    activityCount: activities.length,
    lessonNumbers: writtenNumbers,
    activityTitles: SEED_ACTIVITIES.map((a) => a.activity),
  };
}

if (typeof window !== 'undefined') {
  (window as any).setupLSOYear6Example = setupLSOYear6Example;
  try {
    // Always purge leftover LSO activity stacks (even when seed is skipped).
    cleanupOldActivityStacks();
    if (localStorage.getItem(MARKER_KEY) !== '1') {
      void setupLSOYear6Example();
    }
  } catch (e) {
    console.warn('LSO Year 6 auto-seed failed', e);
  }
}
