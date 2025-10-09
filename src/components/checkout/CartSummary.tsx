import React from 'react';

interface CartItem {
  id: string;
  title: string;
  priceCents: number; // Precio unitario en pesos (no en centavos)
  qty: number;
  image?: string;
  sellerName: string;
}

interface CartSummaryProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  subtotal: number;
  deliveryFee?: number;
  total: number;
}

export default function CartSummary({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  subtotal, 
  deliveryFee = 0, 
  total 
}: CartSummaryProps) {
  const formatPrice = (price: number) => {
    // Verificar si el precio es válido
    if (isNaN(price) || price === null || price === undefined) {
      return '$0';
    }
    
    // El precio siempre viene en pesos desde el carrito, no en centavos
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="checkout-card rounded-2xl bg-[#1D2939] ring-1 ring-white/10 shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-lg font-semibold">Resumen del Pedido</h2>
        <span className="text-white/60 text-sm">
          {items.length} producto{items.length !== 1 ? 's' : ''} • {items.reduce((sum, item) => sum + (item.qty || 0), 0)} items
        </span>
      </div>
      
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="py-3 border-b border-white/5 last:border-b-0">
            <div className="flex items-start gap-3">
              {/* Miniatura */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    📦
                  </div>
                )}
              </div>
              
              {/* Detalles del producto */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base leading-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {item.sellerName || 'Vendedor'}
                    </p>
                  </div>
                  
                  {/* Botón eliminar */}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-sm"
                    title="Eliminar producto"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Controles de cantidad y precio */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onUpdateQuantity(item.id, Math.max(0, item.qty - 1))}
                      className="w-9 h-9 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors"
                      disabled={item.qty <= 1}
                    >
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-10 text-center font-bold text-white text-lg bg-gray-700 rounded px-1">
                      {item.qty || 0}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, (item.qty || 0) + 1)}
                      className="w-9 h-9 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Precio total del item */}
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">
                      {formatPrice((item.priceCents || 0) * (item.qty || 0))}
                    </p>
                    <p className="text-white/60 text-xs">
                      {formatPrice(item.priceCents || 0)} c/u
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Resumen de costos */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="space-y-2">
          <div className="flex justify-between text-white/70 text-sm">
            <span>Productos ({items.reduce((sum, item) => sum + (item.qty || 0), 0)} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          {deliveryFee > 0 && (
            <div className="flex justify-between text-white/70 text-sm">
              <span>Delivery</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-white text-lg font-extrabold pt-2 border-t border-white/10">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
