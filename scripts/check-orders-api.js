#!/usr/bin/env node

/**
 * Script para verificar pedidos usando la API
 */

import fetch from 'node-fetch';

async function checkOrdersAPI() {
  console.log('🔍 Verificando pedidos usando la API...\n');
  
  try {
    // Verificar si el servidor está ejecutándose
    console.log('🌐 Verificando servidor...');
    const healthResponse = await fetch('http://localhost:4321/');
    
    if (!healthResponse.ok) {
      console.log('❌ Servidor no está ejecutándose');
      console.log('💡 Ejecuta: npm run dev');
      return;
    }
    
    console.log('✅ Servidor ejecutándose');

    // Crear un pedido de prueba
    console.log('\n🛒 Creando pedido de prueba...');
    const orderData = {
      customerName: 'Cliente de Prueba',
      customerEmail: 'cliente@prueba.com',
      deliveryAddress: {
        street: 'Calle de Prueba 123',
        city: 'Santiago',
        region: 'Metropolitana'
      },
      paymentMethod: 'cash',
      orderNotes: 'Pedido de prueba para verificar dashboard',
      cartItems: [
        {
          productId: 'ae126fe1-c35f-4fc9-9207-7029f39f5ba4',
          title: 'Cerveza Babaria Sixpack',
          priceCents: 2693,
          quantity: 2,
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

    if (!checkoutResponse.ok) {
      console.log('❌ Error creando pedido:', checkoutResponse.status);
      const errorText = await checkoutResponse.text();
      console.log('Error:', errorText);
      return;
    }

    const checkoutData = await checkoutResponse.json();
    console.log('✅ Pedido creado exitosamente');
    console.log(`   Código: ${checkoutData.orderCode}`);
    console.log(`   Total: $${checkoutData.totalCents}`);
    console.log(`   ID: ${checkoutData.orderId}`);

    // Verificar que el pedido aparezca en el dashboard
    console.log('\n📋 Verificando dashboard de vendedores...');
    console.log('💡 Ahora ve a: http://localhost:4321/dashboard/pedidos');
    console.log('💡 Deberías ver el pedido pendiente para Diego Ramírez');

    console.log('\n🎯 VENDEDORES QUE DEBERÍAN VER EL PEDIDO:');
    console.log('✅ Diego Ramírez (8f0a8848-8647-41e7-b9d0-323ee000d379)');
    console.log('   - Debería ver 1 pedido pendiente');
    console.log('   - Total: $5,386 (2 cervezas x $2,693)');

    console.log('\n📊 RESUMEN:');
    console.log('✅ Pedido de prueba creado');
    console.log('✅ Vendedor: Diego Ramírez');
    console.log('✅ Producto: Cerveza Babaria Sixpack');
    console.log('✅ Cantidad: 2 unidades');
    console.log('✅ Total: $5,386');

    console.log('\n🚀 INSTRUCCIONES:');
    console.log('1. ✅ ABRIR: http://localhost:4321/dashboard/pedidos');
    console.log('2. 🔄 RECARGAR LA PÁGINA');
    console.log('3. ✅ VERIFICAR QUE APARECE EL PEDIDO PENDIENTE');
    console.log('4. ✅ VERIFICAR QUE EL CONTADOR DE NOTIFICACIONES SE ACTUALIZA');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    console.log('\n💡 Asegúrate de que el servidor esté ejecutándose:');
    console.log('   npm run dev');
  }
}

checkOrdersAPI();










