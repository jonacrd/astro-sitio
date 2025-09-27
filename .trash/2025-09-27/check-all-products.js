#!/usr/bin/env node

/**
 * Script para verificar TODOS los productos en la base de datos
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

async function checkAllProducts() {
  try {
    console.log('🔍 Verificando TODOS los productos en la base de datos...');

    // 1. Obtener todos los productos únicos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('title');

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }

    console.log(`\n📦 Productos únicos (${products?.length || 0}):`);
    products?.forEach(product => {
      console.log(`  - ${product.title} (${product.category})`);
    });

    // 2. Obtener todos los productos por vendedor
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
      .eq('active', true)
      .gt('stock', 0)
      .order('stock', { ascending: false });

    if (sellerError) {
      console.error('❌ Error obteniendo productos por vendedor:', sellerError);
      return;
    }

    console.log(`\n📦 Productos por vendedor (${sellerProducts?.length || 0}):`);
    sellerProducts?.forEach(item => {
      console.log(`  - ${item.product.title} por ${item.seller.name} - $${item.price_cents/100} (stock: ${item.stock})`);
    });

    // 3. Agrupar por categoría
    const categories = {};
    sellerProducts?.forEach(item => {
      const category = item.product.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });

    console.log(`\n📊 Productos por categoría:`);
    Object.entries(categories).forEach(([category, items]) => {
      console.log(`\n  ${category.toUpperCase()} (${items.length} productos):`);
      items.forEach(item => {
        console.log(`    - ${item.product.title} por ${item.seller.name} - $${item.price_cents/100}`);
      });
    });

    // 4. Buscar productos específicos
    console.log(`\n🔍 Búsquedas específicas:`);
    
    const searches = ['pasta', 'tequeños', 'hamburguesa', 'arepa'];
    for (const searchTerm of searches) {
      const matches = sellerProducts?.filter(item => 
        item.product.title.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];
      
      console.log(`  "${searchTerm}": ${matches.length} productos`);
      matches.forEach(item => {
        console.log(`    - ${item.product.title} por ${item.seller.name} - $${item.price_cents/100}`);
      });
    }

  } catch (error) {
    console.error('❌ Error verificando productos:', error);
  }
}

checkAllProducts().catch(console.error);
