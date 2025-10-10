#!/usr/bin/env node

/**
 * Script para diagnosticar el problema del dashboard de pedidos
 */

import fetch from 'node-fetch';

async function debugDashboardOrders() {
  console.log('🔍 Diagnosticando problema del dashboard de pedidos...\n');
  
  try {
    // Verificar que el servidor esté ejecutándose
    console.log('🌐 Verificando servidor...');
    const healthResponse = await fetch('http://localhost:4321/');
    
    if (!healthResponse.ok) {
      console.log('❌ Servidor no está ejecutándose');
      console.log('💡 Ejecuta: npm run dev');
      return;
    }
    
    console.log('✅ Servidor ejecutándose');

    // Verificar si hay pedidos en la base de datos
    console.log('\n📦 Verificando pedidos en la base de datos...');
    
    // Crear otro pedido de prueba para asegurar que hay datos
    console.log('🛒 Creando pedido adicional de prueba...');
    const orderData = {
      customerName: 'Cliente de Prueba 2',
      customerEmail: 'cliente2@prueba.com',
      deliveryAddress: {
        street: 'Calle de Prueba 456',
        city: 'Santiago',
        region: 'Metropolitana'
      },
      paymentMethod: 'cash',
      orderNotes: 'Segundo pedido de prueba',
      cartItems: [
        {
          productId: '07c3ce41-031c-4bbb-ada3-30c847605efd',
          title: 'Cerveza Corona Sixpack',
          priceCents: 3926,
          quantity: 1,
          sellerId: '8f0a8848-8647-41e7-b9d0-323ee000d379',
          sellerName: 'Diego Ramírez'
        }
      ]
    };

    const checkoutResponse = await fetch('http://localhost:4321/api/cart/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (checkoutResponse.ok) {
      const checkoutData = await checkoutResponse.json();
      console.log('✅ Segundo pedido creado exitosamente');
      console.log(`   Código: ${checkoutData.orderCode}`);
      console.log(`   Total: $${checkoutData.totalCents}`);
    } else {
      console.log('⚠️ Error creando segundo pedido');
    }

    console.log('\n🔧 DIAGNÓSTICO DEL PROBLEMA:');
    console.log('❌ El dashboard no muestra pedidos');
    console.log('❌ El filtro "Pendientes" no funciona');
    console.log('❌ Solo muestra el contador pero no los pedidos');

    console.log('\n💡 POSIBLES CAUSAS:');
    console.log('1. ❌ Problema con la consulta a Supabase');
    console.log('2. ❌ Problema con la autenticación del usuario');
    console.log('3. ❌ Problema con el UUID del vendedor');
    console.log('4. ❌ Problema con el renderizado de los pedidos');

    console.log('\n🔧 SOLUCIONES A APLICAR:');
    console.log('1. ✅ Verificar que el UUID del vendedor sea correcto');
    console.log('2. ✅ Simplificar la consulta de pedidos');
    console.log('3. ✅ Agregar logs de depuración');
    console.log('4. ✅ Arreglar el filtrado de pedidos');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

debugDashboardOrders();








