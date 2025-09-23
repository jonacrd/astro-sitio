#!/usr/bin/env node

/**
 * Script para verificar la estructura de las tablas
 * Ejecutar con: node scripts/check-table-structure.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Configuración
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estructura de tablas...');
    
    // Verificar seller_products
    console.log('\n📦 Tabla seller_products:');
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select('*')
      .limit(1);
    
    if (spError) {
      console.error('❌ Error en seller_products:', spError);
    } else {
      console.log('✅ seller_products accesible');
      if (sellerProducts && sellerProducts.length > 0) {
        console.log('📋 Columnas disponibles:', Object.keys(sellerProducts[0]));
      }
    }
    
    // Verificar products
    console.log('\n📦 Tabla products:');
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (pError) {
      console.error('❌ Error en products:', pError);
    } else {
      console.log('✅ products accesible');
      if (products && products.length > 0) {
        console.log('📋 Columnas disponibles:', Object.keys(products[0]));
      }
    }
    
    // Verificar profiles
    console.log('\n👥 Tabla profiles:');
    const { data: profiles, error: prError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (prError) {
      console.error('❌ Error en profiles:', prError);
    } else {
      console.log('✅ profiles accesible');
      if (profiles && profiles.length > 0) {
        console.log('📋 Columnas disponibles:', Object.keys(profiles[0]));
      }
    }
    
    // Verificar seller_status
    console.log('\n🟢 Tabla seller_status:');
    const { data: status, error: sError } = await supabase
      .from('seller_status')
      .select('*')
      .limit(1);
    
    if (sError) {
      console.error('❌ Error en seller_status:', sError);
    } else {
      console.log('✅ seller_status accesible');
      if (status && status.length > 0) {
        console.log('📋 Columnas disponibles:', Object.keys(status[0]));
      }
    }
    
    return true;

  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Verificando estructura de base de datos...');
  
  const success = await checkTableStructure();
  if (!success) {
    console.log('❌ Error verificando estructura');
    process.exit(1);
  }
  
  console.log('\n✅ Verificación completada');
}

main().catch(console.error);
