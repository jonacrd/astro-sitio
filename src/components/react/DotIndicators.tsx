import React from 'react';

type Props = {
  total: number;
  active: number;
  onDotClick?: (i: number) => void;
  className?: string;
};

export default function DotIndicators({ total, active, onDotClick, className = '' }: Props) {
  // Si solo hay 1 elemento, no mostrar nada
  if (total <= 1) return null;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className="text-xs text-white/70 bg-black/20 px-2 py-1 rounded-full">
        {active + 1}/{total}
      </span>
    </div>
  );
}
