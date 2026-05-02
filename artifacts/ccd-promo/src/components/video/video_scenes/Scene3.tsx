import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { springs, sceneTransitions } from '@/lib/video/animations';

export function Scene3() {
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
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-bg-light"
      {...sceneTransitions.clipPolygon}
    >
      <div className="relative z-10 w-full h-full flex flex-col pt-[8cqh]">
        <div className="px-[8cqw] text-center flex flex-col items-center mb-[4cqh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={springs.snappy}
            className="mb-4 inline-block px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary-dark font-bold tracking-wide text-[1.2cqw] uppercase"
          >
            RICH LESSON LIBRARY
          </motion.div>
          
          <motion.h2 
            className="text-[4.5cqw] font-black text-text-primary leading-[1.1] tracking-tight text-center max-w-[70cqw]"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ ...springs.snappy, delay: 0.1 }}
          >
            Hundreds of ready-to-teach lessons.
          </motion.h2>
        </div>

        <motion.div 
          className="flex-1 w-full px-[6cqw] relative perspective-[1200px]"
          initial={{ opacity: 0, y: 100, rotateX: 10 }}
          animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 100, rotateX: 10 }}
          transition={springs.smooth}
        >
          <div className="w-full h-full rounded-t-2xl shadow-2xl overflow-hidden border-t-4 border-x-4 border-white/80 bg-white relative">
             <img 
              src={`${import.meta.env.BASE_URL}screens/library.jpg`} 
              alt="CCD Library" 
              className="w-full h-full object-cover object-top"
            />
            {/* Soft gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
          </div>
        </motion.div>

        {/* Decorative elements */}
        {phase >= 2 && (
          <>
            <motion.div 
              className="absolute top-[20%] left-[5%] w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div 
              className="absolute top-[30%] right-[5%] w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none"
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}
