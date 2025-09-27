// Script para crear las tablas de órdenes en Supabase
// Ejecutar con: node scripts/setup-orders.js

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
    const { error: ordersError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.orders (
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
      `
    });

    if (ordersError) {
      console.log('⚠️ Tabla orders ya existe o error:', ordersError.message);
    } else {
      console.log('✅ Tabla orders creada');
    }

    // Crear tabla de items de órdenes
    const { error: itemsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.order_items (
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
      `
    });

    if (itemsError) {
      console.log('⚠️ Tabla order_items ya existe o error:', itemsError.message);
    } else {
      console.log('✅ Tabla order_items creada');
    }

    // Crear tabla de notificaciones
    const { error: notificationsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          data JSONB,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (notificationsError) {
      console.log('⚠️ Tabla notifications ya existe o error:', notificationsError.message);
    } else {
      console.log('✅ Tabla notifications creada');
    }

    // Crear índices
    const { error: indexError } = await supabase.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON public.order_items(seller_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
      `
    });

    if (indexError) {
      console.log('⚠️ Índices ya existen o error:', indexError.message);
    } else {
      console.log('✅ Índices creados');
    }

    // Habilitar RLS
    const { error: rlsError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.log('⚠️ RLS ya habilitado o error:', rlsError.message);
    } else {
      console.log('✅ RLS habilitado');
    }

    // Crear políticas RLS
    const { error: policiesError } = await supabase.rpc('exec', {
      sql: `
        DROP POLICY IF EXISTS "Orders are viewable by everyone" ON public.orders;
        DROP POLICY IF EXISTS "Orders are insertable by everyone" ON public.orders;
        DROP POLICY IF EXISTS "Order items are viewable by everyone" ON public.order_items;
        DROP POLICY IF EXISTS "Order items are insertable by everyone" ON public.order_items;
        DROP POLICY IF EXISTS "Notifications are viewable by owner" ON public.notifications;
        DROP POLICY IF EXISTS "Notifications are insertable by everyone" ON public.notifications;
        DROP POLICY IF EXISTS "Notifications are updatable by owner" ON public.notifications;

        CREATE POLICY "Orders are viewable by everyone" ON public.orders
          FOR SELECT USING (true);

        CREATE POLICY "Orders are insertable by everyone" ON public.orders
          FOR INSERT WITH CHECK (true);

        CREATE POLICY "Order items are viewable by everyone" ON public.order_items
          FOR SELECT USING (true);

        CREATE POLICY "Order items are insertable by everyone" ON public.order_items
          FOR INSERT WITH CHECK (true);

        CREATE POLICY "Notifications are viewable by owner" ON public.notifications
          FOR SELECT USING (user_id = auth.uid()::text OR user_id LIKE 'seller_%');

        CREATE POLICY "Notifications are insertable by everyone" ON public.notifications
          FOR INSERT WITH CHECK (true);

        CREATE POLICY "Notifications are updatable by owner" ON public.notifications
          FOR UPDATE USING (user_id = auth.uid()::text OR user_id LIKE 'seller_%');
      `
    });

    if (policiesError) {
      console.log('⚠️ Políticas ya existen o error:', policiesError.message);
    } else {
      console.log('✅ Políticas RLS creadas');
    }

    // Insertar datos de prueba
    const { error: seedError } = await supabase.rpc('exec', {
      sql: `
        INSERT INTO public.sellers (id, name, email, phone, address) VALUES
        ('seller_1', 'Vendedor de Prueba', 'vendedor@prueba.com', '+56 9 1234 5678', 'Dirección de Prueba 123')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.products (id, title, description, price_cents, category, image_url, seller_id) VALUES
        ('1', 'Producto de Prueba', 'Descripción del producto de prueba', 5000, 'Electrónicos', 'https://via.placeholder.com/300', 'seller_1')
        ON CONFLICT (id) DO NOTHING;
      `
    });

    if (seedError) {
      console.log('⚠️ Datos de prueba ya existen o error:', seedError.message);
    } else {
      console.log('✅ Datos de prueba insertados');
    }

    console.log('🎉 ¡Configuración completada! Las tablas están listas para usar.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTables();
