#!/usr/bin/env node

/**
 * Script completo para configurar el sistema de órdenes
 * Ejecutar con: node scripts/setup-orders-system.js
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

async function executeSQLFile(filename) {
  try {
    console.log(`🔄 Ejecutando ${filename}...`);
    
    const sqlPath = join(__dirname, 'sql', filename);
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Dividir en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.error(`❌ Error en statement:`, error);
          console.error(`Statement:`, statement.substring(0, 100) + '...');
          return false;
        }
      }
    }
    
    console.log(`✅ ${filename} ejecutado exitosamente`);
    return true;

  } catch (error) {
    console.error(`❌ Error ejecutando ${filename}:`, error);
    return false;
  }
}

async function testOrdersSystem() {
  try {
    console.log('🧪 Probando sistema de órdenes...');
    
    // Verificar que las tablas existen
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['orders', 'order_items', 'user_points']);
    
    if (tablesError) {
      console.error('❌ Error verificando tablas:', tablesError);
      return false;
    }
    
    const tableNames = tables?.map(t => t.table_name) || [];
    console.log('📊 Tablas encontradas:', tableNames);
    
    if (tableNames.length < 3) {
      console.error('❌ No se encontraron todas las tablas necesarias');
      return false;
    }
    
    // Verificar que la función existe
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'place_order');
    
    if (functionsError) {
      console.error('❌ Error verificando funciones:', functionsError);
      return false;
    }
    
    if (!functions || functions.length === 0) {
      console.error('❌ Función place_order no encontrada');
      return false;
    }
    
    console.log('✅ Sistema de órdenes configurado correctamente');
    return true;

  } catch (error) {
    console.error('❌ Error probando sistema:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Configurando sistema completo de órdenes...');
  
  // 1. Crear tablas
  const tablesSuccess = await executeSQLFile('orders_tables.sql');
  if (!tablesSuccess) {
    console.log('❌ Error creando tablas');
    process.exit(1);
  }
  
  // 2. Crear función
  const functionSuccess = await executeSQLFile('place_order_function.sql');
  if (!functionSuccess) {
    console.log('❌ Error creando función');
    process.exit(1);
  }
  
  // 3. Probar sistema
  const testSuccess = await testOrdersSystem();
  if (!testSuccess) {
    console.log('❌ Error en pruebas del sistema');
    process.exit(1);
  }
  
  console.log('✅ Sistema de órdenes configurado completamente');
  console.log('📋 Próximos pasos:');
  console.log('   1. Configurar SUPABASE_SERVICE_ROLE_KEY en .env');
  console.log('   2. Probar endpoint POST /api/checkout');
  console.log('   3. Crear UI de checkout');
}

main().catch(console.error);




