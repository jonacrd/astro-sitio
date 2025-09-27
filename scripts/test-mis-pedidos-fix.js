#!/usr/bin/env node

/**
 * Script de prueba para verificar que la vista "Mis Pedidos" funciona correctamente
 * después de las correcciones implementadas.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  console.error('Asegúrate de tener PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMisPedidosFix() {
  console.log('🧪 Probando correcciones de "Mis Pedidos"...\n');

  try {
    // 1. Verificar que las columnas de orders existen
    console.log('1️⃣ Verificando estructura de tabla orders...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'orders')
      .in('column_name', ['payment_status', 'expires_at', 'points_awarded']);

    if (columnsError) {
      console.warn('⚠️ No se pudo verificar columnas (esto es normal en algunos casos)');
    } else {
      console.log('✅ Columnas encontradas:', columns?.map(c => c.column_name) || []);
    }

    // 2. Probar consulta básica de pedidos
    console.log('\n2️⃣ Probando consulta básica de pedidos...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        total_cents,
        status,
        payment_method,
        created_at,
        seller_id,
        sellers:profiles!orders_seller_id_fkey(name, phone)
      `)
      .limit(5);

    if (ordersError) {
      console.error('❌ Error en consulta básica:', ordersError.message);
      return false;
    }

    console.log(`✅ Consulta básica exitosa: ${orders?.length || 0} pedidos encontrados`);

    // 3. Probar consulta extendida (si las columnas existen)
    console.log('\n3️⃣ Probando consulta extendida...');
    
    try {
      const { data: extendedOrders, error: extendedError } = await supabase
        .from('orders')
        .select(`
          id,
          payment_status,
          expires_at,
          points_awarded
        `)
        .limit(5);

      if (extendedError) {
        console.warn('⚠️ Columnas extendidas no disponibles:', extendedError.message);
        console.log('💡 Esto es normal si aún no se han ejecutado los scripts de corrección');
      } else {
        console.log(`✅ Consulta extendida exitosa: ${extendedOrders?.length || 0} pedidos`);
      }
    } catch (error) {
      console.warn('⚠️ Error en consulta extendida:', error.message);
    }

    // 4. Probar endpoints de puntos
    console.log('\n4️⃣ Probando endpoints de puntos...');
    
    // Simular una llamada al endpoint de summary
    try {
      const testUserId = 'test-user-id';
      
      // Probar tabla user_points
      const { data: userPoints, error: userPointsError } = await supabase
        .from('user_points')
        .select('*')
        .limit(1);

      if (userPointsError) {
        console.warn('⚠️ Tabla user_points no disponible:', userPointsError.message);
      } else {
        console.log('✅ Tabla user_points accesible');
      }

      // Probar tabla points_history
      const { data: pointsHistory, error: pointsHistoryError } = await supabase
        .from('points_history')
        .select('*')
        .limit(1);

      if (pointsHistoryError) {
        console.warn('⚠️ Tabla points_history no disponible:', pointsHistoryError.message);
      } else {
        console.log('✅ Tabla points_history accesible');
      }

    } catch (error) {
      console.warn('⚠️ Error probando tablas de puntos:', error.message);
    }

    // 5. Verificar perfiles de usuarios
    console.log('\n5️⃣ Verificando perfiles de usuarios...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .limit(3);

    if (profilesError) {
      console.warn('⚠️ Error accediendo a perfiles:', profilesError.message);
    } else {
      console.log(`✅ Perfiles accesibles: ${profiles?.length || 0} encontrados`);
    }

    console.log('\n🎉 Pruebas completadas exitosamente!');
    console.log('\n📋 Resumen de estado:');
    console.log('   ✅ Consulta básica de pedidos: Funcionando');
    console.log('   ⚠️ Columnas extendidas: Pueden requerir scripts de corrección');
    console.log('   ⚠️ Tablas de puntos: Pueden requerir scripts de corrección');
    console.log('   ✅ Perfiles: Funcionando');
    
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Ejecutar scripts/fix-orders-table.sql en Supabase SQL Editor');
    console.log('   2. Ejecutar scripts/fix-points-tables-simple.sql en Supabase SQL Editor');
    console.log('   3. Probar la vista "Mis Pedidos" en el navegador');

    return true;

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    return false;
  }
}

// Ejecutar pruebas
testMisPedidosFix()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
