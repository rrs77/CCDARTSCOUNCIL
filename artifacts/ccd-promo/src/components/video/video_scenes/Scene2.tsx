import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { springs, sceneTransitions } from '@/lib/video/animations';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 5800), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-primary"
      {...sceneTransitions.wipe}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-dark to-primary opacity-80" />
      
      <motion.div 
        className="absolute top-[-20%] right-[-10%] w-[50cqw] h-[50cqw] rounded-full border border-white/5 bg-white/5 backdrop-blur-3xl"
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 w-full h-full px-[5cqmin] py-[5cqmin] flex flex-col landscape:flex-row items-center justify-center landscape:justify-between gap-[3cqmin] landscape:gap-12">
        <div className="w-full landscape:w-[40%] text-white text-center landscape:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={springs.snappy}
            className="mb-[2cqmin] inline-block px-[2cqmin] py-[1cqmin] rounded-full bg-white/20 border border-white/30 font-bold tracking-wide text-[clamp(10px,1.6cqmax,22px)] shadow-soft"
          >
            SAVE SUNDAYS
          </motion.div>
          <motion.h2 
            className="font-black leading-[1.05] tracking-tight mb-[2cqmin] text-[clamp(28px,5.5cqmax,90px)]"
            initial={{ opacity: 0, x: -40 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={springs.snappy}
          >
            Plan a whole term
            <br />
            <span className="text-primary-light">in minutes.</span>
          </motion.h2>
          <motion.p
            className="text-white/90 max-w-lg mx-auto landscape:mx-0 leading-snug text-[clamp(13px,2.2cqmax,32px)]"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            A curriculum planner that grows with you — from EYFS through KS4. Your ideas, all in one place.
          </motion.p>
        </div>

        <div className="w-full landscape:w-[55%] h-[40%] landscape:h-[70cqh] relative perspective-[1200px]">
          <motion.div
            className="absolute inset-0 rounded-2xl shadow-2xl overflow-hidden border-4 border-white/20"
            initial={{ opacity: 0, rotateY: 15, x: 100, scale: 0.9 }}
            animate={phase >= 2 ? { opacity: 1, rotateY: -5, x: 0, scale: 1 } : { opacity: 0, rotateY: 15, x: 100, scale: 0.9 }}
            transition={springs.smooth}
          >
            <img 
              src={`${import.meta.env.BASE_URL}screens/dashboard.jpg`} 
              alt="CCD Dashboard" 
              className="w-full h-full object-cover object-left-top"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
