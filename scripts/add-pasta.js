#!/usr/bin/env node

/**
 * Script para agregar productos de pasta a la base de datos
 * Ejecutar con: node scripts/add-pasta.js
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

async function addPasta() {
  try {
    console.log('🚀 Agregando productos de pasta a la base de datos...');

    // 1. Crear productos de pasta
    console.log('📦 Creando productos de pasta...');
    const pastaProducts = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        title: 'Lasaña de Carne',
        description: 'Lasaña casera con carne molida, queso y salsa bechamel',
        category: 'comida',
        image_url: null
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        title: 'Espagueti a la Bolognesa',
        description: 'Espagueti con salsa bolognesa y queso parmesano',
        category: 'comida',
        image_url: null
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        title: 'Penne al Pesto',
        description: 'Penne con salsa pesto, tomates cherry y queso',
        category: 'comida',
        image_url: null
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        title: 'Ravioles de Queso',
        description: 'Ravioles caseros rellenos de queso ricotta',
        category: 'comida',
        image_url: null
      }
    ];

    for (const product of pastaProducts) {
      const { error } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creando producto ${product.title}:`, error);
        return false;
      }
    }

    console.log('✅ Productos de pasta creados exitosamente');

    // 2. Obtener vendedores existentes
    console.log('👤 Obteniendo vendedores existentes...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('is_seller', true)
      .limit(4);

    if (profilesError) {
      console.error('❌ Error obteniendo vendedores:', profilesError);
      return false;
    }

    if (!profiles || profiles.length === 0) {
      console.error('❌ No hay vendedores en la base de datos');
      return false;
    }

    console.log(`✅ Encontrados ${profiles.length} vendedores`);

    // 3. Agregar pasta a vendedores
    console.log('📦 Agregando pasta a vendedores...');
    const sellerProducts = [
      // Lasaña de Carne
      {
        seller_id: profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440010',
        price_cents: 3500,
        stock: 12,
        active: true
      },
      {
        seller_id: profiles[1]?.id || profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440010',
        price_cents: 3800,
        stock: 8,
        active: true
      },
      // Espagueti a la Bolognesa
      {
        seller_id: profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440011',
        price_cents: 2800,
        stock: 15,
        active: true
      },
      {
        seller_id: profiles[2]?.id || profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440011',
        price_cents: 3200,
        stock: 10,
        active: true
      },
      // Penne al Pesto
      {
        seller_id: profiles[1]?.id || profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440012',
        price_cents: 3000,
        stock: 14,
        active: true
      },
      {
        seller_id: profiles[3]?.id || profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440012',
        price_cents: 3300,
        stock: 9,
        active: true
      },
      // Ravioles de Queso
      {
        seller_id: profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440013',
        price_cents: 3200,
        stock: 16,
        active: true
      },
      {
        seller_id: profiles[2]?.id || profiles[0].id,
        product_id: '550e8400-e29b-41d4-a716-446655440013',
        price_cents: 3600,
        stock: 11,
        active: true
      }
    ];

    for (const sellerProduct of sellerProducts) {
      const { error } = await supabase
        .from('seller_products')
        .upsert(sellerProduct, { onConflict: 'seller_id,product_id' });

      if (error) {
        console.error(`❌ Error agregando pasta para vendedor:`, error);
        return false;
      }
    }

    console.log('✅ Pasta agregada a vendedores exitosamente');

    // 4. Verificar que se agregaron
    console.log('🔍 Verificando pasta agregada...');
    const { data: pasta, error: verifyError } = await supabase
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
      .in('product_id', [
        '550e8400-e29b-41d4-a716-446655440010',
        '550e8400-e29b-41d4-a716-446655440011',
        '550e8400-e29b-41d4-a716-446655440012',
        '550e8400-e29b-41d4-a716-446655440013'
      ])
      .eq('active', true);

    if (verifyError) {
      console.error('❌ Error verificando pasta:', verifyError);
      return false;
    }

    console.log(`✅ Pasta verificada: ${pasta?.length || 0} productos`);
    pasta?.forEach(item => {
      console.log(`  - ${item.product.title} por ${item.seller.name} - $${item.price_cents/100} (stock: ${item.stock})`);
    });

    console.log('🎉 ¡Pasta agregada exitosamente!');
    
    return true;

  } catch (error) {
    console.error('❌ Error agregando pasta:', error);
    return false;
  }
}

addPasta().catch(console.error);










