#!/usr/bin/env node

/**
 * Script para crear productos por vendedor usando usuarios existentes
 * Ejecutar con: node scripts/create-seller-products.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Configuración
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getExistingSellers() {
  try {
    console.log('👥 Obteniendo vendedores existentes...');
    
    const { data: sellers, error } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);
    
    if (error) {
      console.error('❌ Error obteniendo vendedores:', error);
      return [];
    }
    
    console.log(`✅ Encontrados ${sellers?.length || 0} vendedores`);
    sellers?.forEach(seller => {
      console.log(`   - ${seller.name} (${seller.id})`);
    });
    
    return sellers || [];

  } catch (error) {
    console.error('❌ Error obteniendo vendedores:', error);
    return [];
  }
}

async function createSellerProducts(sellers) {
  try {
    console.log('📦 Creando productos por vendedor...');
    
    // Obtener productos existentes
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(20);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return false;
    }

    if (!products || products.length === 0) {
      console.error('❌ No hay productos en la base de datos');
      return false;
    }

    console.log(`📊 Encontrados ${products.length} productos`);

    // Crear productos por vendedor
    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      const sellerProducts = products.slice(i * 4, (i + 1) * 4); // 4 productos por vendedor

      for (const product of sellerProducts) {
        const priceCents = getPriceForCategory(product.category);
        const stock = Math.floor(Math.random() * 50) + 10;

        const { error } = await supabase
          .from('seller_products')
          .upsert({
            seller_id: seller.id,
            product_id: product.id,
            price_cents: priceCents,
            stock: stock,
            active: true
          }, { onConflict: 'seller_id,product_id' });

        if (error) {
          console.error(`❌ Error creando producto ${product.title} para ${seller.name}:`, error);
          continue;
        }
      }

      console.log(`✅ Productos creados para ${seller.name}`);
    }

    console.log('✅ Productos por vendedor creados exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error creando productos por vendedor:', error);
    return false;
  }
}

function getPriceForCategory(category) {
  const basePrices = {
    'comida': 1500,
    'bebidas': 800,
    'minimarket': 2000,
    'ropa': 5000,
    'tecnologia': 15000,
    'servicios': 3000,
    'alcohol': 8000,
    'postres': 2500
  };

  const basePrice = basePrices[category] || 1000;
  const variation = Math.floor(Math.random() * 1000);
  return basePrice + variation;
}

async function createSellerStatus(sellers) {
  try {
    console.log('🟢 Creando estados de vendedores...');
    
    for (const seller of sellers) {
      const { error } = await supabase
        .from('seller_status')
        .upsert({
          seller_id: seller.id,
          online: Math.random() > 0.3 // 70% online
        }, { onConflict: 'seller_id' });

      if (error) {
        console.error(`❌ Error creando estado para ${seller.name}:`, error);
        continue;
      }
    }

    console.log('✅ Estados de vendedores creados exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error creando estados:', error);
    return false;
  }
}

async function verifyData() {
  try {
    console.log('🔍 Verificando datos insertados...');
    
    // Verificar vendedores
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);
    
    if (sellersError) {
      console.error('❌ Error verificando vendedores:', sellersError);
      return false;
    }
    
    console.log(`✅ Vendedores encontrados: ${sellers?.length || 0}`);
    
    // Verificar estados
    const { data: status, error: statusError } = await supabase
      .from('seller_status')
      .select('seller_id, online');
    
    if (statusError) {
      console.error('❌ Error verificando estados:', statusError);
      return false;
    }
    
    console.log(`✅ Estados de vendedores: ${status?.length || 0}`);
    
    // Verificar productos por vendedor
    const { data: sellerProducts, error: productsError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active');
    
    if (productsError) {
      console.error('❌ Error verificando productos:', productsError);
      return false;
    }
    
    console.log(`✅ Productos por vendedor: ${sellerProducts?.length || 0}`);
    
    // Agrupar por vendedor
    const productsBySeller = sellerProducts?.reduce((acc, item) => {
      if (!acc[item.seller_id]) {
        acc[item.seller_id] = [];
      }
      acc[item.seller_id].push(item);
      return acc;
    }, {}) || {};
    
    Object.entries(productsBySeller).forEach(([sellerId, products]) => {
      console.log(`   - Vendedor ${sellerId}: ${products.length} productos`);
    });
    
    return true;

  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Creando productos por vendedor...');
  
  // 1. Obtener vendedores existentes
  const sellers = await getExistingSellers();
  if (sellers.length === 0) {
    console.log('❌ No se encontraron vendedores');
    process.exit(1);
  }
  
  // 2. Crear estados de vendedores
  const statusSuccess = await createSellerStatus(sellers);
  if (!statusSuccess) {
    console.log('❌ Error creando estados');
    process.exit(1);
  }
  
  // 3. Crear productos por vendedor
  const productsSuccess = await createSellerProducts(sellers);
  if (!productsSuccess) {
    console.log('❌ Error creando productos por vendedor');
    process.exit(1);
  }
  
  // 4. Verificar datos
  const verifySuccess = await verifyData();
  if (!verifySuccess) {
    console.log('❌ Error verificando datos');
    process.exit(1);
  }
  
  console.log('✅ Base de datos poblada exitosamente');
  console.log('📋 Próximos pasos:');
  console.log('   1. Probar búsqueda con IA: /api/nl-search-real');
  console.log('   2. Probar feed real: /api/feed/real');
  console.log('   3. Probar agregar al carrito');
  console.log('   4. Probar checkout');
}

main().catch(console.error);
