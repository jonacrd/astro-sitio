#!/usr/bin/env node

/**
 * Script para verificar los detalles de los productos activos
 */

import { createClient } from '@supabase/supabase-js';

async function checkActiveProductsDetails() {
  console.log('🔍 Verificando detalles de productos activos...\n');
  
  try {
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
    const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener productos activos con detalles completos
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        product:products!inner(
          id,
          title,
          description,
          category,
          image_url
        ),
        seller:profiles!inner(
          id,
          name
        )
      `)
      .eq('active', true)
      .gt('stock', 0);

    if (spError) {
      console.error('❌ Error obteniendo productos activos:', spError);
      return;
    }

    console.log(`📦 PRODUCTOS ACTIVOS ENCONTRADOS: ${sellerProducts?.length || 0}\n`);

    if (!sellerProducts || sellerProducts.length === 0) {
      console.log('❌ NO HAY PRODUCTOS ACTIVOS');
      return;
    }

    // Agrupar por vendedor
    const productsBySeller = {};
    sellerProducts.forEach(sp => {
      if (!productsBySeller[sp.seller.name]) {
        productsBySeller[sp.seller.name] = [];
      }
      productsBySeller[sp.seller.name].push({
        title: sp.product.title,
        category: sp.product.category,
        price: sp.price_cents,
        stock: sp.stock,
        image: sp.product.image_url
      });
    });

    console.log('🏪 VENDEDORES ACTIVOS:\n');
    
    Object.keys(productsBySeller).forEach(sellerName => {
      console.log(`📦 ${sellerName}:`);
      productsBySeller[sellerName].forEach(product => {
        console.log(`   ✅ ${product.title} (${product.category}) - $${product.price} - Stock: ${product.stock}`);
      });
      console.log('');
    });

    console.log('📊 RESUMEN:');
    console.log(`✅ Vendedores activos: ${Object.keys(productsBySeller).length}`);
    console.log(`✅ Productos activos: ${sellerProducts.length}`);
    
    console.log('\n🎯 CATEGORÍAS DISPONIBLES:');
    const categories = [...new Set(sellerProducts.map(sp => sp.product.category))];
    categories.forEach(category => {
      const count = sellerProducts.filter(sp => sp.product.category === category).length;
      console.log(`   📦 ${category}: ${count} productos`);
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkActiveProductsDetails();










