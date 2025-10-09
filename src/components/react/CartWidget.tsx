import { useState, useEffect } from "react";
import { formatPrice } from "@lib/money";
import { supabase } from "../../lib/supabase-browser";
import { cartStore } from "../../lib/cart-store";

interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  title: string;
  priceCents: number;
  qty: number;
  sellerId: string;
  sellerName: string;
  totalCents: number;
}

interface CartData {
  success: boolean;
  items: CartItem[];
  totalCents: number;
  itemCount: number;
}

interface CartWidgetProps {
  className?: string;
}

export default function CartWidget({ className = "" }: CartWidgetProps) {
  const [cartData, setCartData] = useState<CartData>({
    success: true,
    items: [],
    totalCents: 0,
    itemCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const fetchCartSummary = async () => {
    try {
      console.log('🛒 fetchCartSummary called, user:', user?.email || 'No user');
      
      if (!user) {
        console.log('❌ No user, setting empty cart');
        setCartData({
          success: true,
          items: [],
          totalCents: 0,
          itemCount: 0,
        });
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching cart items for user:', user.email);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('❌ No session token');
        setCartData({
          success: true,
          items: [],
          totalCents: 0,
          itemCount: 0,
        });
        setLoading(false);
        return;
      }

      console.log('📡 Making request to /api/cart/items...');
      const response = await fetch("/api/cart/items", {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      console.log('📊 Response status:', response.status);
      const result = await response.json();
      console.log('📋 Response data:', result);
      
      if (result.success) {
        setCartData({
          success: true,
          items: result.data.items,
          totalCents: result.data.totalCents,
          itemCount: result.data.itemCount,
        });
        
        // Actualizar el store del carrito
        cartStore.updateCartStats(result.data.itemCount, result.data.totalCents);
        
        // Si no hay items, limpiar la tienda activa
        if (result.data.itemCount === 0) {
          cartStore.clearActiveSeller();
        }
        
        console.log('✅ Cart items loaded:', result.data.items.length, 'items, total:', result.data.totalCents);
      } else {
        console.error('❌ Error fetching cart items:', result.error);
        setCartData({
          success: false,
          items: [],
          totalCents: 0,
          itemCount: 0,
        });
        cartStore.clearActiveSeller();
      }
    } catch (error) {
      console.error("❌ Error fetching cart items:", error);
      setCartData({
        success: false,
        items: [],
        totalCents: 0,
        itemCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verificar autenticación
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      }
    };

    checkAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user !== null) {
      fetchCartSummary();
    }
  }, [user]);

  useEffect(() => {
    // Escuchar eventos de actualización del carrito
    const handleCartUpdate = (event) => {
      console.log('🛒 Cart update event received:', event.detail);
      // Actualizar inmediatamente cuando se recibe un evento
      fetchCartSummary();
    };

    // Polling automático para mantener el carrito sincronizado (menos frecuente)
    const pollInterval = setInterval(() => {
      if (user) {
        console.log('🔄 Polling cart update...');
        fetchCartSummary();
      }
    }, 10000); // Actualizar cada 10 segundos

    window.addEventListener("cart-updated", handleCartUpdate);
    document.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("cart-updated", handleCartUpdate);
      document.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [user]);

  // Manejar scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar la posición actual del scroll
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar el scroll
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Efecto para manejar la tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('⌨️ Escape key pressed - closing cart');
        closeCart();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const openCart = () => {
    console.log('🛒 Opening cart, current items:', cartData.items.length);
    console.log('🔄 Estado antes de abrir:', isOpen);
    setIsOpen(true);
    console.log('✅ Cart opened - Estado después:', true);
  };
  const closeCart = () => {
    console.log('🔄 Closing cart - Estado actual:', isOpen);
    setIsOpen(false);
    console.log('✅ Cart closed - Estado después:', false);
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      console.log('🗑️ Removing item from cart:', cartItemId);
      
      if (!user) {
        console.error('Usuario no autenticado');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No hay sesión activa');
        return;
      }

      const response = await fetch("/api/cart/updateQty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ cartItemId, qty: 0 }),
      });

      console.log('📊 Remove response status:', response.status);
      const result = await response.json();
      console.log('📋 Remove response data:', result);
      
      if (result.success) {
        // Actualizar el estado local del carrito
        setCartData({
          success: true,
          items: result.data.items || [],
          totalCents: result.data.totalCents || 0,
          itemCount: result.data.itemCount || 0,
        });

        // Actualizar el store del carrito
        cartStore.updateCartStats(result.data.itemCount || 0, result.data.totalCents || 0);
        
        // Si no hay items, limpiar la tienda activa
        if (result.data.itemCount === 0) {
          cartStore.clearActiveSeller();
        }

        // Disparar evento personalizado para actualizar otros componentes
        const cartUpdateEvent = new CustomEvent("cart-updated", {
          detail: {
            itemCount: result.data.itemCount || 0,
            totalCents: result.data.totalCents || 0,
            cartItemId: cartItemId,
            action: 'remove'
          },
        });
        
        window.dispatchEvent(cartUpdateEvent);
        document.dispatchEvent(cartUpdateEvent);
        
        console.log('✅ Product removed from cart:', cartItemId);
      } else {
        console.error('❌ Error removing product:', result.error);
        throw new Error(result.error || "Error al remover del carrito");
      }
    } catch (error) {
      console.error("❌ Error removing from cart:", error);
      alert("Error al eliminar producto del carrito");
    }
  };

  const clearCart = async () => {
    if (!confirm("¿Estás seguro de que quieres vaciar todo el carrito?")) {
      return;
    }

    try {
      console.log('🗑️ Clearing entire cart...');
      
      if (!user) {
        console.error('Usuario no autenticado');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No hay sesión activa');
        return;
      }

      // Eliminar todos los items del carrito uno por uno
      const itemsToRemove = [...cartData.items];
      
      for (const item of itemsToRemove) {
        const response = await fetch("/api/cart/updateQty", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ cartItemId: item.id, qty: 0 }),
        });

        const result = await response.json();
        if (!result.success) {
          console.error('Error removing item:', item.id, result.error);
        }
      }

      // Actualizar el estado local
      setCartData({
        success: true,
        items: [],
        totalCents: 0,
        itemCount: 0,
      });

      // Limpiar la tienda activa
      cartStore.clearActiveSeller();

      // Disparar evento de actualización
      const cartUpdateEvent = new CustomEvent("cart-updated", {
        detail: {
          itemCount: 0,
          totalCents: 0,
          action: 'clear'
        },
      });
      
      window.dispatchEvent(cartUpdateEvent);
      document.dispatchEvent(cartUpdateEvent);
      
      console.log('✅ Cart cleared successfully');
    } catch (error) {
      console.error("❌ Error clearing cart:", error);
      alert("Error al vaciar el carrito");
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-full w-6 h-6"></div>
        <div className="animate-pulse bg-gray-200 rounded w-16 h-4"></div>
      </div>
    );
  }

  return (
    <>
      {/* Botón del carrito */}
      <button
        id="cart-button"
        onClick={openCart}
        className={`
          flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-gray-100 
          transition-colors duration-200 group min-h-11
          ${className}
        `}
      >
        {/* Icono del carrito con badge */}
        <div className="relative">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-blue-700 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
            />
          </svg>

          {/* Badge con cantidad */}
          {cartData.itemCount > 0 && (
            <span
              className="
              absolute -top-2 -right-2 bg-red-500 text-white text-xs 
              rounded-full min-w-[1.25rem] h-5 flex items-center justify-center
              font-bold
            "
            >
              {cartData.itemCount > 99 ? "99+" : cartData.itemCount}
            </span>
          )}
        </div>

        {/* Información del carrito - solo visible en desktop */}
        <div className="hidden sm:flex flex-col">
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
            {cartData.itemCount === 0
              ? "Carrito vacío"
              : cartData.itemCount === 1
                ? "1 producto"
                : `${cartData.itemCount} productos`}
          </span>
          {cartData.totalCents > 0 && (
            <span className="text-xs text-gray-500 group-hover:text-blue-500">
              {formatPrice(cartData.totalCents)}
            </span>
          )}
        </div>
      </button>

      {/* Drawer/Modal del carrito */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] pointer-events-auto"
          style={{ zIndex: 60 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity opacity-100"
            onClick={(e) => {
              console.log('🖱️ Backdrop clicked');
              closeCart();
            }}
          />

          {/* Panel del carrito */}
          <aside className="absolute right-0 top-0 h-screen w-full sm:w-[420px] bg-white shadow-xl transition-transform translate-x-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Carrito ({cartData.itemCount})
            </h2>
            <div className="flex items-center gap-2">
              {/* Botón para vaciar carrito */}
              {cartData.items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                  title="Vaciar carrito"
                  aria-label="Vaciar todo el carrito"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
              {/* Botón para cerrar */}
              <button
                onClick={(e) => {
                  console.log('❌ Close button clicked');
                  e.stopPropagation();
                  closeCart();
                }}
                className="p-3 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors border border-red-200 hover:border-red-300"
                title="Cerrar carrito"
                aria-label="Cerrar carrito"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido del carrito */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {cartData.itemCount === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                  />
                </svg>
                <p className="text-gray-500 text-sm">Tu carrito está vacío</p>
                <p className="text-gray-400 text-xs mt-2">Agrega productos desde el catálogo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartData.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Vendedor: {item.sellerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Cantidad: {item.qty} × {formatPrice(item.priceCents)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(item.totalCents)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Eliminar del carrito"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Resumen total */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(cartData.totalCents)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer con botones */}
          {cartData.itemCount > 0 && (
            <div className="border-t p-4 space-y-3 flex-shrink-0 bg-white">
              <div className="space-y-2">
                <a
                  href="/checkout"
                  className="w-full min-h-11 bg-blue-600 text-white rounded-lg font-medium 
                           hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Proceder al Pago
                </a>
                <a
                  href="/carrito"
                  className="w-full min-h-11 border border-gray-300 text-gray-700 rounded-lg font-medium 
                           hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  Ver carrito completo
                </a>
                <a
                  href="/"
                  className="w-full min-h-11 border border-gray-300 text-gray-700 rounded-lg font-medium 
                           hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  Continuar comprando
                </a>
              </div>
            </div>
          )}
          </aside>
        </div>
      )}
    </>
  );
}
