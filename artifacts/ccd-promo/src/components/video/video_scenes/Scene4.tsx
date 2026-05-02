import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { springs, sceneTransitions } from '@/lib/video/animations';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 2800),
      setTimeout(() => setPhase(5), 3600),
      setTimeout(() => setPhase(6), 4400),
      setTimeout(() => setPhase(7), 6000), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const stackItems = [
    { title: 'Starter: Number Bonds', duration: '10 mins', color: 'bg-primary' },
    { title: 'Main: Word Problems', duration: '30 mins', color: 'bg-accent' },
    { title: 'Plenary: Quiz', duration: '10 mins', color: 'bg-warning' },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-bg-muted"
      {...sceneTransitions.wipe}
    >
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full px-16 flex items-center justify-between">
        
        {/* Left UI Mockup - Stacks */}
        <div className="w-[45%] h-[60vh] flex flex-col justify-center items-center perspective-[1000px]">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, rotateX: 20, y: 40 }}
            animate={phase >= 2 ? { opacity: 1, rotateX: 0, y: 0 } : { opacity: 0, rotateX: 20, y: 40 }}
            transition={springs.smooth}
          >
            {stackItems.map((item, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl shadow-raised p-4 mb-4 border border-gray-100 flex items-center gap-4 relative z-10"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={phase >= 3 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
                transition={{ ...springs.bouncy, delay: phase >= 3 ? i * 0.2 : 0 }}
                style={{ zIndex: stackItems.length - i }}
              >
                <div className={`w-3 h-12 ${item.color} rounded-full`} />
                <div className="flex-1">
                  <div className="font-bold text-text-primary text-lg">{item.title}</div>
                  <div className="text-text-muted text-sm flex items-center gap-2 mt-1">
                    <span className="w-4 h-4 rounded bg-gray-100 inline-block" />
                    {item.duration}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <div className="w-4 h-1 bg-gray-300 rounded-full" />
                </div>
              </motion.div>
            ))}
            
            {/* Connecting line */}
            {phase >= 4 && (
              <motion.div 
                className="absolute left-8 top-10 bottom-10 w-0.5 bg-gray-200 -z-10"
                initial={{ scaleY: 0, originY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
              />
            )}
          </motion.div>
        </div>

        {/* Right Text */}
        <div className="w-[50%] text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={springs.snappy}
            className="mb-4 inline-block px-4 py-2 rounded-full bg-accent/10 text-accent-dark font-bold tracking-wide text-sm uppercase"
          >
            ACTIVITY STACKS
          </motion.div>
          <motion.h2 
            className="text-[4.5vw] font-black text-text-primary leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, x: 40 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={springs.snappy}
          >
            Sequence your activities like building blocks.
          </motion.h2>
          
          <motion.div
            className="flex flex-col gap-4 mt-8"
            initial={{ opacity: 0 }}
            animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {['EYFS', 'KS1', 'KS2'].map((ks, i) => (
              <motion.div 
                key={ks}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={phase >= 5 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ ...springs.snappy, delay: phase >= 5 ? i * 0.15 : 0 }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${ks === 'EYFS' ? 'bg-eyfs' : ks === 'KS1' ? 'bg-ks1' : 'bg-ks2'}`}>
                  ✓
                </div>
                <span className="text-xl font-bold text-text-secondary">Fully mapped to {ks}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}