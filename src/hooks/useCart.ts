import { useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  sellerName: string;
  sellerId: string;
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar carrito desde localStorage al inicializar
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            setCart(parsedCart);
            console.log('🛒 Carrito cargado desde localStorage:', parsedCart);
          }
        }
      } catch (error) {
        console.error('❌ Error cargando carrito:', error);
        setCart([]);
      }
    };

    loadCart();
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
      console.log('💾 Carrito guardado en localStorage:', cart);
      
      // Disparar evento de actualización del carrito
      window.dispatchEvent(new CustomEvent('cart-updated', {
        detail: { 
          cart, 
          totalItems: cart.reduce((sum, item) => sum + (item.quantity || 1), 0) 
        }
      }));
    } catch (error) {
      console.error('❌ Error guardando carrito:', error);
    }
  }, [cart]);

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    console.log('🛒 Agregando producto al carrito:', product);
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Si el producto ya existe, incrementar cantidad
        const updatedCart = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        console.log('✅ Cantidad incrementada:', updatedCart);
        return updatedCart;
      } else {
        // Si es un producto nuevo, agregarlo
        const newCart = [...prevCart, { ...product, quantity: 1 }];
        console.log('✅ Producto agregado al carrito:', newCart);
        return newCart;
      }
    });
  };

  const removeFromCart = (productId: string) => {
    console.log('🗑️ Removiendo producto del carrito:', productId);
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    console.log('🔄 Actualizando cantidad:', productId, quantity);
    
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    console.log('🧹 Limpiando carrito');
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };

  return {
    cart,
    isOpen,
    setIsOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  };
}