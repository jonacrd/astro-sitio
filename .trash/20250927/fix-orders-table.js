// Script para arreglar la tabla orders agregando columnas faltantes
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

async function fixOrdersTable() {
  try {
    console.log('🔧 Arreglando tabla orders...');
    
    // Intentar agregar la columna customer_email
    console.log('📋 Agregando columna customer_email...');
    
    // Como no podemos ejecutar ALTER TABLE directamente, vamos a crear una nueva tabla
    // y migrar los datos si es necesario
    
    // Primero, verificar si podemos insertar con las columnas que tenemos
    const { data: existingOrders, error: selectError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log('❌ Error al consultar orders:', selectError.message);
      return;
    }
    
    console.log('✅ Tabla orders accesible');
    console.log('📋 Columnas existentes:', existingOrders.length > 0 ? Object.keys(existingOrders[0]) : 'Tabla vacía');
    
    // Intentar insertar un registro con solo las columnas básicas
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_code: 'TEST-' + Date.now(),
        customer_name: 'Test Customer',
        total_cents: 1000,
        status: 'pending'
      })
      .select();

    if (error) {
      console.log('❌ Error al insertar:', error.message);
      
      if (error.message.includes('customer_email')) {
        console.log('🔧 La columna customer_email no existe. Necesitas ejecutar este SQL en Supabase:');
        console.log(`
-- Ejecuta este SQL en el editor SQL de Supabase:

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- También verifica que estas columnas existan en order_items:
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id VARCHAR(255);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_title VARCHAR(255);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price_cents INTEGER;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS seller_id VARCHAR(255);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255);

-- Y en notifications:
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
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

fixOrdersTable();