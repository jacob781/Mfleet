
import React from 'react';

interface LogoProps {
  className?: string;
}

const MfleetLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 250 50" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mfleet Logo"
    >
      <g>
        <path d="M49.43 2.11C47.81 1.16 45.74 0.61 43.61 0.61C39.46 0.61 36.31 2.28 35.41 5.06L26.31 34.36L21.86 18.91C20.81 15.61 17.76 13.91 14.51 13.91C13.26 13.91 12.06 14.16 11.01 14.71L1.11 49.36H11.51L18.71 27.06L27.91 49.36H38.56L49.46 12.01L54.76 27.66L61.96 49.36H72.16L58.61 5.31C57.56 1.96 54.41 0.16 50.81 0.16C50.21 0.16 49.71 0.21 49.43 2.11Z" fill="url(#logoGradient)" />
        <text x="75" y="38" fontFamily="Inter, sans-serif" fontSize="36" fontWeight="900" fill="url(#textGradient)">
          Mfleet
        </text>
      </g>
      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="72" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="textGradient" x1="75" y1="0" x2="250" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E40AF" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default MfleetLogo;
