import React from 'react';

interface LoopIndicatorProps {
  isInsideLoop?: boolean;
}

export const LoopIndicator: React.FC<LoopIndicatorProps> = ({ isInsideLoop }) => {
  if (!isInsideLoop) return null;

  return (
    <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-20 flex items-center gap-1">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="w-3 h-3"
        strokeWidth={2.5}
      >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      </svg>
      <span>LOOP</span>
    </div>
  );
};

export default LoopIndicator;

