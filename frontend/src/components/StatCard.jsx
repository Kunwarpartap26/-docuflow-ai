import React from 'react';
import { motion } from 'framer-motion';
import useCountUp from '../hooks/useCountUp';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

const StatCard = ({ label, value, suffix = '', icon: Icon, color = '#3B82F6', pulse = false, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const count = useCountUp(numericValue, 1800, isVisible);

  const displayValue = typeof value === 'string' && value.includes('.')
    ? count.toFixed(1)
    : count.toLocaleString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#121212] border border-white/10 p-6 card-hover relative overflow-hidden"
      style={{ borderRadius: '2px' }}
    >
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: color }} />

      {/* Pulse ring for validation failures */}
      {pulse && (
        <div
          className="absolute top-4 right-4 w-3 h-3 rounded-full animate-ping"
          style={{ backgroundColor: color, opacity: 0.5 }}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-3">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-sora text-4xl font-black text-white leading-none">
              {displayValue}
            </span>
            {suffix && (
              <span className="text-lg font-medium" style={{ color }}>
                {suffix}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className="w-12 h-12 flex items-center justify-center"
            style={{
              backgroundColor: `${color}15`,
              border: `1px solid ${color}30`,
              borderRadius: '2px'
            }}
          >
            <Icon size={20} style={{ color }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
