import { useState, useEffect } from "react";
import { formatPrice } from "@lib/money";

interface CartData {
  success: boolean;
  items: any[];
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

  const fetchCart = async () => {
    try {
      console.log('Fetching cart data...');
      const response = await fetch("/api/cart/get");
      const data = await response.json();
      console.log('Cart data received:', data);
      setCartData(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();

    // Escuchar eventos de actualización del carrito
    const handleCartUpdate = (event) => {
      console.log('Cart update event received:', event.detail);
      fetchCart();
    };

    // Polling automático para mantener el carrito sincronizado
    const pollInterval = setInterval(() => {
      fetchCart();
    }, 3000); // Actualizar cada 3 segundos

    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, []);

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

  const openCart = () => {
    console.log('Opening cart, current items:', cartData.items.length);
    setIsOpen(true);
  };
  const closeCart = () => {
    console.log('Closing cart');
    setIsOpen(false);
  };

  const removeFromCart = async (productId: number) => {
    try {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado local del carrito
        setCartData({
          success: true,
          items: data.cart.items,
          totalCents: data.totalCents,
          itemCount: data.itemCount,
        });

        // Disparar evento personalizado para actualizar otros componentes
        const cartUpdateEvent = new CustomEvent("cart-updated", {
          detail: {
            itemCount: data.itemCount,
            totalCents: data.totalCents,
            productId: productId,
            action: 'remove'
          },
        });
        
        window.dispatchEvent(cartUpdateEvent);
        document.dispatchEvent(cartUpdateEvent);
        
        // Actualización simple - el polling se encargará del resto
        
        console.log('Product removed from cart:', productId);
      } else {
        throw new Error(data.error || "Error al remover del carrito");
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      // Podrías agregar un toast o notificación de error aquí
    }
  };

  const clearCart = async () => {
    if (!confirm("¿Estás seguro de que quieres vaciar todo el carrito?")) {
      return;
    }

    try {
      const response = await fetch("/api/cart/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado local del carrito
        setCartData({
          success: true,
          items: [],
          totalCents: 0,
          itemCount: 0,
        });

        // Disparar evento personalizado para actualizar otros componentes
        const cartUpdateEvent = new CustomEvent("cart-updated", {
          detail: {
            itemCount: 0,
            totalCents: 0,
            action: 'clear'
          },
        });
        
        window.dispatchEvent(cartUpdateEvent);
        document.dispatchEvent(cartUpdateEvent);
        
        // Actualización simple - el polling se encargará del resto
        
        console.log('Cart cleared successfully');
      } else {
        throw new Error(data.error || "Error al vaciar el carrito");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      // Podrías agregar un toast o notificación de error aquí
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
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-blue-600 transition-colors"
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
        <div className="fixed inset-0 z-[60] pointer-events-auto">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity opacity-100"
            onClick={closeCart}
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
                onClick={closeCart}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido del carrito */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {cartData.items.length === 0 ? (
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
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={
                          item.product?.imageUrl ||
                          "/images/placeholder-product.jpg"
                        }
                        alt={item.product?.name || "Producto"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                        {item.product?.name || "Producto"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-blue-600">
                        {formatPrice(
                          item.product?.priceCents * item.quantity || 0,
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {/* Botón para remover producto */}
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                        title="Remover del carrito"
                        aria-label={`Remover ${item.product?.name || 'producto'} del carrito`}
                      >
                        <svg
                          className="w-4 h-4"
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer con total y botones */}
          {cartData.items.length > 0 && (
            <div className="border-t p-4 space-y-3 flex-shrink-0 bg-white">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Total:
                </span>
                <span className="text-xl font-bold text-blue-600">
                  {formatPrice(cartData.totalCents)}
                </span>
              </div>
              <div className="space-y-2">
                <a
                  href="/carrito"
                  className="w-full min-h-11 bg-blue-600 text-white rounded-lg font-medium 
                           hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Ver carrito completo
                </a>
                <a
                  href="/carrito"
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
