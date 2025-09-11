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
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          aria-label={`Ir al slide ${i + 1}`}
          aria-current={i === active}
          onClick={() => onDotClick?.(i)}
          className={[
            'rounded-full transition-all duration-200 cursor-pointer',
            'w-2 h-2', // 8px - tamaño moderado
            i === active 
              ? 'bg-white scale-125' 
              : 'bg-white/50 hover:bg-white/70',
          ].join(' ')}
        />
      ))}
    </div>
  );
}
