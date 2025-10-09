#!/usr/bin/env node

/**
 * Script para poblar la base de datos directamente con Supabase
 * Ejecutar con: node scripts/populate-database-direct.js
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

async function createVendors() {
  try {
    console.log('👥 Creando vendedores...');
    
    const vendors = [
      { id: '00000000-0000-0000-0000-000000000001', name: 'María González', phone: '1234567890', is_seller: true },
      { id: '00000000-0000-0000-0000-000000000002', name: 'Carlos Rodríguez', phone: '0987654321', is_seller: true },
      { id: '00000000-0000-0000-0000-000000000003', name: 'Ana Martínez', phone: '1122334455', is_seller: true },
      { id: '00000000-0000-0000-0000-000000000004', name: 'Luis Pérez', phone: '5566778899', is_seller: true },
      { id: '00000000-0000-0000-0000-000000000005', name: 'Sofia Herrera', phone: '9988776655', is_seller: true }
    ];

    for (const vendor of vendors) {
      const { error } = await supabase
        .from('profiles')
        .upsert(vendor, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creando vendedor ${vendor.name}:`, error);
        return false;
      }
    }

    console.log('✅ Vendedores creados exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error creando vendedores:', error);
    return false;
  }
}

async function createSellerStatus() {
  try {
    console.log('🟢 Creando estados de vendedores...');
    
    const statuses = [
      { seller_id: '00000000-0000-0000-0000-000000000001', online: true },
      { seller_id: '00000000-0000-0000-0000-000000000002', online: true },
      { seller_id: '00000000-0000-0000-0000-000000000003', online: false },
      { seller_id: '00000000-0000-0000-0000-000000000004', online: true },
      { seller_id: '00000000-0000-0000-0000-000000000005', online: true }
    ];

    for (const status of statuses) {
      const { error } = await supabase
        .from('seller_status')
        .upsert(status, { onConflict: 'seller_id' });

      if (error) {
        console.error(`❌ Error creando estado para vendedor ${status.seller_id}:`, error);
        return false;
      }
    }

    console.log('✅ Estados de vendedores creados exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error creando estados:', error);
    return false;
  }
}

async function createSellerProducts() {
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
    const vendors = [
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000005'
    ];

    for (let i = 0; i < vendors.length; i++) {
      const vendorId = vendors[i];
      const vendorProducts = products.slice(i * 4, (i + 1) * 4); // 4 productos por vendedor

      for (const product of vendorProducts) {
        const priceCents = getPriceForCategory(product.category);
        const stock = Math.floor(Math.random() * 50) + 10;

        const { error } = await supabase
          .from('seller_products')
          .upsert({
            seller_id: vendorId,
            product_id: product.id,
            price_cents: priceCents,
            stock: stock,
            active: true
          }, { onConflict: 'seller_id,product_id' });

        if (error) {
          console.error(`❌ Error creando producto ${product.title} para vendedor ${vendorId}:`, error);
          return false;
        }
      }
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
    sellers?.forEach(seller => {
      console.log(`   - ${seller.name} (${seller.id})`);
    });
    
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
  console.log('🚀 Poblando base de datos con datos de prueba...');
  
  // 1. Crear vendedores
  const vendorsSuccess = await createVendors();
  if (!vendorsSuccess) {
    console.log('❌ Error creando vendedores');
    process.exit(1);
  }
  
  // 2. Crear estados
  const statusSuccess = await createSellerStatus();
  if (!statusSuccess) {
    console.log('❌ Error creando estados');
    process.exit(1);
  }
  
  // 3. Crear productos por vendedor
  const productsSuccess = await createSellerProducts();
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










