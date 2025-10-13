#!/usr/bin/env node

/**
 * Script para configurar el sistema de recompensas
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRewardsConfig() {
  console.log('🎯 Configurando sistema de recompensas...\n');
  
  try {
    const sellerUuid = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // Diego Ramírez
    
    // 1. Verificar si ya existe configuración
    const { data: existingConfig, error: configError } = await supabase
      .from('seller_rewards_config')
      .select('*')
      .eq('seller_id', sellerUuid);

    if (configError) {
      console.log('❌ Error verificando configuración:', configError.message);
      return;
    }

    if (existingConfig && existingConfig.length > 0) {
      console.log('✅ Configuración existente encontrada');
      console.log('🔧 Activando sistema de recompensas...');
      
      // Activar la configuración existente
      const { error: updateError } = await supabase
        .from('seller_rewards_config')
        .update({ is_active: true })
        .eq('seller_id', sellerUuid);

      if (updateError) {
        console.error('❌ Error activando configuración:', updateError);
        return;
      }
      
      console.log('✅ Sistema de recompensas activado');
    } else {
      console.log('🔧 Creando nueva configuración de recompensas...');
      
      // Crear nueva configuración
      const { error: insertError } = await supabase
        .from('seller_rewards_config')
        .insert({
          seller_id: sellerUuid,
          is_active: true,
          points_per_peso: 0.0286, // 1 punto = 35 pesos (1/35)
          minimum_purchase_cents: 500000 // $5,000 mínimo
        });

      if (insertError) {
        console.error('❌ Error creando configuración:', insertError);
        return;
      }
      
      console.log('✅ Configuración de recompensas creada');
    }

    // 2. Verificar/crear niveles de recompensa
    const { data: existingTiers, error: tiersError } = await supabase
      .from('seller_reward_tiers')
      .select('*')
      .eq('seller_id', sellerUuid);

    if (tiersError) {
      console.log('❌ Error verificando niveles:', tiersError.message);
      return;
    }

    if (!existingTiers || existingTiers.length === 0) {
      console.log('🔧 Creando niveles de recompensa...');
      
      const tiers = [
        {
          seller_id: sellerUuid,
          tier_name: 'Bronce',
          minimum_purchase_cents: 500000, // $5,000
          points_multiplier: 1.0,
          description: 'Nivel básico - 1 punto por cada $35',
          is_active: true
        },
        {
          seller_id: sellerUuid,
          tier_name: 'Plata',
          minimum_purchase_cents: 1000000, // $10,000
          points_multiplier: 1.2,
          description: 'Nivel intermedio - 1.2x multiplicador',
          is_active: true
        },
        {
          seller_id: sellerUuid,
          tier_name: 'Oro',
          minimum_purchase_cents: 2000000, // $20,000
          points_multiplier: 1.5,
          description: 'Nivel premium - 1.5x multiplicador',
          is_active: true
        }
      ];

      const { error: insertTiersError } = await supabase
        .from('seller_reward_tiers')
        .insert(tiers);

      if (insertTiersError) {
        console.error('❌ Error creando niveles:', insertTiersError);
        return;
      }
      
      console.log('✅ Niveles de recompensa creados');
    } else {
      console.log('✅ Niveles de recompensa ya existen');
    }

    // 3. Verificar configuración final
    const { data: finalConfig, error: finalError } = await supabase
      .from('seller_rewards_config')
      .select('*')
      .eq('seller_id', sellerUuid)
      .eq('is_active', true);

    if (finalError) {
      console.error('❌ Error verificando configuración final:', finalError);
      return;
    }

    if (finalConfig && finalConfig.length > 0) {
      console.log('\n🎉 SISTEMA DE RECOMPENSAS CONFIGURADO:');
      console.log('✅ Configuración activa');
      console.log('✅ Puntos por peso: 1 punto = $35');
      console.log('✅ Compra mínima: $5,000');
      console.log('✅ Niveles: Bronce, Plata, Oro');
      console.log('✅ Multiplicadores: 1.0x, 1.2x, 1.5x');
      
      console.log('\n🎯 PRÓXIMAS COMPRAS OTORGARÁN PUNTOS:');
      console.log('✅ Compra de $5,000+ → Puntos base');
      console.log('✅ Compra de $10,000+ → 1.2x multiplicador');
      console.log('✅ Compra de $20,000+ → 1.5x multiplicador');
    } else {
      console.log('❌ Configuración no encontrada o inactiva');
    }

  } catch (error) {
    console.error('❌ Error configurando recompensas:', error);
  }
}

setupRewardsConfig();










