import React, { useState } from 'react';

interface AddToCartButtonProps {
  productId: string;
  title: string;
  price: number;
  image: string;
  sellerName: string;
  sellerId: string;
  className?: string;
  disabled?: boolean;
}

export default function AddToCartButton({
  productId,
  title,
  price,
  image,
  sellerName,
  sellerId,
  className = '',
  disabled = false
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (disabled || isAdding) return;
    
    setIsAdding(true);
    
    try {
      console.log('🛒 Agregando producto al carrito:', {
        productId,
        title,
        price,
        image,
        sellerName,
        sellerId
      });

      // Validar datos
      if (!productId || !title || typeof price !== 'number' || isNaN(price)) {
        throw new Error('Datos del producto inválidos');
      }

      // Obtener carrito actual
      let currentCart = [];
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          currentCart = JSON.parse(savedCart);
          if (!Array.isArray(currentCart)) {
            currentCart = [];
          }
        }
      } catch (error) {
        console.error('Error cargando carrito:', error);
        currentCart = [];
      }
      
      // Buscar si el producto ya existe
      const existingItemIndex = currentCart.findIndex((item: any) => item.id === productId);
      
      let updatedCart;
      if (existingItemIndex >= 0) {
        // Si existe, incrementar cantidad
        updatedCart = [...currentCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: (updatedCart[existingItemIndex].quantity || 1) + 1
        };
        console.log('✅ Cantidad incrementada:', updatedCart[existingItemIndex]);
      } else {
        // Si no existe, agregar nuevo producto
        const newItem = {
          id: productId,
          title: title,
          price: price,
          quantity: 1,
          image: image || '/placeholder-product.jpg',
          sellerName: sellerName || 'Vendedor',
          sellerId: sellerId || 'unknown'
        };
        updatedCart = [...currentCart, newItem];
        console.log('✅ Producto agregado al carrito:', newItem);
      }

      // Guardar en localStorage
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      console.log('💾 Carrito guardado en localStorage:', updatedCart);

      // Disparar evento de actualización
      window.dispatchEvent(new CustomEvent('cart-updated', {
        detail: { 
          cart: updatedCart, 
          totalItems: updatedCart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) 
        }
      }));

      // Mostrar notificación de éxito
      if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
        notification.innerHTML = `
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            ¡Producto agregado al carrito!
          </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animar la notificación
        setTimeout(() => {
          notification.classList.remove('translate-x-full');
          notification.classList.add('translate-x-0');
        }, 100);
        
        // Remover la notificación después de 2 segundos
        setTimeout(() => {
          notification.classList.remove('translate-x-0');
          notification.classList.add('translate-x-full');
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 300);
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Error agregando al carrito:', error);
      
      // Mostrar notificación de error
      if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
        notification.innerHTML = `
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Error al agregar al carrito
          </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.classList.remove('translate-x-full');
          notification.classList.add('translate-x-0');
        }, 100);
        
        setTimeout(() => {
          notification.classList.remove('translate-x-0');
          notification.classList.add('translate-x-full');
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 300);
        }, 3000);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
      className={`${className} ${disabled || isAdding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'} bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2`}
    >
      {isAdding ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Agregando...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h6" />
          </svg>
          Agregar al Carrito
        </>
      )}
    </button>
  );
}