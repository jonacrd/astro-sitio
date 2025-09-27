// Script para crear las tablas de órdenes en Supabase usando SQL directo
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables de entorno no configuradas');
  console.log('Asegúrate de tener PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  try {
    console.log('🔧 Creando tablas de órdenes...');
    
    // Crear tabla de órdenes
    const { error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (ordersError && ordersError.code === 'PGRST116') {
      console.log('📋 Tabla orders no existe, creándola...');
      // La tabla no existe, necesitamos crearla manualmente en Supabase
      console.log('⚠️ Necesitas crear la tabla orders manualmente en Supabase con este SQL:');
      console.log(`
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  total_cents INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'cash',
  delivery_address JSONB,
  order_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
    } else {
      console.log('✅ Tabla orders ya existe');
    }

    // Crear tabla de items de órdenes
    const { error: itemsError } = await supabase
      .from('order_items')
      .select('id')
      .limit(1);

    if (itemsError && itemsError.code === 'PGRST116') {
      console.log('📋 Tabla order_items no existe, creándola...');
      console.log('⚠️ Necesitas crear la tabla order_items manualmente en Supabase con este SQL:');
      console.log(`
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  product_title VARCHAR(255) NOT NULL,
  price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  seller_id VARCHAR(255) NOT NULL,
  seller_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
    } else {
      console.log('✅ Tabla order_items ya existe');
    }

    // Crear tabla de notificaciones
    const { error: notificationsError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (notificationsError && notificationsError.code === 'PGRST116') {
      console.log('📋 Tabla notifications no existe, creándola...');
      console.log('⚠️ Necesitas crear la tabla notifications manualmente en Supabase con este SQL:');
      console.log(`
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
    } else {
      console.log('✅ Tabla notifications ya existe');
    }

    console.log('🎉 ¡Verificación completada!');
    console.log('📝 Si alguna tabla no existe, copia y pega el SQL en el editor SQL de Supabase');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTables();