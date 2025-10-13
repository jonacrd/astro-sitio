#!/usr/bin/env node

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

async function checkTableSchema() {
  console.log('🔍 Verificando esquema de la tabla products...\n');
  
  try {
    // Intentar insertar un producto de prueba para ver qué columnas acepta
    const testProduct = {
      title: 'Producto de prueba',
      description: 'Descripción de prueba',
      price: 1000,
      category: 'test',
      image_url: 'test.jpg',
      stock: 10
    };
    
    console.log('🧪 Intentando insertar producto de prueba...');
    const { data, error } = await supabase
      .from('products')
      .insert(testProduct)
      .select();
    
    if (error) {
      console.log('❌ Error al insertar (esto es esperado):', error.message);
      console.log('📋 Información del error:');
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Producto insertado exitosamente:', data);
    }
    
    // Intentar con diferentes nombres de columnas
    const alternativeProduct = {
      product_name: 'Producto alternativo',
      product_description: 'Descripción alternativa',
      product_price: 2000,
      product_category: 'test',
      product_image: 'test2.jpg',
      product_stock: 5
    };
    
    console.log('\n🧪 Intentando con nombres alternativos...');
    const { data: altData, error: altError } = await supabase
      .from('products')
      .insert(alternativeProduct)
      .select();
    
    if (altError) {
      console.log('❌ Error con nombres alternativos:', altError.message);
    } else {
      console.log('✅ Producto alternativo insertado:', altData);
    }
    
  } catch (error) {
    console.error('❌ Error verificando esquema:', error);
  }
}

checkTableSchema();










