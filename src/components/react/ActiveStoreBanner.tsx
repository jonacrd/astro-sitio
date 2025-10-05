import React from 'react';
import { useCartStore } from '../../lib/cart-store';

export default function ActiveStoreBanner() {
  const store = useCartStore();

  if (!store.activeSellerId) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Comprando en: {store.activeSellerName}
            </h3>
            <p className="text-xs text-blue-600">
              {store.itemCount} {store.itemCount === 1 ? 'producto' : 'productos'} • ${(store.totalCents / 100).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            Tienda activa
          </span>
          <button
            onClick={() => {
              if (confirm('¿Estás seguro de que quieres cambiar de tienda? Esto vaciará tu carrito actual.')) {
                cartStore.clearActiveSeller();
                // Aquí podrías agregar lógica para vaciar el carrito
                window.location.reload();
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Cambiar tienda
          </button>
        </div>
      </div>
    </div>
  );
}









