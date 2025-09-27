import React, { useState, useEffect } from 'react';
import AuthButton from './AuthButton';
import CartSheet from './CartSheet';
import NotificationsPanel from './NotificationsPanel';
import { getUser } from '../../lib/session';
import { supabase } from '../../lib/supabase-browser';

export default function Header() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Log cuando cambie el estado del carrito
  useEffect(() => {
    console.log('🛒 Estado del carrito cambió:', { cartOpen });
  }, [cartOpen]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getUser();
        if (user) {
          setUserId(user.id);
          // Cargar contadores reales
          loadCounters(user.id);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    // Función para cargar items del carrito
    const loadCartItems = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        console.log('🛒 Cargando items del carrito desde localStorage:', cart);
        
        // Convertir formato de localStorage a formato de CartItem
        const cartItems = cart.map((item: any) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity || 1,
          image: item.image,
          sellerName: item.vendor || 'Vendedor'
        }));
        
        setCartItems(cartItems);
        setCartCount(cartItems.length);
        
        console.log('✅ Items del carrito cargados:', cartItems);
      } catch (error) {
        console.error('❌ Error cargando items del carrito:', error);
        setCartItems([]);
        setCartCount(0);
      }
    };

    loadUserData();
    loadCartItems(); // Cargar items del carrito al inicio

    // Escuchar eventos de actualización del carrito
    const handleCartUpdate = (event: CustomEvent) => {
      console.log('🛒 Header recibió evento de carrito:', event.detail);
      loadCartItems(); // Recargar items cuando hay cambios
    };

    window.addEventListener('cart-updated', handleCartUpdate as EventListener);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
    };
  }, []);

  const loadCounters = async (userId: string) => {
    try {
      // Usar localStorage para evitar errores de Supabase
      console.log('📊 Cargando contadores desde localStorage para evitar errores de DB');
      
      // Notificaciones desde localStorage
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const unreadNotifications = notifications.filter((n: any) => !n.read);
      setUnreadCount(unreadNotifications.length);

      // Carrito desde localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      setCartCount(totalItems);
      
      console.log('📊 Contadores cargados:', { 
        notifications: unreadNotifications.length, 
        cartItems: totalItems 
      });
    } catch (error) {
      console.error('Error loading counters:', error);
      setUnreadCount(0);
      setCartCount(0);
    }
  };

  const handleNotificationsClick = () => {
    setNotificationsOpen(true);
  };

  const handleCartClick = () => {
    console.log('🛒 Click en carrito - Estado actual:', { cartOpen, cartCount });
    console.log('🛒 Abriendo carrito...');
    setCartOpen(true);
    console.log('🛒 Estado después de setCartOpen:', { cartOpen: true });
  };

  return (
    <>
      <header className="sticky top-0 z-[60] bg-primary/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white">🛍️ Tienda</h1>
            </div>
            
            {/* Notificaciones, Carrito y Autenticación */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notificaciones */}
              <button 
                onClick={handleNotificationsClick}
                className="notification-btn-opaque relative p-2 rounded-lg"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge-opaque absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Carrito */}
              <button 
                id="cart-button"
                onClick={handleCartClick}
                className="cart-btn-opaque relative p-2 rounded-lg"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h6" />
                </svg>
                {cartCount > 0 && (
                  <span 
                    className="cart-badge-opaque absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-white text-xs rounded-full flex items-center justify-center font-bold"
                    data-cart-count
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Botón de Autenticación */}
              <div className="min-w-0 flex-shrink-0">
                <AuthButton client:load />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Panel de Notificaciones Real */}
        <NotificationsPanel
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          userId={userId}
        />

      {/* Carrito Original */}
      <CartSheet
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(itemId, quantity) => {
          console.log('🔄 Actualizando cantidad:', itemId, quantity);
          // Actualizar localStorage
          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          const updatedCart = cart.map((item: any) => 
            item.id === itemId ? { ...item, quantity } : item
          );
          localStorage.setItem('cart', JSON.stringify(updatedCart));
          loadCartItems(); // Recargar items
        }}
        onRemoveItem={(itemId) => {
          console.log('🗑️ Removiendo item:', itemId);
          // Remover de localStorage
          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          const updatedCart = cart.filter((item: any) => item.id !== itemId);
          localStorage.setItem('cart', JSON.stringify(updatedCart));
          loadCartItems(); // Recargar items
        }}
        onCheckout={() => {
          console.log('💳 Procesando checkout');
        }}
      />
    </>
  );
}
