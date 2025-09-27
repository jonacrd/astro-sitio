#!/usr/bin/env node

/**
 * Script para verificar si las tablas del sistema de recompensas existen
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkTables() {
  console.log('🔍 Verificando tablas del sistema de recompensas...\n');

  const tables = [
    'seller_rewards_config',
    'seller_reward_tiers', 
    'point_redemptions',
    'points_history'
  ];

  for (const tableName of tables) {
    try {
      console.log(`📊 Verificando tabla: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          console.log(`❌ Tabla ${tableName} NO existe`);
        } else {
          console.log(`⚠️  Error verificando ${tableName}:`, error.message);
        }
      } else {
        console.log(`✅ Tabla ${tableName} existe`);
        console.log(`   📦 Registros: ${data?.length || 0}`);
      }
    } catch (err) {
      console.log(`❌ Error verificando ${tableName}:`, err.message);
    }
  }

  console.log('\n📋 Resumen:');
  console.log('Si alguna tabla NO existe, necesitas ejecutar el SQL en Supabase');
  console.log('Si todas existen, el sistema debería funcionar');
}

checkTables().catch(console.error);



