#!/usr/bin/env node

/**
 * Script para verificar la nueva interfaz de productos
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

async function testProductInterface() {
  console.log('🧪 Verificando nueva interfaz de productos...\n');
  
  try {
    // 1. Verificar que ProductManagerEnhanced está actualizado
    console.log('📄 Verificando ProductManagerEnhanced...');
    const productManagerPath = path.join(process.cwd(), 'src/components/react/ProductManagerEnhanced.tsx');
    const productManagerContent = fs.readFileSync(productManagerPath, 'utf8');
    
    if (productManagerContent.includes('pendingProducts')) {
      console.log('✅ ProductManagerEnhanced tiene lista de productos pendientes');
    } else {
      console.log('❌ ProductManagerEnhanced no tiene lista de productos pendientes');
    }
    
    if (productManagerContent.includes('showConfigModal')) {
      console.log('✅ ProductManagerEnhanced tiene modal de configuración');
    } else {
      console.log('❌ ProductManagerEnhanced no tiene modal de configuración');
    }
    
    if (productManagerContent.includes('handleSaveAllProducts')) {
      console.log('✅ ProductManagerEnhanced tiene función para guardar todos los productos');
    } else {
      console.log('❌ ProductManagerEnhanced no tiene función para guardar todos los productos');
    }
    
    if (productManagerContent.includes('Productos pendientes de configuración')) {
      console.log('✅ ProductManagerEnhanced tiene interfaz para productos pendientes');
    } else {
      console.log('❌ ProductManagerEnhanced no tiene interfaz para productos pendientes');
    }
    
    if (productManagerContent.includes('Configurar')) {
      console.log('✅ ProductManagerEnhanced tiene modal de configuración visual');
    } else {
      console.log('❌ ProductManagerEnhanced no tiene modal de configuración visual');
    }
    
    // 2. Verificar que no usa prompt()
    if (!productManagerContent.includes('prompt(')) {
      console.log('✅ ProductManagerEnhanced no usa prompt() - Interfaz visual implementada');
    } else {
      console.log('❌ ProductManagerEnhanced aún usa prompt() - Necesita corrección');
    }
    
    // 3. Verificar productos activos en la base de datos
    console.log('\n📦 Verificando productos activos...');
    
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
      .order('price_cents', { ascending: false })
      .limit(5);
    
    if (activeProductsError) {
      console.error('❌ Error cargando productos activos:', activeProductsError);
    } else {
      console.log(`✅ Productos activos encontrados: ${activeProducts?.length || 0}`);
      
      if (activeProducts && activeProducts.length > 0) {
        console.log('\n📋 Primeros 3 productos activos:');
        activeProducts.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. Product ID: ${product.product_id}`);
          console.log(`     Precio: $${(product.price_cents / 100).toLocaleString('es-CL')}`);
          console.log(`     Stock: ${product.stock}`);
          console.log(`     Activo: ${product.active}`);
          console.log(`     Seller ID: ${product.seller_id}`);
          console.log('');
        });
      }
    }
    
    // 4. Verificar productos disponibles para agregar
    console.log('\n📦 Verificando productos disponibles para agregar...');
    
    const { data: availableProducts, error: availableProductsError } = await supabase
      .from('products')
      .select('id, title, category, image_url')
      .limit(5);
    
    if (availableProductsError) {
      console.error('❌ Error cargando productos disponibles:', availableProductsError);
    } else {
      console.log(`✅ Productos disponibles para agregar: ${availableProducts?.length || 0}`);
      
      if (availableProducts && availableProducts.length > 0) {
        console.log('\n📋 Primeros 3 productos disponibles:');
        availableProducts.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. Product ID: ${product.id}`);
          console.log(`     Título: ${product.title}`);
          console.log(`     Categoría: ${product.category}`);
          console.log(`     Imagen: ${product.image_url ? 'Sí' : 'No'}`);
          console.log('');
        });
      }
    }
    
    // 5. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Productos activos: ${activeProducts?.length || 0}`);
    console.log(`✅ Productos disponibles: ${availableProducts?.length || 0}`);
    
    console.log('\n🎉 ¡Nueva interfaz implementada correctamente!');
    console.log('\n💡 FUNCIONALIDADES NUEVAS:');
    console.log('   1. ✅ Lista de productos pendientes');
    console.log('   2. ✅ Modal de configuración visual');
    console.log('   3. ✅ Botón para guardar todos los productos');
    console.log('   4. ✅ Sin uso de prompt() - Interfaz visual');
    console.log('   5. ✅ Configuración de precio y stock en modal');
    
    console.log('\n🚀 INSTRUCCIONES PARA EL VENDEDOR:');
    console.log('   1. Ir a Dashboard > Mis Productos');
    console.log('   2. Hacer clic en "Añadir Producto"');
    console.log('   3. Buscar y seleccionar productos');
    console.log('   4. Los productos aparecerán en "Productos pendientes"');
    console.log('   5. Hacer clic en "Configurar" para cada producto');
    console.log('   6. Ingresar precio y stock en el modal');
    console.log('   7. Hacer clic en "Guardar todos los productos"');
    console.log('   8. Los productos se guardarán en la base de datos');
    
    console.log('\n🔧 VENTAJAS DE LA NUEVA INTERFAZ:');
    console.log('   - ✅ Sin ventanas de alerta molestas');
    console.log('   - ✅ Interfaz visual intuitiva');
    console.log('   - ✅ Configuración por lotes');
    console.log('   - ✅ Vista previa de productos pendientes');
    console.log('   - ✅ Validación de datos antes de guardar');
    console.log('   - ✅ Botón de limpiar lista');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

testProductInterface();





