import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-browser';
import { useAuth } from './useAuth';

interface CartItem {
  id: string;
  productId: string;
  sellerId: string;
  title: string;
  price_cents: number;
  qty: number;
  image_url?: string;
}

interface Cart {
  id: string;
  seller_id: string;
  items: CartItem[];
  total: number;
  itemCount: number;
}

export function useCart() {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar carrito del usuario
  const loadCart = async () => {
    if (!currentUser) {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener carritos del usuario
      const { data: carts, error: cartsError } = await supabase
        .from('carts')
        .select(`
          id,
          seller_id,
          cart_items (
            id,
            product_id,
            title,
            price_cents,
            qty,
            image_url
          )
        `)
        .eq('user_id', currentUser.id);

      if (cartsError) {
        throw cartsError;
      }

      if (carts && carts.length > 0) {
        // Tomar el primer carrito (o el más reciente)
        const userCart = carts[0];
        const items = userCart.cart_items || [];
        
        const total = items.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
        const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

        setCart({
          id: userCart.id,
          seller_id: userCart.seller_id,
          items: items,
          total,
          itemCount
        });
      } else {
        setCart(null);
      }
    } catch (err) {
      console.error('Error cargando carrito:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Agregar producto al carrito
  const addToCart = async (productId: string, sellerId: string, title: string, price_cents: number, qty: number = 1, image_url?: string) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para agregar productos al carrito');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No hay sesión activa');
        return false;
      }

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          productId,
          sellerId,
          title,
          price_cents,
          qty,
          image_url
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error agregando al carrito');
      }

      // Recargar carrito
      await loadCart();

      // Emitir evento de actualización del carrito
      window.dispatchEvent(new CustomEvent('cart-updated', {
        detail: { productId, sellerId, title, qty }
      }));

      return true;
    } catch (err) {
      console.error('Error agregando al carrito:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad de un item
  const updateItemQty = async (itemId: string, qty: number) => {
    if (!currentUser) return false;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cart/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          qty
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error actualizando carrito');
      }

      // Recargar carrito
      await loadCart();

      // Emitir evento de actualización del carrito
      window.dispatchEvent(new CustomEvent('cart-updated'));

      return true;
    } catch (err) {
      console.error('Error actualizando carrito:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar item del carrito
  const removeFromCart = async (itemId: string) => {
    if (!currentUser) return false;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error eliminando del carrito');
      }

      // Recargar carrito
      await loadCart();

      // Emitir evento de actualización del carrito
      window.dispatchEvent(new CustomEvent('cart-updated'));

      return true;
    } catch (err) {
      console.error('Error eliminando del carrito:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Limpiar carrito
  const clearCart = async () => {
    if (!currentUser) return false;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error limpiando carrito');
      }

      // Recargar carrito
      await loadCart();

      // Emitir evento de actualización del carrito
      window.dispatchEvent(new CustomEvent('cart-updated'));

      return true;
    } catch (err) {
      console.error('Error limpiando carrito:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar carrito cuando el usuario cambie
  useEffect(() => {
    loadCart();
  }, [currentUser]);

  // Escuchar eventos de actualización del carrito
  useEffect(() => {
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  return {
    cart,
    loading,
    error,
    addToCart,
    updateItemQty,
    removeFromCart,
    clearCart,
    loadCart
  };
}
