/**
 * Tests de integración para el checkout robusto
 * Prueba el flujo completo: pedido → transferencia → validación → notificaciones
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuración
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

if (!supabaseServiceKey || supabaseServiceKey === 'your-service-key') {
  console.error('❌ Configura SUPABASE_SERVICE_ROLE_KEY en tu archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos de prueba
const TEST_USERS = {
  buyer: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'comprador@test.com'
  },
  seller: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'vendedor@test.com'
  }
};

const TEST_PRODUCTS = [
  {
    id: 'test-product-1',
    title: 'Producto Test 1',
    price_cents: 5000
  },
  {
    id: 'test-product-2',
    title: 'Producto Test 2',
    price_cents: 3000
  }
];

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

async function logTest(testName, success, error = null) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
    if (error) {
      testResults.errors.push(`${testName}: ${error.message}`);
      console.error(`   Error: ${error.message}`);
    }
  }
}

async function cleanupTestData() {
  console.log('🧹 Limpiando datos de prueba...');
  
  try {
    // Eliminar en orden correcto por las foreign keys
    await supabase.from('notifications').delete().like('order_id', 'test-order-%');
    await supabase.from('payments').delete().like('order_id', 'test-order-%');
    await supabase.from('order_items').delete().like('order_id', 'test-order-%');
    await supabase.from('orders').delete().like('id', 'test-order-%');
    await supabase.from('cart_items').delete().like('cart_id', 'test-cart-%');
    await supabase.from('carts').delete().like('id', 'test-cart-%');
    
    console.log('✅ Datos de prueba limpiados');
  } catch (error) {
    console.warn('⚠️ Error limpiando datos:', error.message);
  }
}

async function setupTestData() {
  console.log('🔧 Configurando datos de prueba...');
  
  try {
    // Crear carrito de prueba
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .insert({
        id: 'test-cart-001',
        user_id: TEST_USERS.buyer.id,
        seller_id: TEST_USERS.seller.id
      })
      .select()
      .single();

    if (cartError) throw cartError;

    // Agregar items al carrito
    const cartItems = TEST_PRODUCTS.map(product => ({
      cart_id: cart.id,
      product_id: product.id,
      title: product.title,
      price_cents: product.price_cents,
      qty: 1
    }));

    const { error: itemsError } = await supabase
      .from('cart_items')
      .insert(cartItems);

    if (itemsError) throw itemsError;

    console.log('✅ Datos de prueba configurados');
    return cart;
  } catch (error) {
    console.error('❌ Error configurando datos:', error.message);
    throw error;
  }
}

async function testCreateOrderWithExpiration() {
  console.log('\n📋 Test 1: Crear pedido con expiración');
  
  try {
    const { data, error } = await supabase.rpc('place_order_with_expiration', {
      p_user_id: TEST_USERS.buyer.id,
      p_seller_id: TEST_USERS.seller.id,
      p_payment_method: 'transfer',
      p_expiration_minutes: 15
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    // Verificar que el pedido se creó correctamente
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', data.order_id)
      .single();

    if (orderError) throw orderError;
    if (!order.expires_at) throw new Error('expires_at no se estableció');
    if (order.status !== 'placed') throw new Error('Estado incorrecto del pedido');
    if (order.payment_status !== 'pending') throw new Error('Estado de pago incorrecto');

    // Verificar que el pago se creó
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', data.order_id)
      .single();

    if (paymentError) throw paymentError;
    if (payment.status !== 'pending') throw new Error('Estado de pago incorrecto');

    // Verificar notificaciones
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('order_id', data.order_id);

    if (notifError) throw notifError;
    if (notifications.length < 2) throw new Error('No se crearon todas las notificaciones');

    await logTest('Crear pedido con expiración', true);
    return { order, payment, orderId: data.order_id };
  } catch (error) {
    await logTest('Crear pedido con expiración', false, error);
    return null;
  }
}

async function testUploadReceipt(orderId) {
  console.log('\n📄 Test 2: Subir comprobante de transferencia');
  
  try {
    // Simular subida de comprobante (en producción sería un archivo real)
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('transferDetails', JSON.stringify({
      bank: 'Banco Test',
      account: '1234567890',
      amount: '80.00'
    }));
    
    // Crear un archivo de prueba en memoria
    const testFile = new File(['test receipt content'], 'receipt.jpg', { type: 'image/jpeg' });
    formData.append('receipt', testFile);

    // Simular la llamada al endpoint (en producción sería una petición HTTP real)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        transfer_receipt_url: 'https://example.com/receipt.jpg',
        transfer_details: {
          bank: 'Banco Test',
          account: '1234567890',
          amount: '80.00'
        },
        status: 'pending_review'
      })
      .eq('order_id', orderId)
      .select()
      .single();

    if (paymentError) throw paymentError;
    if (payment.status !== 'pending_review') throw new Error('Estado de pago no actualizado');

    // Verificar que se actualizó el estado del pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (order.payment_status !== 'pending_review') throw new Error('Estado del pedido no actualizado');

    await logTest('Subir comprobante de transferencia', true);
    return payment;
  } catch (error) {
    await logTest('Subir comprobante de transferencia', false, error);
    return null;
  }
}

async function testValidateReceipt(paymentId) {
  console.log('\n✅ Test 3: Validar comprobante de transferencia');
  
  try {
    // Aprobar el pago
    const { data, error } = await supabase.rpc('validate_transfer_receipt', {
      p_payment_id: paymentId,
      p_reviewer_id: TEST_USERS.seller.id,
      p_approved: true,
      p_rejection_reason: null
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    // Verificar que el pago se aprobó
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError) throw paymentError;
    if (payment.status !== 'confirmed') throw new Error('Estado de pago no confirmado');
    if (!payment.reviewed_by) throw new Error('reviewed_by no establecido');
    if (!payment.reviewed_at) throw new Error('reviewed_at no establecido');

    // Verificar que el pedido se confirmó
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', payment.order_id)
      .single();

    if (orderError) throw orderError;
    if (order.payment_status !== 'confirmed') throw new Error('Estado de pago del pedido no confirmado');
    if (order.status !== 'seller_confirmed') throw new Error('Estado del pedido no confirmado');

    // Verificar notificaciones de confirmación
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('order_id', order.id)
      .eq('type', 'payment_confirmed');

    if (notifError) throw notifError;
    if (notifications.length < 2) throw new Error('No se crearon notificaciones de confirmación');

    await logTest('Validar comprobante de transferencia', true);
    return { payment, order };
  } catch (error) {
    await logTest('Validar comprobante de transferencia', false, error);
    return null;
  }
}

async function testExpiredOrderCancellation() {
  console.log('\n⏰ Test 4: Cancelación de pedidos expirados');
  
  try {
    // Crear un pedido que expire en 1 segundo
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .insert({
        id: 'test-cart-expired',
        user_id: TEST_USERS.buyer.id,
        seller_id: TEST_USERS.seller.id
      })
      .select()
      .single();

    if (cartError) throw cartError;

    // Agregar item al carrito
    await supabase.from('cart_items').insert({
      cart_id: cart.id,
      product_id: 'test-product-expired',
      title: 'Producto Expirado',
      price_cents: 1000,
      qty: 1
    });

    // Crear pedido con expiración muy corta
    const { data, error } = await supabase.rpc('place_order_with_expiration', {
      p_user_id: TEST_USERS.buyer.id,
      p_seller_id: TEST_USERS.seller.id,
      p_payment_method: 'transfer',
      p_expiration_minutes: 0.01 // 0.6 segundos
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    // Esperar a que expire
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Ejecutar función de cancelación
    const { data: cancelledCount, error: cancelError } = await supabase.rpc('cancel_expired_orders');

    if (cancelError) throw cancelError;
    if (cancelledCount < 1) throw new Error('No se canceló ningún pedido expirado');

    // Verificar que el pedido se canceló
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', data.order_id)
      .single();

    if (orderError) throw orderError;
    if (order.status !== 'cancelled') throw new Error('Pedido no cancelado');
    if (order.payment_status !== 'rejected') throw new Error('Pago no rechazado');

    await logTest('Cancelación de pedidos expirados', true);
    return order;
  } catch (error) {
    await logTest('Cancelación de pedidos expirados', false, error);
    return null;
  }
}

async function testNotificationSystem(orderId) {
  console.log('\n🔔 Test 5: Sistema de notificaciones');
  
  try {
    // Verificar que se crearon notificaciones para el comprador
    const { data: buyerNotifications, error: buyerError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', TEST_USERS.buyer.id)
      .eq('order_id', orderId);

    if (buyerError) throw buyerError;
    if (buyerNotifications.length === 0) throw new Error('No se crearon notificaciones para el comprador');

    // Verificar que se crearon notificaciones para el vendedor
    const { data: sellerNotifications, error: sellerError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', TEST_USERS.seller.id)
      .eq('order_id', orderId);

    if (sellerError) throw sellerError;
    if (sellerNotifications.length === 0) throw new Error('No se crearon notificaciones para el vendedor');

    // Verificar tipos de notificaciones
    const notificationTypes = [...buyerNotifications, ...sellerNotifications].map(n => n.type);
    const expectedTypes = ['order_placed', 'new_order', 'payment_confirmed'];
    
    const hasAllTypes = expectedTypes.every(type => notificationTypes.includes(type));
    if (!hasAllTypes) throw new Error('Faltan tipos de notificaciones esperados');

    await logTest('Sistema de notificaciones', true);
    return { buyerNotifications, sellerNotifications };
  } catch (error) {
    await logTest('Sistema de notificaciones', false, error);
    return null;
  }
}

async function runIntegrationTests() {
  console.log('🚀 Iniciando tests de integración del checkout robusto\n');
  console.log('=' .repeat(60));

  try {
    // Limpiar datos previos
    await cleanupTestData();

    // Configurar datos de prueba
    await setupTestData();

    // Ejecutar tests en secuencia
    const test1Result = await testCreateOrderWithExpiration();
    if (!test1Result) {
      console.log('\n❌ Test 1 falló, saltando tests siguientes');
      return;
    }

    const test2Result = await testUploadReceipt(test1Result.orderId);
    if (!test2Result) {
      console.log('\n❌ Test 2 falló, saltando tests siguientes');
      return;
    }

    const test3Result = await testValidateReceipt(test2Result.id);
    if (!test3Result) {
      console.log('\n❌ Test 3 falló, saltando tests siguientes');
      return;
    }

    await testExpiredOrderCancellation();
    await testNotificationSystem(test1Result.orderId);

  } catch (error) {
    console.error('❌ Error en tests de integración:', error);
  } finally {
    // Limpiar datos de prueba
    await cleanupTestData();

    // Mostrar resumen
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMEN DE TESTS');
    console.log('=' .repeat(60));
    console.log(`✅ Tests pasados: ${testResults.passed}`);
    console.log(`❌ Tests fallidos: ${testResults.failed}`);
    console.log(`📈 Tasa de éxito: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

    if (testResults.errors.length > 0) {
      console.log('\n🚨 ERRORES ENCONTRADOS:');
      testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (testResults.failed === 0) {
      console.log('\n🎉 ¡Todos los tests pasaron exitosamente!');
      console.log('✨ El sistema de checkout robusto está funcionando correctamente');
    } else {
      console.log('\n⚠️ Algunos tests fallaron. Revisa los errores arriba.');
    }

    // Guardar reporte
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: testResults.passed,
        failed: testResults.failed,
        success_rate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
      },
      errors: testResults.errors
    };

    const reportPath = path.join(process.cwd(), 'test-report-checkout-robusto.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
  }
}

// Ejecutar tests si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests().catch(console.error);
}

export { runIntegrationTests };





