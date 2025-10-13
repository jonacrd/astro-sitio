#!/usr/bin/env node

/**
 * Script para configurar el sistema de recompensas manualmente
 * Ejecutar con: node scripts/setup-rewards-manual.js
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

async function main() {
  console.log('🎁 Configurando sistema de recompensas...\n');

  try {
    // 1. Crear configuración por defecto para vendedores existentes
    console.log('📊 Creando configuración por defecto para vendedores...');
    
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_seller', true);

    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }

    console.log(`📦 Encontrados ${sellers?.length || 0} vendedores`);

    if (sellers && sellers.length > 0) {
      for (const seller of sellers) {
        // Crear configuración de recompensas
        const { error: configError } = await supabase
          .from('seller_rewards_config')
          .upsert({
            seller_id: seller.id,
            is_active: false,
            points_per_peso: 0.0286, // 1 punto = 35 pesos
            minimum_purchase_cents: 500000 // 5000 pesos mínimo
          }, { onConflict: 'seller_id' });

        if (configError) {
          console.warn(`⚠️  Error creando configuración para vendedor ${seller.id}:`, configError.message);
        } else {
          console.log(`✅ Configuración creada para vendedor ${seller.id}`);
        }

        // Crear niveles de recompensa
        const tiers = [
          {
            tier_name: 'Bronce',
            minimum_purchase_cents: 500000, // 5000 pesos
            points_multiplier: 1.0,
            description: 'Nivel básico - 1 punto por cada 35 pesos'
          },
          {
            tier_name: 'Plata',
            minimum_purchase_cents: 1000000, // 10000 pesos
            points_multiplier: 1.2,
            description: 'Nivel intermedio - 20% más puntos'
          },
          {
            tier_name: 'Oro',
            minimum_purchase_cents: 2000000, // 20000 pesos
            points_multiplier: 1.5,
            description: 'Nivel premium - 50% más puntos'
          }
        ];

        for (const tier of tiers) {
          const { error: tierError } = await supabase
            .from('seller_reward_tiers')
            .upsert({
              seller_id: seller.id,
              ...tier,
              is_active: true
            }, { onConflict: 'seller_id, tier_name' });

          if (tierError) {
            console.warn(`⚠️  Error creando nivel ${tier.tier_name} para vendedor ${seller.id}:`, tierError.message);
          } else {
            console.log(`✅ Nivel ${tier.tier_name} creado para vendedor ${seller.id}`);
          }
        }
      }
    }

    console.log('\n🎉 Sistema de recompensas configurado exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Ve a /dashboard/recompensas para configurar tu sistema');
    console.log('2. Activa el sistema de puntos para tu tienda');
    console.log('3. Configura los niveles de recompensa');
    console.log('4. Los clientes podrán ganar puntos en compras de $5,000+');
    console.log('\n💡 Nota: Las tablas deben crearse manualmente en Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Error configurando sistema de recompensas:', error);
    process.exit(1);
  }
}

main().catch(console.error);














