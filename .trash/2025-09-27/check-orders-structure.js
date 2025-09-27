// Script para verificar la estructura de la tabla orders
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla orders...');
    
    // Intentar insertar un registro de prueba para ver qué columnas faltan
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_code: 'TEST-' + Date.now(),
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        total_cents: 1000,
        status: 'pending'
      })
      .select();

    if (error) {
      console.log('❌ Error al insertar:', error.message);
      console.log('📋 Detalles del error:', error);
      
      if (error.message.includes('customer_email')) {
        console.log('🔧 La columna customer_email no existe. Necesitas ejecutar este SQL en Supabase:');
        console.log(`
ALTER TABLE public.orders ADD COLUMN customer_email VARCHAR(255);
        `);
      }
    } else {
      console.log('✅ Estructura correcta, registro insertado:', data);
      
      // Limpiar el registro de prueba
      await supabase
        .from('orders')
        .delete()
        .eq('order_code', 'TEST-' + Date.now());
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkStructure();

