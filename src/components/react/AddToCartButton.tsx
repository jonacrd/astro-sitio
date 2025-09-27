import { useState } from "react";
import { cartStore } from "../../lib/cart-store";

interface AddToCartButtonProps {
  productId: string;
  sellerId: string;
  sellerName?: string;
  title: string;
  price_cents: number;
  stock: number;
  disabled?: boolean;
  className?: string;
}

export default function AddToCartButton({
  productId,
  sellerId,
  sellerName = "Vendedor",
  title,
  price_cents,
  stock,
  disabled = false,
  className = "",
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    if (loading || disabled || stock === 0) return;

            // Verificar si se puede agregar de esta tienda
            const canAdd = cartStore.canAddFromSeller(sellerId);
            if (!canAdd.canAdd) {
              alert(canAdd.message);
              return;
            }

            console.log('🛒 Adding to cart:', { sellerId, productId, title, price_cents });
            console.log('🛒 Current cart state:', cartStore.getState());

            setLoading(true);

            try {
              // Verificar autenticación y obtener token
              const { supabase } = await import('../../lib/supabase-browser');
              const { data: { session } } = await supabase.auth.getSession();
              
              if (!session?.access_token) {
                alert('Debes iniciar sesión para agregar productos al carrito');
                return;
              }

              const response = await fetch("/api/cart/add", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ 
                  sellerId, 
                  productId, 
                  title, 
                  price_cents, 
                  qty: 1 
                }),
              });

              const result = await response.json();

      if (result.success) {
        setAdded(true);

                // Establecer tienda activa (siempre actualizar para mostrar productos de la tienda actual)
                cartStore.setActiveSeller(sellerId, sellerName);

        // Actualizar estadísticas del carrito
        cartStore.updateCartStats(result.itemCount, result.totalCents);

                // Disparar evento personalizado para actualizar el widget del carrito y el feed
                const cartUpdateEvent = new CustomEvent("cart-updated", {
                  detail: {
                    itemCount: result.itemCount,
                    totalCents: result.totalCents,
                    productId: productId,
                    sellerId: sellerId,
                    sellerName: sellerName,
                    action: 'add'
                  },
                });
                
                // Disparar en window y document para asegurar que se capture
                window.dispatchEvent(cartUpdateEvent);
                document.dispatchEvent(cartUpdateEvent);
                
                // Forzar actualización del feed después de un pequeño delay
                setTimeout(() => {
                  const refreshEvent = new CustomEvent("force-feed-refresh", {
                    detail: { sellerId, sellerName }
                  });
                  window.dispatchEvent(refreshEvent);
                  
                  // También disparar un evento de cambio de tienda
                  const sellerChangeEvent = new CustomEvent("seller-changed", {
                    detail: { sellerId, sellerName }
                  });
                  window.dispatchEvent(sellerChangeEvent);
                }, 200);

        // Resetear estado después de 2 segundos
        setTimeout(() => setAdded(false), 2000);
      } else {
        throw new Error(result.error || "Error al agregar al carrito");
      }
    } catch (error) {
      alert("Error al agregar producto al carrito");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || stock === 0 || loading;

  return (
    <button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`
        min-h-11 px-4 py-2 rounded-lg font-medium transition-all duration-200
        text-sm sm:text-base
        ${
          isDisabled
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : added
              ? "btn-cart-opaque"
              : "btn-primary-opaque active:scale-[0.99]"
        }
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              className="opacity-75"
            />
          </svg>
          Agregando...
        </span>
      ) : added ? (
        <span className="flex items-center gap-2">✓ ¡Agregado!</span>
      ) : stock === 0 ? (
        "Sin stock"
      ) : (
        "Agregar al carrito"
      )}
    </button>
  );
}
