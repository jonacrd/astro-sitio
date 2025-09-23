#!/usr/bin/env node

/**
 * Script para poblar la base de datos con datos de prueba
 * Ejecutar con: node scripts/populate-database.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function executeSQLFile(filename) {
  try {
    console.log(`🔄 Ejecutando ${filename}...`);
    
    const sqlPath = join(__dirname, filename);
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Dividir en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.error(`❌ Error en statement:`, error);
          console.error(`Statement:`, statement.substring(0, 100) + '...');
          return false;
        }
      }
    }
    
    console.log(`✅ ${filename} ejecutado exitosamente`);
    return true;

  } catch (error) {
    console.error(`❌ Error ejecutando ${filename}:`, error);
    return false;
  }
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
    
    console.log(`✅ Vendedores creados: ${sellers?.length || 0}`);
    sellers?.forEach(seller => {
      console.log(`   - ${seller.name} (${seller.id})`);
    });
    
    // Verificar estados de vendedores
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
  
  // 1. Ejecutar script SQL
  const success = await executeSQLFile('seed-database.sql');
  if (!success) {
    console.log('❌ Error ejecutando script SQL');
    process.exit(1);
  }
  
  // 2. Verificar datos
  const verifySuccess = await verifyData();
  if (!verifySuccess) {
    console.log('❌ Error verificando datos');
    process.exit(1);
  }
  
  console.log('✅ Base de datos poblada exitosamente');
  console.log('📋 Próximos pasos:');
  console.log('   1. Probar búsqueda con IA');
  console.log('   2. Probar agregar al carrito');
  console.log('   3. Probar checkout');
}

main().catch(console.error);
