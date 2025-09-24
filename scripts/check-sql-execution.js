#!/usr/bin/env node

/**
 * Script para verificar si el SQL se ejecutó correctamente
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSqlExecution() {
  console.log('🔍 Verificando si el SQL se ejecutó correctamente...');
  console.log('📊 URL de Supabase:', supabaseUrl);
  console.log('');

  try {
    // Intentar ejecutar el SQL directamente
    console.log('🔧 Intentando ejecutar el SQL directamente...');
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID;' 
    });

    if (error) {
      console.log('❌ Error ejecutando SQL:', error.message);
      console.log('');
      console.log('🎯 POSIBLES CAUSAS:');
      console.log('1. No tienes permisos de administrador');
      console.log('2. La función exec_sql no existe');
      console.log('3. Estás en el proyecto equivocado');
      console.log('');
      console.log('📋 SOLUCIÓN MANUAL:');
      console.log('1. Ve a https://supabase.com/dashboard');
      console.log('2. Asegúrate de estar en el proyecto correcto');
      console.log('3. Ve a SQL Editor');
      console.log('4. Ejecuta manualmente:');
      console.log('   ALTER TABLE orders ADD COLUMN buyer_id UUID;');
      console.log('5. Verifica que no haya errores');
      
    } else {
      console.log('✅ SQL ejecutado exitosamente');
      console.log('📊 Resultado:', data);
    }

    // Verificar si la columna existe ahora
    console.log('');
    console.log('🔍 Verificando si buyer_id existe ahora...');
    
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('buyer_id')
      .limit(1);

    if (testError) {
      console.log('❌ La columna buyer_id AÚN NO EXISTE');
      console.log('Error:', testError.message);
    } else {
      console.log('✅ La columna buyer_id SÍ EXISTE ahora');
      console.log('📊 Datos:', testData);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkSqlExecution();
