import React, { useState, useEffect } from 'react';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  sellerName: string;
}

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CartItem[];
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onCheckout?: () => void;
}

function CartSheet({
  isOpen,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Cargar items del localStorage al montar
  useEffect(() => {
    const loadCartItems = () => {
      try {
        const stored = localStorage.getItem('cart');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('🛒 CartSheet: Cargando items del localStorage:', parsed);
          setCartItems(parsed);
        }
      } catch (error) {
        console.error('❌ Error cargando carrito:', error);
        setCartItems([]);
      }
    };

    loadCartItems();
  }, []);

  // Escuchar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🛒 CartSheet: Actualizando desde localStorage:', parsed);
        setCartItems(parsed);
      }
    };

    window.addEventListener('cart-updated', handleStorageChange);
    return () => window.removeEventListener('cart-updated', handleStorageChange);
  }, []);

  // Función para actualizar cantidad
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      const updatedItems = cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      
      setCartItems(updatedItems);
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      
      // Disparar evento
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { cart: updatedItems } 
      }));
      
      console.log('📈 Cantidad actualizada:', itemId, newQuantity);
    } catch (error) {
      console.error('❌ Error actualizando cantidad:', error);
    }
  };

  // Función para eliminar item
  const handleRemoveItem = (itemId: string) => {
    try {
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedItems);
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      
      // Disparar evento
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { cart: updatedItems } 
      }));
      
      console.log('🗑️ Item eliminado:', itemId);
    } catch (error) {
      console.error('❌ Error eliminando item:', error);
    }
  };

  // Función para limpiar carrito
  const handleClearCart = () => {
    try {
      setCartItems([]);
      localStorage.setItem('cart', '[]');
      
      // Disparar evento
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { cart: [] } 
      }));
      
      console.log('🧹 Carrito limpiado');
    } catch (error) {
      console.error('❌ Error limpiando carrito:', error);
    }
  };

  // Función para ir al checkout
  const handleCheckout = () => {
    console.log('💳 Redirigiendo al checkout...');
    // Redirigir al checkout real
    window.location.href = '/checkout';
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSwipeDown = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentY = moveEvent.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 100) { // Swipe down threshold
        onClose();
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      
      {/* Sheet */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col"
        onTouchStart={handleSwipeDown}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Carrito ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              aria-label="Cerrar carrito"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-white/70">
                Agrega algunos productos para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-surface/50 rounded-xl">
                  {/* Image */}
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">
                      {item.title}
                    </h4>
                    <p className="text-white/70 text-sm truncate">
                      {item.sellerName}
                    </p>
                    <p className="text-accent font-semibold">
                      ${item.price.toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-white font-medium min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="px-6 py-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/70">Total:</span>
              <span className="text-2xl font-bold text-white">
                ${total.toLocaleString()}
              </span>
            </div>
            
            {/* Botón Limpiar Carrito */}
            <button
              onClick={handleClearCart}
              className="w-full mb-3 bg-red-500/20 text-red-400 py-2 px-4 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              🧹 Limpiar Carrito
            </button>
            
            <button
              onClick={handleCheckout}
              className="w-full bg-accent text-primary py-4 rounded-2xl font-semibold hover:bg-accent/90 transition-colors duration-200 mb-20"
            >
              💳 Pagar Ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartSheet;
