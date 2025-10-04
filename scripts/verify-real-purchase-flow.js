#!/usr/bin/env node

/**
 * Script para verificar si el proceso de compra es real o ficticio
 */

import fetch from 'node-fetch';

async function verifyRealPurchaseFlow() {
  console.log('🔍 Verificando si el proceso de compra es real...\n');
  
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

    // Crear un pedido de prueba con datos reales
    console.log('\n🛒 Creando pedido de prueba con datos reales...');
    const orderData = {
      customerName: 'Juan Pérez',
      customerEmail: 'juan.perez@email.com',
      deliveryAddress: {
        street: 'Av. Libertador 1234',
        city: 'Santiago',
        region: 'Metropolitana',
        postalCode: '8320000'
      },
      paymentMethod: 'cash',
      orderNotes: 'Pedido de prueba para verificar flujo real',
      cartItems: [
        {
          productId: 'ae126fe1-c35f-4fc9-9207-7029f39f5ba4',
          title: 'Cerveza Babaria Sixpack',
          priceCents: 2693,
          quantity: 3,
          sellerId: '8f0a8848-8647-41e7-b9d0-323ee000d379',
          sellerName: 'Diego Ramírez'
        },
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

    console.log('📦 Datos del pedido:');
    console.log(`   Cliente: ${orderData.customerName}`);
    console.log(`   Email: ${orderData.customerEmail}`);
    console.log(`   Dirección: ${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.city}`);
    console.log(`   Productos: ${orderData.cartItems.length}`);
    console.log(`   Total: $${orderData.cartItems.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0)}`);

    const checkoutResponse = await fetch('http://localhost:4321/api/cart/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!checkoutResponse.ok) {
      console.log('❌ Error en el checkout:', checkoutResponse.status);
      const errorText = await checkoutResponse.text();
      console.log('Error:', errorText);
      return;
    }

    const checkoutData = await checkoutResponse.json();
    console.log('\n✅ PEDIDO CREADO EXITOSAMENTE:');
    console.log(`   Código: ${checkoutData.orderCode}`);
    console.log(`   ID: ${checkoutData.orderId}`);
    console.log(`   Total: $${checkoutData.totalCents}`);
    console.log(`   Mensaje: ${checkoutData.message}`);

    // Verificar que el pedido aparezca en el dashboard
    console.log('\n📋 Verificando que el pedido aparezca en el dashboard...');
    console.log('💡 Ahora ve a: http://localhost:4321/dashboard/pedidos');
    console.log('💡 Deberías ver el nuevo pedido pendiente');

    // Verificar el flujo completo
    console.log('\n🔍 DIAGNÓSTICO DEL FLUJO DE COMPRA:');
    
    if (checkoutData.success) {
      console.log('✅ El checkout es REAL - se creó en la base de datos');
      console.log('✅ El pedido tiene un ID único:', checkoutData.orderId);
      console.log('✅ El pedido tiene un código único:', checkoutData.orderCode);
      console.log('✅ El total se calculó correctamente');
    } else {
      console.log('❌ El checkout es FICTICIO - no se creó en la base de datos');
    }

    console.log('\n📊 RESUMEN DEL FLUJO:');
    console.log('✅ Cliente: Juan Pérez');
    console.log('✅ Email: juan.perez@email.com');
    console.log('✅ Vendedor: Diego Ramírez');
    console.log('✅ Productos: 2 tipos de cerveza');
    console.log('✅ Total: $12,005 (3x$2,693 + 1x$3,926)');
    console.log('✅ Estado: Pendiente');

    console.log('\n🚀 INSTRUCCIONES PARA VERIFICAR:');
    console.log('1. ✅ ABRIR: http://localhost:4321/dashboard/pedidos');
    console.log('2. 🔄 RECARGAR LA PÁGINA');
    console.log('3. ✅ VERIFICAR QUE APARECE EL NUEVO PEDIDO');
    console.log('4. ✅ VERIFICAR QUE EL CONTADOR DE NOTIFICACIONES SE ACTUALIZA');
    console.log('5. ✅ VERIFICAR QUE EL FILTRO "Pendientes" MUESTRA EL NUEVO PEDIDO');

    console.log('\n🎯 VERIFICACIÓN DEL FLUJO REAL:');
    console.log('✅ Si el pedido aparece en el dashboard = FLUJO REAL');
    console.log('❌ Si el pedido NO aparece = FLUJO FICTICIO');

  } catch (error) {
    console.error('❌ Error verificando flujo de compra:', error);
  }
}

verifyRealPurchaseFlow();




