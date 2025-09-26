#!/usr/bin/env node

/**
 * Script para crear las tablas usando el método que SÍ funciona
 * Ejecutar con: node scripts/create-tables-simple.js
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

async function createTables() {
  console.log('🔧 Creando tablas del sistema de recompensas...\n');

  try {
    // Método 1: Intentar crear las tablas usando la API REST
    console.log('📊 Intentando crear tablas usando API REST...');
    
    // Crear tabla seller_rewards_config
    console.log('1. Creando seller_rewards_config...');
    try {
      const { data: configData, error: configError } = await supabase
        .from('seller_rewards_config')
        .select('id')
        .limit(1);
      
      if (configError && configError.code === 'PGRST205') {
        console.log('❌ Tabla seller_rewards_config no existe, necesitas crearla manualmente');
      } else {
        console.log('✅ Tabla seller_rewards_config ya existe');
      }
    } catch (err) {
      console.log('❌ Error verificando seller_rewards_config:', err.message);
    }

    // Crear tabla seller_reward_tiers
    console.log('2. Creando seller_reward_tiers...');
    try {
      const { data: tiersData, error: tiersError } = await supabase
        .from('seller_reward_tiers')
        .select('id')
        .limit(1);
      
      if (tiersError && tiersError.code === 'PGRST205') {
        console.log('❌ Tabla seller_reward_tiers no existe, necesitas crearla manualmente');
      } else {
        console.log('✅ Tabla seller_reward_tiers ya existe');
      }
    } catch (err) {
      console.log('❌ Error verificando seller_reward_tiers:', err.message);
    }

    // Crear tabla point_redemptions
    console.log('3. Creando point_redemptions...');
    try {
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('point_redemptions')
        .select('id')
        .limit(1);
      
      if (redemptionsError && redemptionsError.code === 'PGRST205') {
        console.log('❌ Tabla point_redemptions no existe, necesitas crearla manualmente');
      } else {
        console.log('✅ Tabla point_redemptions ya existe');
      }
    } catch (err) {
      console.log('❌ Error verificando point_redemptions:', err.message);
    }

    // Crear tabla points_history
    console.log('4. Creando points_history...');
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('points_history')
        .select('id')
        .limit(1);
      
      if (historyError && historyError.code === 'PGRST205') {
        console.log('❌ Tabla points_history no existe, necesitas crearla manualmente');
      } else {
        console.log('✅ Tabla points_history ya existe');
      }
    } catch (err) {
      console.log('❌ Error verificando points_history:', err.message);
    }

    console.log('\n🚨 SOLUCIÓN ALTERNATIVA:');
    console.log('Como Supabase no permite crear tablas via API, necesitas:');
    console.log('\n1. Ve a Supabase Dashboard → Table Editor');
    console.log('2. Haz clic en "Create a new table"');
    console.log('3. Crea cada tabla manualmente con estos campos:');
    
    console.log('\n📋 TABLA 1: seller_rewards_config');
    console.log('- id: uuid (Primary Key, Default: gen_random_uuid())');
    console.log('- seller_id: uuid (Foreign Key → auth.users.id)');
    console.log('- is_active: boolean (Default: false)');
    console.log('- points_per_peso: decimal (Default: 0.0286)');
    console.log('- minimum_purchase_cents: integer (Default: 500000)');
    console.log('- created_at: timestamptz (Default: now())');
    console.log('- updated_at: timestamptz (Default: now())');
    
    console.log('\n📋 TABLA 2: seller_reward_tiers');
    console.log('- id: uuid (Primary Key, Default: gen_random_uuid())');
    console.log('- seller_id: uuid (Foreign Key → auth.users.id)');
    console.log('- tier_name: varchar (NOT NULL)');
    console.log('- minimum_purchase_cents: integer (NOT NULL)');
    console.log('- points_multiplier: decimal (Default: 1.0)');
    console.log('- description: text');
    console.log('- is_active: boolean (Default: true)');
    console.log('- created_at: timestamptz (Default: now())');
    
    console.log('\n📋 TABLA 3: point_redemptions');
    console.log('- id: uuid (Primary Key, Default: gen_random_uuid())');
    console.log('- user_id: uuid (Foreign Key → auth.users.id)');
    console.log('- seller_id: uuid (Foreign Key → auth.users.id)');
    console.log('- order_id: uuid (Foreign Key → orders.id)');
    console.log('- points_used: integer (NOT NULL)');
    console.log('- discount_cents: integer (NOT NULL)');
    console.log('- status: varchar (Default: pending)');
    console.log('- created_at: timestamptz (Default: now())');
    console.log('- applied_at: timestamptz');
    
    console.log('\n📋 TABLA 4: points_history');
    console.log('- id: uuid (Primary Key, Default: gen_random_uuid())');
    console.log('- user_id: uuid (Foreign Key → auth.users.id)');
    console.log('- seller_id: uuid (Foreign Key → auth.users.id)');
    console.log('- order_id: uuid (Foreign Key → orders.id)');
    console.log('- points_earned: integer (Default: 0)');
    console.log('- points_spent: integer (Default: 0)');
    console.log('- transaction_type: varchar (NOT NULL)');
    console.log('- description: text');
    console.log('- created_at: timestamptz (Default: now())');
    
    console.log('\n4. Después de crear las tablas, ejecuta:');
    console.log('   node scripts/populate-rewards-data.js');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTables().catch(console.error);
