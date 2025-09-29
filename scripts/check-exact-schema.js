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

async function checkExactSchema() {
  console.log('🔍 Verificando esquema exacto de la tabla products...\n');
  
  try {
    // Intentar insertar un producto con solo las columnas básicas
    const basicProduct = {
      title: 'Producto básico',
      description: 'Descripción básica'
    };
    
    console.log('🧪 Intentando insertar con columnas básicas...');
    const { data, error } = await supabase
      .from('products')
      .insert(basicProduct)
      .select();
    
    if (error) {
      console.log('❌ Error con columnas básicas:', error.message);
    } else {
      console.log('✅ Producto básico insertado:', data);
      
      // Eliminar el producto de prueba
      await supabase.from('products').delete().eq('title', 'Producto básico');
    }
    
    // Intentar con diferentes combinaciones de columnas
    const testColumns = [
      { title: 'Test 1', price: 1000 },
      { title: 'Test 2', price_cents: 1000 },
      { title: 'Test 3', cost: 1000 },
      { title: 'Test 4', amount: 1000 },
      { title: 'Test 5', value: 1000 }
    ];
    
    for (let i = 0; i < testColumns.length; i++) {
      const testProduct = testColumns[i];
      console.log(`\n🧪 Probando combinación ${i + 1}:`, Object.keys(testProduct));
      
      const { data, error } = await supabase
        .from('products')
        .insert(testProduct)
        .select();
      
      if (error) {
        console.log(`❌ Error con combinación ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Combinación ${i + 1} exitosa:`, data);
        
        // Eliminar el producto de prueba
        await supabase.from('products').delete().eq('title', testProduct.title);
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ Error verificando esquema:', error);
  }
}

checkExactSchema();

