/**
 * Script para probar los endpoints de puntos y verificar que funcionen correctamente
 */

import { createClient } from '@supabase/supabase-js';

// Configuración
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

if (!supabaseServiceKey || supabaseServiceKey === 'your-service-key') {
  console.error('❌ Configura SUPABASE_SERVICE_ROLE_KEY en tu archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPointsTables() {
  console.log('🔍 Probando tablas de puntos...\n');

  try {
    // 1. Verificar que las tablas existen
    console.log('1. Verificando existencia de tablas...');
    
    const tables = ['user_points', 'points_history', 'point_redemptions', 'seller_rewards_config', 'seller_reward_tiers'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: ${err.message}`);
      }
    }

    // 2. Verificar estructura de user_points
    console.log('\n2. Verificando estructura de user_points...');
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('id, user_id, seller_id, points')
        .limit(1);
      
      if (error) {
        console.log(`❌ Error en user_points: ${error.message}`);
      } else {
        console.log('✅ Estructura de user_points: OK');
      }
    } catch (err) {
      console.log(`❌ Error en user_points: ${err.message}`);
    }

    // 3. Verificar estructura de points_history
    console.log('\n3. Verificando estructura de points_history...');
    try {
      const { data, error } = await supabase
        .from('points_history')
        .select('id, user_id, seller_id, order_id, points_earned, points_spent, transaction_type')
        .limit(1);
      
      if (error) {
        console.log(`❌ Error en points_history: ${error.message}`);
      } else {
        console.log('✅ Estructura de points_history: OK');
      }
    } catch (err) {
      console.log(`❌ Error en points_history: ${err.message}`);
    }

    // 4. Crear datos de prueba
    console.log('\n4. Creando datos de prueba...');
    
    // Crear un usuario de prueba
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testSellerId = '00000000-0000-0000-0000-000000000002';
    const testOrderId = '00000000-0000-0000-0000-000000000003';

    // Insertar configuración de recompensas
    const { error: configError } = await supabase
      .from('seller_rewards_config')
      .upsert({
        seller_id: testSellerId,
        is_active: true,
        points_per_peso: 0.0286,
        minimum_purchase_cents: 500000
      });

    if (configError) {
      console.log(`❌ Error creando configuración: ${configError.message}`);
    } else {
      console.log('✅ Configuración de recompensas creada');
    }

    // Insertar puntos de usuario
    const { error: pointsError } = await supabase
      .from('user_points')
      .upsert({
        user_id: testUserId,
        seller_id: testSellerId,
        points: 100,
        source: 'test'
      });

    if (pointsError) {
      console.log(`❌ Error creando puntos de usuario: ${pointsError.message}`);
    } else {
      console.log('✅ Puntos de usuario creados');
    }

    // Insertar historial de puntos
    const { error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: testUserId,
        seller_id: testSellerId,
        order_id: testOrderId,
        points_earned: 50,
        transaction_type: 'earned',
        description: 'Puntos de prueba'
      });

    if (historyError) {
      console.log(`❌ Error creando historial: ${historyError.message}`);
    } else {
      console.log('✅ Historial de puntos creado');
    }

    // 5. Probar consultas que usan los endpoints
    console.log('\n5. Probando consultas de endpoints...');

    // Probar consulta de historial
    try {
      const { data: historyData, error: historyQueryError } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', testUserId);

      if (historyQueryError) {
        console.log(`❌ Error en consulta de historial: ${historyQueryError.message}`);
      } else {
        console.log(`✅ Consulta de historial: ${historyData?.length || 0} registros`);
      }
    } catch (err) {
      console.log(`❌ Error en consulta de historial: ${err.message}`);
    }

    // Probar consulta de resumen
    try {
      const { data: summaryData, error: summaryQueryError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', testUserId);

      if (summaryQueryError) {
        console.log(`❌ Error en consulta de resumen: ${summaryQueryError.message}`);
      } else {
        console.log(`✅ Consulta de resumen: ${summaryData?.length || 0} registros`);
      }
    } catch (err) {
      console.log(`❌ Error en consulta de resumen: ${err.message}`);
    }

    // 6. Limpiar datos de prueba
    console.log('\n6. Limpiando datos de prueba...');
    
    await supabase.from('points_history').delete().eq('user_id', testUserId);
    await supabase.from('user_points').delete().eq('user_id', testUserId);
    await supabase.from('seller_rewards_config').delete().eq('seller_id', testSellerId);
    
    console.log('✅ Datos de prueba limpiados');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

async function testEndpoints() {
  console.log('\n🌐 Probando endpoints...\n');

  try {
    // Probar endpoint de historial
    console.log('1. Probando /api/points/history...');
    const historyResponse = await fetch(`${supabaseUrl.replace('.co', '.dev')}/api/points/history?userId=00000000-0000-0000-0000-000000000001`);
    const historyData = await historyResponse.json();
    
    if (historyResponse.ok) {
      console.log('✅ Endpoint de historial: OK');
      console.log(`   Respuesta: ${JSON.stringify(historyData).substring(0, 100)}...`);
    } else {
      console.log(`❌ Endpoint de historial: ${historyResponse.status} - ${historyData.error}`);
    }

    // Probar endpoint de resumen
    console.log('\n2. Probando /api/points/summary...');
    const summaryResponse = await fetch(`${supabaseUrl.replace('.co', '.dev')}/api/points/summary?userId=00000000-0000-0000-0000-000000000001`);
    const summaryData = await summaryResponse.json();
    
    if (summaryResponse.ok) {
      console.log('✅ Endpoint de resumen: OK');
      console.log(`   Respuesta: ${JSON.stringify(summaryData).substring(0, 100)}...`);
    } else {
      console.log(`❌ Endpoint de resumen: ${summaryResponse.status} - ${summaryData.error}`);
    }

  } catch (error) {
    console.error('❌ Error probando endpoints:', error);
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de sistema de puntos\n');
  console.log('=' .repeat(50));

  await testPointsTables();
  await testEndpoints();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Pruebas completadas');
  console.log('\n📋 Resumen:');
  console.log('- Verificar que todas las tablas estén marcadas como ✅');
  console.log('- Si hay errores ❌, ejecuta el script fix-points-tables.sql');
  console.log('- Los endpoints deberían responder con código 200');
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
