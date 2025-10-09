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

async function checkProductsTable() {
  console.log('🔍 Verificando estructura de la tabla products...\n');
  
  try {
    // Intentar obtener un producto existente para ver la estructura
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error consultando tabla products:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Estructura de la tabla products:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('ℹ️ La tabla products está vacía');
    }
    
    // Intentar obtener información del esquema
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'products' });
    
    if (schemaError) {
      console.log('⚠️ No se pudo obtener esquema de la tabla');
    } else {
      console.log('\n📋 Columnas de la tabla:');
      console.log(schemaData);
    }
    
  } catch (error) {
    console.error('❌ Error verificando tabla:', error);
  }
}

checkProductsTable();






