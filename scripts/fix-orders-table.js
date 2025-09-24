#!/usr/bin/env node

/**
 * Script para arreglar la tabla orders agregando la columna delivery_address
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

async function fixOrdersTable() {
  console.log('🔧 Arreglando tabla orders...\n');

  try {
    // 1. Agregar columna delivery_address si no existe
    console.log('📝 Agregando columna delivery_address...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS delivery_address JSONB;
      `
    });

    if (alterError) {
      console.log('⚠️ Error agregando columna delivery_address:', alterError.message);
      console.log('💡 Intenta ejecutar manualmente en Supabase SQL Editor:');
      console.log('   ALTER TABLE orders ADD COLUMN delivery_address JSONB;');
    } else {
      console.log('✅ Columna delivery_address agregada exitosamente');
    }

    // 2. Crear tabla notifications si no existe
    console.log('\n📝 Creando tabla notifications...');
    
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createTableError) {
      console.log('⚠️ Error creando tabla notifications:', createTableError.message);
      console.log('💡 Intenta ejecutar manualmente en Supabase SQL Editor:');
      console.log(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    } else {
      console.log('✅ Tabla notifications creada exitosamente');
    }

    // 3. Habilitar RLS para notifications
    console.log('\n📝 Configurando RLS para notifications...');
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view own notifications" ON notifications
          FOR SELECT USING (auth.uid() = user_id);
      `
    });

    if (rlsError) {
      console.log('⚠️ Error configurando RLS:', rlsError.message);
      console.log('💡 Intenta ejecutar manualmente en Supabase SQL Editor:');
      console.log(`
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own notifications" ON notifications
          FOR SELECT USING (auth.uid() = user_id);
      `);
    } else {
      console.log('✅ RLS configurado exitosamente');
    }

    console.log('\n🎉 ¡Tabla orders arreglada!');
    console.log('   Ahora puedes hacer checkout sin errores.');
    console.log('   Las notificaciones también están listas.');

  } catch (error) {
    console.error('❌ Error arreglando tabla:', error);
    console.log('\n💡 Solución manual:');
    console.log('   1. Ve a Supabase > SQL Editor');
    console.log('   2. Ejecuta: ALTER TABLE orders ADD COLUMN delivery_address JSONB;');
    console.log('   3. Ejecuta el SQL de notifications que se mostró arriba');
  }
}

fixOrdersTable();
