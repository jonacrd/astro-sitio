#!/usr/bin/env node

/**
 * Script para crear las tablas directamente usando la API de Supabase
 * Ejecutar con: node scripts/create-tables-direct.js
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
  console.log('🔧 Creando tablas del sistema de recompensas directamente...\n');

  try {
    // 1. Crear tabla seller_rewards_config
    console.log('📊 Creando tabla seller_rewards_config...');
    const { error: configError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS seller_rewards_config (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT false,
          points_per_peso DECIMAL(10,4) DEFAULT 0.0286,
          minimum_purchase_cents INTEGER DEFAULT 500000,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(seller_id)
        );
      `
    });

    if (configError) {
      console.warn('⚠️  Error creando seller_rewards_config:', configError.message);
    } else {
      console.log('✅ Tabla seller_rewards_config creada');
    }

    // 2. Crear tabla seller_reward_tiers
    console.log('📊 Creando tabla seller_reward_tiers...');
    const { error: tiersError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS seller_reward_tiers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          tier_name VARCHAR(100) NOT NULL,
          minimum_purchase_cents INTEGER NOT NULL,
          points_multiplier DECIMAL(10,4) DEFAULT 1.0,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(seller_id, tier_name)
        );
      `
    });

    if (tiersError) {
      console.warn('⚠️  Error creando seller_reward_tiers:', tiersError.message);
    } else {
      console.log('✅ Tabla seller_reward_tiers creada');
    }

    // 3. Crear tabla point_redemptions
    console.log('📊 Creando tabla point_redemptions...');
    const { error: redemptionsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS point_redemptions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          points_used INTEGER NOT NULL,
          discount_cents INTEGER NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          applied_at TIMESTAMP WITH TIME ZONE
        );
      `
    });

    if (redemptionsError) {
      console.warn('⚠️  Error creando point_redemptions:', redemptionsError.message);
    } else {
      console.log('✅ Tabla point_redemptions creada');
    }

    // 4. Crear tabla points_history
    console.log('📊 Creando tabla points_history...');
    const { error: historyError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS points_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          points_earned INTEGER DEFAULT 0,
          points_spent INTEGER DEFAULT 0,
          transaction_type VARCHAR(20) NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (historyError) {
      console.warn('⚠️  Error creando points_history:', historyError.message);
    } else {
      console.log('✅ Tabla points_history creada');
    }

    // 5. Habilitar RLS
    console.log('🔒 Habilitando RLS...');
    const { error: rlsError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE seller_rewards_config ENABLE ROW LEVEL SECURITY;
        ALTER TABLE seller_reward_tiers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE point_redemptions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.warn('⚠️  Error habilitando RLS:', rlsError.message);
    } else {
      console.log('✅ RLS habilitado');
    }

    // 6. Crear políticas RLS
    console.log('🛡️ Creando políticas RLS...');
    const { error: policiesError } = await supabase.rpc('exec', {
      sql: `
        CREATE POLICY "Sellers can manage own rewards config" ON seller_rewards_config
          FOR ALL USING (auth.uid() = seller_id);

        CREATE POLICY "Users can view active rewards config" ON seller_rewards_config
          FOR SELECT USING (is_active = true);

        CREATE POLICY "Sellers can manage own reward tiers" ON seller_reward_tiers
          FOR ALL USING (auth.uid() = seller_id);

        CREATE POLICY "Users can view active reward tiers" ON seller_reward_tiers
          FOR SELECT USING (is_active = true);

        CREATE POLICY "Users can view own redemptions" ON point_redemptions
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Sellers can view redemptions for their store" ON point_redemptions
          FOR SELECT USING (auth.uid() = seller_id);

        CREATE POLICY "Users can create redemptions" ON point_redemptions
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can view own points history" ON points_history
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Sellers can view points history for their store" ON points_history
          FOR SELECT USING (auth.uid() = seller_id);
      `
    });

    if (policiesError) {
      console.warn('⚠️  Error creando políticas:', policiesError.message);
    } else {
      console.log('✅ Políticas RLS creadas');
    }

    console.log('\n🎉 ¡Tablas creadas exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Ejecuta: node scripts/check-tables.js');
    console.log('2. Ejecuta: node scripts/populate-rewards-data.js');
    console.log('3. Ve a /dashboard/recompensas para configurar tu sistema');

  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    process.exit(1);
  }
}

createTables().catch(console.error);
