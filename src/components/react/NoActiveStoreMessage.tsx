import React from 'react';

export default function NoActiveStoreMessage() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
      <div className="flex items-center justify-center mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Agrega un producto al carrito
      </h3>
      <p className="text-gray-600 mb-4">
        Cuando agregues un producto al carrito, verás recomendaciones de esa tienda aquí.
      </p>
      <div className="text-sm text-gray-500">
        💡 Tip: Busca productos que te gusten y agrégalos al carrito para ver más opciones de esa tienda
      </div>
    </div>
  );
}





