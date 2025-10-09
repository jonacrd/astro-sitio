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

async function checkSellerProductsTable() {
  console.log('🔍 Verificando tabla seller_products...\n');
  
  try {
    // Intentar obtener información de la tabla
    const { data, error } = await supabase
      .from('seller_products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accediendo a seller_products:', error);
      console.log('📋 Detalles del error:');
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
      
      // Intentar crear la tabla si no existe
      console.log('\n🔧 Intentando crear tabla seller_products...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS seller_products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          seller_id UUID REFERENCES profiles(id) NOT NULL,
          product_id UUID REFERENCES products(id) NOT NULL,
          price_cents INTEGER NOT NULL,
          stock INTEGER DEFAULT 0,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(seller_id, product_id)
        );
      `;
      
      const { data: createResult, error: createError } = await supabase
        .rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('❌ Error creando tabla:', createError);
      } else {
        console.log('✅ Tabla seller_products creada exitosamente');
      }
      
    } else {
      console.log('✅ Tabla seller_products accesible');
      console.log('📊 Datos encontrados:', data.length);
    }
    
  } catch (error) {
    console.error('❌ Error verificando tabla:', error);
  }
}

checkSellerProductsTable();






