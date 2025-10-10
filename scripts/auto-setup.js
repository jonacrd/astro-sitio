#!/usr/bin/env node

/**
 * Script automático para configurar la base de datos
 * Ejecutar con: node scripts/auto-setup.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function autoSetup() {
  console.log('🚀 Configurando base de datos automáticamente...');

  try {
    // 1. Agregar columnas a orders
    console.log('📝 Agregando columnas a orders...');
    
    const alterStatements = [
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_confirmed_at TIMESTAMP WITH TIME ZONE",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMP WITH TIME ZONE", 
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE"
    ];

    for (const stmt of alterStatements) {
      try {
        await supabase.rpc('exec_sql', { sql: stmt });
        console.log('✅ Statement ejecutado');
      } catch (err) {
        console.log('⚠️  Warning:', err.message);
      }
    }

    // 2. Crear tabla notifications
    console.log('📝 Creando tabla notifications...');
    const createNotifications = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    try {
      await supabase.rpc('exec_sql', { sql: createNotifications });
      console.log('✅ Tabla notifications creada');
    } catch (err) {
      console.log('⚠️  Warning notifications:', err.message);
    }

    // 3. Crear tabla user_points
    console.log('📝 Creando tabla user_points...');
    const createUserPoints = `
      CREATE TABLE IF NOT EXISTS user_points (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        points INTEGER NOT NULL DEFAULT 0,
        source VARCHAR(50) NOT NULL,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    try {
      await supabase.rpc('exec_sql', { sql: createUserPoints });
      console.log('✅ Tabla user_points creada');
    } catch (err) {
      console.log('⚠️  Warning user_points:', err.message);
    }

    // 4. Agregar columna a profiles
    console.log('📝 Agregando columna total_points a profiles...');
    try {
      await supabase.rpc('exec_sql', { 
        sql: "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0" 
      });
      console.log('✅ Columna total_points agregada');
    } catch (err) {
      console.log('⚠️  Warning total_points:', err.message);
    }

    // 5. Crear índices
    console.log('📝 Creando índices...');
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id)",
      "CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id)",
      "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)"
    ];

    for (const idx of indexes) {
      try {
        await supabase.rpc('exec_sql', { sql: idx });
        console.log('✅ Índice creado');
      } catch (err) {
        console.log('⚠️  Warning índice:', err.message);
      }
    }

    // 6. Configurar RLS
    console.log('📝 Configurando RLS...');
    try {
      await supabase.rpc('exec_sql', { 
        sql: "ALTER TABLE notifications ENABLE ROW LEVEL SECURITY" 
      });
      await supabase.rpc('exec_sql', { 
        sql: "ALTER TABLE user_points ENABLE ROW LEVEL SECURITY" 
      });
      console.log('✅ RLS configurado');
    } catch (err) {
      console.log('⚠️  Warning RLS:', err.message);
    }

    // 7. Crear políticas RLS
    console.log('📝 Creando políticas RLS...');
    const policies = [
      'CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id)',
      'CREATE POLICY "Users can view own points" ON user_points FOR SELECT USING (auth.uid() = user_id)'
    ];

    for (const policy of policies) {
      try {
        await supabase.rpc('exec_sql', { sql: policy });
        console.log('✅ Política creada');
      } catch (err) {
        console.log('⚠️  Warning política:', err.message);
      }
    }

    console.log('🎉 ¡Base de datos configurada exitosamente!');
    console.log('✅ Ahora puedes usar el dashboard sin errores');

  } catch (error) {
    console.error('❌ Error configurando base de datos:', error);
    process.exit(1);
  }
}

autoSetup();












