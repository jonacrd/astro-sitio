import React, { useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

export default function CartDebugButton() {
  const [loading, setLoading] = useState(false);

  const testAddToCart = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing cart functionality...');
      
      // Obtener sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('No hay sesión activa. Inicia sesión primero.');
        return;
      }

      // Datos de prueba
      const testData = {
        sellerId: '8f0a8848-8647-41e7-b9d0-323ee000d379', // techstore
        productId: '550e8400-e29b-41d4-a716-446655440000', // Producto de prueba
        title: 'Producto de Prueba',
        price_cents: 1000,
        qty: 1
      };

      console.log('📡 Enviando datos de prueba:', testData);

      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      console.log('📋 Resultado:', result);

      if (result.success) {
        alert(`¡Producto agregado! Items: ${result.itemCount}, Total: $${(result.totalCents / 100).toFixed(2)}`);
        
        // Disparar evento
        const cartUpdateEvent = new CustomEvent("cart-updated", {
          detail: {
            itemCount: result.itemCount,
            totalCents: result.totalCents,
            productId: testData.productId,
            action: 'add'
          },
        });
        
        window.dispatchEvent(cartUpdateEvent);
        document.dispatchEvent(cartUpdateEvent);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error en prueba:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={testAddToCart}
        disabled={loading}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
      >
        {loading ? 'Probando...' : '🧪 Test Cart'}
      </button>
    </div>
  );
}
