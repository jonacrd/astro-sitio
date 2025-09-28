#!/usr/bin/env node

/**
 * Script para probar la funcionalidad de selección de productos
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductSelector() {
  console.log('🧪 Probando funcionalidad de selección de productos...\n');
  
  try {
    // 1. Verificar que hay productos disponibles
    console.log('📦 Verificando productos disponibles...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(5);
    
    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }
    
    console.log(`✅ Productos disponibles: ${products.length}`);
    products.forEach(product => {
      console.log(`  - ${product.title} (${product.category})`);
    });
    
    // 2. Verificar vendedores existentes
    console.log('\n👤 Verificando vendedores...');
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true)
      .limit(3);
    
    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }
    
    console.log(`✅ Vendedores encontrados: ${sellers.length}`);
    sellers.forEach(seller => {
      console.log(`  - ${seller.name} (${seller.id})`);
    });
    
    if (sellers.length === 0) {
      console.log('⚠️ No hay vendedores. Creando vendedor de prueba...');
      
      const { data: newSeller, error: createError } = await supabase
        .from('profiles')
        .insert({
          name: 'Vendedor de Prueba',
          is_seller: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creando vendedor:', createError);
        return;
      }
      
      console.log('✅ Vendedor de prueba creado:', newSeller.id);
    }
    
    // 3. Verificar productos de vendedores
    console.log('\n🛒 Verificando productos de vendedores...');
    const { data: sellerProducts, error: sellerProductsError } = await supabase
      .from('seller_products')
      .select(`
        price_cents,
        stock,
        active,
        products (title, category)
      `)
      .limit(5);
    
    if (sellerProductsError) {
      console.error('❌ Error obteniendo productos de vendedores:', sellerProductsError);
      return;
    }
    
    console.log(`✅ Productos de vendedores: ${sellerProducts.length}`);
    sellerProducts.forEach(sp => {
      console.log(`  - ${sp.products.title}: $${(sp.price_cents/100).toLocaleString('es-CL')} (Stock: ${sp.stock}, Activo: ${sp.active})`);
    });
    
    // 4. Simular agregar un producto a un vendedor
    if (products.length > 0 && sellers.length > 0) {
      console.log('\n🧪 Simulando agregar producto a vendedor...');
      
      const testProduct = products[0];
      const testSeller = sellers[0];
      
      // Verificar si ya existe
      const { data: existing, error: checkError } = await supabase
        .from('seller_products')
        .select('seller_id, product_id')
        .eq('seller_id', testSeller.id)
        .eq('product_id', testProduct.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error verificando producto existente:', checkError);
        return;
      }
      
      if (existing) {
        console.log('ℹ️ El producto ya está asociado al vendedor');
      } else {
        console.log(`📝 Agregando ${testProduct.title} a ${testSeller.name}...`);
        
        const { data: newSellerProduct, error: addError } = await supabase
          .from('seller_products')
          .insert({
            seller_id: testSeller.id,
            product_id: testProduct.id,
            price_cents: 5000, // $50.00
            stock: 10,
            active: true
          })
          .select()
          .single();
        
        if (addError) {
          console.error('❌ Error agregando producto:', addError);
          return;
        }
        
        console.log('✅ Producto agregado exitosamente:', newSellerProduct.id);
      }
    }
    
    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('\n💡 Para probar la interfaz:');
    console.log('   1. Ve a /dashboard-mis-productos');
    console.log('   2. Busca productos por nombre o categoría');
    console.log('   3. Agrega productos a tu inventario');
    console.log('   4. Configura precios y stock');
    console.log('   5. Activa productos para la venta');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testProductSelector();
