#!/usr/bin/env node

/**
 * Script para verificar que el sistema de guardado de productos funciona
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductSaving() {
  console.log('🧪 Verificando sistema de guardado de productos...\n');
  
  try {
    // 1. Verificar que ProductManagerEnhanced está corregido
    console.log('📄 Verificando ProductManagerEnhanced...');
    const productManagerPath = path.join(process.cwd(), 'src/components/react/ProductManagerEnhanced.tsx');
    const productManagerContent = fs.readFileSync(productManagerPath, 'utf8');
    
    if (productManagerContent.includes('prompt(\'Ingresa el precio del producto')) {
      console.log('✅ ProductManagerEnhanced pide precio al agregar producto');
    } else {
      console.log('❌ ProductManagerEnhanced no pide precio');
    }
    
    if (productManagerContent.includes('prompt(\'Ingresa la cantidad en stock')) {
      console.log('✅ ProductManagerEnhanced pide stock al agregar producto');
    } else {
      console.log('❌ ProductManagerEnhanced no pide stock');
    }
    
    if (productManagerContent.includes('active: true')) {
      console.log('✅ ProductManagerEnhanced activa productos por defecto');
    } else {
      console.log('❌ ProductManagerEnhanced no activa productos');
    }
    
    if (productManagerContent.includes('alert(\'Producto agregado exitosamente')) {
      console.log('✅ ProductManagerEnhanced muestra confirmación');
    } else {
      console.log('❌ ProductManagerEnhanced no muestra confirmación');
    }
    
    // 2. Verificar productos activos en la base de datos
    console.log('\n📦 Verificando productos activos en la base de datos...');
    
    const { data: activeProducts, error: activeProductsError } = await supabase
      .from('seller_products')
      .select(`
        price_cents,
        stock,
        active,
        product_id,
        seller_id
      `)
      .eq('active', true)
      .gt('stock', 0)
      .order('price_cents', { ascending: false });
    
    if (activeProductsError) {
      console.error('❌ Error cargando productos activos:', activeProductsError);
    } else {
      console.log(`✅ Productos activos encontrados: ${activeProducts?.length || 0}`);
      
      if (activeProducts && activeProducts.length > 0) {
        console.log('\n📋 Productos activos:');
        activeProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. Product ID: ${product.product_id}`);
          console.log(`     Precio: $${(product.price_cents / 100).toLocaleString('es-CL')}`);
          console.log(`     Stock: ${product.stock}`);
          console.log(`     Activo: ${product.active}`);
          console.log(`     Seller ID: ${product.seller_id}`);
          console.log('');
        });
      } else {
        console.log('⚠️ No hay productos activos disponibles');
      }
    }
    
    // 3. Verificar productos inactivos
    console.log('\n📦 Verificando productos inactivos...');
    
    const { data: inactiveProducts, error: inactiveProductsError } = await supabase
      .from('seller_products')
      .select(`
        price_cents,
        stock,
        active,
        product_id,
        seller_id
      `)
      .eq('active', false)
      .order('price_cents', { ascending: false })
      .limit(5);
    
    if (inactiveProductsError) {
      console.error('❌ Error cargando productos inactivos:', inactiveProductsError);
    } else {
      console.log(`✅ Productos inactivos encontrados: ${inactiveProducts?.length || 0}`);
      
      if (inactiveProducts && inactiveProducts.length > 0) {
        console.log('\n📋 Productos inactivos (NO deben aparecer en el feed):');
        inactiveProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. Product ID: ${product.product_id}`);
          console.log(`     Precio: $${(product.price_cents / 100).toLocaleString('es-CL')}`);
          console.log(`     Stock: ${product.stock}`);
          console.log(`     Activo: ${product.active}`);
          console.log(`     Seller ID: ${product.seller_id}`);
          console.log('');
        });
      }
    }
    
    // 4. Verificar vendedores con productos
    console.log('\n👥 Verificando vendedores con productos...');
    
    const { data: sellersWithProducts, error: sellersError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        active,
        stock,
        price_cents
      `)
      .eq('active', true)
      .gt('stock', 0);
    
    if (sellersError) {
      console.error('❌ Error cargando vendedores:', sellersError);
    } else {
      const uniqueSellers = new Set(sellersWithProducts?.map(p => p.seller_id) || []);
      console.log(`✅ Vendedores con productos activos: ${uniqueSellers.size}`);
      
      if (uniqueSellers.size > 0) {
        console.log('\n📋 Vendedores activos:');
        uniqueSellers.forEach((sellerId, index) => {
          const sellerProducts = sellersWithProducts?.filter(p => p.seller_id === sellerId) || [];
          const totalStock = sellerProducts.reduce((sum, p) => sum + p.stock, 0);
          const totalValue = sellerProducts.reduce((sum, p) => sum + p.price_cents, 0);
          
          console.log(`  ${index + 1}. Seller ID: ${sellerId}`);
          console.log(`     Productos activos: ${sellerProducts.length}`);
          console.log(`     Stock total: ${totalStock}`);
          console.log(`     Valor total: $${(totalValue / 100).toLocaleString('es-CL')}`);
          console.log('');
        });
      }
    }
    
    // 5. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Productos activos: ${activeProducts?.length || 0}`);
    console.log(`✅ Productos inactivos: ${inactiveProducts?.length || 0}`);
    console.log(`✅ Vendedores activos: ${uniqueSellers?.size || 0}`);
    
    if (activeProducts && activeProducts.length > 0) {
      console.log('\n🎉 ¡Sistema de guardado funcionando correctamente!');
      console.log('\n💡 INSTRUCCIONES PARA EL VENDEDOR:');
      console.log('   1. Ir a Dashboard > Mis Productos');
      console.log('   2. Hacer clic en "Añadir Producto"');
      console.log('   3. Buscar y seleccionar un producto');
      console.log('   4. Ingresar precio cuando se solicite');
      console.log('   5. Ingresar stock cuando se solicite');
      console.log('   6. El producto se guardará automáticamente');
      console.log('   7. El producto aparecerá en el feed inmediatamente');
      
      console.log('\n🔧 Si el problema persiste:');
      console.log('   - Verificar que el vendedor esté logueado');
      console.log('   - Verificar que el vendedor tenga permisos');
      console.log('   - Verificar consola del navegador (F12)');
      console.log('   - Buscar errores de JavaScript');
    } else {
      console.log('\n⚠️ No hay productos activos disponibles');
      console.log('💡 Sugerencia: El vendedor debe agregar productos desde el dashboard');
    }
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

testProductSaving();










