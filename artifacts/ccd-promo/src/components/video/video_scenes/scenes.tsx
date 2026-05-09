import React from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/video/animations';
import {
  Backdrop,
  Cinematic,
  Eyebrow,
  GlassPanel,
  IdeaCard,
  MockupFrame,
  SceneChip,
  SceneLayout,
  Sub,
} from './_shared';

const TOTAL = 22;

const dashboardImg = `${import.meta.env.BASE_URL}screens/dashboard.jpg`;
const libraryImg = `${import.meta.env.BASE_URL}screens/library.jpg`;
const learnersImg = `${import.meta.env.BASE_URL}images/kids-learning.jpg`;

/* ------------------------------------------------------------------ *
 * 01 — WELCOME / HERO
 * ------------------------------------------------------------------ */
export function Scene01_Welcome() {
  return (
    <Backdrop tint="teal">
      <SceneChip index={1} total={TOTAL} />

      {/* Soft purple aurora wash so the dark "DESIGNER" text reads on the dark scene */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.55, 0.7] }}
        transition={{ duration: 2.4, times: [0, 0.4, 1], ease: 'easeOut' }}
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 52%, rgba(196,176,255,0.55), rgba(124,58,237,0.18) 45%, transparent 70%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[6cqmin] gap-[3cqmin]">
        {/* Hero logo: enters from soft blur + scale, then a gentle breathing glow loop */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.78, y: 18, filter: 'blur(14px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Pulsing halo behind the wordmark */}
          <motion.div
            className="absolute inset-0 -m-[6cqmin] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(closest-side, rgba(196,176,255,0.55), rgba(168,139,250,0.18) 55%, transparent 75%)',
              filter: 'blur(2cqmin)',
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: [0, 0.9, 0.7, 0.9], scale: [0.85, 1.04, 1, 1.04] }}
            transition={{ duration: 5.2, ease: 'easeInOut', times: [0, 0.25, 0.6, 1], delay: 0.3 }}
          />

          <motion.img
            src={`${import.meta.env.BASE_URL}ccdesigner-logo-light.png`}
            alt="CCDesigner"
            crossOrigin="anonymous"
            className="relative block w-auto"
            style={{
              height: 'clamp(140px, 26cqmax, 320px)',
              filter: 'drop-shadow(0 10px 40px rgba(168,139,250,0.55))',
            }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity, delay: 1.4 }}
          />

          {/* Light sweep across the wordmark */}
          <motion.div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{
              background:
                'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)',
            }}
            initial={{ x: '-110%', opacity: 0 }}
            animate={{ x: ['-110%', '110%'], opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.6, ease: 'easeInOut', delay: 1.5, times: [0, 0.5, 1] }}
          />
        </motion.div>

        {/* Tagline reveal */}
        <motion.div
          className="overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <motion.div
            className="text-white/80 font-body tracking-[0.32em] uppercase"
            style={{ fontSize: 'clamp(11px, 1.5cqmax, 22px)' }}
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 1.25 }}
          >
            A Creative Studio for Educators
          </motion.div>
        </motion.div>
      </div>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 02 — TEACHING IS CREATIVE WORK
 * ------------------------------------------------------------------ */
export function Scene02_TeacherCreativity() {
  return (
    <Backdrop tint="amber">
      <SceneChip index={2} total={TOTAL} />
      <div className="absolute inset-0">
        <img
          src={learnersImg}
          alt=""
          className="w-full h-full object-cover opacity-25 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
      </div>
      <div className="absolute inset-0 flex items-center px-[6cqmin]">
        <div className="flex flex-col gap-[2cqmin] max-w-[70cqw]">
          <Eyebrow tint="amber">A philosophy, first</Eyebrow>
          <Cinematic size="xl">
            <span>Teaching</span>
            <span>is</span>
            <span style={{ color: '#FBBF24' }}>creative work.</span>
          </Cinematic>
          <Sub delay={0.95}>
            Your ideas are valuable. Your practice should grow. Great teaching should never disappear into forgotten documents.
          </Sub>
        </div>
      </div>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 03 — NEVER LOSE A BRILLIANT IDEA
 * ------------------------------------------------------------------ */
export function Scene03_NeverLose() {
  // A storm of ideas falls from above, settling into a dense backdrop.
  // The "hero" cards — one per age range, EYFS through KS5 — emerge on top
  // to show the breadth of practice the archive holds.
  const tagPalette = ['#5EEAD4', '#FB7185', '#C084FC', '#FBBF24', '#7DD3FC', '#A5B4FC', '#F472B6', '#86EFAC'];

  // Deterministic pseudo-random so positions are stable across renders / recording
  const rand = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  // ~100 background "ghost" cards that fall and settle into a dense bed of practice
  const ghosts = Array.from({ length: 100 }).map((_, i) => {
    const left = rand(i + 1) * 96 + 2;
    const top = 28 + rand(i + 17) * 70;
    const rot = (rand(i + 31) - 0.5) * 24;
    const color = tagPalette[Math.floor(rand(i + 53) * tagPalette.length)];
    const w = 8 + rand(i + 71) * 6; // % width
    const fallDelay = rand(i + 91) * 1.8;
    return { left, top, rot, color, w, fallDelay, key: i };
  });

  // Hero cards — one per age range (EYFS through KS5) so the breadth is undeniable
  const heroes = [
    { tag: 'WARMUP',     title: 'Action songs to anchor circle time',  meta: 'EYFS · Music & Drama', color: '#5EEAD4', left: '14%', top: '46%', rot: -6 },
    { tag: 'IDEA',       title: 'Animal movement stories',             meta: 'KS1 · Dance',          color: '#86EFAC', left: '38%', top: '74%', rot: 4 },
    { tag: 'REHEARSAL',  title: 'Echo-and-respond rhythm circle',      meta: 'KS2 · Music',          color: '#FB7185', left: '64%', top: '44%', rot: 5 },
    { tag: 'IDEA',       title: 'Tableaux to explore character',       meta: 'KS3 · Drama',          color: '#C084FC', left: '86%', top: '70%', rot: -4 },
    { tag: 'DEVISING',   title: 'Devising from a stimulus image',      meta: 'GCSE Drama',           color: '#FBBF24', left: '24%', top: '82%', rot: 3 },
    { tag: 'COMPOSITION',title: 'Cunningham-style chance choreography',meta: 'A-Level · BTEC Dance', color: '#A5B4FC', left: '52%', top: '58%', rot: 0 },
  ];

  return (
    <Backdrop tint="indigo">
      <SceneChip index={3} total={TOTAL} />
      <div className="absolute inset-x-0 top-[8cqmin] flex flex-col items-center text-center px-[6cqmin] gap-[1.5cqmin] z-20">
        <Eyebrow tint="indigo" align="center">Your ideas, captured forever</Eyebrow>
        <Cinematic size="lg" align="center">
          <span>Never lose a brilliant idea.</span>
        </Cinematic>
      </div>

      {/* The storm: ~100 ideas falling from above, settling into a dense bed */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {ghosts.map((g) => (
          <motion.div
            key={`g-${g.key}`}
            className="absolute rounded-[0.8cqmin] border"
            style={{
              left: `${g.left}%`,
              top: `${g.top}%`,
              width: `${g.w}cqmin`,
              height: `${g.w * 0.65}cqmin`,
              background: `linear-gradient(135deg, ${g.color}22, ${g.color}08)`,
              borderColor: `${g.color}33`,
              boxShadow: `0 6px 14px -4px rgba(0,0,0,0.4)`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, y: '-120cqh', rotate: g.rot * 0.4 }}
            animate={{
              opacity: [0, 0.85, 0.18],
              y: ['-120cqh', '0cqh', '0cqh'],
              rotate: [g.rot * 0.4, g.rot, g.rot],
            }}
            transition={{
              duration: 2.4,
              times: [0, 0.55, 1],
              ease: ['circIn', 'circOut', 'linear'],
              delay: g.fallDelay,
            }}
          >
            {/* tiny tag dot + bar to imply real card content without text noise */}
            <div className="absolute top-[10%] left-[8%] right-[8%] flex items-center gap-[0.4cqmin]">
              <div className="rounded-full" style={{ width: '0.9cqmin', height: '0.9cqmin', background: g.color }} />
              <div className="rounded-full" style={{ height: '0.5cqmin', width: '60%', background: `${g.color}66` }} />
            </div>
            <div className="absolute bottom-[18%] left-[8%] right-[18%] rounded-full" style={{ height: '0.5cqmin', background: 'rgba(255,255,255,0.18)' }} />
            <div className="absolute bottom-[8%] left-[8%] right-[40%] rounded-full" style={{ height: '0.4cqmin', background: 'rgba(255,255,255,0.10)' }} />
          </motion.div>
        ))}
      </div>

      {/* Hero cards — one per age range, EYFS → KS5. Land last, sit on top, full opacity */}
      {heroes.map((c, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute z-10"
          style={{
            left: c.left,
            top: c.top,
            width: 'min(clamp(140px,19cqmax,300px), 38vw)',
          }}
          initial={{ opacity: 0, scale: 0.6, rotate: c.rot * 0.3, x: '-50%', y: 'calc(-50% - 80cqh)' }}
          animate={{ opacity: 1, scale: 1, rotate: c.rot, x: '-50%', y: '-50%' }}
          transition={{ ...springs.gentle, delay: 2.6 + i * 0.18 }}
        >
          <IdeaCard tag={c.tag} title={c.title} meta={c.meta} color={c.color} />
        </motion.div>
      ))}
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 04 — BUILD YOUR CREATIVE ARCHIVE
 * ------------------------------------------------------------------ */
export function Scene04_Archive() {
  const tags = ['Drama', 'Music', 'Dance', 'Cross-curricular', 'EYFS', 'KS1', 'KS2', 'KS3', 'Improvisation', 'Composition', 'Choreography', 'Voice', 'Movement', 'Reflection', 'Warmup', 'Plenary'];

  // 24 real activity cards — feels like a working creative archive, not empty boxes.
  type Card = { tag: string; title: string; meta: string; color: string };
  const cards: Card[] = [
    { tag: 'WARMUP',      title: 'Action songs to anchor circle time',  meta: 'EYFS · Music',           color: '#5EEAD4' },
    { tag: 'IDEA',        title: 'Animal movement stories',             meta: 'KS1 · Dance',            color: '#86EFAC' },
    { tag: 'VOICE',       title: 'Call-and-response rhythm circle',     meta: 'KS2 · Music',            color: '#FB7185' },
    { tag: 'DRAMA',       title: 'Tableaux to explore character',       meta: 'KS3 · Drama',            color: '#C084FC' },
    { tag: 'DEVISING',    title: 'Devising from a stimulus image',      meta: 'GCSE · Drama',           color: '#FBBF24' },
    { tag: 'COMPOSITION', title: 'Cunningham chance choreography',      meta: 'A-Level · Dance',        color: '#A5B4FC' },
    { tag: 'PLENARY',     title: 'Two stars and a wish reflection',     meta: 'KS2 · All',              color: '#7DD3FC' },
    { tag: 'WARMUP',      title: 'Pass the clap rhythm game',           meta: 'KS1 · Music',            color: '#F472B6' },
    { tag: 'IDEA',        title: 'Mirror partner movement',             meta: 'EYFS · Dance',           color: '#86EFAC' },
    { tag: 'REHEARSAL',   title: 'Status work — high & low',            meta: 'KS3 · Drama',            color: '#FB7185' },
    { tag: 'VOICE',       title: 'Body percussion warm-up sequence',    meta: 'KS2 · Music',            color: '#FBBF24' },
    { tag: 'CHOREO',      title: 'Motif development from 8 counts',     meta: 'KS3 · Dance',            color: '#A5B4FC' },
    { tag: 'IMPROV',      title: 'Yes-and storytelling circle',         meta: 'KS2 · Drama',            color: '#C084FC' },
    { tag: 'COMPOSITION', title: 'Graphic score listening task',        meta: 'KS3 · Music',            color: '#5EEAD4' },
    { tag: 'WARMUP',      title: 'Jelly-fish to skyscraper stretch',    meta: 'KS1 · Dance',            color: '#7DD3FC' },
    { tag: 'IDEA',        title: 'Soundscape for a setting',            meta: 'KS2 · Cross-curric.',    color: '#FBBF24' },
    { tag: 'REFLECTION',  title: 'Silent gallery walk + sticky notes',  meta: 'All · Plenary',          color: '#F472B6' },
    { tag: 'DRAMA',       title: 'Hot-seating in role',                 meta: 'KS2 · Literacy link',    color: '#C084FC' },
    { tag: 'DEVISING',    title: 'Verbatim from interview transcripts', meta: 'GCSE · Drama',           color: '#FB7185' },
    { tag: 'CHOREO',      title: 'Contact improvisation duet',          meta: 'A-Level · Dance',        color: '#86EFAC' },
    { tag: 'VOICE',       title: 'Diaphragm breathing & sirens',        meta: 'KS3 · Music',            color: '#5EEAD4' },
    { tag: 'IDEA',        title: 'Cross-curric: Tudor court masque',    meta: 'KS3 · History+Drama',    color: '#FBBF24' },
    { tag: 'WARMUP',      title: 'Zip-zap-boing focus game',            meta: 'KS2 · Drama',            color: '#A5B4FC' },
    { tag: 'PLENARY',     title: 'One word reflection passport',        meta: 'All · Plenary',          color: '#7DD3FC' },
  ];

  return (
    <Backdrop tint="plum">
      <SceneChip index={4} total={TOTAL} />
      <SceneLayout layout="left-text" visual={
        <div className="relative w-full h-[70cqh]">
          {cards.map((c, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const tilt = ((i * 37) % 7) - 3; // -3 to +3 deg
            return (
              <motion.div
                key={i}
                className="absolute rounded-[1cqmin] overflow-hidden flex flex-col justify-between"
                style={{
                  left: `${col * 25}%`,
                  top: `${row * 17}%`,
                  width: '22.5%',
                  height: '15%',
                  padding: '1cqmin 1.1cqmin',
                  background: `linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))`,
                  border: `1px solid ${c.color}30`,
                  boxShadow: `0 10px 26px -12px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.04)`,
                  transform: `rotate(${tilt * 0.25}deg)`,
                }}
                initial={{ opacity: 0, y: 26, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...springs.gentle, delay: 0.35 + i * 0.045 }}
              >
                {/* color rail */}
                <div
                  className="absolute left-0 top-0 bottom-0"
                  style={{ width: '0.4cqmin', background: c.color, opacity: 0.85 }}
                />
                <div className="flex items-center gap-[0.5cqmin]">
                  <span
                    className="font-display font-black tracking-[0.15em] uppercase"
                    style={{
                      fontSize: 'clamp(7px,0.85cqmax,11px)',
                      color: c.color,
                    }}
                  >
                    {c.tag}
                  </span>
                </div>
                <div
                  className="text-white/90 font-medium leading-[1.15]"
                  style={{
                    fontSize: 'clamp(8px,1.0cqmax,13px)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {c.title}
                </div>
                <div
                  className="text-white/45"
                  style={{ fontSize: 'clamp(6px,0.75cqmax,10px)' }}
                >
                  {c.meta}
                </div>
              </motion.div>
            );
          })}
        </div>
      }>
        <Eyebrow tint="plum">A library only you can build</Eyebrow>
        <Cinematic size="xl">
          <span>Build your</span>
          <span>creative</span>
          <span style={{ color: '#C084FC' }}>archive.</span>
        </Cinematic>
        <Sub delay={0.85}>
          Activities, rehearsal techniques, reflections, and warmups — preserved, tagged, and always within reach.
        </Sub>
        <motion.div
          className="flex flex-wrap gap-[0.8cqmin] mt-[1cqmin]"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 1.1 } } }}
        >
          {tags.map((t) => (
            <motion.span
              key={t}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: springs.snappy },
              }}
              className="px-[1.4cqmin] py-[0.6cqmin] rounded-full bg-white/[0.06] border border-white/10 text-white/70"
              style={{ fontSize: 'clamp(9px,1.1cqmax,14px)' }}
            >
              {t}
            </motion.span>
          ))}
        </motion.div>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 05 — CURRICULUM MAPPING (animated node web)
 * ------------------------------------------------------------------ */
export function Scene05_Mapping() {
  const nodes = [
    { x: 50, y: 50, label: 'Year', size: 18 },
    { x: 22, y: 28, label: 'Term 1', size: 12 },
    { x: 78, y: 28, label: 'Term 2', size: 12 },
    { x: 22, y: 72, label: 'Term 3', size: 12 },
    { x: 78, y: 72, label: 'Skills', size: 12 },
    { x: 8, y: 50, label: 'Voice', size: 10 },
    { x: 92, y: 50, label: 'Movement', size: 10 },
    { x: 50, y: 8, label: 'Composition', size: 10 },
    { x: 50, y: 92, label: 'Reflection', size: 10 },
  ];
  const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [4, 6], [2, 7], [3, 8]];
  return (
    <Backdrop tint="teal">
      <SceneChip index={5} total={TOTAL} />
      <SceneLayout layout="right-text" visual={
        <div className="relative w-full h-[70cqh]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {edges.map(([a, b], i) => (
              <motion.line
                key={i}
                x1={nodes[a].x}
                y1={nodes[a].y}
                x2={nodes[b].x}
                y2={nodes[b].y}
                stroke="#5EEAD4"
                strokeWidth="0.25"
                strokeOpacity="0.45"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: 'circOut', delay: 0.6 + i * 0.08 }}
              />
            ))}
          </svg>
          {nodes.map((n, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/[0.07] backdrop-blur-md border border-white/15 flex items-center justify-center text-white/85 font-medium"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                transform: 'translate(-50%,-50%)',
                width: `${n.size * 1.1}cqmin`,
                height: `${n.size * 1.1}cqmin`,
                fontSize: 'clamp(8px,1.1cqmax,14px)',
                boxShadow: '0 0 30px rgba(94,234,212,0.18)',
              }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springs.gentle, delay: 0.3 + i * 0.08 }}
            >
              {n.label}
            </motion.div>
          ))}
        </div>
      }>
        <Eyebrow tint="teal">Curriculum mapping</Eyebrow>
        <Cinematic size="xl">
          <span>Build connected</span>
          <span style={{ color: '#5EEAD4' }}>learning journeys.</span>
        </Cinematic>
        <Sub delay={0.85}>
          See how every lesson, skill, and outcome links across the year — and across subjects.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 06 — LESSON PLANNING (uses dashboard.jpg)
 * ------------------------------------------------------------------ */
export function Scene06_Planning() {
  return (
    <Backdrop tint="midnight">
      <SceneChip index={6} total={TOTAL} />
      <SceneLayout layout="left-text" visual={
        <motion.div
          initial={{ opacity: 0, y: 40, rotateY: -10, rotateX: 6 }}
          animate={{ opacity: 1, y: 0, rotateY: -6, rotateX: 4 }}
          transition={{ duration: 1.2, ease: 'circOut', delay: 0.5 }}
          style={{ transformPerspective: 1500 }}
        >
          <MockupFrame label="cd · lesson builder">
            <img src={dashboardImg} alt="Lesson dashboard" className="w-full block" />
          </MockupFrame>
        </motion.div>
      }>
        <Eyebrow tint="midnight">Plan with intention</Eyebrow>
        <Cinematic size="xl">
          <span>Rich lessons,</span>
          <span style={{ color: '#7DD3FC' }}>built in minutes.</span>
        </Cinematic>
        <Sub delay={0.85}>
          Drag activities into shape. Sequence with purpose. Save the structure — keep the soul.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 07 — DRAMA. DANCE. MUSIC.
 * ------------------------------------------------------------------ */
export function Scene07_ArtsFocus() {
  const arts = [
    {
      label: 'Drama',
      color: '#FB7185',
      subtitle: 'Improvise. Embody. Reflect.',
      tags: ['Hot-seating', 'Tableaux', 'Devising', 'Status work'],
      sample: 'Build empathy through role',
    },
    {
      label: 'Dance',
      color: '#C084FC',
      subtitle: 'Move. Phrase. Choreograph.',
      tags: ['Motif', 'Contact', 'Phrasing', 'Choreography'],
      sample: 'Develop 8-counts into a phrase',
    },
    {
      label: 'Music',
      color: '#5EEAD4',
      subtitle: 'Listen. Compose. Perform.',
      tags: ['Rhythm', 'Pitch', 'Composition', 'Ensemble'],
      sample: 'Body percussion to graphic score',
    },
  ];
  return (
    <Backdrop tint="rose">
      <SceneChip index={7} total={TOTAL} />
      <div className="absolute inset-0 flex flex-col justify-center px-[5cqmin] gap-[2.5cqmin]">
        <div className="flex flex-col gap-[1cqmin]">
          <Eyebrow tint="rose">Built for the arts</Eyebrow>
          <Cinematic size="xl">
            <span>Drama. Dance.</span>
            <span style={{ color: '#FB7185' }}>Music.</span>
          </Cinematic>
          <Sub delay={0.85}>
            Designed by performing-arts teachers, for the rituals, vocabularies and rehearsal practices of every discipline.
          </Sub>
        </div>
        <div className="grid grid-cols-1 landscape:grid-cols-3 gap-[1.5cqmin]">
          {arts.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 1.0 + i * 0.15 }}
              className="relative rounded-[1.4cqmin] overflow-hidden"
              style={{
                background: `linear-gradient(160deg, ${a.color}22, rgba(255,255,255,0.04) 60%)`,
                border: `1px solid ${a.color}55`,
                padding: '2cqmin',
                boxShadow: `0 20px 50px -20px ${a.color}55, inset 0 0 0 1px rgba(255,255,255,0.04)`,
              }}
            >
              {/* coloured glow blob */}
              <div
                className="absolute -top-[6cqmin] -right-[6cqmin] rounded-full pointer-events-none"
                style={{
                  width: '14cqmin',
                  height: '14cqmin',
                  background: `radial-gradient(circle, ${a.color}66, transparent 70%)`,
                  filter: 'blur(2cqmin)',
                }}
              />
              <div
                className="font-display font-black leading-[0.95]"
                style={{ color: a.color, fontSize: 'clamp(22px,3.6cqmax,48px)' }}
              >
                {a.label}
              </div>
              <div
                className="text-white/65 mt-[0.4cqmin]"
                style={{ fontSize: 'clamp(10px,1.25cqmax,16px)' }}
              >
                {a.subtitle}
              </div>
              <div className="flex flex-wrap gap-[0.5cqmin] mt-[1.2cqmin]">
                {a.tags.map((t, ti) => (
                  <motion.span
                    key={t}
                    className="px-[1cqmin] py-[0.35cqmin] rounded-full"
                    style={{
                      background: `${a.color}20`,
                      border: `1px solid ${a.color}55`,
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 'clamp(8px,0.95cqmax,12px)',
                    }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 + i * 0.15 + ti * 0.06 }}
                  >
                    {t}
                  </motion.span>
                ))}
              </div>
              <div
                className="mt-[1.2cqmin] flex items-center gap-[0.8cqmin] text-white/55"
                style={{ fontSize: 'clamp(9px,1.05cqmax,13px)' }}
              >
                <span
                  className="inline-block rounded-full"
                  style={{ width: '0.7cqmin', height: '0.7cqmin', background: a.color }}
                />
                <span className="italic">e.g. {a.sample}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 08 — CREATIVE LEARNING
 * ------------------------------------------------------------------ */
export function Scene08_Creative() {
  return (
    <Backdrop tint="amber">
      <SceneChip index={8} total={TOTAL} />
      <SceneLayout layout="centered">
        <Eyebrow tint="amber" align="center">Curiosity, by design</Eyebrow>
        <Cinematic size="2xl" align="center">
          <span>Encourage</span>
          <span style={{ color: '#FBBF24' }}>curiosity</span>
          <span>and imagination.</span>
        </Cinematic>
        <Sub align="center" delay={0.95}>
          Design moments of wonder, risk-taking, and play — woven into every learning sequence.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 09 — AI AS CREATIVE PARTNER
 * ------------------------------------------------------------------ */
export function Scene09_AI() {
  // Show AI as a real conversation: teacher asks, AI suggests practical options.
  const messages: Array<{ from: 'you' | 'ai'; text: string; tag?: string; delay: number }> = [
    { from: 'you', text: '15-min KS2 warmup that builds focus?', delay: 0.4 },
    { from: 'ai',  text: 'Try "Zip-zap-boing" → "1-2-3 mirror" → silent count-up to 20.', tag: 'Three options', delay: 1.2 },
    { from: 'you', text: 'Make one SEND-friendly, one stretch.', delay: 2.4 },
    { from: 'ai',  text: 'SEND: visual cue cards + paired calls. Stretch: pupils lead the round.', tag: 'Adapted', delay: 3.2 },
  ];
  return (
    <Backdrop tint="indigo">
      <SceneChip index={9} total={TOTAL} />
      <SceneLayout layout="right-text" visual={
        <div className="relative w-full h-[62cqh] flex items-center justify-center">
          {/* Soft halo behind the panel */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '60cqmin', height: '60cqmin',
              background: 'radial-gradient(closest-side, rgba(99,102,241,0.35), transparent 70%)',
              filter: 'blur(2cqmin)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...springs.gentle, delay: 0.2 }}
            className="relative w-[88%] max-w-[58cqmin] rounded-[1.4cqmin] backdrop-blur-md"
            style={{
              background: 'linear-gradient(160deg, rgba(30,27,75,0.85), rgba(15,23,42,0.85))',
              border: '1px solid rgba(165,180,252,0.25)',
              boxShadow: '0 30px 80px -20px rgba(99,102,241,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)',
              padding: '1.6cqmin',
            }}
          >
            {/* header */}
            <div className="flex items-center gap-[0.8cqmin] pb-[1cqmin] border-b border-white/10 mb-[1.2cqmin]">
              <div
                className="rounded-full flex items-center justify-center font-display font-black"
                style={{
                  width: 'clamp(20px,2.6cqmax,36px)',
                  height: 'clamp(20px,2.6cqmax,36px)',
                  background: 'radial-gradient(circle, #6366F1, #38BDF8)',
                  color: 'white',
                  fontSize: 'clamp(9px,1.1cqmax,14px)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.6)',
                }}
              >AI</div>
              <div>
                <div className="text-white/90 font-semibold leading-tight" style={{ fontSize: 'clamp(10px,1.2cqmax,15px)' }}>
                  Creative thinking partner
                </div>
                <div className="text-white/40" style={{ fontSize: 'clamp(8px,0.9cqmax,11px)' }}>
                  Suggests · never replaces
                </div>
              </div>
              <div className="ml-auto flex items-center gap-[0.4cqmin]">
                <span className="rounded-full bg-emerald-400" style={{ width: '0.6cqmin', height: '0.6cqmin' }} />
                <span className="text-emerald-300/80" style={{ fontSize: 'clamp(8px,0.9cqmax,11px)' }}>live</span>
              </div>
            </div>

            <div className="flex flex-col gap-[1cqmin]">
              {messages.map((m, i) => {
                const isAi = m.from === 'ai';
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.gentle, delay: m.delay }}
                    className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className="max-w-[88%] rounded-[1cqmin] px-[1.2cqmin] py-[0.8cqmin]"
                      style={{
                        background: isAi
                          ? 'linear-gradient(135deg, rgba(99,102,241,0.30), rgba(56,189,248,0.18))'
                          : 'rgba(255,255,255,0.06)',
                        border: isAi ? '1px solid rgba(165,180,252,0.45)' : '1px solid rgba(255,255,255,0.10)',
                        color: 'rgba(255,255,255,0.92)',
                        fontSize: 'clamp(9px,1.15cqmax,14px)',
                        lineHeight: 1.4,
                      }}
                    >
                      {m.tag && (
                        <div
                          className="font-display tracking-[0.15em] uppercase mb-[0.3cqmin]"
                          style={{ fontSize: 'clamp(7px,0.8cqmax,10px)', color: '#A5B4FC' }}
                        >
                          {m.tag}
                        </div>
                      )}
                      {m.text}
                    </div>
                  </motion.div>
                );
              })}

              {/* typing indicator */}
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 4, delay: 4.2, times: [0, 0.1, 0.85, 1] }}
              >
                <div
                  className="rounded-full px-[1cqmin] py-[0.6cqmin] flex items-center gap-[0.4cqmin]"
                  style={{
                    background: 'rgba(99,102,241,0.18)',
                    border: '1px solid rgba(165,180,252,0.35)',
                  }}
                >
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="rounded-full bg-white/80"
                      style={{ width: '0.6cqmin', height: '0.6cqmin' }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 4.2 + d * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      }>
        <Eyebrow tint="indigo">An assistant, not a replacement</Eyebrow>
        <Cinematic size="xl">
          <span>AI that</span>
          <span style={{ color: '#A5B4FC' }}>amplifies</span>
          <span>your thinking.</span>
        </Cinematic>
        <Sub delay={0.95}>
          A creative thinking partner — never a replacement for the teacher in the room.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 10 — ADAPTIVE PLANNING
 * ------------------------------------------------------------------ */
export function Scene10_Adaptive() {
  const variants = [
    { label: 'Core lesson',         tone: '#5EEAD4', detail: 'Tableaux to explore character motivations',                      meta: 'KS3 · 50 min' },
    { label: 'Stretch & challenge', tone: '#FBBF24', detail: '+ Subtext layering, role-on-the-wall extension',                  meta: 'GCSE-ready · 65 min' },
    { label: 'SEND adaptation',     tone: '#C084FC', detail: 'Visual cue cards · paired support · sensory-friendly pacing',     meta: 'Inclusion · 45 min' },
    { label: 'EAL scaffolds',       tone: '#7DD3FC', detail: 'Picture vocab bank · sentence stems · mother-tongue option',      meta: 'EAL · 50 min' },
  ];
  return (
    <Backdrop tint="teal">
      <SceneChip index={10} total={TOTAL} />
      <SceneLayout layout="left-text" visual={
        <div className="relative w-full flex flex-col gap-[1cqmin]">
          {/* connecting spine on the left so they read as branches off one source */}
          <div
            className="absolute left-[1.4cqmin] top-[2cqmin] bottom-[2cqmin] w-px"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(94,234,212,0.5), transparent)' }}
            aria-hidden
          />
          {variants.map((v, i) => (
            <motion.div
              key={v.label}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.gentle, delay: 0.4 + i * 0.18 }}
              className="relative pl-[3.2cqmin]"
            >
              {/* branch line into the card */}
              <div
                className="absolute left-[1.4cqmin] top-1/2 h-px"
                style={{ width: '1.6cqmin', background: `${v.tone}88` }}
                aria-hidden
              />
              <div
                className="rounded-[1.2cqmin] px-[1.6cqmin] py-[1.2cqmin] backdrop-blur-md"
                style={{
                  background: `linear-gradient(135deg, ${v.tone}1A, rgba(255,255,255,0.04))`,
                  border: `1px solid ${v.tone}55`,
                  boxShadow: `0 12px 30px -14px ${v.tone}55`,
                }}
              >
                <div className="flex items-center gap-[1cqmin]">
                  <div
                    className="rounded-full shrink-0"
                    style={{
                      width: 'clamp(8px,1.1cqmax,16px)',
                      height: 'clamp(8px,1.1cqmax,16px)',
                      background: v.tone,
                      boxShadow: `0 0 14px ${v.tone}`,
                    }}
                  />
                  <div
                    className="font-semibold"
                    style={{ color: v.tone, fontSize: 'clamp(12px,1.55cqmax,20px)' }}
                  >
                    {v.label}
                  </div>
                  <div className="flex-1" />
                  <div
                    className="font-mono px-[0.8cqmin] py-[0.2cqmin] rounded-full"
                    style={{
                      fontSize: 'clamp(8px,0.9cqmax,11px)',
                      color: v.tone,
                      background: `${v.tone}15`,
                      border: `1px solid ${v.tone}40`,
                    }}
                  >
                    {v.meta}
                  </div>
                </div>
                <div
                  className="text-white/75 mt-[0.5cqmin] leading-snug"
                  style={{ fontSize: 'clamp(9px,1.1cqmax,14px)' }}
                >
                  {v.detail}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      }>
        <Eyebrow tint="teal">Adaptive by design</Eyebrow>
        <Cinematic size="xl">
          <span>Adapt instantly</span>
          <span>for</span>
          <span style={{ color: '#5EEAD4' }}>different learners.</span>
        </Cinematic>
        <Sub delay={0.85}>
          One lesson, many pathways — generated and refined at the speed of the room.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 11 — SEND SUPPORT
 * ------------------------------------------------------------------ */
export function Scene11_SEND() {
  return (
    <Backdrop tint="rose">
      <SceneChip index={11} total={TOTAL} />
      <SceneLayout layout="centered">
        <Eyebrow tint="rose" align="center">Inclusion at the centre</Eyebrow>
        <Cinematic size="2xl" align="center">
          <span>Support every child</span>
          <span style={{ color: '#FB7185' }}>meaningfully.</span>
        </Cinematic>
        <Sub align="center" delay={0.95}>
          Sensory considerations, communication scaffolds, and movement-friendly options — built into the planning surface.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 12 — STRETCH & CHALLENGE
 * ------------------------------------------------------------------ */
export function Scene12_Stretch() {
  return (
    <Backdrop tint="amber">
      <SceneChip index={12} total={TOTAL} />
      <SceneLayout layout="right-text" visual={
        <div className="relative w-full h-[55cqh] flex items-end justify-center gap-[1cqmin]">
          {[28, 42, 58, 72, 88].map((h, i) => (
            <motion.div
              key={i}
              className="rounded-t-[1cqmin] flex-1 max-w-[8cqmax]"
              style={{
                background: `linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)`,
                boxShadow: '0 0 30px rgba(251,191,36,0.4)',
              }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${h}%`, opacity: 1 }}
              transition={{ duration: 0.9, ease: 'circOut', delay: 0.5 + i * 0.12 }}
            />
          ))}
        </div>
      }>
        <Eyebrow tint="amber">Depth, not speed</Eyebrow>
        <Cinematic size="xl">
          <span>Create</span>
          <span style={{ color: '#FBBF24' }}>deeper</span>
          <span>learning opportunities.</span>
        </Cinematic>
        <Sub delay={0.85}>
          Stretch tasks, metacognitive prompts, and challenge layers — woven naturally through every lesson.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 13 — CROSS-CURRICULAR
 * ------------------------------------------------------------------ */
export function Scene13_CrossCurricular() {
  const rings = [
    { color: '#5EEAD4', label: 'Drama', x: -8 },
    { color: '#C084FC', label: 'English', x: 0 },
    { color: '#FBBF24', label: 'History', x: 8 },
  ];
  return (
    <Backdrop tint="plum">
      <SceneChip index={13} total={TOTAL} />
      <SceneLayout layout="left-text" visual={
        <div className="relative w-full h-[60cqh] flex items-center justify-center">
          {rings.map((r, i) => (
            <motion.div
              key={r.label}
              className="absolute rounded-full border-2 flex items-center justify-center text-white/85 font-semibold"
              style={{
                width: 'clamp(120px,28cqmax,400px)',
                height: 'clamp(120px,28cqmax,400px)',
                borderColor: r.color,
                background: `${r.color}15`,
                left: `calc(50% + ${r.x}cqmax)`,
                top: '50%',
                transform: 'translate(-50%,-50%)',
                fontSize: 'clamp(14px,2cqmax,28px)',
                boxShadow: `0 0 40px ${r.color}55, inset 0 0 30px ${r.color}25`,
                mixBlendMode: 'screen',
              }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springs.gentle, delay: 0.4 + i * 0.18 }}
            >
              <span className="absolute" style={{ transform: `translateX(${(i - 1) * 18}cqmax)` }}>
                {r.label}
              </span>
            </motion.div>
          ))}
        </div>
      }>
        <Eyebrow tint="plum">One thread, many subjects</Eyebrow>
        <Cinematic size="xl">
          <span>Connect</span>
          <span style={{ color: '#C084FC' }}>subjects</span>
          <span>naturally.</span>
        </Cinematic>
        <Sub delay={0.85}>
          A single creative thread can run through drama, literacy, history, and beyond — designed deliberately, not by accident.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 14 — REFLECT. ADAPT. IMPROVE.
 * ------------------------------------------------------------------ */
export function Scene14_Reflect() {
  const steps = ['Teach', 'Reflect', 'Adapt', 'Refine'];
  return (
    <Backdrop tint="teal">
      <SceneChip index={14} total={TOTAL} />
      <SceneLayout layout="right-text" visual={
        <div className="relative w-full h-[55cqh] flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="absolute w-[80%] h-[80%]" preserveAspectRatio="xMidYMid meet">
            <motion.circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="#5EEAD4"
              strokeWidth="1"
              strokeDasharray="4 6"
              initial={{ pathLength: 0, rotate: -90 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: 'circOut', delay: 0.3 }}
              style={{ transformOrigin: 'center' }}
            />
          </svg>
          {steps.map((s, i) => {
            const angle = (i / steps.length) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const r = 22;
            return (
              <motion.div
                key={s}
                className="absolute rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 font-semibold"
                style={{
                  width: 'clamp(44px,7.5cqmax,100px)',
                  height: 'clamp(44px,7.5cqmax,100px)',
                  left: `calc(50% + ${Math.cos(rad) * r}cqmin)`,
                  top: `calc(50% + ${Math.sin(rad) * r}cqmin)`,
                  transform: 'translate(-50%,-50%)',
                  fontSize: 'clamp(11px,1.5cqmax,20px)',
                  boxShadow: '0 0 30px rgba(94,234,212,0.25)',
                }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.gentle, delay: 0.6 + i * 0.18 }}
              >
                {s}
              </motion.div>
            );
          })}
        </div>
      }>
        <Eyebrow tint="teal">A loop, not a line</Eyebrow>
        <Cinematic size="xl">
          <span>Reflect.</span>
          <span>Adapt.</span>
          <span style={{ color: '#5EEAD4' }}>Improve.</span>
        </Cinematic>
        <Sub delay={1.0}>
          Capture what worked. Refine what didn't. Each lesson becomes the seed of the next.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 15 — SKILLS PROGRESSION
 * ------------------------------------------------------------------ */
export function Scene15_Progression() {
  return (
    <Backdrop tint="indigo">
      <SceneChip index={15} total={TOTAL} />
      <SceneLayout layout="left-text" visual={
        <GlassPanel className="p-[2cqmin]">
          <div className="text-white/55 mb-[1.2cqmin] font-mono uppercase tracking-wider" style={{ fontSize: 'clamp(9px,1.1cqmax,14px)' }}>
            Skill · Ensemble Performance
          </div>
          <div className="relative h-[28cqh]">
            <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <motion.path
                d="M0,42 C18,40 24,30 38,28 C52,26 60,18 74,12 C84,8 92,6 100,4"
                fill="none"
                stroke="#A5B4FC"
                strokeWidth="0.6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, ease: 'circOut', delay: 0.4 }}
              />
              <motion.path
                d="M0,42 C18,40 24,30 38,28 C52,26 60,18 74,12 C84,8 92,6 100,4 L100,50 L0,50 Z"
                fill="url(#progGrad)"
                opacity="0.35"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                transition={{ duration: 0.8, delay: 1.4 }}
              />
              <defs>
                <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A5B4FC" />
                  <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-white/40 font-mono" style={{ fontSize: 'clamp(8px,1cqmax,12px)' }}>
              {['Aut1', 'Aut2', 'Spr1', 'Spr2', 'Sum1', 'Sum2'].map((t) => <span key={t}>{t}</span>)}
            </div>
          </div>
        </GlassPanel>
      }>
        <Eyebrow tint="indigo">Skills, sequenced</Eyebrow>
        <Cinematic size="xl">
          <span>Track</span>
          <span style={{ color: '#A5B4FC' }}>growth</span>
          <span>over time.</span>
        </Cinematic>
        <Sub delay={0.85}>
          Each skill builds on the last. Progress becomes visible — not assumed.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 16 — KNOWLEDGE SEQUENCING
 * ------------------------------------------------------------------ */
export function Scene16_Sequencing() {
  const blocks = ['Foundation', 'Vocabulary', 'Technique', 'Application', 'Mastery'];
  return (
    <Backdrop tint="midnight">
      <SceneChip index={16} total={TOTAL} />
      <SceneLayout layout="right-text" visual={
        <div className="relative w-full flex flex-col gap-[0.8cqmin]">
          {blocks.map((b, i) => (
            <motion.div
              key={b}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.gentle, delay: 0.4 + i * 0.16 }}
              className="rounded-[1cqmin] border border-white/10 px-[2cqmin] py-[1.4cqmin] flex items-center gap-[1.5cqmin]"
              style={{
                background: `linear-gradient(90deg, rgba(125,211,252,${0.08 + i * 0.03}), rgba(125,211,252,0.02))`,
                marginLeft: `${i * 4}%`,
                width: `${100 - i * 4}%`,
              }}
            >
              <div
                className="rounded-full font-mono text-[#0a1428] font-bold flex items-center justify-center"
                style={{
                  width: 'clamp(20px,2.6cqmax,40px)',
                  height: 'clamp(20px,2.6cqmax,40px)',
                  background: '#7DD3FC',
                  fontSize: 'clamp(10px,1.3cqmax,16px)',
                }}
              >
                {i + 1}
              </div>
              <span className="text-white/85 font-semibold" style={{ fontSize: 'clamp(12px,1.6cqmax,22px)' }}>
                {b}
              </span>
            </motion.div>
          ))}
        </div>
      }>
        <Eyebrow tint="midnight">Knowledge, on purpose</Eyebrow>
        <Cinematic size="xl">
          <span>Build knowledge</span>
          <span style={{ color: '#7DD3FC' }}>intentionally.</span>
        </Cinematic>
        <Sub delay={0.85}>
          Sequence what matters. Layer concepts so they hold. Nothing important left to chance.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 17 — INSPIRATION THAT GROWS WITH YOU
 * ------------------------------------------------------------------ */
export function Scene17_Inspiration() {
  // A real "remix" diagram: ONE old idea grows up into branches that become
  // labelled new lessons and units. Card-style nodes so the meaning is concrete.
  type N = { x: number; y: number; tag: 'old' | 'mid' | 'new'; title: string; meta?: string };
  const nodes: N[] = [
    { x: 50, y: 86, tag: 'old', title: 'Tableaux to explore character', meta: 'KS3 · Drama · 2024' },
    { x: 28, y: 58, tag: 'mid', title: 'Add subtext layering',           meta: 'remix' },
    { x: 72, y: 58, tag: 'mid', title: 'Move to physical theatre',       meta: 'remix' },
    { x: 14, y: 28, tag: 'new', title: 'GCSE devising warm-up',          meta: 'New lesson' },
    { x: 38, y: 16, tag: 'new', title: 'Subtext mini-unit',              meta: 'New unit · 3 lessons' },
    { x: 64, y: 16, tag: 'new', title: 'KS2 movement story',             meta: 'New lesson' },
    { x: 86, y: 28, tag: 'new', title: 'Tudor masque',                   meta: 'New unit · cross-curric.' },
  ];
  const edges: Array<[number, number, number]> = [
    [0, 1, 0.0], [0, 2, 0.0],
    [1, 3, 0.25], [1, 4, 0.25],
    [2, 5, 0.4],  [2, 6, 0.4],
  ];
  const styleFor = (tag: N['tag']) => ({
    bg:      tag === 'old' ? 'rgba(251,146,60,0.18)' : tag === 'mid' ? 'rgba(251,191,36,0.14)' : 'rgba(253,224,71,0.18)',
    border:  tag === 'old' ? '#FB923C'                 : tag === 'mid' ? '#FBBF24'                 : '#FDE68A',
    label:   tag === 'old' ? '#FED7AA'                 : tag === 'mid' ? '#FDE68A'                 : '#FFFFFF',
    halo:    tag === 'old' ? 'rgba(251,146,60,0.55)'   : tag === 'mid' ? 'rgba(251,191,36,0.45)'   : 'rgba(253,224,71,0.55)',
  });
  return (
    <Backdrop tint="amber">
      <SceneChip index={17} total={TOTAL} />
      <SceneLayout layout="left-text" visual={
        <div className="relative w-full h-[64cqh]">
          {/* Branches drawn first (under the cards) */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="branchGlow" x1="0" y1="100%" x2="0" y2="0%">
                <stop offset="0%" stopColor="#FB923C" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            {edges.map(([a, b, dly], i) => {
              const A = nodes[a], B = nodes[b];
              // gentle curve via control point pulled toward the source
              const cx = (A.x + B.x) / 2;
              const cy = (A.y + B.y) / 2 + 6;
              return (
                <motion.path
                  key={i}
                  d={`M${A.x},${A.y} Q${cx},${cy} ${B.x},${B.y}`}
                  stroke="url(#branchGlow)"
                  strokeWidth="0.7"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.0, ease: 'circOut', delay: 0.5 + dly }}
                />
              );
            })}
          </svg>

          {nodes.map((n, i) => {
            const s = styleFor(n.tag);
            const widthCq = n.tag === 'old' ? 22 : n.tag === 'new' ? 18 : 18;
            return (
              <motion.div
                key={i}
                className="absolute rounded-[1cqmin] backdrop-blur-md"
                style={{
                  left: `${n.x}%`,
                  top: `${n.y}%`,
                  transform: 'translate(-50%,-50%)',
                  width: `${widthCq}cqmin`,
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  boxShadow: `0 0 22px ${s.halo}, 0 12px 28px -12px rgba(0,0,0,0.4)`,
                  padding: '0.8cqmin 1cqmin',
                }}
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.3 + i * 0.18 }}
              >
                <div
                  className="font-display tracking-[0.18em] uppercase"
                  style={{ fontSize: 'clamp(6px,0.75cqmax,9px)', color: s.label, opacity: 0.85 }}
                >
                  {n.meta}
                </div>
                <div
                  className="text-white/95 font-medium leading-[1.15] mt-[0.2cqmin]"
                  style={{ fontSize: 'clamp(8px,1.0cqmax,12px)' }}
                >
                  {n.title}
                </div>
              </motion.div>
            );
          })}

          {/* travelling spark along one of the branches to imply ideas flowing upward */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '1.2cqmin', height: '1.2cqmin',
              background: 'radial-gradient(circle, #FFFFFF, #FDE68A 60%, transparent 75%)',
              boxShadow: '0 0 12px #FDE68A',
              left: '50%',
              top: '86%',
            }}
            animate={{
              left:  ['50%', '28%', '14%'],
              top:   ['86%', '58%', '28%'],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 2.0, ease: 'easeInOut' }}
          />
        </div>
      }>
        <Eyebrow tint="amber">Remix, don't restart</Eyebrow>
        <Cinematic size="xl">
          <span>Inspiration</span>
          <span>that</span>
          <span style={{ color: '#FBBF24' }}>grows with you.</span>
        </Cinematic>
        <Sub delay={0.85}>
          Old ideas reconnect into new lessons. Your past teaching becomes the soil for what's next.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 18 — POWERED BY CREATIVE COMMUNITIES
 * ------------------------------------------------------------------ */
export function Scene18_Community() {
  const orgs = [
    { label: 'Theatre companies', color: '#FB7185', count: '142', kind: 'sharing rehearsal toolkits' },
    { label: 'Orchestras',        color: '#5EEAD4', count: '38',  kind: 'composition + listening' },
    { label: 'Dance companies',   color: '#C084FC', count: '67',  kind: 'choreographic warm-ups' },
    { label: 'Universities',      color: '#FBBF24', count: '24',  kind: 'PGCE + research' },
    { label: 'Outreach teams',    color: '#7DD3FC', count: '91',  kind: 'community workshops' },
  ];
  return (
    <Backdrop tint="plum">
      <SceneChip index={18} total={TOTAL} />
      <SceneLayout layout="right-text" visual={
        <div className="relative w-full h-[64cqh] flex items-center justify-center">
          {/* orbit ring */}
          <motion.div
            className="absolute rounded-full border"
            style={{
              width: '54cqmin', height: '54cqmin',
              borderColor: 'rgba(192,132,252,0.25)',
              borderStyle: 'dashed',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 60, ease: 'linear', repeat: Infinity }}
          />
          <motion.div
            className="absolute rounded-full border border-white/5"
            style={{ width: '40cqmin', height: '40cqmin' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 80, ease: 'linear', repeat: Infinity }}
          />

          {/* Connecting lines from centre to each org */}
          <svg viewBox="-50 -50 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            {orgs.map((o, i) => {
              const angle = (i / orgs.length) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const r = 27;
              return (
                <motion.line
                  key={o.label}
                  x1={0} y1={0}
                  x2={Math.cos(rad) * r}
                  y2={Math.sin(rad) * r}
                  stroke={o.color}
                  strokeOpacity="0.5"
                  strokeWidth="0.3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: 'circOut', delay: 0.4 + i * 0.1 }}
                />
              );
            })}
          </svg>

          {/* Pulse rings flowing INTO the centre to show contributions */}
          {orgs.map((o, i) => {
            const angle = (i / orgs.length) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const r = 27;
            return (
              <motion.div
                key={`pulse-${o.label}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: '1.2cqmin', height: '1.2cqmin',
                  background: o.color,
                  boxShadow: `0 0 14px ${o.color}`,
                  left: '50%', top: '50%',
                }}
                initial={{ x: Math.cos(rad) * r * 4, y: Math.sin(rad) * r * 4, opacity: 0 }}
                animate={{
                  x: [Math.cos(rad) * r * 4, 0],
                  y: [Math.sin(rad) * r * 4, 0],
                  opacity: [0, 1, 0],
                  scale: [1, 0.4],
                }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 1.5 + i * 0.4, ease: 'easeIn' }}
              />
            );
          })}

          {/* Centre: CC mark logo as the heart of the ecosystem */}
          <motion.div
            className="absolute rounded-full flex items-center justify-center overflow-hidden"
            style={{
              width: 'clamp(96px,18cqmax,220px)',
              height: 'clamp(96px,18cqmax,220px)',
              background: 'radial-gradient(circle, rgba(196,176,255,0.40), rgba(124,58,237,0.12) 55%, transparent 75%)',
              boxShadow: '0 0 80px rgba(168,139,250,0.55)',
            }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [0.7, 1, 1.04, 1], opacity: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
          >
            <img
              src={`${import.meta.env.BASE_URL}ccdesigner-logo-light.png`}
              alt="CCDesigner"
              crossOrigin="anonymous"
              className="block"
              style={{
                width: '72%',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 16px rgba(168,139,250,0.6))',
              }}
            />
          </motion.div>

          {/* Org cards orbiting */}
          {orgs.map((o, i) => {
            const angle = (i / orgs.length) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const r = 27;
            return (
              <motion.div
                key={o.label}
                className="absolute rounded-[1cqmin] backdrop-blur-md text-center"
                style={{
                  left: `calc(50% + ${Math.cos(rad) * r}cqmin)`,
                  top: `calc(50% + ${Math.sin(rad) * r}cqmin)`,
                  transform: 'translate(-50%,-50%)',
                  background: `linear-gradient(135deg, ${o.color}28, rgba(255,255,255,0.04))`,
                  border: `1px solid ${o.color}66`,
                  boxShadow: `0 0 24px ${o.color}33, 0 14px 30px -12px rgba(0,0,0,0.45)`,
                  padding: '1cqmin 1.2cqmin',
                  minWidth: '14cqmin',
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.gentle, delay: 0.6 + i * 0.13 }}
              >
                <div className="flex items-center justify-center gap-[0.5cqmin]">
                  <span
                    className="rounded-full inline-block"
                    style={{ width: '0.7cqmin', height: '0.7cqmin', background: o.color }}
                  />
                  <span
                    className="font-mono"
                    style={{ color: o.color, fontSize: 'clamp(9px,1.1cqmax,14px)' }}
                  >
                    {o.count}
                  </span>
                </div>
                <div
                  className="text-white/95 font-semibold leading-tight mt-[0.2cqmin]"
                  style={{ fontSize: 'clamp(9px,1.15cqmax,15px)' }}
                >
                  {o.label}
                </div>
                <div
                  className="text-white/55 italic leading-tight mt-[0.1cqmin]"
                  style={{ fontSize: 'clamp(7px,0.85cqmax,11px)' }}
                >
                  {o.kind}
                </div>
              </motion.div>
            );
          })}
        </div>
      }>
        <Eyebrow tint="plum">A growing ecosystem</Eyebrow>
        <Cinematic size="xl">
          <span>Powered by</span>
          <span style={{ color: '#C084FC' }}>creative</span>
          <span>communities.</span>
        </Cinematic>
        <Sub delay={0.95}>
          Theatres, orchestras, dance companies, universities and outreach teams — all contributing to a shared, evolving ecosystem of creative practice. Free to use, made together.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 19 — VISUAL CURRICULUM DESIGN (uses library.jpg)
 * ------------------------------------------------------------------ */
export function Scene19_VisualMap() {
  return (
    <Backdrop tint="midnight">
      <SceneChip index={19} total={TOTAL} />
      <SceneLayout layout="right-text" visual={
        <motion.div
          initial={{ opacity: 0, y: 40, rotateY: 8, rotateX: 4 }}
          animate={{ opacity: 1, y: 0, rotateY: 5, rotateX: 3 }}
          transition={{ duration: 1.2, ease: 'circOut', delay: 0.5 }}
          style={{ transformPerspective: 1500 }}
        >
          <MockupFrame label="cd · activity library">
            <img src={libraryImg} alt="Activity library" className="w-full block" />
          </MockupFrame>
        </motion.div>
      }>
        <Eyebrow tint="midnight">Bigger picture, on demand</Eyebrow>
        <Cinematic size="xl">
          <span>See the</span>
          <span style={{ color: '#7DD3FC' }}>bigger</span>
          <span>learning picture.</span>
        </Cinematic>
        <Sub delay={0.85}>
          Zoom from a single activity to a whole-school view — and back again — without losing context.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 20 — PRESENTATION & EXPORT
 * ------------------------------------------------------------------ */
export function Scene20_Export() {
  return (
    <Backdrop tint="teal">
      <SceneChip index={20} total={TOTAL} />
      <SceneLayout layout="left-text" visual={
        <div className="relative w-full h-[65cqh] flex items-center justify-center">
          {[2, 1, 0].map((offset) => (
            <motion.div
              key={offset}
              className="absolute rounded-[1.2cqmin] bg-white border border-white/20"
              style={{
                width: 'clamp(140px,28cqmax,360px)',
                aspectRatio: '8.5 / 11',
                boxShadow: '0 30px 60px -10px rgba(0,0,0,0.6)',
              }}
              initial={{ opacity: 0, y: 60, x: 0, rotate: 0 }}
              animate={{
                opacity: offset === 0 ? 1 : 0.85 - offset * 0.18,
                y: -offset * 12,
                x: offset * -16,
                rotate: -offset * 4,
              }}
              transition={{ ...springs.gentle, delay: 0.4 + (2 - offset) * 0.15 }}
            >
              <div className="p-[2cqmin]">
                <div className="h-[1.2cqmin] w-[60%] bg-[#0f2a2e] rounded mb-[1.2cqmin]" />
                <div className="h-[0.6cqmin] w-[80%] bg-gray-200 rounded mb-[0.5cqmin]" />
                <div className="h-[0.6cqmin] w-[70%] bg-gray-200 rounded mb-[0.5cqmin]" />
                <div className="h-[0.6cqmin] w-[75%] bg-gray-200 rounded mb-[1.5cqmin]" />
                <div className="h-[8cqmin] w-full bg-gradient-to-br from-[#5EEAD4]/20 to-[#14B8A6]/10 rounded" />
                <div className="mt-[1.2cqmin] h-[0.6cqmin] w-[85%] bg-gray-200 rounded mb-[0.5cqmin]" />
                <div className="h-[0.6cqmin] w-[65%] bg-gray-200 rounded" />
              </div>
            </motion.div>
          ))}
        </div>
      }>
        <Eyebrow tint="teal">Share with confidence</Eyebrow>
        <Cinematic size="xl">
          <span>Beautiful,</span>
          <span style={{ color: '#5EEAD4' }}>professional</span>
          <span>plans.</span>
        </Cinematic>
        <Sub delay={0.85}>
          Export, print, present — for parents, leadership, inspections, and the staffroom wall.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 21 — MOBILE WORKFLOW
 * ------------------------------------------------------------------ */
export function Scene21_Mobile() {
  return (
    <Backdrop tint="indigo">
      <SceneChip index={21} total={TOTAL} />
      <SceneLayout layout="right-text" visual={
        <div className="relative w-full h-[65cqh] flex items-center justify-center">
          <motion.div
            className="rounded-[3cqmin] bg-[#0a1014] border border-white/10 overflow-hidden"
            style={{
              width: 'clamp(140px,22cqmax,300px)',
              aspectRatio: '9/19',
              boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.3)',
            }}
            initial={{ opacity: 0, y: 40, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 1, ease: 'circOut', delay: 0.4 }}
          >
            <div className="p-[1.5cqmin]">
              <div className="h-[1.4cqmin] w-[40%] bg-white/30 rounded-full mb-[1cqmin]" />
              <div className="h-[1cqmin] w-[70%] bg-white/15 rounded-full mb-[2cqmin]" />
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[3cqmin] rounded-[0.6cqmin] mb-[0.8cqmin]"
                  style={{
                    background: `linear-gradient(90deg, rgba(165,180,252,${0.20 - i * 0.04}), rgba(165,180,252,0.05))`,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      }>
        <Eyebrow tint="indigo">Plan from the rehearsal room</Eyebrow>
        <Cinematic size="xl">
          <span>Plan</span>
          <span style={{ color: '#A5B4FC' }}>anywhere.</span>
        </Cinematic>
        <Sub delay={0.85}>
          Fully responsive on phone, tablet, and laptop — capture an idea the moment it lands.
        </Sub>
      </SceneLayout>
    </Backdrop>
  );
}

/* ------------------------------------------------------------------ *
 * 22 — FUTURE / OUTRO + CTA
 * ------------------------------------------------------------------ */
export function Scene22_Future() {
  return (
    <Backdrop tint="teal">
      <SceneChip index={22} total={TOTAL} />

      {/* Aurora wash so the wordmark reads on the dark teal backdrop */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.55, 0.75] }}
        transition={{ duration: 2.6, times: [0, 0.4, 1], ease: 'easeOut' }}
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 48%, rgba(196,176,255,0.55), rgba(124,58,237,0.18) 45%, transparent 72%)',
        }}
      />

      {/* Soft floating particles to give the outro motion */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => {
          const left = (i * 73) % 100;
          const delay = (i % 7) * 0.4;
          const size = 0.4 + ((i * 31) % 10) / 10;
          return (
            <motion.div
              key={`p-${i}`}
              className="absolute rounded-full bg-white/60"
              style={{
                left: `${left}%`,
                bottom: '-2cqmin',
                width: `${size}cqmin`,
                height: `${size}cqmin`,
                filter: 'blur(0.4cqmin)',
              }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: '-110cqh', opacity: [0, 0.8, 0] }}
              transition={{ duration: 7 + (i % 4), ease: 'linear', delay, repeat: Infinity }}
            />
          );
        })}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[6cqmin] gap-[3cqmin]">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'circOut', delay: 0.2 }}
          className="text-white/65 font-body tracking-[0.32em] uppercase"
          style={{ fontSize: 'clamp(10px, 1.3cqmax, 18px)' }}
        >
          The future of curriculum design
        </motion.div>

        {/* Hero outro logo */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.82, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        >
          {/* Halo */}
          <motion.div
            className="absolute inset-0 -m-[6cqmin] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(closest-side, rgba(196,176,255,0.6), rgba(168,139,250,0.18) 55%, transparent 75%)',
              filter: 'blur(2cqmin)',
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: [0, 0.9, 0.65, 0.9], scale: [0.85, 1.05, 1, 1.05] }}
            transition={{ duration: 5.5, ease: 'easeInOut', times: [0, 0.25, 0.6, 1], delay: 0.6 }}
          />

          <motion.img
            src={`${import.meta.env.BASE_URL}ccdesigner-logo-light.png`}
            alt="CCDesigner"
            crossOrigin="anonymous"
            className="relative block w-auto"
            style={{
              height: 'clamp(130px, 24cqmax, 300px)',
              filter: 'drop-shadow(0 10px 40px rgba(168,139,250,0.55))',
            }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity, delay: 1.6 }}
          />

          {/* Light sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{
              background:
                'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)',
            }}
            initial={{ x: '-110%', opacity: 0 }}
            animate={{ x: ['-110%', '110%'], opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.8, ease: 'easeInOut', delay: 1.7, times: [0, 0.5, 1] }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'circOut', delay: 1.6 }}
          className="text-white/80 font-body max-w-[60cqw]"
          style={{ fontSize: 'clamp(12px, 1.5cqmax, 22px)', lineHeight: 1.5 }}
        >
          Built with educators. Powered by your creativity.<br />
          Where creative teaching ideas <span style={{ color: '#C4B0FF' }}>live, evolve and grow.</span>
        </motion.div>

        <motion.div
          className="inline-flex items-center gap-[1.5cqmin] px-[3cqmin] py-[1.4cqmin] rounded-full text-white font-bold"
          style={{
            background: 'linear-gradient(135deg,#A78BFA,#7C3AED)',
            boxShadow: '0 0 60px rgba(168,139,250,0.5), 0 20px 40px -10px rgba(0,0,0,0.5)',
            fontSize: 'clamp(13px,1.7cqmax,22px)',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...springs.bouncy, delay: 2.2 }}
        >
          Join the creative ecosystem
          <span style={{ fontSize: '1.1em' }}>→</span>
        </motion.div>
      </div>
    </Backdrop>
  );
}

export const SCENES = {
  s01_welcome: Scene01_Welcome,
  s02_creativeWork: Scene02_TeacherCreativity,
  s03_neverLose: Scene03_NeverLose,
  s04_archive: Scene04_Archive,
  s05_mapping: Scene05_Mapping,
  s06_planning: Scene06_Planning,
  s07_arts: Scene07_ArtsFocus,
  s08_creative: Scene08_Creative,
  s09_ai: Scene09_AI,
  s10_adaptive: Scene10_Adaptive,
  s11_send: Scene11_SEND,
  s12_stretch: Scene12_Stretch,
  s13_crossCurric: Scene13_CrossCurricular,
  s14_reflect: Scene14_Reflect,
  s15_progression: Scene15_Progression,
  s16_sequencing: Scene16_Sequencing,
  s17_inspiration: Scene17_Inspiration,
  s18_community: Scene18_Community,
  s19_visualMap: Scene19_VisualMap,
  s20_export: Scene20_Export,
  s21_mobile: Scene21_Mobile,
  s22_future: Scene22_Future,
} as const;
