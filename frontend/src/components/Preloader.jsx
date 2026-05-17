import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Preloader = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const duration = 2500;
    const steps = 100;
    const interval = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setCount(current);
      if (current >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setVisible(false);
          setTimeout(onComplete, 600);
        }, 400);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A0A]"
        >
          {/* Logo mark */}
          <div className="mb-8 flex items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-2 border-blue-500 animate-spin" style={{ animationDuration: '3s', borderTopColor: 'transparent', borderRadius: '2px' }} />
              <div className="absolute inset-2 bg-blue-500 opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500" />
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="font-sora text-sm font-bold tracking-[0.4em] uppercase text-zinc-400 mb-2">
            INITIALIZING DOCUFLOW AI
          </div>

          {/* Counter */}
          <div className="font-sora text-6xl font-black text-white tracking-tighter mb-12">
            {count}<span className="text-blue-500">%</span>
          </div>

          {/* Thin progress bar at bottom */}
          <div className="fixed bottom-0 left-0 right-0 h-[2px] bg-zinc-900">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: `${count}%` }}
              transition={{ duration: 0.05, ease: 'linear' }}
            />
          </div>

          {/* Subtle grid bg */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
