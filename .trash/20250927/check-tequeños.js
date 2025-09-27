#!/usr/bin/env node

/**
 * Script para verificar si los tequeños están en la base de datos
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTequeños() {
  try {
    console.log('🔍 Verificando tequeños en la base de datos...');

    // 1. Verificar si el producto existe
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', '550e8400-e29b-41d4-a716-446655440009');

    if (productError) {
      console.error('❌ Error verificando producto:', productError);
      return;
    }

    if (!product || product.length === 0) {
      console.log('❌ Producto tequeños no encontrado');
      return;
    }

    console.log('✅ Producto tequeños encontrado:', product[0].title);

    // 2. Verificar productos por vendedor
    const { data: sellerProducts, error: sellerError } = await supabase
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

    if (sellerError) {
      console.error('❌ Error verificando productos por vendedor:', sellerError);
      return;
    }

    console.log(`✅ Productos por vendedor encontrados: ${sellerProducts?.length || 0}`);
    sellerProducts?.forEach(item => {
      console.log(`  - ${item.product.title} por ${item.seller.name} - $${item.price_cents/100} (stock: ${item.stock})`);
    });

    // 3. Verificar consulta completa
    const { data: allProducts, error: allError } = await supabase
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
      .eq('active', true)
      .gt('stock', 0);

    if (allError) {
      console.error('❌ Error en consulta completa:', allError);
      return;
    }

    console.log(`✅ Total productos activos: ${allProducts?.length || 0}`);
    allProducts?.forEach(item => {
      console.log(`  - ${item.product.title} por ${item.seller.name} - $${item.price_cents/100} (stock: ${item.stock})`);
    });

  } catch (error) {
    console.error('❌ Error verificando tequeños:', error);
  }
}

checkTequeños().catch(console.error);



