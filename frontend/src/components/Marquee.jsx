import React from 'react';
import ReactMarquee from 'react-fast-marquee';

const MARQUEE_TEXT = ['DIGITIZE', 'VALIDATE', 'ANALYZE', 'AUTOMATE', 'EXTRACT', 'REVIEW'];

const MarqueeRow = ({ direction = 'left', speed = 40 }) => (
  <ReactMarquee
    direction={direction}
    speed={speed}
    gradient={false}
    className="py-3"
  >
    {MARQUEE_TEXT.map((text, i) => (
      <span
        key={i}
        className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-500 mx-6 select-none"
      >
        {text} <span className="text-zinc-700 mr-6">*</span>
      </span>
    ))}
  </ReactMarquee>
);

const MarqueeSection = () => {
  return (
    <div className="border-y border-white/5 overflow-hidden">
      <MarqueeRow direction="left" speed={40} />
      <MarqueeRow direction="right" speed={35} />
    </div>
  );
};

export default MarqueeSection;
