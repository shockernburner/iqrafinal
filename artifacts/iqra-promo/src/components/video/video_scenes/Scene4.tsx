import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import logo from '@assets/iqra-logo.png';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
      >
        <img src={logo} alt="IQRA Logo" className="w-[18vw] h-auto mb-10" />
      </motion.div>

      <motion.h1 
        className="text-[6vw] font-display font-bold text-white mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        Seek Knowledge Today
      </motion.h1>

      <motion.div
        className="px-12 py-5 bg-[var(--color-secondary)] rounded-full shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <span className="text-[var(--color-bg-dark)] font-sans font-bold text-[2vw] tracking-widest">
          IQRA.LIVE
        </span>
      </motion.div>
    </motion.div>
  );
}
