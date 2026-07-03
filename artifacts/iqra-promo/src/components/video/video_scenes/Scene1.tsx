import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import logo from '@assets/iqra-logo.png';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <img src={logo} alt="IQRA Logo" className="w-[15vw] h-auto" />
      </motion.div>

      <motion.h1 
        className="text-[6vw] font-display font-bold text-white tracking-wide leading-none"
        initial={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
        animate={phase >= 2 ? { opacity: 1, clipPath: 'inset(0% 0 0 0)' } : { opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        IQRA ASSISTANT
      </motion.h1>

      <motion.p 
        className="text-[2vw] font-sans text-brand-cream/80 mt-6 max-w-[60vw]"
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
        style={{ color: 'var(--color-bg-light)' }}
      >
        Islamic Ethics & Leadership Guidance
      </motion.p>
    </motion.div>
  );
}
