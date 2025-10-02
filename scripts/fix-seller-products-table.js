#!/usr/bin/env node

/**
 * Script para corregir la tabla seller_products
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

async function fixSellerProductsTable() {
  try {
    console.log('🔧 Corrigiendo tabla seller_products...');
    
    // Primero, verificar si ya existe la columna id
    const { data: existingData, error: checkError } = await supabase
      .from('seller_products')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.message.includes('column "id" does not exist')) {
      console.log('❌ Columna id no existe, agregándola...');
      
      // Agregar columna id
      const addIdColumnSQL = `
        ALTER TABLE seller_products 
        ADD COLUMN id UUID DEFAULT gen_random_uuid();
      `;
      
      const { error: addIdError } = await supabase.rpc('exec_sql', { sql: addIdColumnSQL });
      
      if (addIdError) {
        console.error('❌ Error agregando columna id:', addIdError);
        return;
      }
      
      console.log('✅ Columna id agregada');
      
      // Hacer id la clave primaria
      const makePrimaryKeySQL = `
        ALTER TABLE seller_products 
        ADD PRIMARY KEY (id);
      `;
      
      const { error: primaryKeyError } = await supabase.rpc('exec_sql', { sql: makePrimaryKeySQL });
      
      if (primaryKeyError) {
        console.error('❌ Error haciendo id clave primaria:', primaryKeyError);
      } else {
        console.log('✅ Columna id ahora es clave primaria');
      }
      
    } else if (checkError) {
      console.error('❌ Error verificando tabla:', checkError);
      return;
    } else {
      console.log('✅ Columna id ya existe');
    }
    
    // Verificar estructura final
    const { data: finalData, error: finalError } = await supabase
      .from('seller_products')
      .select('*')
      .limit(1);
    
    if (finalError) {
      console.error('❌ Error verificando estructura final:', finalError);
    } else {
      console.log('✅ Estructura final de seller_products:');
      console.log('📊 Columnas:', Object.keys(finalData[0] || {}));
    }
    
    // Verificar productos del usuario techstore
    const { data: techstoreProducts, error: techstoreError } = await supabase
      .from('seller_products')
      .select(`
        id,
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
    console.error('❌ Error corrigiendo tabla:', error);
  }
}

fixSellerProductsTable().catch(console.error);







