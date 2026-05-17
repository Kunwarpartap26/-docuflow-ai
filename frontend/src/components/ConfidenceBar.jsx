import React from 'react';
import { motion } from 'framer-motion';

const ConfidenceBar = ({ confidence = 0, showLabel = true }) => {
  const pct = Math.round(confidence * 100);
  const color = pct > 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="w-full">
      <div className="h-[3px] bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] text-zinc-500 mt-0.5 block" style={{ color }}>
          {pct}% confidence
        </span>
      )}
    </div>
  );
};

export default ConfidenceBar;
