/**
 * Tests de integración para el sistema de recompensas mejorado
 * Prueba el flujo completo: configuración → compra → ganancia de puntos → canje
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
    id: 'test-product-rewards-1',
    title: 'Producto Test Recompensas 1',
    price_cents: 600000 // $6,000 - cumple mínimo de $5,000
  },
  {
    id: 'test-product-rewards-2',
    title: 'Producto Test Recompensas 2',
    price_cents: 400000 // $4,000
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
    await supabase.from('notifications').delete().like('order_id', 'test-rewards-%');
    await supabase.from('point_redemptions').delete().like('order_id', 'test-rewards-%');
    await supabase.from('points_history').delete().like('order_id', 'test-rewards-%');
    await supabase.from('user_points').delete().eq('user_id', TEST_USERS.buyer.id);
    await supabase.from('payments').delete().like('order_id', 'test-rewards-%');
    await supabase.from('order_items').delete().like('order_id', 'test-rewards-%');
    await supabase.from('orders').delete().like('id', 'test-rewards-%');
    await supabase.from('cart_items').delete().like('cart_id', 'test-rewards-%');
    await supabase.from('carts').delete().like('id', 'test-rewards-%');
    
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
        id: 'test-rewards-cart-001',
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

async function testRewardsConfiguration() {
  console.log('\n⚙️ Test 1: Configuración de sistema de recompensas');
  
  try {
    // Configurar sistema de recompensas para el vendedor
    const { data: config, error: configError } = await supabase
      .from('seller_rewards_config')
      .upsert({
        seller_id: TEST_USERS.seller.id,
        is_active: true,
        points_per_peso: 0.0286, // 1 punto = 35 pesos
        minimum_purchase_cents: 500000 // $5,000 mínimo
      })
      .select()
      .single();

    if (configError) throw configError;
    if (!config.is_active) throw new Error('Configuración no activada');

    // Crear niveles de recompensa
    const tiers = [
      {
        seller_id: TEST_USERS.seller.id,
        tier_name: 'Bronce',
        minimum_purchase_cents: 500000, // $5,000
        points_multiplier: 1.0,
        description: 'Nivel básico',
        is_active: true
      },
      {
        seller_id: TEST_USERS.seller.id,
        tier_name: 'Plata',
        minimum_purchase_cents: 1000000, // $10,000
        points_multiplier: 1.2,
        description: 'Nivel intermedio',
        is_active: true
      },
      {
        seller_id: TEST_USERS.seller.id,
        tier_name: 'Oro',
        minimum_purchase_cents: 2000000, // $20,000
        points_multiplier: 1.5,
        description: 'Nivel premium',
        is_active: true
      }
    ];

    const { error: tiersError } = await supabase
      .from('seller_reward_tiers')
      .upsert(tiers);

    if (tiersError) throw tiersError;

    await logTest('Configuración de sistema de recompensas', true);
    return { config, tiers };
  } catch (error) {
    await logTest('Configuración de sistema de recompensas', false, error);
    return null;
  }
}

async function testOrderWithRewards() {
  console.log('\n🛒 Test 2: Crear pedido con sistema de recompensas');
  
  try {
    // Crear pedido que cumple el mínimo ($10,000 total)
    const { data: orderResult, error: orderError } = await supabase.rpc('place_order_with_expiration', {
      p_user_id: TEST_USERS.buyer.id,
      p_seller_id: TEST_USERS.seller.id,
      p_payment_method: 'cash',
      p_expiration_minutes: 15
    });

    if (orderError) throw orderError;
    if (!orderResult.success) throw new Error(orderResult.error);

    // Verificar que se creó el pedido
    const { data: order, error: orderError2 } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderResult.order_id)
      .single();

    if (orderError2) throw orderError2;
    if (order.total_cents !== 1000000) throw new Error('Total del pedido incorrecto');

    // Verificar que se otorgaron puntos
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', TEST_USERS.buyer.id)
      .eq('seller_id', TEST_USERS.seller.id)
      .single();

    if (pointsError) throw pointsError;
    if (!userPoints || userPoints.points <= 0) throw new Error('No se otorgaron puntos');

    // Verificar historial de puntos
    const { data: history, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .eq('order_id', orderResult.order_id)
      .single();

    if (historyError) throw historyError;
    if (history.transaction_type !== 'earned') throw new Error('Tipo de transacción incorrecto');

    // Verificar notificaciones
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('order_id', orderResult.order_id);

    if (notifError) throw notifError;
    if (notifications.length < 3) throw new Error('No se crearon todas las notificaciones');

    await logTest('Crear pedido con sistema de recompensas', true);
    return { order, userPoints, history, orderId: orderResult.order_id };
  } catch (error) {
    await logTest('Crear pedido con sistema de recompensas', false, error);
    return null;
  }
}

async function testTierCalculation(orderId) {
  console.log('\n🏆 Test 3: Cálculo de niveles de recompensa');
  
  try {
    // Verificar que se usó el nivel correcto (Plata para $10,000)
    const { data: history, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (historyError) throw historyError;

    // Verificar que la descripción menciona el nivel Plata
    if (!history.description.includes('Plata')) {
      throw new Error('No se aplicó el nivel correcto de recompensa');
    }

    // Verificar que se aplicó el multiplicador (1.2x)
    const expectedPoints = Math.floor(1000000 * 0.0286 * 1.2); // $10,000 * 0.0286 * 1.2
    if (history.points_earned !== expectedPoints) {
      throw new Error(`Puntos incorrectos. Esperado: ${expectedPoints}, Obtenido: ${history.points_earned}`);
    }

    await logTest('Cálculo de niveles de recompensa', true);
    return history;
  } catch (error) {
    await logTest('Cálculo de niveles de recompensa', false, error);
    return null;
  }
}

async function testPointsRedemption(orderId) {
  console.log('\n💳 Test 4: Canje de puntos');
  
  try {
    // Obtener puntos disponibles
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', TEST_USERS.buyer.id)
      .eq('seller_id', TEST_USERS.seller.id)
      .single();

    if (pointsError) throw pointsError;
    const availablePoints = userPoints.points;

    // Crear un nuevo pedido para canjear puntos
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .insert({
        id: 'test-rewards-cart-redemption',
        user_id: TEST_USERS.buyer.id,
        seller_id: TEST_USERS.seller.id
      })
      .select()
      .single();

    if (cartError) throw cartError;

    // Agregar un producto al carrito
    await supabase.from('cart_items').insert({
      cart_id: cart.id,
      product_id: 'test-product-redemption',
      title: 'Producto para Canje',
      price_cents: 500000, // $5,000
      qty: 1
    });

    // Crear pedido
    const { data: orderResult2, error: orderError2 } = await supabase.rpc('place_order_with_expiration', {
      p_user_id: TEST_USERS.buyer.id,
      p_seller_id: TEST_USERS.seller.id,
      p_payment_method: 'cash',
      p_expiration_minutes: 15
    });

    if (orderError2) throw orderError2;
    if (!orderResult2.success) throw new Error(orderResult2.error);

    // Canjear algunos puntos
    const pointsToRedeem = Math.floor(availablePoints * 0.5); // Canjear 50% de los puntos
    
    const { data: redemptionResult, error: redemptionError } = await supabase.rpc('redeem_points', {
      order_id_param: orderResult2.order_id,
      points_to_use: pointsToRedeem
    });

    if (redemptionError) throw redemptionError;

    // Verificar que se aplicó el descuento
    const { data: orderAfterRedemption, error: orderError3 } = await supabase
      .from('orders')
      .select('total_cents')
      .eq('id', orderResult2.order_id)
      .single();

    if (orderError3) throw orderError3;

    // Verificar que el total se redujo
    const originalTotal = 500000; // $5,000
    const discountCents = pointsToRedeem * 35 * 100; // 35 pesos por punto
    const expectedTotal = originalTotal - discountCents;

    if (orderAfterRedemption.total_cents !== expectedTotal) {
      throw new Error(`Total incorrecto después del canje. Esperado: ${expectedTotal}, Obtenido: ${orderAfterRedemption.total_cents}`);
    }

    // Verificar que se registró la redención
    const { data: redemption, error: redemptionError2 } = await supabase
      .from('point_redemptions')
      .select('*')
      .eq('order_id', orderResult2.order_id)
      .single();

    if (redemptionError2) throw redemptionError2;
    if (redemption.status !== 'applied') throw new Error('Redención no aplicada');

    // Verificar que se actualizaron los puntos del usuario
    const { data: updatedPoints, error: pointsError2 } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', TEST_USERS.buyer.id)
      .eq('seller_id', TEST_USERS.seller.id)
      .single();

    if (pointsError2) throw pointsError2;
    const expectedNewPoints = availablePoints - pointsToRedeem + Math.floor(500000 * 0.0286); // Puntos originales - canjeados + ganados en nuevo pedido

    if (Math.abs(updatedPoints.points - expectedNewPoints) > 1) { // Permitir diferencia de 1 punto por redondeo
      throw new Error(`Puntos del usuario incorrectos. Esperado: ~${expectedNewPoints}, Obtenido: ${updatedPoints.points}`);
    }

    await logTest('Canje de puntos', true);
    return { redemption, updatedPoints, orderId: orderResult2.order_id };
  } catch (error) {
    await logTest('Canje de puntos', false, error);
    return null;
  }
}

async function testPointsHistory() {
  console.log('\n📊 Test 5: Historial de puntos');
  
  try {
    // Obtener historial de puntos
    const { data: history, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', TEST_USERS.buyer.id)
      .eq('seller_id', TEST_USERS.seller.id)
      .order('created_at', { ascending: false });

    if (historyError) throw historyError;
    if (history.length < 3) throw new Error('Historial insuficiente');

    // Verificar que hay transacciones de ganancia y gasto
    const earnedTransactions = history.filter(h => h.transaction_type === 'earned');
    const spentTransactions = history.filter(h => h.transaction_type === 'spent');

    if (earnedTransactions.length === 0) throw new Error('No hay transacciones de ganancia');
    if (spentTransactions.length === 0) throw new Error('No hay transacciones de gasto');

    // Verificar resumen por vendedor
    const { data: summary, error: summaryError } = await supabase
      .from('user_points_summary')
      .select('*')
      .eq('user_id', TEST_USERS.buyer.id)
      .eq('seller_id', TEST_USERS.seller.id)
      .single();

    if (summaryError) throw summaryError;
    if (summary.total_points <= 0) throw new Error('Total de puntos incorrecto');

    await logTest('Historial de puntos', true);
    return { history, summary };
  } catch (error) {
    await logTest('Historial de puntos', false, error);
    return null;
  }
}

async function testRewardsToggle() {
  console.log('\n🔄 Test 6: Toggle de sistema de recompensas');
  
  try {
    // Desactivar sistema de recompensas
    const { error: deactivateError } = await supabase
      .from('seller_rewards_config')
      .update({ is_active: false })
      .eq('seller_id', TEST_USERS.seller.id);

    if (deactivateError) throw deactivateError;

    // Crear un pedido después de desactivar
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .insert({
        id: 'test-rewards-cart-inactive',
        user_id: TEST_USERS.buyer.id,
        seller_id: TEST_USERS.seller.id
      })
      .select()
      .single();

    if (cartError) throw cartError;

    await supabase.from('cart_items').insert({
      cart_id: cart.id,
      product_id: 'test-product-inactive',
      title: 'Producto Sin Puntos',
      price_cents: 600000,
      qty: 1
    });

    // Obtener puntos antes del pedido
    const { data: pointsBefore, error: pointsError1 } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', TEST_USERS.buyer.id)
      .eq('seller_id', TEST_USERS.seller.id)
      .single();

    if (pointsError1) throw pointsError1;

    // Crear pedido
    const { data: orderResult, error: orderError } = await supabase.rpc('place_order_with_expiration', {
      p_user_id: TEST_USERS.buyer.id,
      p_seller_id: TEST_USERS.seller.id,
      p_payment_method: 'cash',
      p_expiration_minutes: 15
    });

    if (orderError) throw orderError;
    if (!orderResult.success) throw new Error(orderResult.error);

    // Verificar que no se otorgaron puntos
    const { data: pointsAfter, error: pointsError2 } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', TEST_USERS.buyer.id)
      .eq('seller_id', TEST_USERS.seller.id)
      .single();

    if (pointsError2) throw pointsError2;
    if (pointsAfter.points !== pointsBefore.points) {
      throw new Error('Se otorgaron puntos cuando el sistema estaba desactivado');
    }

    // Reactivar sistema
    const { error: activateError } = await supabase
      .from('seller_rewards_config')
      .update({ is_active: true })
      .eq('seller_id', TEST_USERS.seller.id);

    if (activateError) throw activateError;

    await logTest('Toggle de sistema de recompensas', true);
    return orderResult.order_id;
  } catch (error) {
    await logTest('Toggle de sistema de recompensas', false, error);
    return null;
  }
}

async function runRewardsTests() {
  console.log('🚀 Iniciando tests de integración del sistema de recompensas\n');
  console.log('=' .repeat(70));

  try {
    // Limpiar datos previos
    await cleanupTestData();

    // Configurar datos de prueba
    await setupTestData();

    // Ejecutar tests en secuencia
    const test1Result = await testRewardsConfiguration();
    if (!test1Result) {
      console.log('\n❌ Test 1 falló, saltando tests siguientes');
      return;
    }

    const test2Result = await testOrderWithRewards();
    if (!test2Result) {
      console.log('\n❌ Test 2 falló, saltando tests siguientes');
      return;
    }

    const test3Result = await testTierCalculation(test2Result.orderId);
    if (!test3Result) {
      console.log('\n❌ Test 3 falló, saltando tests siguientes');
      return;
    }

    const test4Result = await testPointsRedemption(test2Result.orderId);
    if (!test4Result) {
      console.log('\n❌ Test 4 falló, saltando tests siguientes');
      return;
    }

    await testPointsHistory();
    await testRewardsToggle();

  } catch (error) {
    console.error('❌ Error en tests de recompensas:', error);
  } finally {
    // Limpiar datos de prueba
    await cleanupTestData();

    // Mostrar resumen
    console.log('\n' + '=' .repeat(70));
    console.log('📊 RESUMEN DE TESTS - SISTEMA DE RECOMPENSAS');
    console.log('=' .repeat(70));
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
      console.log('✨ El sistema de recompensas está funcionando correctamente');
      console.log('🏆 Características verificadas:');
      console.log('   • Configuración de recompensas por vendedor');
      console.log('   • Niveles de recompensa (Bronce, Plata, Oro)');
      console.log('   • Cálculo automático de puntos con multiplicadores');
      console.log('   • Canje de puntos con descuentos');
      console.log('   • Historial completo de transacciones');
      console.log('   • Toggle de activación/desactivación');
    } else {
      console.log('\n⚠️ Algunos tests fallaron. Revisa los errores arriba.');
    }

    // Guardar reporte
    const report = {
      timestamp: new Date().toISOString(),
      system: 'rewards',
      summary: {
        passed: testResults.passed,
        failed: testResults.failed,
        success_rate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
      },
      errors: testResults.errors
    };

    const reportPath = path.join(process.cwd(), 'test-report-rewards-system.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
  }
}

// Ejecutar tests si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runRewardsTests().catch(console.error);
}

export { runRewardsTests };










