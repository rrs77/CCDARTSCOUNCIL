import React from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/video/animations';
import {
  Backdrop,
  Cinematic,
  CornerBrand,
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
      <CornerBrand />
      <SceneChip index={1} total={TOTAL} />
      <SceneLayout layout="centered">
        <Eyebrow tint="teal" align="center">A Creative Studio for Educators</Eyebrow>
        <Cinematic size="2xl" align="center">
          <span>Design learning</span>
          <span style={{ color: '#5EEAD4' }}>that inspires.</span>
        </Cinematic>
        <Sub align="center" delay={0.9}>
          A living workspace where great teaching ideas live, evolve, and grow — for every child, every classroom, every season of the year.
        </Sub>
      </SceneLayout>
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
  // Headline anchored top; cards float in lower portion so they never collide.
  // Positions are CENTER points (we translate -50% so each card stays anchored
  // around its anchor, preventing right-edge overflow on narrow viewports).
  const cards = [
    { tag: 'WARMUP', title: 'Mirror games to build ensemble focus', meta: 'Year 5 · Drama', color: '#5EEAD4', left: '16%', top: '52%', rot: -5 },
    { tag: 'REHEARSAL', title: 'Echo-and-respond rhythm circle', meta: 'KS2 · Music', color: '#FB7185', left: '82%', top: '48%', rot: 5 },
    { tag: 'IDEA', title: 'Tableaux to explore character motivation', meta: 'Year 7 · Drama', color: '#C084FC', left: '28%', top: '78%', rot: 3 },
    { tag: 'ADAPTATION', title: 'Movement phrases without spoken cues', meta: 'SEND-friendly', color: '#FBBF24', left: '70%', top: '80%', rot: -4 },
    { tag: 'REFLECTION', title: "What worked in today's improvisation?", meta: 'Captured 12:42', color: '#7DD3FC', left: '50%', top: '62%', rot: 0 },
  ];
  return (
    <Backdrop tint="indigo">
      <SceneChip index={3} total={TOTAL} />
      <div className="absolute inset-x-0 top-[8cqmin] flex flex-col items-center text-center px-[6cqmin] gap-[1.5cqmin]">
        <Eyebrow tint="indigo" align="center">Your ideas, captured forever</Eyebrow>
        <Cinematic size="lg" align="center">
          <span>Never lose a brilliant idea.</span>
        </Cinematic>
      </div>
      {cards.map((c, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: c.left,
            top: c.top,
            width: 'min(clamp(130px,18cqmax,280px), 38vw)',
          }}
          initial={{ opacity: 0, scale: 0.5, rotate: 0, x: '-50%', y: 'calc(-50% + 30px)' }}
          animate={{ opacity: 1, scale: 1, rotate: c.rot, x: '-50%', y: '-50%' }}
          transition={{ ...springs.gentle, delay: 1.0 + i * 0.15 }}
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
  return (
    <Backdrop tint="plum">
      <SceneChip index={4} total={TOTAL} />
      <SceneLayout layout="left-text" visual={
        <div className="relative w-full h-[70cqh]">
          {Array.from({ length: 24 }).map((_, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            return (
              <motion.div
                key={i}
                className="absolute rounded-[1cqmin]"
                style={{
                  left: `${col * 25}%`,
                  top: `${row * 17}%`,
                  width: '22%',
                  height: '14%',
                  background: `linear-gradient(135deg, rgba(192,132,252,${0.10 + (i % 5) * 0.04}), rgba(244,114,182,${0.05 + (i % 3) * 0.05}))`,
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                }}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...springs.gentle, delay: 0.4 + i * 0.04 }}
              />
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
    { label: 'Drama', color: '#FB7185', subtitle: 'Improvise. Embody. Reflect.' },
    { label: 'Dance', color: '#C084FC', subtitle: 'Move. Phrase. Choreograph.' },
    { label: 'Music', color: '#5EEAD4', subtitle: 'Listen. Compose. Perform.' },
  ];
  return (
    <Backdrop tint="rose">
      <SceneChip index={7} total={TOTAL} />
      <div className="absolute inset-0 flex flex-col justify-center px-[6cqmin] gap-[3cqmin]">
        <div className="flex flex-col gap-[1.5cqmin]">
          <Eyebrow tint="rose">Built for the arts</Eyebrow>
          <Cinematic size="2xl">
            <span>Drama. Dance.</span>
            <span style={{ color: '#FB7185' }}>Music.</span>
          </Cinematic>
        </div>
        <div className="grid grid-cols-1 landscape:grid-cols-3 gap-[1.5cqmin] mt-[1cqmin]">
          {arts.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 1.0 + i * 0.15 }}
            >
              <GlassPanel className="px-[2.5cqmin] py-[2cqmin]">
                <div
                  className="font-display font-black"
                  style={{ color: a.color, fontSize: 'clamp(20px,3.5cqmax,52px)' }}
                >
                  {a.label}
                </div>
                <div className="text-white/55 mt-[0.4cqmin]" style={{ fontSize: 'clamp(11px,1.4cqmax,18px)' }}>
                  {a.subtitle}
                </div>
              </GlassPanel>
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
  const ringNodes = [0, 60, 120, 180, 240, 300];
  return (
    <Backdrop tint="indigo">
      <SceneChip index={9} total={TOTAL} />
      <SceneLayout layout="right-text" visual={
        <div className="relative w-full h-[60cqh] flex items-center justify-center">
          <motion.div
            className="absolute rounded-full border border-white/10"
            style={{ width: '50cqmin', height: '50cqmin' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute rounded-full border border-white/10"
            style={{ width: '36cqmin', height: '36cqmin' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
          {ringNodes.map((deg, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10 backdrop-blur-md border border-white/20"
              style={{
                width: 'clamp(12px,1.8cqmax,28px)',
                height: 'clamp(12px,1.8cqmax,28px)',
                left: '50%',
                top: '50%',
                transform: `translate(-50%,-50%) rotate(${deg}deg) translateY(-25cqmin)`,
                boxShadow: '0 0 20px rgba(165,180,252,0.5)',
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springs.gentle, delay: 0.4 + i * 0.08 }}
            />
          ))}
          <motion.div
            className="relative rounded-full flex items-center justify-center font-display font-black text-white/90"
            style={{
              width: 'clamp(80px,16cqmax,220px)',
              height: 'clamp(80px,16cqmax,220px)',
              background: 'radial-gradient(circle, rgba(99,102,241,0.5), rgba(56,189,248,0.2))',
              boxShadow: '0 0 80px rgba(99,102,241,0.6), inset 0 0 40px rgba(255,255,255,0.1)',
              fontSize: 'clamp(18px,3cqmax,44px)',
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.bouncy, delay: 0.2 }}
          >
            AI
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
    { label: 'Core lesson', tone: '#5EEAD4' },
    { label: 'Stretch & challenge', tone: '#FBBF24' },
    { label: 'SEND adaptation', tone: '#C084FC' },
    { label: 'EAL scaffolds', tone: '#7DD3FC' },
  ];
  return (
    <Backdrop tint="teal">
      <SceneChip index={10} total={TOTAL} />
      <SceneLayout layout="left-text" visual={
        <div className="relative w-full flex flex-col gap-[1.2cqmin]">
          {variants.map((v, i) => (
            <motion.div
              key={v.label}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.gentle, delay: 0.4 + i * 0.18 }}
            >
              <GlassPanel className="flex items-center gap-[1.5cqmin] px-[2cqmin] py-[1.6cqmin]">
                <div
                  className="rounded-full"
                  style={{
                    width: 'clamp(8px,1.2cqmax,18px)',
                    height: 'clamp(8px,1.2cqmax,18px)',
                    background: v.tone,
                    boxShadow: `0 0 16px ${v.tone}`,
                  }}
                />
                <div
                  className="text-white/85 font-semibold"
                  style={{ fontSize: 'clamp(13px,1.8cqmax,24px)' }}
                >
                  {v.label}
                </div>
                <div className="flex-1 h-px bg-white/10" />
                <div
                  className="text-white/40 font-mono"
                  style={{ fontSize: 'clamp(9px,1.1cqmax,14px)' }}
                >
                  ready
                </div>
              </GlassPanel>
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
  return (
    <Backdrop tint="amber">
      <SceneChip index={17} total={TOTAL} />
      <SceneLayout layout="left-text" visual={
        <div className="relative w-full h-[60cqh]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            {[
              ['M50,90 L50,55', 0],
              ['M50,55 L25,30', 0.2],
              ['M50,55 L75,30', 0.2],
              ['M25,30 L12,12', 0.4],
              ['M25,30 L30,8', 0.4],
              ['M75,30 L70,8', 0.4],
              ['M75,30 L88,12', 0.4],
            ].map(([d, delay], i) => (
              <motion.path
                key={i}
                d={d as string}
                stroke="#FBBF24"
                strokeWidth="0.5"
                strokeOpacity="0.6"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: 'circOut', delay: 0.4 + (delay as number) }}
              />
            ))}
          </svg>
          {[
            { x: 50, y: 90, size: 16, label: 'Old idea' },
            { x: 50, y: 55, size: 12 },
            { x: 25, y: 30, size: 10 },
            { x: 75, y: 30, size: 10 },
            { x: 12, y: 12, size: 8, label: 'New lesson' },
            { x: 30, y: 8, size: 8 },
            { x: 70, y: 8, size: 8 },
            { x: 88, y: 12, size: 8, label: 'New unit' },
          ].map((n, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-[#FBBF24]/30 backdrop-blur-sm border border-[#FBBF24]/50 flex items-center justify-center text-white/95 font-medium whitespace-nowrap"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                transform: 'translate(-50%,-50%)',
                width: `${n.size}cqmin`,
                height: `${n.size}cqmin`,
                fontSize: 'clamp(8px,1cqmax,12px)',
                boxShadow: '0 0 20px rgba(251,191,36,0.5)',
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springs.gentle, delay: 0.3 + i * 0.13 }}
            >
              {n.label && (
                <span className="absolute" style={{ top: '110%', whiteSpace: 'nowrap' }}>
                  {n.label}
                </span>
              )}
            </motion.div>
          ))}
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
    { label: 'Theatre companies', color: '#FB7185' },
    { label: 'Music educators', color: '#5EEAD4' },
    { label: 'Dance partners', color: '#C084FC' },
    { label: 'Curriculum specialists', color: '#FBBF24' },
    { label: 'Arts charities', color: '#7DD3FC' },
  ];
  return (
    <Backdrop tint="plum">
      <SceneChip index={18} total={TOTAL} />
      <SceneLayout layout="right-text" visual={
        <div className="relative w-full h-[60cqh] flex items-center justify-center">
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 'clamp(60px,12cqmax,160px)',
              height: 'clamp(60px,12cqmax,160px)',
              background: 'radial-gradient(circle, rgba(192,132,252,0.6), transparent 70%)',
              boxShadow: '0 0 80px rgba(192,132,252,0.5)',
            }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {orgs.map((o, i) => {
            const angle = (i / orgs.length) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const r = 26;
            return (
              <motion.div
                key={o.label}
                className="absolute rounded-[1cqmin] backdrop-blur-md border border-white/15 px-[1.4cqmin] py-[0.8cqmin] text-white/90 font-medium whitespace-nowrap text-center"
                style={{
                  left: `calc(50% + ${Math.cos(rad) * r}cqmin)`,
                  top: `calc(50% + ${Math.sin(rad) * r}cqmin)`,
                  transform: 'translate(-50%,-50%)',
                  background: `${o.color}15`,
                  borderColor: `${o.color}55`,
                  fontSize: 'clamp(9px,1.2cqmax,16px)',
                  boxShadow: `0 0 24px ${o.color}33`,
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.gentle, delay: 0.6 + i * 0.13 }}
              >
                {o.label}
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
          Planning ideas, frameworks, and creative resources from arts organisations and educators — many of them free.
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
      <CornerBrand />
      <SceneChip index={22} total={TOTAL} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[6cqmin] gap-[2.5cqmin]">
        <Eyebrow tint="teal" align="center">The future of curriculum design</Eyebrow>
        <Cinematic size="2xl" align="center">
          <span>Where creative</span>
          <span>teaching ideas</span>
          <span style={{ color: '#5EEAD4' }}>live, evolve, and grow.</span>
        </Cinematic>
        <Sub align="center" delay={1.0}>
          Built for educators. Powered by your creativity. Open to a growing community of arts and curriculum partners.
        </Sub>
        <motion.div
          className="mt-[1cqmin] inline-flex items-center gap-[1.5cqmin] px-[3cqmin] py-[1.4cqmin] rounded-full text-[#0f2a2e] font-bold"
          style={{
            background: 'linear-gradient(135deg,#5EEAD4,#14B8A6)',
            boxShadow: '0 0 60px rgba(94,234,212,0.45), 0 20px 40px -10px rgba(0,0,0,0.5)',
            fontSize: 'clamp(13px,1.8cqmax,24px)',
          }}
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...springs.bouncy, delay: 1.4 }}
        >
          Try it with your school
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
