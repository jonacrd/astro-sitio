#!/usr/bin/env node

/**
 * Script para verificar si las tablas existen en la base de datos
 * Ejecutar con: node scripts/check-tables-exist.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTablesExist() {
  console.log('🔍 Verificando si las tablas existen en la base de datos...\n');

  const tablesToCheck = [
    { name: 'notifications', type: 'table' },
    { name: 'user_points', type: 'table' },
    { name: 'seller_orders_dashboard', type: 'view' },
    { name: 'buyer_notifications', type: 'view' },
    { name: 'user_points_summary', type: 'view' }
  ];

  let allExist = true;

  for (const table of tablesToCheck) {
    try {
      console.log(`📊 Verificando ${table.type}: ${table.name}`);
      
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST205') {
          console.log(`❌ ${table.name}: NO EXISTE`);
          allExist = false;
        } else {
          console.log(`⚠️  ${table.name}: Error - ${error.message}`);
          allExist = false;
        }
      } else {
        console.log(`✅ ${table.name}: EXISTE`);
      }
    } catch (err) {
      console.log(`❌ ${table.name}: Error - ${err.message}`);
      allExist = false;
    }
  }

  console.log('\n🎯 RESUMEN:');
  if (allExist) {
    console.log('✅ Todas las tablas y vistas existen');
    console.log('🎉 El sistema debería funcionar correctamente');
  } else {
    console.log('❌ Faltan tablas/vistas en la base de datos');
    console.log('\n📋 PASOS:');
    console.log('1. Ir a https://supabase.com/dashboard');
    console.log('2. Seleccionar tu proyecto');
    console.log('3. Ir a SQL Editor');
    console.log('4. Copiar y pegar el contenido de scripts/create-essential-tables.sql');
    console.log('5. Hacer clic en "Run"');
    console.log('6. Verificar que no haya errores');
    console.log('7. Probar la página /perfil nuevamente');
  }

  return allExist;
}

checkTablesExist();