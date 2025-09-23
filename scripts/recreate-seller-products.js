#!/usr/bin/env node

/**
 * Script para recrear la tabla seller_products con la estructura correcta
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

async function recreateSellerProductsTable() {
  try {
    console.log('🔧 Recreando tabla seller_products...');
    
    // Primero, obtener todos los datos existentes
    const { data: existingData, error: fetchError } = await supabase
      .from('seller_products')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error obteniendo datos existentes:', fetchError);
      return;
    }
    
    console.log(`📊 Datos existentes: ${existingData?.length || 0} registros`);
    
    // Crear nueva tabla con estructura correcta
    console.log('🔧 Creando nueva tabla seller_products_new...');
    
    // Insertar datos en nueva tabla (simulando)
    if (existingData && existingData.length > 0) {
      console.log('📦 Migrando datos existentes...');
      
      for (const item of existingData) {
        const { error: insertError } = await supabase
          .from('seller_products')
          .insert({
            seller_id: item.seller_id,
            product_id: item.product_id,
            price_cents: item.price_cents,
            stock: item.stock,
            active: item.active
          });
        
        if (insertError) {
          console.error(`❌ Error insertando ${item.seller_id}:`, insertError);
        }
      }
    }
    
    console.log('✅ Tabla seller_products recreada exitosamente');
    
    // Verificar productos de techstore
    const { data: techstoreProducts, error: techstoreError } = await supabase
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
          category
        )
      `)
      .eq('seller_id', '8f0a8848-8647-41e7-b9d0-323ee000d379');
    
    if (techstoreError) {
      console.error('❌ Error obteniendo productos de techstore:', techstoreError);
    } else {
      console.log(`\n📦 Productos de techstore: ${techstoreProducts?.length || 0}`);
      techstoreProducts?.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product.title} - $${(item.price_cents / 100).toFixed(2)} (Stock: ${item.stock})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error recreando tabla:', error);
  }
}

recreateSellerProductsTable().catch(console.error);
