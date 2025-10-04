import React from 'react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
}

export function ProductImage({ 
  src, 
  alt, 
  className = '',
  aspectRatio = 'square'
}: ProductImageProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-[16/9]',
    wide: 'aspect-[4/3]'
  };
  
  return (
    <div className={`bg-bg-paper border border-stroke-soft rounded-xl overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover" 
      />
    </div>
  );
}



