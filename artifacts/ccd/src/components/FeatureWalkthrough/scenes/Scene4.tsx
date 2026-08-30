import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { springs, sceneTransitions } from '../lib/video/animations';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 5500), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-bg-muted"
      {...sceneTransitions.wipe}
    >
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, transparent 80%)' }} />

      <div className="relative z-10 w-full px-[6cqw] flex flex-row-reverse items-center justify-between gap-12">
        
        <div className="w-[45%] text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={springs.snappy}
            className="mb-6 inline-block px-5 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-dark font-bold tracking-wide text-[1.2cqw] uppercase"
          >
            BUILT OVER YEARS, USED IN SECONDS
          </motion.div>
          <motion.h2 
            className="text-[4.5cqw] font-black text-text-primary leading-[1.05] tracking-tight mb-6"
            initial={{ opacity: 0, x: 40 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={springs.snappy}
          >
            Your teaching history,
            <br />
            always at hand.
          </motion.h2>
          
          <motion.p
            className="text-[1.8cqw] text-text-secondary max-w-lg leading-snug"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Capture every lesson, activity and resource across your career. Build on what worked, year after year.
          </motion.p>
        </div>

        <div className="w-[50%] h-[70cqh] relative perspective-[1200px]">
          <motion.div
            className="absolute inset-0 rounded-2xl shadow-2xl overflow-hidden border-4 border-white"
            initial={{ opacity: 0, rotateY: -15, x: -100, scale: 0.9 }}
            animate={phase >= 2 ? { opacity: 1, rotateY: 5, x: 0, scale: 1 } : { opacity: 0, rotateY: -15, x: -100, scale: 0.9 }}
            transition={springs.smooth}
          >
            <img 
              src={`${import.meta.env.BASE_URL}screens/dashboard.jpg`} 
              alt="CCD lesson plan builder" 
              className="w-full h-full object-cover object-left-top"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
