import React from 'react';

interface CartItem {
  id: string;
  title: string;
  priceCents: number;
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
    
    // Si el precio es muy grande, probablemente ya está en pesos, no centavos
    if (price > 1000) {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
      }).format(price);
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price / 100);
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
          <div key={item.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-b-0">
            {/* Miniatura */}
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
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
              <h3 className="text-white font-medium text-sm truncate">
                {item.title}
              </h3>
              <p className="text-white/60 text-xs">
                {item.sellerName}
              </p>
            </div>
            
            {/* Controles de cantidad */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, Math.max(0, item.qty - 1))}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                disabled={item.qty <= 1}
              >
                −
              </button>
              <span className="text-white font-medium min-w-[2rem] text-center">
                {item.qty || 0}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, (item.qty || 0) + 1)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                +
              </button>
            </div>
            
            {/* Precio y cantidad */}
            <div className="text-right">
              <p className="text-white font-semibold">
                {formatPrice((item.priceCents || 0) * (item.qty || 0))}
              </p>
              <p className="text-white/60 text-xs">
                {item.qty || 0} producto{(item.qty || 0) !== 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Botón eliminar */}
            <button
              onClick={() => onRemoveItem(item.id)}
              className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
              title="Eliminar producto"
            >
              ✕
            </button>
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
