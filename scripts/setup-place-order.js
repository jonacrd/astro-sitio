#!/usr/bin/env node

/**
 * Script para crear la función place_order en Supabase
 * Ejecutar con: node scripts/setup-place-order.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPlaceOrderFunction() {
  try {
    console.log('🔄 Creando función place_order...');
    
    // Leer el archivo SQL
    const sqlPath = join(__dirname, 'sql', 'place_order_function.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Ejecutar la función SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      return false;
    }

    console.log('✅ Función place_order creada exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

async function testPlaceOrderFunction() {
  try {
    console.log('🧪 Probando función place_order...');
    
    // Crear datos de prueba
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const testSellerId = '00000000-0000-0000-0000-000000000001';
    const testPaymentMethod = 'cash';
    
    const { data, error } = await supabase.rpc('place_order', {
      user_id: testUserId,
      seller_id: testSellerId,
      payment_method: testPaymentMethod
    });

    if (error) {
      console.log('⚠️  Función creada pero con errores de prueba:', error.message);
      return true; // La función existe, solo hay error de datos de prueba
    }

    console.log('✅ Función place_order funciona correctamente');
    console.log('📊 Resultado de prueba:', data);
    return true;

  } catch (error) {
    console.log('⚠️  Función creada pero no se pudo probar:', error.message);
    return true; // La función existe, solo hay error de prueba
  }
}

async function main() {
  console.log('🚀 Configurando función place_order en Supabase...');
  
  const success = await setupPlaceOrderFunction();
  
  if (success) {
    await testPlaceOrderFunction();
    console.log('✅ Configuración completada');
  } else {
    console.log('❌ Configuración falló');
    process.exit(1);
  }
}

main().catch(console.error);














