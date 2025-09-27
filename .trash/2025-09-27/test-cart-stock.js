#!/usr/bin/env node

/**
 * Script para probar que el stock se reduce correctamente al hacer checkout
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

async function testCartStock() {
  try {
    console.log('🧪 Probando reducción de stock en checkout...');
    
    // 1. Verificar stock inicial de techstore
    const { data: initialStock, error: initialError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        stock,
        product:products!inner(
          id,
          title
        )
      `)
      .eq('seller_id', '8f0a8848-8647-41e7-b9d0-323ee000d379')
      .eq('active', true);
    
    if (initialError) {
      console.error('❌ Error obteniendo stock inicial:', initialError);
      return;
    }
    
    console.log('📊 Stock inicial de techstore:');
    initialStock?.forEach(item => {
      console.log(`   - ${item.product.title}: ${item.stock} unidades`);
    });
    
    // 2. Simular una compra (esto requeriría autenticación real)
    console.log('\n💡 Para probar la reducción de stock:');
    console.log('   1. Inicia sesión como comprador');
    console.log('   2. Agrega productos al carrito');
    console.log('   3. Ve al checkout y confirma la compra');
    console.log('   4. Verifica que el stock se redujo en el dashboard del vendedor');
    
    // 3. Mostrar productos disponibles para agregar al carrito
    console.log('\n🛒 Productos disponibles para agregar al carrito:');
    initialStock?.forEach(item => {
      if (item.stock > 0) {
        console.log(`   ✅ ${item.product.title} - Stock: ${item.stock}`);
      } else {
        console.log(`   ❌ ${item.product.title} - Sin stock`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testCartStock().catch(console.error);



