import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { springs, sceneTransitions } from '@/lib/video/animations';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 2800),
      setTimeout(() => setPhase(5), 3500),
      setTimeout(() => setPhase(6), 6000), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const cards = [
    { title: 'Phonics Phase 2', category: 'EYFS', color: 'bg-pink-400' },
    { title: 'Great Fire of London', category: 'KS1 History', color: 'bg-sky-400' },
    { title: 'Fractions & Decimals', category: 'KS2 Maths', color: 'bg-purple-500' },
    { title: 'Volcanoes', category: 'KS2 Geography', color: 'bg-orange-400' },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-bg-light"
      {...sceneTransitions.slideLeft}
    >
      {/* Background Image */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1, x: 20 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/kids-learning.jpg`} 
          alt="Kids learning" 
          className="w-full h-full object-cover opacity-10"
        />
      </motion.div>

      <div className="relative z-10 w-full px-16 flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={springs.snappy}
          className="mb-6 inline-block px-4 py-2 rounded-full bg-primary/10 text-primary-dark font-bold tracking-wide text-sm uppercase"
        >
          RICH LESSON LIBRARY
        </motion.div>
        
        <motion.h2 
          className="text-[4vw] font-black text-text-primary leading-[1.1] tracking-tight mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={springs.snappy}
        >
          Browse hundreds of ready-to-teach lessons.
        </motion.h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-4 gap-6 w-full max-w-5xl">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-2xl shadow-hover overflow-hidden border border-gray-100 flex flex-col h-64"
              initial={{ opacity: 0, y: 40, rotate: i % 2 === 0 ? -5 : 5, scale: 0.8 }}
              animate={phase >= 3 ? { opacity: 1, y: 0, rotate: 0, scale: 1 } : { opacity: 0, y: 40, rotate: i % 2 === 0 ? -5 : 5, scale: 0.8 }}
              transition={{ ...springs.bouncy, delay: phase >= 3 ? i * 0.15 : 0 }}
              whileHover={{ y: -10 }}
            >
              <div className={`h-24 ${card.color} w-full flex items-center justify-center relative overflow-hidden`}>
                {/* Abstract pattern */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{card.category}</div>
                <div className="font-bold text-text-primary text-lg leading-tight flex-1">{card.title}</div>
                
                {/* Fake skeleton lines */}
                <motion.div 
                  className="w-full h-2 bg-gray-100 rounded-full mb-2"
                  initial={{ width: 0 }}
                  animate={phase >= 4 ? { width: "100%" } : { width: 0 }}
                  transition={{ duration: 0.5, delay: phase >= 4 ? i * 0.1 + 0.2 : 0 }}
                />
                <motion.div 
                  className="w-2/3 h-2 bg-gray-100 rounded-full"
                  initial={{ width: 0 }}
                  animate={phase >= 4 ? { width: "66%" } : { width: 0 }}
                  transition={{ duration: 0.5, delay: phase >= 4 ? i * 0.1 + 0.3 : 0 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating elements */}
        {phase >= 5 && (
          <>
            <motion.div 
              className="absolute top-[20%] left-[10%] w-16 h-16 bg-ks1/20 rounded-full blur-xl"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute bottom-[20%] right-[10%] w-24 h-24 bg-ks2/20 rounded-full blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}