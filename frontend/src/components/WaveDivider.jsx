import React from 'react';

const WaveDivider = ({ flip = false }) => {
  return (
    <div
      className="wave-divider pointer-events-none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      <svg
        viewBox="0 0 1440 80"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: '80px' }}
      >
        <path
          d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,20 1440,40 L1440,80 L0,80 Z"
          fill="#0A0A0A"
        />
      </svg>
    </div>
  );
};

export const WaveDividerTop = () => (
  <div className="wave-divider pointer-events-none" style={{ transform: 'scaleY(-1)' }}>
    <svg
      viewBox="0 0 1440 80"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height: '80px' }}
    >
      <path
        d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,20 1440,40 L1440,80 L0,80 Z"
        fill="#0A0A0A"
      />
    </svg>
  </div>
);

export default WaveDivider;
