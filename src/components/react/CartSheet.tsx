import React, { useEffect } from 'react';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  onProceedToCheckout: () => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onClearCart?: () => void;
}

export default function CartSheet({ 
  isOpen, 
  onClose, 
  items, 
  onProceedToCheckout,
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart 
}: CartSheetProps) {
  if (!isOpen) return null;

  // Efecto para manejar la tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Función segura para obtener total de items
  const getTotalItems = () => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      if (!item || typeof item.quantity !== 'number') return sum + 1;
      return sum + item.quantity;
    }, 0);
  };

  // Función segura para obtener precio total
  const getTotalPrice = () => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      if (!item || typeof item.price !== 'number') return sum;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      return sum + (item.price * quantity);
    }, 0);
  };

  // Función segura para formatear precio
  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) return '$0';
    return '$' + price.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-[65]
                   sm:inset-0
                   max-sm:top-[60px] max-sm:bottom-[80px] max-sm:left-0 max-sm:right-0">
      {/* Backdrop clickable */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div 
        className="bg-white h-full w-full max-w-md shadow-xl transform transition-transform duration-300 ease-in-out relative z-10
                   sm:h-full sm:max-w-md
                   max-sm:h-[calc(100vh-140px)] max-sm:mt-[60px] max-sm:mb-[80px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Carrito ({getTotalItems()})
          </h2>
          <button
            onClick={onClose}
            className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
            title="Cerrar carrito"
            aria-label="Cerrar carrito"
            style={{ 
              minWidth: '44px', 
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {!items || items.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h6" />
              </svg>
              <p className="text-gray-500 text-lg">Tu carrito está vacío</p>
              <p className="text-gray-400 text-sm">Agrega algunos productos para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                // Validar que el item existe y tiene las propiedades necesarias
                if (!item || typeof item !== 'object') {
                  console.warn('Item inválido en el carrito:', item);
                  return null;
                }

                const itemId = item.id || `item-${index}`;
                const itemTitle = item.title || 'Producto sin nombre';
                const itemPrice = typeof item.price === 'number' ? item.price : 0;
                const itemQuantity = typeof item.quantity === 'number' ? item.quantity : 1;
                const itemImage = item.image || '/placeholder-product.jpg';
                const itemSellerName = item.sellerName || 'Vendedor';

                return (
                  <div key={itemId} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                    <img
                      src={itemImage}
                      alt={itemTitle}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.jpg';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{itemTitle}</h3>
                      <p className="text-gray-500 text-xs">{itemSellerName}</p>
                      <p className="text-blue-600 font-semibold text-sm">
                        {formatPrice(itemPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity?.(itemId, Math.max(1, itemQuantity - 1))}
                        className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center font-bold text-gray-800 text-lg">{itemQuantity}</span>
                      <button
                        onClick={() => onUpdateQuantity?.(itemId, itemQuantity + 1)}
                        className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onRemoveItem?.(itemId)}
                        className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors ml-2 shadow-sm"
                        title="Eliminar producto"
                        aria-label="Eliminar producto"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items && items.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatPrice(getTotalPrice())}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onClearCart?.();
                  console.log('🧹 Carrito limpiado');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpiar Carrito
              </button>
              <button
                onClick={onProceedToCheckout}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Proceder al Pago
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}