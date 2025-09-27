#!/usr/bin/env node

/**
 * Script para agregar tequeños a la base de datos
 * Ejecutar con: node scripts/add-tequeños.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTequeños() {
  try {
    console.log('🚀 Agregando tequeños a la base de datos...');

    // 1. Crear producto de tequeños
    console.log('📦 Creando producto de tequeños...');
    const tequeñosProduct = {
      id: '550e8400-e29b-41d4-a716-446655440009',
      title: 'Tequeños (12 unidades)',
      description: 'Tequeños de queso blanco fritos',
      category: 'comida',
      image_url: null
    };

    const { error: productError } = await supabase
      .from('products')
      .upsert(tequeñosProduct, { onConflict: 'id' });

    if (productError) {
      console.error('❌ Error creando producto tequeños:', productError);
      return false;
    }

    console.log('✅ Producto tequeños creado exitosamente');

    // 2. Obtener vendedores existentes
    console.log('👤 Obteniendo vendedores existentes...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('is_seller', true)
      .limit(3);

    if (profilesError) {
      console.error('❌ Error obteniendo vendedores:', profilesError);
      return false;
    }

    if (!profiles || profiles.length === 0) {
      console.error('❌ No hay vendedores en la base de datos');
      return false;
    }

    console.log(`✅ Encontrados ${profiles.length} vendedores`);

    // 3. Agregar tequeños a vendedores
    console.log('📦 Agregando tequeños a vendedores...');
    const sellerProducts = [
      {
        seller_id: profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440009',
        price_cents: 2500,
        stock: 20,
        active: true
      },
      {
        seller_id: profiles[1]?.id || profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440009',
        price_cents: 2800,
        stock: 15,
        active: true
      },
      {
        seller_id: profiles[2]?.id || profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440009',
        price_cents: 2200,
        stock: 25,
        active: true
      }
    ];

    for (const sellerProduct of sellerProducts) {
      const { error } = await supabase
        .from('seller_products')
        .upsert(sellerProduct, { onConflict: 'seller_id,product_id' });

      if (error) {
        console.error(`❌ Error agregando tequeños para vendedor:`, error);
        return false;
      }
    }

    console.log('✅ Tequeños agregados a vendedores exitosamente');

    // 4. Verificar que se agregaron
    console.log('🔍 Verificando tequeños agregados...');
    const { data: tequeños, error: verifyError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        product:products!inner(
          title,
          category
        ),
        seller:profiles!inner(
          name
        )
      `)
      .eq('product_id', '550e8400-e29b-41d4-a716-446655440009')
      .eq('active', true);

    if (verifyError) {
      console.error('❌ Error verificando tequeños:', verifyError);
      return false;
    }

    console.log(`✅ Tequeños verificados: ${tequeños?.length || 0} vendedores`);
    tequeños?.forEach(item => {
      console.log(`  - ${item.product.title} por ${item.seller.name} - $${item.price_cents/100} (stock: ${item.stock})`);
    });

    console.log('🎉 ¡Tequeños agregados exitosamente!');
    
    return true;

  } catch (error) {
    console.error('❌ Error agregando tequeños:', error);
    return false;
  }
}

addTequeños().catch(console.error);




