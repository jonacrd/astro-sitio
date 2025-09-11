import React from 'react';

type Props = {
  total: number;
  active: number;
  onDotClick?: (i: number) => void;
  className?: string;
};

export default function DotIndicators({ total, active, onDotClick, className = '' }: Props) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          aria-label={`Ir al slide ${i + 1}`}
          aria-current={i === active}
          onClick={() => onDotClick?.(i)}
          className={[
            'rounded-full transition-all duration-200',
            'w-1.5 h-1.5 md:w-2 md:h-2',                // tamaños muy pequeños
            i === active ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400',
          ].join(' ')}
        />
      ))}
    </div>
  );
}
