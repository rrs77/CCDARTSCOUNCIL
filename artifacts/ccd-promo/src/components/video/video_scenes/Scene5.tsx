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
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 3000), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-primary-dark"
      {...sceneTransitions.clipCircle}
    >
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] bg-[length:40px_40px]" />

      <motion.div 
        className="absolute w-full h-full bg-gradient-to-t from-primary-dark via-primary to-primary-light opacity-50 mix-blend-overlay"
      />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0, opacity: 0, rotate: -180 }}
          transition={springs.bouncy}
          className="mb-8"
        >
          <img src={logoUrl} alt="CCD Logo" className="w-32 h-32 drop-shadow-2xl" />
        </motion.div>

        <motion.h1
          className="text-[5vw] font-black text-white leading-none tracking-tight mb-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={springs.snappy}
        >
          Creative Curriculum Designer
        </motion.h1>

        <motion.p
          className="text-[2vw] text-white/80 font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Planning shouldn't take all weekend.
        </motion.p>
      </div>

      {/* Decorative circles */}
      {phase >= 1 && (
        <>
          <motion.div 
            className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-accent/60"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1], y: [0, -20, -10] }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/4 w-6 h-6 rounded-full bg-warning/60"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1], y: [0, -30, -15] }}
            transition={{ duration: 2.5, ease: "easeOut", delay: 0.2 }}
          />
          <motion.div 
            className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-white/60"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.8, 1], y: [0, -15, -5] }}
            transition={{ duration: 1.8, ease: "easeOut", delay: 0.4 }}
          />
        </>
      )}
    </motion.div>
  );
}