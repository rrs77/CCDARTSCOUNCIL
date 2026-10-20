/**
 * Restructure Activity Library: key stage → subject → leaf category.
 * Updates demoSnapshot.json in place; prints folder counts + SQL fragment path.
 *
 * Run: node scripts/restructure-library-hierarchy.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = join(__dirname, '../src/data/demoSnapshot.json');
const README = join(__dirname, '../docs/ACTIVITY_LIBRARY_HIERARCHY.md');
const SQL_OUT = join(__dirname, '../../../supabase/data-updates/2026-10-19_library_hierarchy.sql');

const KEY_STAGES = [
  { id: 'eyfs', label: 'EYFS' },
  { id: 'ks1', label: 'KS1' },
  { id: 'ks2', label: 'KS2' },
  { id: 'ks3', label: 'KS3' },
  { id: 'ks4', label: 'KS4 (GCSE)' },
  { id: 'ks5', label: 'KS5 (A level)' },
];

const SUBJECTS_BY_KS = {
  eyfs: ['Music', 'Drama', 'Dance', 'Art'],
  ks1: ['Music', 'Drama', 'Dance', 'Art'],
  ks2: ['Music', 'Drama', 'Dance', 'Art'],
  ks3: ['Music', 'Drama', 'Dance', 'Art'],
  ks4: ['Music', 'Drama', 'Dance', 'Art', 'Photography'],
  ks5: ['Music', 'Drama', 'Dance', 'Art', 'Photography'],
};

const SUBJECT_COLORS = {
  Music: '#14B8A6',
  Drama: '#8B5CF6',
  Dance: '#EC4899',
  Art: '#F59E0B',
  Photography: '#6366F1',
};

/** Year-group ticks per key stage (names used in Settings + demo sheets). */
const YG_BY_KS = {
  eyfs: {
    Reception: true,
    'Reception Music': true,
    'Reception Drama': true,
    'Lower Kindergarten': true,
    'Upper Kindergarten': true,
    'Upper Kindergarten Music': true,
    LKG: true,
    UKG: true,
  },
  ks1: {
    'Year 1': true,
    'Year 2': true,
    'Year 1 Music': true,
    'Year 2 Music': true,
    'Year 1 Drama': true,
    'Year 2 Drama': true,
  },
  ks2: {
    'Year 3': true,
    'Year 4': true,
    'Year 5': true,
    'Year 6': true,
    'Year 3 Music': true,
    'Year 4 Music': true,
    'Year 5 Music': true,
    'Year 6 Music': true,
    'Year 3 Drama': true,
    'Year 4 Drama': true,
    'Year 5 Drama': true,
    'Year 6 Drama': true,
  },
  ks3: {
    'Year 7': true,
    'Year 8': true,
    'Year 9': true,
    'Year 7 Music': true,
    'Year 8 Music': true,
    'Year 9 Music': true,
    'Year 7 Drama': true,
    'Year 8 Drama': true,
    'Year 9 Drama': true,
  },
  ks4: {
    'Year 10': true,
    'Year 11': true,
    'Year 10 Music (OCR)': true,
    'Year 10 Music (GCSE)': true,
    'Year 11 Music (GCSE)': true,
    'Year 10 Drama (GCSE)': true,
    'Year 11 Drama (GCSE)': true,
    'Year 10 Drama': true,
    'Year 11 Drama': true,
    'Year 10 Dance (GCSE)': true,
    'Year 11 Dance (GCSE)': true,
    'Year 10 Art (GCSE)': true,
    'Year 11 Art (GCSE)': true,
    'Year 10 Photography (GCSE)': true,
    'Year 11 Photography (GCSE)': true,
  },
  ks5: {
    'Year 12': true,
    'Year 13': true,
    'Year 12 Music (A level)': true,
    'Year 13 Music (A level)': true,
    'Year 12 Drama (A level)': true,
    'Year 13 Drama (A level)': true,
    'Year 12 Dance (A level)': true,
    'Year 13 Dance (A level)': true,
    'Year 12 Art (A level)': true,
    'Year 13 Art (A level)': true,
    'Year 12 Photography (A level)': true,
    'Year 13 Photography (A level)': true,
  },
};

/** Existing leaf → home subject (+ optional home KS for metadata). */
const EXISTING_PLACEMENT = {
  Welcome: { subject: 'Music', keyStages: ['eyfs'] },
  Goodbye: { subject: 'Music', keyStages: ['eyfs'] },
  'Kodaly Songs': { subject: 'Music', keyStages: ['eyfs'] },
  'Kodaly Action Songs': { subject: 'Music', keyStages: ['eyfs'] },
  'Action/Games Songs': { subject: 'Music', keyStages: ['eyfs'] },
  'Rhythm Sticks': { subject: 'Music', keyStages: ['eyfs'] },
  'Scarf Songs': { subject: 'Music', keyStages: ['eyfs'] },
  'General Game': { subject: 'Music', keyStages: ['eyfs'] },
  'Core Songs': { subject: 'Music', keyStages: ['eyfs'] },
  'Parachute Games': { subject: 'Music', keyStages: ['eyfs'] },
  'Percussion Games': { subject: 'Music', keyStages: ['eyfs'] },
  'Teaching Units': { subject: 'Music', keyStages: ['eyfs'] },
  'Kodaly Rhythms': { subject: 'Music', keyStages: ['eyfs'] },
  'Kodaly Games': { subject: 'Music', keyStages: ['eyfs'] },
  'IWB Games': { subject: 'Music', keyStages: ['eyfs'] },
  Hello: { subject: 'Music', keyStages: ['eyfs', 'ks1'] },
  'Bubble Songs': { subject: 'Music', keyStages: ['eyfs'] },
  Songs: { subject: 'Music', keyStages: ['eyfs', 'ks1'] },
  Rhythm: { subject: 'Music', keyStages: ['ks1'] },
  Singing: { subject: 'Music', keyStages: ['ks1'] },
  'KS2 Songs': { subject: 'Music', keyStages: ['ks2'] },
  'Drama Games': { subject: 'Drama', keyStages: ['eyfs', 'ks1', 'ks2'] },
  'KS1 Drama': { subject: 'Drama', keyStages: ['ks1'] },
  'Vocal Warmups': { subject: 'Music', keyStages: ['ks1', 'ks2', 'ks3'] },
  'Vocal Warm-Ups': { subject: 'Music', keyStages: ['ks1', 'ks2', 'ks3'] },
  'Physical Starters': { subject: 'Music', keyStages: ['ks1', 'ks2', 'ks3'] },
  'Breathing Exercises': { subject: 'Music', keyStages: ['ks1', 'ks2', 'ks3'] },
  'Facial Warm-Ups / Diction': { subject: 'Music', keyStages: ['ks1', 'ks2', 'ks3'] },
  'Pitch Exercises': { subject: 'Music', keyStages: ['ks1', 'ks2', 'ks3'] },
  'Film/Computer Music — Listen': { subject: 'Music', keyStages: ['ks4'] },
  'Film/Computer Music — Technology': { subject: 'Music', keyStages: ['ks4'] },
  'Film/Computer Music — Compose': { subject: 'Music', keyStages: ['ks4'] },
  'Film/Computer Music — Evaluate': { subject: 'Music', keyStages: ['ks4'] },
};

/** New leaf categories for thin subject folders (keep colours stable). */
const NEW_LEAVES = [
  // EYFS
  { name: 'EYFS Dance Play', subject: 'Dance', keyStages: ['eyfs'], color: '#EC4899' },
  { name: 'EYFS Art Explorations', subject: 'Art', keyStages: ['eyfs'], color: '#F59E0B' },
  { name: 'EYFS Drama Starters', subject: 'Drama', keyStages: ['eyfs'], color: '#A78BFA' },
  // KS1
  { name: 'KS1 Music Making', subject: 'Music', keyStages: ['ks1'], color: '#0D9488' },
  { name: 'KS1 Dance', subject: 'Dance', keyStages: ['ks1'], color: '#DB2777' },
  { name: 'KS1 Art', subject: 'Art', keyStages: ['ks1'], color: '#D97706' },
  // KS2
  { name: 'KS2 Music Making', subject: 'Music', keyStages: ['ks2'], color: '#0F766E' },
  { name: 'KS2 Drama', subject: 'Drama', keyStages: ['ks2'], color: '#7C3AED' },
  { name: 'KS2 Dance', subject: 'Dance', keyStages: ['ks2'], color: '#BE185D' },
  { name: 'KS2 Art', subject: 'Art', keyStages: ['ks2'], color: '#B45309' },
  // KS3
  { name: 'KS3 Music', subject: 'Music', keyStages: ['ks3'], color: '#115E59' },
  { name: 'KS3 Drama', subject: 'Drama', keyStages: ['ks3'], color: '#6D28D9' },
  { name: 'KS3 Dance', subject: 'Dance', keyStages: ['ks3'], color: '#9D174D' },
  { name: 'KS3 Art', subject: 'Art', keyStages: ['ks3'], color: '#92400E' },
  // KS4
  { name: 'KS4 Music (GCSE)', subject: 'Music', keyStages: ['ks4'], color: '#134E4A' },
  { name: 'KS4 Drama (GCSE)', subject: 'Drama', keyStages: ['ks4'], color: '#5B21B6' },
  { name: 'KS4 Dance (GCSE)', subject: 'Dance', keyStages: ['ks4'], color: '#831843' },
  { name: 'KS4 Art & Design (GCSE)', subject: 'Art', keyStages: ['ks4'], color: '#78350F' },
  { name: 'KS4 Photography (GCSE)', subject: 'Photography', keyStages: ['ks4'], color: '#4F46E5' },
  // KS5
  { name: 'KS5 Music (A level)', subject: 'Music', keyStages: ['ks5'], color: '#042F2E' },
  { name: 'KS5 Drama (A level)', subject: 'Drama', keyStages: ['ks5'], color: '#4C1D95' },
  { name: 'KS5 Dance (A level)', subject: 'Dance', keyStages: ['ks5'], color: '#500724' },
  { name: 'KS5 Art & Design (A level)', subject: 'Art', keyStages: ['ks5'], color: '#451A03' },
  { name: 'KS5 Photography (A level)', subject: 'Photography', keyStages: ['ks5'], color: '#3730A3' },
];

function mergeYearGroups(ksList) {
  const out = {};
  for (const ks of ksList) {
    Object.assign(out, YG_BY_KS[ks] || {});
  }
  return out;
}

function richActivity({ title, intro, why, setup, steps, tips, easier, harder, time = 15 }) {
  const whyLis = why.map((w) => `<li>${w}</li>`).join('');
  const stepLis = steps.map((s) => `<li>${s}</li>`).join('');
  const tipLis = tips.map((t) => `<li>${t}</li>`).join('');
  const description = `<p>${intro}</p><p><strong>Why it works</strong></p><ul>${whyLis}</ul>`;
  const activity_text = `<p><strong>Setup</strong></p><p>${setup}</p><p><strong>How to play</strong></p><ol>${stepLis}</ol><p><strong>Teacher tips</strong></p><ul>${tipLis}</ul><p><strong>Make it easier</strong></p><p>${easier}</p><p><strong>Make it harder</strong></p><p>${harder}</p>`;
  return { title, description, activity_text, time };
}

/** Curriculum-aligned activity banks (~6 each). */
const SEED_BANK = {
  'EYFS Dance Play': [
    richActivity({
      title: 'Scarf Floating Pathways',
      intro: 'Children explore travelling pathways with scarves, linking movement to music for EYFS Expressive Arts and Design.',
      why: ['Builds spatial awareness and coordination', 'Supports listening and response to music', 'Encourages imaginative movement without fixed steps'],
      setup: 'Open floor space. One scarf per child. Soft instrumental track ~3 minutes. About 10–15 minutes.',
      steps: ['Children hold scarves and copy teacher floating pathways (high/low, zig-zag, circle)', 'Freeze when music pauses; restart on a different pathway', 'Invite two children to lead a short pathway for the class'],
      tips: ['Keep language simple: high, low, slow, stop', 'Celebrate big clear shapes rather than “correct” steps', 'Use the same freeze cue as drama/music so routines transfer'],
      easier: 'Sit and float scarves first, then stand and travel short distances.',
      harder: 'Ask children to change pathway when they hear a timbre change (e.g. woodblock).',
      time: 12,
    }),
    richActivity({
      title: 'Animal Travelling',
      intro: 'Move like animals through the space, changing speed and size to match a drum cue.',
      why: ['Develops gross motor control', 'Introduces dynamics (fast/slow, big/small)', 'Links movement vocabulary to storytelling'],
      setup: 'Clear pathways. Hand drum or clap cues. About 10 minutes.',
      steps: ['Call an animal; children travel in that quality', 'Drum cue = freeze; soft taps = tip-toe restart', 'Combine two animals in a short ABC phrase'],
      tips: ['Model one animal fully before calling the next', 'Keep rounds short so energy stays joyful', 'Name body parts: strong legs, soft paws'],
      easier: 'Whole class mirrors the teacher animal first.',
      harder: 'Children invent a “new animal” and teach one movement to a partner.',
      time: 10,
    }),
    richActivity({
      title: 'Copy My Shape',
      intro: 'A simple mirroring game that builds stillness, body awareness and turn-taking.',
      why: ['Supports self-regulation through freeze', 'Introduces shape and levels', 'Prepares for later dance phrase work'],
      setup: 'Circle or scattered spots. No props. About 8–10 minutes.',
      steps: ['Teacher makes a still shape; children copy', 'Count of three hold, then shake out', 'Children take turns leading one shape'],
      tips: ['Use levels: low, middle, high', 'Praise stillness as much as movement', 'Offer seated shape options for inclusion'],
      easier: 'Only standing shapes; teacher always leads.',
      harder: 'Link two shapes with a slow transition on a vocal count.',
      time: 8,
    }),
    richActivity({
      title: 'Beat Stomp Circle',
      intro: 'Feel a steady pulse through feet and hands, aligning with early music MMC pulse work.',
      why: ['Internalises steady beat', 'Coordinates whole-body response', 'Builds ensemble listening'],
      setup: 'Standing circle. Frame drum or recording with clear pulse. About 10 minutes.',
      steps: ['Stomp quietly on the pulse together', 'Add clap on beat 1 of each four', 'Travel the circle on the pulse, freeze on silence'],
      tips: ['Keep tempo moderate', 'Watch for children rushing—reset with a clear count-in', 'Alternate loud/soft stomps for dynamics'],
      easier: 'Seated knee-taps on the pulse first.',
      harder: 'Split circle: half stomp, half clap, then swap.',
      time: 10,
    }),
    richActivity({
      title: 'Ribbon Rainbow Waves',
      intro: 'Explore continuous vs broken movement with ribbons or streamers.',
      why: ['Contrasts smooth and sharp qualities', 'Strengthens shoulder/arm control', 'Invites colour and pattern talk (EAD)'],
      setup: 'One ribbon/streamer each. Calm then lively music. About 12 minutes.',
      steps: ['Make continuous rainbow waves to calm music', 'Switch to sharp “zig-zag lightning” on lively music', 'Children choose quality when music changes unpredictably'],
      tips: ['Demonstrate safe ribbon space (arm’s length)', 'Link words: smooth, sharp, float, jab', 'End with a shared rainbow freeze'],
      easier: 'Teacher calls “wave” or “zig-zag” explicitly.',
      harder: 'Partner: one leads quality, other mirrors.',
      time: 12,
    }),
    richActivity({
      title: 'Stop-Go Traffic Dance',
      intro: 'Respond to colour/sound signals with travel, freeze and direction changes.',
      why: ['Practises impulse control', 'Builds listening for cues', 'Introduces direction vocabulary'],
      setup: 'Red/green cards or vocal cues. Floor markers optional. About 10 minutes.',
      steps: ['Green = travel; red = freeze shape', 'Add amber = slow-motion travel', 'Introduce left/right or forwards/backwards on green'],
      tips: ['Keep signals consistent with PE/drama', 'Celebrate controlled freezes', 'Offer crawling travel for variety'],
      easier: 'Only green/red; teacher models each time.',
      harder: 'Children take turns holding the colour cards.',
      time: 10,
    }),
  ],
  'EYFS Art Explorations': [
    richActivity({
      title: 'Mark-Making Weather',
      intro: 'Children make marks that show weather ideas—rain dots, wind swirls, sun rays—using chunky tools.',
      why: ['Builds fine motor control', 'Links observation to representation (EAD ELG)', 'Introduces line vocabulary'],
      setup: 'Large paper, crayons/chalks, optional outdoor photos. About 15 minutes.',
      steps: ['Look at a weather photo together and name what you see', 'Make rain dots, then wind swirls on a shared sheet', 'Children add their own weather mark and describe it'],
      tips: ['Model one mark slowly', 'Accept all representations—focus on talk', 'Offer standing easels for shoulder strength'],
      easier: 'Finger-paint rain dots only.',
      harder: 'Combine two weathers in one picture and tell a tiny story.',
      time: 15,
    }),
    richActivity({
      title: 'Texture Treasure Rubbings',
      intro: 'Explore texture by rubbing crayons over classroom or outdoor surfaces.',
      why: ['Sensory exploration of materials', 'Builds observational language', 'Prepares for collage and print later'],
      setup: 'Paper, crayons without wrappers, safe textured surfaces. About 15 minutes.',
      steps: ['Hunt for a rough and a smooth surface', 'Make rubbings side by side', 'Sort rubbings into rough/smooth piles and talk'],
      tips: ['Tape paper so it does not slip', 'Model light vs heavy pressure', 'Collect natural objects only with permission'],
      easier: 'Teacher prepares two fixed rubbing boards.',
      harder: 'Children guess a partner’s rubbing surface.' ,
      time: 15,
    }),
    richActivity({
      title: 'Colour Mixing Magic',
      intro: 'Discover what happens when primary colours meet using paint or food-colour water trays.',
      why: ['Introduces primary colour knowledge', 'Encourages prediction and talk', 'Supports safe tool use'],
      setup: 'Primary paints, palettes, brushes, aprons. About 15 minutes.',
      steps: ['Predict: what will red + yellow make?', 'Mix and name the new colour', 'Paint a simple shape using only mixed colours'],
      tips: ['Limit to two primaries per tray to avoid mud', 'Photograph results for a class colour book', 'Use clear vocabulary: mix, blend, shade'],
      easier: 'Premixed secondary; children match name to colour.',
      harder: 'Children invent a name for their unique mix.',
      time: 15,
    }),
    richActivity({
      title: 'Clay Pinch Pots',
      intro: 'Pinch clay into a simple pot, focusing on safe tool use and 3D form.',
      why: ['Develops hand strength', 'Introduces form and space', 'Supports perseverance'],
      setup: 'Air-dry clay, mats, water pots, simple tools. About 20 minutes.',
      steps: ['Warm clay in hands into a ball', 'Thumb in centre; pinch walls evenly', 'Optional: press a pattern with a tool'],
      tips: ['Keep walls thick enough to stand', 'Celebrate wonky pots', 'Dry flat; paint next session'],
      easier: 'Flatten a clay “biscuit” and press textures.',
      harder: 'Add a clay handle or lid disc.',
      time: 20,
    }),
    richActivity({
      title: 'Self-Portrait Faces',
      intro: 'Look in mirrors and draw faces with simple shapes—circles, lines, dots.',
      why: ['Builds identity and observation', 'Practises shape vocabulary', 'Links art to PSED'],
      setup: 'Mirrors, paper, skin-tone crayons, pencils. About 15 minutes.',
      steps: ['Look carefully at eyes, hair, smile', 'Draw an oval face and add features', 'Share one thing they noticed about themselves'],
      tips: ['Offer mirrors at table height', 'Avoid “perfect” examples that pressure children', 'Include collage hair options'],
      easier: 'Pre-drawn ovals; children add features.',
      harder: 'Add a favourite colour background pattern.',
      time: 15,
    }),
    richActivity({
      title: 'Nature Collage Gardens',
      intro: 'Arrange natural or scrap materials into a garden collage, talking about pattern and placement.',
      why: ['Composition and arrangement', 'Respectful use of materials', 'Collaborative talk'],
      setup: 'Card bases, glue sticks, leaves/fabric scraps/buttons. About 15 minutes.',
      steps: ['Choose 5–8 pieces', 'Arrange before gluing (“try then stick”)', 'Name patterns: row, cluster, border'],
      tips: ['Model arranging without glue first', 'Limit glue to reduce soaking', 'Display as a class garden wall'],
      easier: 'Stick on a drawn path template.',
      harder: 'Make a repeating pattern along one edge.',
      time: 15,
    }),
  ],
  'EYFS Drama Starters': [
    richActivity({
      title: 'Magic Shoes Walk',
      intro: 'Imagine putting on magic shoes that change how you walk—giant, tiny, sticky, floaty.',
      why: ['Introduces characterisation through movement', 'Builds imagination and vocabulary', 'Warm-up for Drama Games'],
      setup: 'Clear floor. Optional shoe icons. About 8 minutes.',
      steps: ['Mime putting on shoes', 'Teacher names a shoe type; class walks in that quality', 'Freeze and show shoe to a partner'],
      tips: ['Keep walks short', 'Use stop/go cues already known', 'Celebrate bold choices'],
      easier: 'Two shoe types only.',
      harder: 'Children invent a shoe and teach the walk.',
      time: 8,
    }),
    richActivity({
      title: 'Emotion Statues',
      intro: 'Make still statues that show a feeling, then soften and reset.',
      why: ['Links feelings to body language', 'Practises stillness', 'Supports emotional literacy'],
      setup: 'Standing spots. Feeling cards optional. About 8 minutes.',
      steps: ['Call a feeling; children make a statue', 'Hold for a count of three', 'Shake out; new feeling'],
      tips: ['Model face + body', 'Offer seated statues', 'Name safe feelings first'],
      easier: 'Happy/sad only with teacher model.',
      harder: 'Partner guesses the feeling silently.',
      time: 8,
    }),
    richActivity({
      title: 'Soundscape Forest',
      intro: 'Build a forest soundscape with voices and body percussion.',
      why: ['Ensemble listening', 'Vocal exploration', 'Story atmosphere for later drama'],
      setup: 'Circle. No props. About 10 minutes.',
      steps: ['Layer wind, birds, footsteps on cue', 'Conduct louder/softer with hands', 'End in silence together'],
      tips: ['Start with one sound layer', 'Use clear conductor gestures', 'Keep volume classroom-safe'],
      easier: 'Whole class does one sound together.',
      harder: 'Small groups own different forest layers.',
      time: 10,
    }),
    richActivity({
      title: 'Who’s Behind the Curtain?',
      intro: 'Guess classmates by voice or movement peeking from behind a cloth “curtain”.',
      why: ['Builds focus and turn-taking', 'Voice/body awareness', 'Gentle performance practice'],
      setup: 'Cloth or PE bench as curtain. About 10 minutes.',
      steps: ['One child hides and speaks a line or moves', 'Class guesses who', 'Swap roles'],
      tips: ['Keep queues short', 'Praise kind guessing', 'Offer movement-only option'],
      easier: 'Teacher is always behind the curtain first.',
      harder: 'Perform a tiny character voice.',
      time: 10,
    }),
    richActivity({
      title: 'Story Object Pass',
      intro: 'Pass an everyday object that “becomes” something new each time.',
      why: ['Mime and imagination', 'Oral language', 'Collaborative storytelling'],
      setup: 'One prop (scarf/cup). Circle. About 10 minutes.',
      steps: ['Demonstrate scarf as cape, river, baby', 'Pass; each child shows a new idea', 'Class echoes the idea once'],
      tips: ['Accept all offers', 'Keep pace brisk', 'Model big clear mime'],
      easier: 'Choose from three teacher ideas.',
      harder: 'Link two ideas into a two-sentence story.',
      time: 10,
    }),
    richActivity({
      title: 'Yes Let’s Tiny Adventures',
      intro: 'Whole class answers “Yes, let’s!” and mimes short adventures together.',
      why: ['Collective play', 'Following directions', 'Joyful ensemble habit'],
      setup: 'Open space. About 8 minutes.',
      steps: ['Leader: “Let’s splash in puddles!”', 'All: “Yes, let’s!” and mime', 'New leader each round'],
      tips: ['Teacher leads first three', 'Keep actions inclusive', 'Stop while energy is high'],
      easier: 'Teacher always leads.',
      harder: 'Add a feeling to the adventure (excited/tired).',
      time: 8,
    }),
  ],
};

// Additional banks generated programmatically for KS1–KS5 thin folders
function genericBank(leafName, subject, ks, specs) {
  const titles = {
    Music: [
      ['Pulse Patrol', 'Find and keep a steady pulse with body percussion and instruments'],
      ['Call and Response Echo', 'Echo melodic or rhythmic phrases with clear starts and stops'],
      ['Listening Map Sketch', 'Draw a simple listening map while hearing a short extract'],
      ['Compose a 4-Beat Cell', 'Invent and refine a short rhythmic or melodic cell'],
      ['Dynamics Detective', 'Spot and perform loud/soft and crescendo/decrescendo'],
      ['Perform and Reflect', 'Perform a short piece and use one target for improvement'],
    ],
    Drama: [
      ['Status Walks', 'Explore high/low status through walk, eyeline and pace'],
      ['Hot-Seating Snapshot', 'Interview a character in role with evidence-based answers'],
      ['Tableau Transitions', 'Build still images and transition with intention'],
      ['Objective and Obstacle', 'Play a short scene with a clear want and barrier'],
      ['Vocal Colour Lines', 'Deliver the same line with contrasting vocal colours'],
      ['Live Theatre Note', 'Capture one staging choice and its effect on audience'],
    ],
    Dance: [
      ['Action Bank Phrase', 'Build a phrase from travel, turn, jump, gesture, stillness'],
      ['Space Pathways', 'Choreograph pathways using levels and directions'],
      ['Dynamics Contrast', 'Perform the same motif with sharp vs sustained dynamics'],
      ['Unison to Canon', 'Take a unison motif into a simple canon'],
      ['Motif Development', 'Develop a motif by changing size, speed or level'],
      ['Appreciation Pause', 'Watch a short clip/peer work and name one choreographic device'],
    ],
    Art: [
      ['Observational Line Study', 'Draw from observation focusing on contour and proportion'],
      ['Tone Ladder', 'Create a tone ladder then apply to a simple form'],
      ['Artist Response Card', 'Respond to an artist image with materials and annotation'],
      ['Composition Thumbnails', 'Make three thumbnails before a final composition'],
      ['Material Experiment', 'Test one material’s marks, edges and layering'],
      ['Critique Triangle', 'Peer feedback: notice, question, suggest'],
    ],
    Photography: [
      ['Rule of Thirds Hunt', 'Frame shots using thirds; select and justify one'],
      ['Light Direction Study', 'Photograph the same subject in front/side/back light'],
      ['Depth of Field Trial', 'Compare shallow vs deep focus for storytelling'],
      ['Contact Sheet Edit', 'Shoot a set, contact-sheet, and justify final selection'],
      ['Narrative Sequence', 'Create a 3–5 image sequence with a clear narrative arc'],
      ['Contextual Annotation', 'Annotate a final image linking technique to intention'],
    ],
  };
  const list = titles[subject] || titles.Music;
  return list.map(([title, focus], i) =>
    richActivity({
      title,
      intro: `${focus}. Designed for ${ks.toUpperCase()} ${subject} and aligned with ${specs}.`,
      why: [
        `Targets core ${subject.toLowerCase()} skills expected at ${ks.toUpperCase()}`,
        'Builds progressive practice → perform/make → reflect habits',
        'Uses clear success criteria teachers can reuse across lessons',
      ],
      setup: `Classroom or studio space appropriate for ${subject}. Props/instruments as needed. About 15–20 minutes.`,
      steps: [
        'Share the learning focus in one sentence and success criteria',
        `Students try the core task (${focus.toLowerCase()})`,
        'Mini-share: two examples; refine once using peer/teacher feedback',
        'Exit: students name one improvement for next time',
      ],
      tips: [
        'Keep teacher talk short; maximise doing time',
        'Model one high-quality example, then step back',
        'Use the same reflection stem across the unit for consistency',
        specs.includes('GCSE') || specs.includes('A level')
          ? 'Link explicitly to exam-board terminology in plenary'
          : 'Link to National Curriculum / MMC language where helpful',
      ],
      easier: 'Reduce choices; provide a scaffolded template or paired roles.',
      harder: 'Add a constraint (time, motif limit, or audience focus) and justify artistic decisions.',
      time: 15 + (i % 3) * 5,
    }),
  );
}

const SPEC_BLURBS = {
  eyfs: 'EYFS statutory framework — Expressive Arts and Design',
  ks1: 'National Curriculum Music/Art KS1 and Model Music Curriculum',
  ks2: 'National Curriculum Music/Art KS2 and Model Music Curriculum',
  ks3: 'National Curriculum Music/Art KS3; Ofsted arts research reviews',
  ks4: 'GCSE specs (AQA/OCR/Edexcel/Eduqas as applicable)',
  ks5: 'A level specs (AQA/OCR/Edexcel/Eduqas as applicable)',
};

function activitiesForNewLeaf(leaf) {
  if (SEED_BANK[leaf.name]) return SEED_BANK[leaf.name];
  const ks = leaf.keyStages[0];
  return genericBank(leaf.name, leaf.subject, ks, SPEC_BLURBS[ks]);
}

function nowIso() {
  return new Date().toISOString();
}

function main() {
  const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  const cats = snap.tables.custom_categories;
  const acts = snap.tables.activities;
  const sqlParts = [];
  sqlParts.push(`-- Activity Library hierarchy restructure + seeded subject activities`);
  sqlParts.push(`-- Generated ${new Date().toISOString().slice(0, 10)}`);
  sqlParts.push(`-- Apply manually to live Supabase. Do not run from CI.`);
  sqlParts.push(`BEGIN;\n`);

  // Remap existing categories
  let position = 0;
  const byName = new Map(cats.map((c) => [c.name, c]));

  for (const cat of cats) {
    const place = EXISTING_PLACEMENT[cat.name];
    if (!place) {
      // Heuristic fallback
      const sub =
        /drama/i.test(cat.name) ? 'Drama' :
        /dance/i.test(cat.name) ? 'Dance' :
        /photo/i.test(cat.name) ? 'Photography' :
        /art/i.test(cat.name) ? 'Art' : 'Music';
      const ks = /ks5|a\s*level/i.test(cat.name) ? ['ks5'] :
        /ks4|gcse|film\/computer/i.test(cat.name) ? ['ks4'] :
        /ks3/i.test(cat.name) ? ['ks3'] :
        /ks2/i.test(cat.name) ? ['ks2'] :
        /ks1/i.test(cat.name) ? ['ks1'] : ['eyfs'];
      cat.group = sub;
      cat.groups = [ks[0], sub];
      cat.yearGroups = mergeYearGroups(ks);
      cat.year_groups = { ...cat.yearGroups };
      cat.color = cat.color || SUBJECT_COLORS[sub];
      cat.position = position++;
      cat.updated_at = nowIso();
      continue;
    }
    const homeKs = place.keyStages[0];
    cat.group = place.subject;
    cat.groups = [homeKs, place.subject];
    cat.yearGroups = mergeYearGroups(place.keyStages);
    cat.year_groups = { ...cat.yearGroups };
    cat.position = position++;
    cat.updated_at = nowIso();

    sqlParts.push(`-- Category metadata: ${cat.name}`);
    sqlParts.push(`UPDATE custom_categories SET`);
    sqlParts.push(`  "group" = '${place.subject}',`);
    sqlParts.push(`  groups = ARRAY['${homeKs}','${place.subject}']::text[],`);
    sqlParts.push(`  year_groups = '${JSON.stringify(cat.year_groups).replace(/'/g, "''")}'::jsonb,`);
    sqlParts.push(`  updated_at = NOW()`);
    sqlParts.push(`WHERE id = '${cat.id}';\n`);
  }

  // Ensure Vocal Warmups spelling category exists as parent if only Warm-Ups on acts
  if (!byName.has('Vocal Warmups') && byName.has('Vocal Warm-Ups')) {
    // alias already handled in filters
  }

  // Add new leaf categories
  const newActRows = [];
  for (const leaf of NEW_LEAVES) {
    if (byName.has(leaf.name)) {
      const existing = byName.get(leaf.name);
      existing.group = leaf.subject;
      existing.groups = [leaf.keyStages[0], leaf.subject];
      existing.yearGroups = mergeYearGroups(leaf.keyStages);
      existing.year_groups = { ...existing.yearGroups };
      existing.color = leaf.color;
      existing.position = position++;
      existing.updated_at = nowIso();
      continue;
    }
    const id = randomUUID();
    const yg = mergeYearGroups(leaf.keyStages);
    const row = {
      id,
      name: leaf.name,
      color: leaf.color,
      position: position++,
      created_at: nowIso(),
      updated_at: nowIso(),
      yearGroups: yg,
      groups: [leaf.keyStages[0], leaf.subject],
      group: leaf.subject,
      year_groups: yg,
    };
    cats.push(row);
    byName.set(leaf.name, row);

    sqlParts.push(`-- Insert category ${leaf.name}`);
    sqlParts.push(`INSERT INTO custom_categories (id, name, color, position, year_groups, groups, "group", created_at, updated_at)`);
    sqlParts.push(`VALUES (`);
    sqlParts.push(`  '${id}',`);
    sqlParts.push(`  '${leaf.name.replace(/'/g, "''")}',`);
    sqlParts.push(`  '${leaf.color}',`);
    sqlParts.push(`  ${row.position},`);
    sqlParts.push(`  '${JSON.stringify(yg).replace(/'/g, "''")}'::jsonb,`);
    sqlParts.push(`  ARRAY['${leaf.keyStages[0]}','${leaf.subject}']::text[],`);
    sqlParts.push(`  '${leaf.subject}',`);
    sqlParts.push(`  NOW(), NOW()`);
    sqlParts.push(`) ON CONFLICT (id) DO UPDATE SET`);
    sqlParts.push(`  name = EXCLUDED.name, color = EXCLUDED.color, position = EXCLUDED.position,`);
    sqlParts.push(`  year_groups = EXCLUDED.year_groups, groups = EXCLUDED.groups, "group" = EXCLUDED."group", updated_at = NOW();\n`);

    const bank = activitiesForNewLeaf(leaf);
    const ygTags = Object.keys(yg).filter((k) => !['LKG', 'UKG'].includes(k)).slice(0, 6);
    for (const a of bank) {
      const actId = randomUUID();
      const actRow = {
        id: actId,
        activity: a.title,
        description: a.description,
        activity_text: a.activity_text,
        time: a.time,
        video_link: '',
        music_link: '',
        backing_link: '',
        resource_link: '',
        link: '',
        vocals_link: '',
        image_link: '',
        teaching_unit: leaf.name,
        category: leaf.name,
        level: leaf.keyStages[0].toUpperCase(),
        unit_name: leaf.subject,
        lesson_number: null,
        eyfs_standards: leaf.keyStages[0] === 'eyfs' ? [] : [],
        created_at: nowIso(),
        updated_at: nowIso(),
        year_group_id: null,
        subject_id: null,
        category_id: id,
        yeargroups: ygTags.length ? ygTags : Object.keys(yg).slice(0, 4),
        curriculum_type: leaf.keyStages[0] === 'eyfs' ? 'EYFS' : 'CUSTOM',
        activity_heading: 'Activity',
        description_heading: 'Introduction/Context',
        link_heading: 'Additional Link',
        canva_link: '',
      };
      newActRows.push(actRow);
      acts.push(actRow);

      sqlParts.push(`INSERT INTO activities (id, activity, description, activity_text, time, category, level, unit_name, yeargroups, curriculum_type, created_at, updated_at)`);
      sqlParts.push(`VALUES (`);
      sqlParts.push(`  '${actId}',`);
      sqlParts.push(`  '${a.title.replace(/'/g, "''")}',`);
      sqlParts.push(`  '${a.description.replace(/'/g, "''")}',`);
      sqlParts.push(`  '${a.activity_text.replace(/'/g, "''")}',`);
      sqlParts.push(`  ${a.time},`);
      sqlParts.push(`  '${leaf.name.replace(/'/g, "''")}',`);
      sqlParts.push(`  '${leaf.keyStages[0].toUpperCase()}',`);
      sqlParts.push(`  '${leaf.subject}',`);
      sqlParts.push(`  '${JSON.stringify(actRow.yeargroups).replace(/'/g, "''")}'::jsonb,`);
      sqlParts.push(`  '${actRow.curriculum_type}',`);
      sqlParts.push(`  NOW(), NOW()`);
      sqlParts.push(`) ON CONFLICT (id) DO UPDATE SET`);
      sqlParts.push(`  description = EXCLUDED.description, activity_text = EXCLUDED.activity_text,`);
      sqlParts.push(`  category = EXCLUDED.category, yeargroups = EXCLUDED.yeargroups, updated_at = NOW();\n`);
    }
  }

  // Remap Drama Games yeargroups to include EYFS + KS1 + KS2 drama classes
  for (const a of acts) {
    if (a.category === 'Drama Games') {
      const tags = new Set(Array.isArray(a.yeargroups) ? a.yeargroups : []);
      ['Reception', 'Reception Drama', 'Year 1 Drama', 'Year 2 Drama', 'Year 3 Drama', 'Year 4 Drama', 'Year 5 Drama', 'Year 6 Drama'].forEach((t) => tags.add(t));
      a.yeargroups = [...tags];
    }
  }

  snap.fetchedAt = nowIso();
  writeFileSync(SNAPSHOT, JSON.stringify(snap, null, 2) + '\n');

  sqlParts.push('COMMIT;\n');
  mkdirSync(dirname(SQL_OUT), { recursive: true });
  writeFileSync(SQL_OUT, sqlParts.join('\n'));

  // Counts report
  const counts = {};
  for (const a of acts) {
    const cat = byName.get(a.category);
    const sub = cat?.group || EXISTING_PLACEMENT[a.category]?.subject || 'Other';
    const ks = (cat?.groups && cat.groups[0]) || EXISTING_PLACEMENT[a.category]?.keyStages?.[0] || 'other';
    const key = `${ks}/${sub}/${a.category}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  const report = {
    totalActivities: acts.length,
    totalCategories: cats.length,
    newActivities: newActRows.length,
    newCategories: NEW_LEAVES.length,
    countsByFolder: counts,
  };
  mkdirSync(join(__dirname, '../docs'), { recursive: true });
  writeFileSync(join(__dirname, '../docs/library-hierarchy-counts.json'), JSON.stringify(report, null, 2) + '\n');

  const readme = `# Activity Library hierarchy

## Structure

Top level **key stage** → **subject** → **leaf category** (existing folders keep their names and colours).

| Key stage | Subjects |
|-----------|----------|
| EYFS | Music, Drama, Dance, Art |
| KS1–KS3 | Music, Drama, Dance, Art |
| KS4 (GCSE) / KS5 (A level) | Music, Drama, Dance, Art, Photography |

All headings start **collapsed**. Activity counts show on collapsed rows. Expanded state is remembered for the browser session.

Class filter behaviour is unchanged: a class only sees categories assigned to it in Settings (plus vocal warm-up subcategory mapping).

## Spec / guidance sources (England)

Used when writing seed activities (not a substitute for centre exam-board choices):

- **EYFS**: Statutory framework for the early years foundation stage — Expressive Arts and Design (EAD) ELGs (creating with materials; being imaginative and expressive). GOV.UK.
- **KS1–KS3 Music / Art**: National curriculum in England programmes of study; **Model Music Curriculum** (DfE, non-statutory) — singing, listening, composing, performing.
- **Ofsted**: Research review series — art and design; music subject research / deep dive expectations (curriculum ambition, teaching, assessment).
- **GCSE Music**: AQA 8271; OCR J536 (AoS include film/game music); Edexcel/Pearson; Eduqas — performing, composing, appraising.
- **GCSE Drama**: AQA 8261; OCR J316; Eduqas — devising, performing texts, evaluation of live theatre.
- **GCSE Dance**: AQA 8236 — performance, choreography, dance appreciation (anthology).
- **GCSE Art & Design / Photography**: AQA; OCR; Edexcel; Eduqas — portfolio + externally set assignment; photography as endorsed title.
- **A level**: AQA/OCR/Edexcel/Eduqas Music, Drama & Theatre, Dance, Art & Design, Photography — coursework/NEA + examined components as per current specs.

Always check the centre’s chosen board specification and NEA dates.

## Data updates

- Snapshot: \`artifacts/ccd/src/data/demoSnapshot.json\`
- SQL: \`supabase/data-updates/2026-10-19_library_hierarchy.sql\`
- Counts: \`artifacts/ccd/docs/library-hierarchy-counts.json\`

Regenerate with:

\`\`\`bash
node artifacts/ccd/scripts/restructure-library-hierarchy.mjs
\`\`\`
`;
  mkdirSync(dirname(README), { recursive: true });
  writeFileSync(README, readme);

  console.log(JSON.stringify({
    totalActivities: report.totalActivities,
    totalCategories: report.totalCategories,
    newActivities: report.newActivities,
    sql: SQL_OUT,
    readme: README,
  }, null, 2));

  // Print per subject-folder totals
  const folderTotals = {};
  for (const [k, n] of Object.entries(counts)) {
    const [ks, sub] = k.split('/');
    const fk = `${ks}/${sub}`;
    folderTotals[fk] = (folderTotals[fk] || 0) + n;
  }
  console.log('\nCounts per key-stage/subject folder:');
  for (const ks of KEY_STAGES) {
    for (const sub of SUBJECTS_BY_KS[ks.id]) {
      const n = folderTotals[`${ks.id}/${sub}`] || 0;
      console.log(`  ${ks.label} › ${sub}: ${n}`);
    }
  }
}

main();
