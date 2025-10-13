#!/usr/bin/env node

/**
 * Script para ejecutar el SQL de place_order
 * Ejecutar con: node scripts/execute-place-order-sql.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executePlaceOrderSQL() {
  console.log('🔧 Ejecutando SQL de place_order...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // Leer el archivo SQL
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const sqlPath = join(__dirname, 'fix-place-order-global.sql');
    
    console.log(`\n📊 Leyendo archivo SQL: ${sqlPath}`);
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    console.log('✅ Archivo SQL leído correctamente');
    console.log(`📏 Tamaño del archivo: ${sqlContent.length} caracteres`);

    // Ejecutar el SQL
    console.log('\n📊 Ejecutando SQL en Supabase...');
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: sqlContent 
    });

    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      console.log('\n📋 SQL que se intentó ejecutar:');
      console.log(sqlContent.substring(0, 500) + '...');
      return;
    }

    console.log('✅ SQL ejecutado exitosamente');
    console.log('✅ Función place_order actualizada');

    // Probar la función
    console.log('\n📊 Probando la función place_order...');
    const { data: testResult, error: testError } = await supabase.rpc('place_order', {
      p_user_id: '29197e62-fef7-4ba8-808a-4dfb48aea7f5',
      p_seller_id: '8f0a8848-8647-41e7-b9d0-323ee000d379',
      p_payment_method: 'cash'
    });

    if (testError) {
      console.error('❌ Error probando función:', testError);
    } else {
      console.log('✅ Función probada exitosamente:', testResult);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

executePlaceOrderSQL();














