import { useState, useEffect } from "react";
import { formatPrice } from "@lib/money";

interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    priceCents: number;
    imageUrl?: string;
    stock: number;
  };
}

interface CartData {
  success: boolean;
  items: CartItem[];
  totalCents: number;
  itemCount: number;
}

interface CartTableProps {
  className?: string;
}

export default function CartTable({ className = "" }: CartTableProps) {
  const [cartData, setCartData] = useState<CartData>({
    success: true,
    items: [],
    totalCents: 0,
    itemCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart/get");
      const data = await response.json();
      setCartData(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: number, newQuantity: number) => {
    setUpdating(productId);

    try {
      const response = await fetch("/api/cart/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });

      const data = await response.json();

      if (data.success) {
        setCartData(data);

        // Disparar evento para actualizar el widget
        window.dispatchEvent(
          new CustomEvent("cart-updated", {
            detail: {
              itemCount: data.itemCount,
              totalCents: data.totalCents,
            },
          }),
        );
      } else {
        alert(data.error || "Error al actualizar cantidad");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Error al actualizar cantidad");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId: number) => {
    if (!confirm("¿Estás seguro de que quieres remover este producto?")) {
      return;
    }

    setUpdating(productId);

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
        setCartData(data);

        // Disparar evento para actualizar el widget
        window.dispatchEvent(
          new CustomEvent("cart-updated", {
            detail: {
              itemCount: data.itemCount,
              totalCents: data.totalCents,
            },
          }),
        );
      } else {
        alert(data.error || "Error al remover producto");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Error al remover producto");
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (cartData.items.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg
            className="w-24 h-24 mx-auto"
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
        </div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">
          Tu carrito está vacío
        </h3>
        <p className="text-gray-500 mb-6">
          Agrega algunos productos para comenzar
        </p>
        <a
          href="/catalogo"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver catálogo
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Items del carrito */}
      <div className="space-y-4 mb-8">
        {cartData.items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md p-6 flex items-center gap-4"
          >
            {/* Imagen */}
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={item.product.imageUrl || "/images/placeholder-product.jpg"}
                alt={item.product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Información del producto */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {item.product.name}
              </h3>
              <p className="text-blue-600 font-medium">
                {formatPrice(item.product.priceCents)}
              </p>
              <p className="text-sm text-gray-500">
                Stock disponible: {item.product.stock}
              </p>
            </div>

            {/* Controles de cantidad */}
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity - 1)
                }
                disabled={updating === item.product.id || item.quantity <= 1}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                -
              </button>

              <span className="w-12 text-center font-medium">
                {updating === item.product.id ? "..." : item.quantity}
              </span>

              <button
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity + 1)
                }
                disabled={
                  updating === item.product.id ||
                  item.quantity >= item.product.stock
                }
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                +
              </button>
            </div>

            {/* Subtotal y remover */}
            <div className="text-right">
              <p className="font-bold text-lg text-gray-900 mb-2">
                {formatPrice(item.quantity * item.product.priceCents)}
              </p>
              <button
                onClick={() => removeItem(item.product.id)}
                disabled={updating === item.product.id}
                className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {updating === item.product.id ? "Removiendo..." : "Remover"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total:</span>
          <span className="text-blue-600">
            {formatPrice(cartData.totalCents)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {cartData.itemCount}{" "}
          {cartData.itemCount === 1 ? "producto" : "productos"}
        </p>
      </div>
    </div>
  );
}




