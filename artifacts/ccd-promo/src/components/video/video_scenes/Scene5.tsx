import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { springs, sceneTransitions } from '@/lib/video/animations';
import logoUrl from '@assets/ccd_brand/cd-logo.svg';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2400),
      setTimeout(() => setPhase(5), 7000), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 overflow-hidden bg-[#008272]"
      {...sceneTransitions.clipCircle}
    >
      {/* Background gradients matching CallToAction.tsx */}
      <motion.div
        className="absolute -bottom-[30cqh] -right-[20cqw] rounded-full"
        style={{
          width: "70cqw",
          height: "70cqw",
          background: "radial-gradient(circle at center, rgba(255,107,107,0.45), transparent 65%)",
          filter: "blur(4cqw)",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-[20cqh] -left-[15cqw] rounded-full"
        style={{
          width: "55cqw",
          height: "55cqw",
          background: "radial-gradient(circle at center, rgba(20,184,166,0.35), transparent 65%)",
          filter: "blur(4cqw)",
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.9, 0.7] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 h-full w-full flex flex-col justify-between px-[5cqmin] py-[5cqmin] gap-[3cqmin]">
        
        {/* Header */}
        <motion.div 
          className="flex items-center gap-[1.5cqmin]"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={springs.snappy}
        >
          <img
            src={logoUrl}
            alt="CCD logo"
            className="w-[clamp(28px,4.5cqmax,64px)] h-[clamp(28px,4.5cqmax,64px)]"
          />
          <span className="text-white font-display font-semibold tracking-tight text-[clamp(14px,2cqmax,28px)]">
            Creative Curriculum Designer
          </span>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-full">
          <motion.span 
            className="inline-block px-[2cqmin] py-[1cqmin] rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white font-medium text-[clamp(10px,1.4cqmax,18px)] tracking-wide uppercase mb-[2cqmin]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={springs.bouncy}
          >
            EYFS → KS4 · Try it with your school
          </motion.span>
          
          <h1
            className="font-display font-black text-white tracking-tighter leading-[0.95]"
            style={{ fontSize: "clamp(32px, 7.5cqmax, 120px)", textWrap: "balance" }}
          >
            <motion.span 
              className="block"
              initial={{ opacity: 0, y: 40 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={springs.snappy}
            >
              Give your team back
            </motion.span>
            <motion.span 
              className="block text-[#ff6b6b]"
              initial={{ opacity: 0, y: 40 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ ...springs.snappy, delay: 0.1 }}
            >
              their planning hours.
            </motion.span>
          </h1>
          
          <motion.p
            className="mt-[2cqmin] text-white/85 font-body font-medium max-w-full leading-snug"
            style={{ fontSize: "clamp(13px, 2.2cqmax, 32px)", textWrap: "pretty" }}
            initial={{ opacity: 0 }}
            animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            Bring CCD into your school for a half-term trial. We'll set up your year groups, import your existing units, and walk your team through it.
          </motion.p>
        </div>

        {/* Footer Cards */}
        <div className="grid grid-cols-1 landscape:grid-cols-3 gap-[2cqmin]">
          <motion.div 
            className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2cqmin]"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ ...springs.snappy, delay: 0.2 }}
          >
            <div className="font-display font-semibold text-[#ff6b6b] text-[clamp(9px,1.3cqmax,16px)] uppercase tracking-wide mb-[1cqmin]">Visit</div>
            <div className="font-display font-bold text-white text-[clamp(12px,1.8cqmax,24px)] leading-tight break-words">creativecurriculumdesigner.com</div>
          </motion.div>
          
          <motion.div 
            className="rounded-[1.5rem] bg-white/8 border border-white/15 backdrop-blur-sm p-[2cqmin]"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ ...springs.snappy, delay: 0.3 }}
          >
            <div className="font-display font-semibold text-[#ff6b6b] text-[clamp(9px,1.3cqmax,16px)] uppercase tracking-wide mb-[1cqmin]">Email</div>
            <div className="font-display font-bold text-white text-[clamp(12px,1.8cqmax,24px)] leading-tight break-words">hello@creativecurriculumdesigner.com</div>
          </motion.div>
          
          <motion.div 
            className="rounded-[1.5rem] bg-[#ff6b6b] text-white p-[2cqmin]"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ ...springs.snappy, delay: 0.4 }}
          >
            <div className="font-display font-semibold text-white/90 text-[clamp(9px,1.3cqmax,16px)] uppercase tracking-wide mb-[1cqmin]">Book a demo</div>
            <div className="font-display font-bold text-white text-[clamp(12px,1.8cqmax,24px)] leading-tight">30-minute walk-through with your year leads</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
