import React from 'react';
import { motion } from 'framer-motion';

const ScannerBeam = ({ active = true, label = 'Extracting fields' }) => {
  if (!active) return null;

  return (
    <div className="absolute inset-0 z-10 overflow-hidden" style={{ borderRadius: '2px' }}>
      {/* Semi-transparent dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Scanner beam */}
      <motion.div
        className="absolute left-0 right-0"
        style={{
          height: '4px',
          background: 'linear-gradient(to right, transparent, #3B82F6, #60A5FA, #3B82F6, transparent)',
          boxShadow: '0 0 20px rgba(59,130,246,0.8), 0 0 40px rgba(59,130,246,0.4)',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{
          duration: 1.5,
          ease: 'linear',
          repeat: Infinity,
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-blue-500 opacity-80" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-blue-500 opacity-80" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue-500 opacity-80" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue-500 opacity-80" />

      {/* Label */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="bg-black/80 border border-blue-500/40 px-4 py-2 text-xs font-medium text-blue-400 tracking-widest uppercase backdrop-blur-sm">
          {label}
          <span className="animated-dots" />
        </div>
      </div>
    </div>
  );
};

export default ScannerBeam;
