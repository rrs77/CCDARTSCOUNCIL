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
      className="absolute inset-0 flex items-center justify-center bg-bg-dark"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: 'circOut' }}
    >
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/teacher-stressed.jpg`} 
          alt="Teacher planning" 
          className="w-full h-full object-cover opacity-30 grayscale mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/90 to-bg-dark/40" />
      </motion.div>

      <div className="relative z-10 w-full max-w-[80vw] mx-auto flex flex-col items-start px-12">
        <motion.div className="overflow-hidden mb-6">
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
            transition={springs.gentle}
            className="inline-block px-5 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold text-[1.2vw] tracking-wider uppercase"
          >
            THE SUNDAY NIGHT STRUGGLE
          </motion.div>
        </motion.div>

        <motion.h1 
          className="text-[6.5vw] font-black text-white leading-[1.05] tracking-tight max-w-[60vw]"
          style={{ perspective: '1000px' }}
        >
          <motion.span
            className="block text-white/50"
            initial={{ opacity: 0, rotateX: -30, y: 40 }}
            animate={phase >= 2 ? { opacity: 1, rotateX: 0, y: 0 } : { opacity: 0, rotateX: -30, y: 40 }}
            transition={springs.snappy}
          >
            Don't spend
          </motion.span>
          <motion.span
            className="block"
            initial={{ opacity: 0, rotateX: -30, y: 40 }}
            animate={phase >= 3 ? { opacity: 1, rotateX: 0, y: 0 } : { opacity: 0, rotateX: -30, y: 40 }}
            transition={{ ...springs.snappy, delay: 0.1 }}
          >
            another weekend
          </motion.span>
          <motion.span
            className="block text-accent"
            initial={{ opacity: 0, rotateX: -30, y: 40 }}
            animate={phase >= 4 ? { opacity: 1, rotateX: 0, y: 0 } : { opacity: 0, rotateX: -30, y: 40 }}
            transition={{ ...springs.snappy, delay: 0.2 }}
          >
            planning lessons.
          </motion.span>
        </motion.h1>
      </div>
    </motion.div>
  );
}
