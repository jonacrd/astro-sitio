#!/usr/bin/env node

/**
 * Script para verificar la configuración
 * Ejecutar con: node scripts/verify-setup.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifySetup() {
  console.log('🔍 Verificando configuración...\n');

  // 1. Verificar variables de entorno
  console.log('📋 Variables de entorno:');
  console.log(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.log(`PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '✅' : '❌'}\n`);

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.error('❌ Variables de entorno faltantes. Ejecuta: node scripts/setup-env.js');
    process.exit(1);
  }

  // 2. Verificar conexión a Supabase
  console.log('🔗 Verificando conexión a Supabase...');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Error conectando a Supabase:', error.message);
      console.log('💡 Asegúrate de que las tablas estén creadas ejecutando el script SQL');
      process.exit(1);
    }
    
    console.log('✅ Conexión a Supabase exitosa\n');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  }

  // 3. Verificar tablas
  console.log('🗄️ Verificando tablas...');
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const tables = ['profiles', 'products', 'seller_products', 'seller_status', 'carts', 'cart_items'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: Error`);
      }
    }
    console.log('');
  } catch (error) {
    console.error('❌ Error verificando tablas:', error.message);
  }

  // 4. Verificar datos
  console.log('📊 Verificando datos...');
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (productsError) {
      console.log('❌ No hay productos en la base de datos');
      console.log('💡 Ejecuta: node scripts/populate-database-direct.js');
    } else {
      console.log('✅ Productos encontrados');
    }
    
    const { data: sellerProducts, error: sellerProductsError } = await supabase
      .from('seller_products')
      .select('count')
      .limit(1);
    
    if (sellerProductsError) {
      console.log('❌ No hay productos de vendedores');
      console.log('💡 Ejecuta: node scripts/populate-database-direct.js');
    } else {
      console.log('✅ Productos de vendedores encontrados');
    }
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error.message);
  }

  console.log('\n🎉 Verificación completada!');
  console.log('💡 Si hay errores, revisa el archivo SETUP.md para instrucciones detalladas');
}

verifySetup().catch(console.error);














