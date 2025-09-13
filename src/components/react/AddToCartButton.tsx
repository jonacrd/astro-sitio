import { useState } from "react";

interface AddToCartButtonProps {
  productId: number;
  stock: number;
  disabled?: boolean;
  className?: string;
}

export default function AddToCartButton({
  productId,
  stock,
  disabled = false,
  className = "",
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    if (loading || disabled || stock === 0) return;

    setLoading(true);

    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await response.json();

      if (data.success) {
        setAdded(true);

        // Disparar evento personalizado para actualizar el widget del carrito
        const cartUpdateEvent = new CustomEvent("cart-updated", {
          detail: {
            itemCount: data.itemCount,
            totalCents: data.totalCents,
            productId: productId,
          },
        });
        
        // Disparar en window y document para asegurar que se capture
        window.dispatchEvent(cartUpdateEvent);
        document.dispatchEvent(cartUpdateEvent);
        
        // Usar localStorage como puente para comunicación entre pestañas
        const cartUpdateData = {
          itemCount: data.itemCount,
          totalCents: data.totalCents,
          productId: productId,
          timestamp: Date.now(),
        };
        
        localStorage.setItem('cart-updated', JSON.stringify(cartUpdateData));
        
        // Trigger storage event para otras pestañas
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'cart-updated',
          newValue: JSON.stringify(cartUpdateData),
          url: window.location.href
        }));
        
        console.log('Cart update event dispatched:', cartUpdateEvent.detail);

        // Resetear estado después de 2 segundos
        setTimeout(() => setAdded(false), 2000);
      } else {
        throw new Error(data.error || "Error al agregar al carrito");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
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
              ? "bg-green-500 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
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
