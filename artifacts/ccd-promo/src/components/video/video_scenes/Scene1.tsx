import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/video/animations';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2800),
      setTimeout(() => setPhase(4), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: 'circOut' }}
    >
      {/* Background Image Layer */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/teacher-stressed.jpg`} 
          alt="Teacher planning" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-light via-bg-light/80 to-transparent mix-blend-normal" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[80vw] mx-auto flex flex-col items-start px-12">
        <motion.div
          className="overflow-hidden mb-4"
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
            transition={springs.gentle}
            className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent-dark font-bold text-[1.5vw] tracking-wide uppercase"
          >
            THE SUNDAY NIGHT STRUGGLE
          </motion.div>
        </motion.div>

        <motion.h1 
          className="text-[6vw] font-black text-text-primary leading-[1.1] tracking-tight max-w-4xl"
          style={{ perspective: '1000px' }}
        >
          <motion.span
            className="block"
            initial={{ opacity: 0, rotateX: -30, y: 40 }}
            animate={phase >= 2 ? { opacity: 1, rotateX: 0, y: 0 } : { opacity: 0, rotateX: -30, y: 40 }}
            transition={springs.snappy}
          >
            Planning shouldn't
          </motion.span>
          <motion.span
            className="block text-primary"
            initial={{ opacity: 0, rotateX: -30, y: 40 }}
            animate={phase >= 3 ? { opacity: 1, rotateX: 0, y: 0 } : { opacity: 0, rotateX: -30, y: 40 }}
            transition={springs.snappy}
          >
            take all weekend.
          </motion.span>
        </motion.h1>
      </div>
    </motion.div>
  );
}