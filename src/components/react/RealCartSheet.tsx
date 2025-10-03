import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price_cents: number;
    image_url?: string;
  };
}

interface RealCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function RealCartSheet({ isOpen, onClose, userId }: RealCartSheetProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  console.log('🛒 RealCartSheet renderizado con props:', { isOpen, userId });

  useEffect(() => {
    console.log('🛒 RealCartSheet useEffect:', { isOpen, userId });
    
    if (isOpen) {
      console.log('🛒 Abriendo carrito...');
      setIsVisible(true);
      // No cambiar overflow del body para evitar problemas con el header
      // document.body.style.overflow = 'hidden';
      
      // Siempre cargar desde localStorage por ahora
      console.log('🔄 Cargando carrito desde localStorage...');
      loadCartItems();
    } else {
      console.log('🛒 Cerrando carrito...');
      setIsVisible(false);
      // document.body.style.overflow = 'unset';
    }

    return () => {
      // No hacer nada en cleanup para evitar problemas con el header
    };
  }, [isOpen, userId]);

  // Escuchar eventos de actualización del carrito
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      console.log('🛒 RealCartSheet recibió evento de carrito:', event.detail);
      if (!userId) {
        loadCartFromLocalStorage();
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate as EventListener);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
    };
  }, [userId]);

  const loadCartFromLocalStorage = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      console.log('🛒 Cargando carrito desde localStorage:', cart);
      
      // Convertir formato de localStorage a formato de CartItem
      const localCartItems = cart.map((item: any) => ({
        id: item.id,
        product_id: item.id,
        quantity: item.quantity || 1,
        product: {
          id: item.id,
          title: item.title,
          price_cents: item.price * 100, // Convertir a centavos
          image_url: item.image
        }
      }));
      
      setCartItems(localCartItems);
      console.log('✅ Carrito cargado desde localStorage:', localCartItems.length, 'items');
      
    } catch (error) {
      console.error('❌ Error cargando carrito desde localStorage:', error);
      setCartItems([]);
    }
  };

  const loadCartItems = async () => {
    try {
      setLoading(true);
      console.log('🛒 Cargando items del carrito...');
      
      // Usar solo localStorage por ahora
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      console.log('📦 Carrito desde localStorage:', cart);
      
      if (cart.length === 0) {
        console.log('📭 Carrito vacío');
        setCartItems([]);
        return;
      }
      
      // Convertir formato de localStorage a formato de CartItem
      const localCartItems = cart.map((item: any) => ({
        id: item.id,
        product_id: item.id,
        quantity: item.quantity || 1,
        product: {
          id: item.id,
          title: item.title,
          price_cents: (item.price || 0) * 100, // Convertir a centavos
          image_url: item.image,
          vendor: item.vendor || 'Vendedor' // ✅ Agregar vendor
        }
      }));
      
      setCartItems(localCartItems);
      console.log('✅ Carrito cargado desde localStorage:', localCartItems.length, 'items');
      console.log('🛒 Items del carrito:', localCartItems);
      
    } catch (error) {
      console.error('❌ Error cargando carrito:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      console.log('🔄 Actualizando cantidad:', itemId, 'a', newQuantity);
      
      // Actualizar desde localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const updatedCart = cart.map((item: any) => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      );
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
      
      // Disparar evento de actualización
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { itemId, action: 'update', newQuantity, cart: updatedCart } 
      }));
      
      console.log('✅ Cantidad actualizada en localStorage');
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      if (userId) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);

        if (error) {
          console.error('Error removing item:', error);
        } else {
          setCartItems(prev => prev.filter(item => item.id !== itemId));
        }
      } else {
        // Remover desde localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const updatedCart = cart.filter((item: any) => item.id !== itemId);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        
        // Disparar evento de actualización
        window.dispatchEvent(new CustomEvent('cart-updated', { 
          detail: { itemId, action: 'remove' } 
        }));
        
        console.log('✅ Item removido del carrito localStorage');
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const proceedToCheckout = async () => {
    if (!userId || cartItems.length === 0) return;

    try {
      // Llamar a la función de checkout del backend
      const { data, error } = await supabase.rpc('place_order', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error during checkout:', error);
        alert('Error al procesar el pedido: ' + error.message);
      } else {
        console.log('✅ Pedido creado exitosamente:', data);
        
        // 📱 Enviar notificación al vendedor via OneSignal
        try {
          // Obtener el sellerId del primer item (asumimos que todos son del mismo vendedor)
          const sellerId = cartItems[0]?.seller_id;
          
          if (sellerId) {
            console.log('📬 Enviando notificación al vendedor:', sellerId);
            
            const response = await fetch('https://onesignal.com/api/v1/notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic os_v2_app_e4ejnwf2fzalzdz3yhto7usyusef5yk3avlcu4umoy7adwyxujdr7kerrk7mfe6myvfiv3762hga7e7xbzxu2zhanilwfo2gtmsl5rga'
              },
              body: JSON.stringify({
                app_id: '270896d8-ba2e-40bc-8f3b-c1e6efd258a1',
                include_aliases: {
                  external_id: [sellerId]
                },
                target_channel: 'push',
                headings: { en: '🛒 ¡Nuevo Pedido Recibido!' },
                contents: { en: `Tienes un nuevo pedido de ${cartItems.length} producto(s)` },
                chrome_web_icon: '/favicon.svg',
                firefox_icon: '/favicon.svg'
              })
            });
            
            const result = await response.json();
            console.log('📊 Resultado notificación:', result);
          }
        } catch (notifError) {
          console.error('⚠️ Error enviando notificación (no crítico):', notifError);
        }
        
        alert('¡Pedido realizado con éxito!');
        setCartItems([]);
        onClose();
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Error al procesar el pedido');
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.product.price_cents * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!isVisible) {
    console.log('🛒 RealCartSheet no visible, no renderizando');
    return null;
  }

  console.log('🛒 RealCartSheet renderizando con z-50');

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col">
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
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/60">Cargando carrito...</p>
            </div>
          ) : cartItems.length === 0 ? (
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
                    {item.product.image_url ? (
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">
                      {item.product.title}
                    </h4>
                    <p className="text-white/70 text-sm truncate">
                      {item.product.vendor || 'Vendedor'}
                    </p>
                    <p className="text-accent font-semibold">
                      ${(item.product.price_cents / 100).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-white font-medium min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
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
                ${(total / 100).toLocaleString()}
              </span>
            </div>
            <button
              onClick={proceedToCheckout}
              className="w-full bg-accent text-primary py-4 rounded-2xl font-semibold hover:bg-accent/90 transition-colors duration-200"
            >
              Proceder al Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


