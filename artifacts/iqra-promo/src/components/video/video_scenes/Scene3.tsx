import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, x: '10%' }}
      animate={{ opacity: 1, x: '0%' }}
      exit={{ opacity: 0, y: '-10%' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute left-[10vw] w-[40vw] h-[60vh] bg-[var(--color-bg-light)] rounded-3xl p-8 flex flex-col gap-6 shadow-2xl overflow-hidden">
        <motion.div 
          className="w-[90%] bg-white rounded-2xl p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <p className="text-[var(--color-text-primary)] font-sans font-medium text-[1.4vw]">How should a leader handle disagreement?</p>
        </motion.div>

        <motion.div 
          className="w-[90%] self-end bg-[var(--color-primary)] rounded-2xl p-5 shadow-sm"
          initial={{ opacity: 0, scale: 0.9, originX: 1, originY: 0 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <p className="text-[var(--color-bg-light)] font-sans text-[1.2vw] leading-relaxed">
            In Islamic tradition, disagreement (ikhtilaf) is managed with adab (etiquette). A leader should foster shura (consultation)...
          </p>
        </motion.div>

        <motion.div 
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--color-bg-light)] to-transparent"
        />
      </div>

      <div className="absolute right-[10vw] flex flex-col gap-8 w-[30vw]">
        <motion.h3 
          className="text-[4.5vw] font-display text-white leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1 }}
        >
          Policy-Grounded Answers.
        </motion.h3>
        <motion.div 
          className="h-1 bg-[var(--color-secondary)] w-24"
          initial={{ width: 0 }}
          animate={phase >= 3 ? { width: "6rem" } : { width: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
