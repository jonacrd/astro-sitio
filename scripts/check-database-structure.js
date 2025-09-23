#!/usr/bin/env node

/**
 * Script para verificar la estructura de la base de datos
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

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    // Verificar tabla seller_products
    const { data: sellerProducts, error: sellerProductsError } = await supabase
      .from('seller_products')
      .select('*')
      .limit(1);
    
    if (sellerProductsError) {
      console.error('❌ Error en tabla seller_products:', sellerProductsError);
      
      // Intentar crear la tabla si no existe
      console.log('🔧 Intentando crear tabla seller_products...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS seller_products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          price_cents INTEGER NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(seller_id, product_id)
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('❌ Error creando tabla:', createError);
      } else {
        console.log('✅ Tabla seller_products creada exitosamente');
      }
    } else {
      console.log('✅ Tabla seller_products existe');
      console.log('📊 Estructura:', Object.keys(sellerProducts[0] || {}));
    }
    
    // Verificar tabla products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('❌ Error en tabla products:', productsError);
    } else {
      console.log('✅ Tabla products existe');
      console.log('📊 Estructura:', Object.keys(products[0] || {}));
    }
    
    // Verificar tabla profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Error en tabla profiles:', profilesError);
    } else {
      console.log('✅ Tabla profiles existe');
      console.log('📊 Estructura:', Object.keys(profiles[0] || {}));
    }
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
  }
}

checkDatabaseStructure().catch(console.error);
