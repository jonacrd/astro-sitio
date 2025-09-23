/**
 * Store para manejar el estado del carrito y la tienda activa
 */

import React from 'react';

interface CartStore {
  activeSellerId: string | null;
  activeSellerName: string | null;
  itemCount: number;
  totalCents: number;
}

class CartStoreManager {
  private store: CartStore = {
    activeSellerId: null,
    activeSellerName: null,
    itemCount: 0,
    totalCents: 0
  };

  private listeners: Set<(store: CartStore) => void> = new Set();

  constructor() {
    // Cargar estado desde localStorage al inicializar
    this.loadFromStorage();
  }

  // Cargar estado desde localStorage
  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cart-store');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.store = { ...this.store, ...parsed };
          console.log('🔄 CartStore: Loaded from storage:', this.store);
        }
      }
    } catch (error) {
      console.error('Error loading cart store from storage:', error);
    }
  }

  // Guardar estado en localStorage
  private saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart-store', JSON.stringify(this.store));
        console.log('💾 CartStore: Saved to storage:', this.store);
      }
    } catch (error) {
      console.error('Error saving cart store to storage:', error);
    }
  }

  // Obtener el estado actual
  getState(): CartStore {
    return { ...this.store };
  }

  // Suscribirse a cambios
  subscribe(listener: (store: CartStore) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notificar a todos los listeners
  private notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // Establecer tienda activa
  setActiveSeller(sellerId: string, sellerName: string) {
    this.store.activeSellerId = sellerId;
    this.store.activeSellerName = sellerName;
    this.saveToStorage();
    this.notify();
  }

  // Limpiar tienda activa
  clearActiveSeller() {
    this.store.activeSellerId = null;
    this.store.activeSellerName = null;
    this.store.itemCount = 0;
    this.store.totalCents = 0;
    this.saveToStorage();
    this.notify();
  }

  // Actualizar contadores del carrito
  updateCartStats(itemCount: number, totalCents: number) {
    this.store.itemCount = itemCount;
    this.store.totalCents = totalCents;
    this.saveToStorage();
    this.notify();
  }

  // Verificar si se puede agregar producto de otra tienda
  canAddFromSeller(sellerId: string): { canAdd: boolean; message?: string } {
    console.log('🔍 canAddFromSeller called with:', { sellerId, activeSellerId: this.store.activeSellerId, activeSellerName: this.store.activeSellerName });
    
    if (!this.store.activeSellerId) {
      console.log('✅ No active seller, can add');
      return { canAdd: true };
    }

    if (this.store.activeSellerId === sellerId) {
      console.log('✅ Same seller, can add');
      return { canAdd: true };
    }

    console.log('❌ Different seller, cannot add');
    return {
      canAdd: false,
      message: `Ya tienes productos de ${this.store.activeSellerName} en tu carrito. No puedes agregar productos de otras tiendas. Primero finaliza tu compra actual o vacía el carrito.`
    };
  }

  // Obtener información de la tienda activa
  getActiveSellerInfo(): { sellerId: string; sellerName: string } | null {
    if (!this.store.activeSellerId || !this.store.activeSellerName) {
      return null;
    }
    return {
      sellerId: this.store.activeSellerId,
      sellerName: this.store.activeSellerName
    };
  }
}

// Instancia global del store
export const cartStore = new CartStoreManager();

// Hook para usar en React
export function useCartStore() {
  const [store, setStore] = React.useState(cartStore.getState());

  React.useEffect(() => {
    const unsubscribe = cartStore.subscribe(setStore);
    return unsubscribe;
  }, []);

  return store;
}

