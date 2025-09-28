import React from 'react';
import ProductFeedSimple from './ProductFeedSimple';

interface MixedFeedSimpleProps {
  className?: string;
}

export default function MixedFeedSimple({ className = '' }: MixedFeedSimpleProps) {
  console.log('📱 MixedFeedSimple renderizado - ProductFeedSimple siempre visible');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sección de Productos Reales - Siempre visible */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <ProductFeedSimple />
      </div>
    </div>
  );
}
