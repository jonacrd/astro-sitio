import React, { useState, useEffect } from 'react';
import SimpleAuthButton from './SimpleAuthButton';
import CartSheet from './CartSheet';
import NotificationsPanel from './NotificationsPanel';
import { getUser } from '../../lib/session';
import { supabase } from '../../lib/supabase-browser';

export default function Header() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Función para cargar items del carrito
  const loadCartItems = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      console.log('🛒 Cargando items del carrito desde localStorage:', cart);
      
      // Validar que cart es un array
      if (!Array.isArray(cart)) {
        console.warn('Cart no es un array, inicializando como array vacío');
        localStorage.setItem('cart', '[]');
        setCartItems([]);
        setCartCount(0);
        return;
      }
      
      // Filtrar items válidos
      const validItems = cart.filter(item => {
        if (!item || typeof item !== 'object') return false;
        if (!item.id) return false;
        if (typeof item.price !== 'number' || isNaN(item.price)) return false;
        return true;
      });
      
      setCartItems(validItems);
      setCartCount(validItems.length);
      
      console.log('✅ Items del carrito cargados:', validItems);
      console.log('📊 Contador del carrito actualizado:', validItems.length);
    } catch (error) {
      console.error('❌ Error cargando items del carrito:', error);
      // Limpiar localStorage corrupto
      localStorage.setItem('cart', '[]');
      setCartItems([]);
      setCartCount(0);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
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
      // Notificaciones desde localStorage
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const unreadNotifications = notifications.filter((n: any) => !n.read);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error loading counters:', error);
      setUnreadCount(0);
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

  const handleCartClose = () => {
    console.log('🛒 Cerrando carrito...');
    setCartOpen(false);
  };

  const handleProceedToCheckout = async () => {
    console.log('🛒 Procediendo al checkout...');
    setCartOpen(false);
    
    // Verificar si hay sesión activa
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuario encontrado:', user ? user.email : 'null');
      
      if (!user) {
        console.log('🔐 No hay sesión activa, mostrando modal de inicio de sesión');
        // Disparar evento para mostrar modal de inicio de sesión
        window.dispatchEvent(new CustomEvent('show-login-modal'));
        return;
      }
      
      // Si hay sesión, redirigir al checkout
      console.log('✅ Usuario autenticado, redirigiendo al checkout');
      window.location.href = '/checkout';
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      // En caso de error, mostrar modal de inicio de sesión
      window.dispatchEvent(new CustomEvent('show-login-modal'));
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    console.log('🔄 Actualizando cantidad:', itemId, quantity);
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const updatedCart = cart.map((item: any) => 
        item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
      );
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      loadCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    console.log('🗑️ Removiendo item:', itemId);
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const updatedCart = cart.filter((item: any) => item.id !== itemId);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      loadCartItems();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleClearCart = () => {
    console.log('🧹 Limpiando carrito');
    localStorage.setItem('cart', '[]');
    loadCartItems();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60] bg-primary/95 backdrop-blur-md border-b border-white/10 header-fix">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/icon.png" alt="Town" className="w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">Town</h1>
            </a>
            
            {/* Búsqueda, Notificaciones, Carrito y Autenticación */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Búsqueda */}
              <button 
                onClick={() => window.location.href = '/buscar'}
                className="search-btn-opaque p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                title="Buscar productos"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
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
                <SimpleAuthButton client:load />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Panel de Notificaciones */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        userId={userId}
      />

      {/* Carrito funcional */}
      <CartSheet
        isOpen={cartOpen}
        onClose={handleCartClose}
        items={cartItems}
        onProceedToCheckout={handleProceedToCheckout}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </>
  );
}