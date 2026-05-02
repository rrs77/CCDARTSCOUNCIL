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
      setTimeout(() => setPhase(4), 2800),
      setTimeout(() => setPhase(5), 3600),
      setTimeout(() => setPhase(6), 5000), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const weeks = [1, 2, 3, 4, 5, 6];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-primary"
      {...sceneTransitions.wipe}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-dark to-primary opacity-50" />
      
      {/* Decorative background shapes */}
      <motion.div 
        className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full border-4 border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 w-full px-16 flex items-center justify-between">
        
        {/* Left Text */}
        <div className="w-[45%] text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={springs.snappy}
            className="mb-4 inline-block px-4 py-2 rounded-full bg-white/20 font-bold tracking-wide text-sm"
          >
            THE SOLUTION
          </motion.div>
          <motion.h2 
            className="text-[4.5vw] font-black leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, x: -40 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={springs.snappy}
          >
            Plan a whole half-term.
            <br />
            <span className="text-primary-light">In one place.</span>
          </motion.h2>
          <motion.p
            className="text-[1.8vw] text-white/80 max-w-lg"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            Drag, drop, and organise your entire curriculum without touching a spreadsheet.
          </motion.p>
        </div>

        {/* Right UI Mockup */}
        <div className="w-[50%] h-[60vh] relative perspective-[1200px]">
          <motion.div
            className="absolute inset-0 bg-white rounded-2xl shadow-raised overflow-hidden border border-gray-100 flex flex-col"
            initial={{ opacity: 0, rotateY: 20, x: 100, scale: 0.8 }}
            animate={phase >= 2 ? { opacity: 1, rotateY: -5, x: 0, scale: 1 } : { opacity: 0, rotateY: 20, x: 100, scale: 0.8 }}
            transition={springs.smooth}
          >
            {/* Header */}
            <div className="h-12 bg-gray-50 border-b border-gray-100 flex items-center px-6">
              <div className="w-3 h-3 rounded-full bg-red-400 mr-2" />
              <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="mx-auto bg-white px-8 py-1 rounded-md text-xs font-medium text-gray-400 border border-gray-200">
                Autumn Term 1 — Year 3
              </div>
            </div>
            
            {/* Grid */}
            <div className="flex-1 p-6 grid grid-cols-3 gap-4">
              {weeks.map((week, i) => (
                <motion.div 
                  key={week}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={phase >= 3 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ ...springs.bouncy, delay: phase >= 3 ? i * 0.1 : 0 }}
                >
                  <div className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Week {week}</div>
                  
                  {/* Lesson block */}
                  <motion.div 
                    className="h-12 bg-white rounded-lg border border-gray-200 shadow-soft mb-2 w-full flex items-center px-3"
                    initial={{ width: 0, opacity: 0 }}
                    animate={phase >= 4 ? { width: "100%", opacity: 1 } : { width: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "circOut", delay: phase >= 4 ? i * 0.15 : 0 }}
                  >
                    <div className="w-8 h-2 bg-primary/20 rounded-full" />
                  </motion.div>
                  
                  {/* Second block */}
                  <motion.div 
                    className="h-10 bg-white rounded-lg border border-gray-200 shadow-soft w-4/5 flex items-center px-3"
                    initial={{ width: 0, opacity: 0 }}
                    animate={phase >= 5 ? { width: "80%", opacity: 1 } : { width: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "circOut", delay: phase >= 5 ? i * 0.15 + 0.2 : 0 }}
                  >
                    <div className="w-6 h-2 bg-accent/20 rounded-full" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}